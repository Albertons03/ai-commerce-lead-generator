# Phase 3B: Product Training Endpoint 🧠

> **Part 2 of 5** - OpenAI embeddings generation and product catalog training

## 📋 Table of Contents

- [What We're Building](#what-were-building)
- [Why These Design Decisions](#why-these-design-decisions)
- [Architecture Overview](#architecture-overview)
- [Implementation Steps](#implementation-steps)
- [API Contract](#api-contract)
- [Testing & Validation](#testing--validation)
- [Cost Optimization](#cost-optimization)

---

## 🎯 What We're Building

Phase 3B enables organizations to "train" the AI chatbot with their product catalog by generating OpenAI embeddings and storing them in pgvector.

### Key Features

1. **OpenAI Integration** - Generate 1536-dimensional embeddings
2. **Batch Processing** - Handle 100+ products efficiently
3. **Cost Tracking** - Monitor OpenAI API usage and costs
4. **Error Handling** - Retry logic for API failures
5. **Training API** - RESTful endpoint for product uploads

### User Flow

```
Organization Admin
    ↓
Upload Products (CSV/JSON)
    ↓
POST /api/train-bot
    ↓
Generate Embeddings (OpenAI)
    ↓
Store in product_embeddings
    ↓
Return Statistics
```

---

## 🤔 Why These Design Decisions

### Why OpenAI embeddings instead of open-source?

**Options Compared:**
- OpenAI text-embedding-3-small (1536 dim)
- OpenAI text-embedding-ada-002 (1024 dim)
- sentence-transformers/all-MiniLM-L6-v2 (384 dim, free)
- Cohere embeddings (1024 dim)

**Our Choice: text-embedding-3-small**

**Pros:**
- ✅ Best quality-to-cost ratio ($0.00002/1K tokens)
- ✅ 1536 dimensions (more nuanced than ada-002)
- ✅ Same vendor as chat model (consistency)
- ✅ Fast API response (<200ms per batch)
- ✅ Native pgvector support

**Cons:**
- ❌ Costs money (but very cheap)
- ❌ Requires internet connection
- ❌ Vendor lock-in (but embeddings are portable)

**Cost Example:**
```
100 products × 50 tokens avg = 5,000 tokens
5,000 tokens ÷ 1,000 × $0.00002 = $0.0001
→ 100 products = $0.0001 (basically free!)
```

### Why batch processing?

**Problem:** OpenAI rate limits
- Free tier: 3 requests/minute
- Tier 1: 500 requests/minute
- Tier 2: 5,000 requests/minute

**Solution:** Batch requests (10-20 products per API call)

**Benefits:**
- ✅ Stay under rate limits
- ✅ Faster overall processing (fewer network round trips)
- ✅ Better error handling (isolate failures)
- ✅ Progress tracking (show "50/100 products processed")

**Trade-off:** Slightly more complex code, but worth it

### Why store embedding_model version?

**Future-proofing:** OpenAI will release new models

**Scenario:**
```
2024: text-embedding-3-small (1536 dim)
2025: text-embedding-4 (2048 dim, better quality)
```

**Without versioning:**
```
❌ Mixed embeddings (some v3, some v4)
❌ Search accuracy degrades
❌ Can't identify which products need re-embedding
```

**With versioning:**
```sql
-- Find products using old model
SELECT COUNT(*) FROM product_embeddings
WHERE embedding_model = 'text-embedding-3-small';

-- Re-embed with new model
-- ...

-- Switch to new model gradually
```

### Why upsert instead of insert-only?

**Use Case:** Product catalog updates

**Scenario 1: New Products**
- Insert new embeddings

**Scenario 2: Updated Descriptions**
- Product price changed: $99 → $79
- Product description improved
- Need to re-generate embedding

**Solution: UPSERT (ON CONFLICT)**
```sql
INSERT INTO product_embeddings (...)
VALUES (...)
ON CONFLICT (organization_id, product_id)
DO UPDATE SET
    product_name = EXCLUDED.product_name,
    product_description = EXCLUDED.product_description,
    embedding = EXCLUDED.embedding,
    updated_at = NOW();
```

---

## 🏗️ Architecture Overview

### Component Diagram

```
┌─────────────────────────────────────────────────────────┐
│              POST /api/train-bot                         │
│  (Next.js API Route - app/api/train-bot/route.ts)       │
└──────────────┬──────────────────────────────────────────┘
               │
               ├─► 1. Validate Request (Zod)
               │
               ├─► 2. Check Permissions (RLS)
               │
               ├─► 3. Process in Batches
               │       ↓
               │   ┌─────────────────────────────┐
               │   │  Embedding Service          │
               │   │  lib/ai/embedding-service.ts │
               │   └──────────┬──────────────────┘
               │              │
               │              ├─► Batch products (10/batch)
               │              │
               │              ├─► Generate embeddings
               │              │       ↓
               │              │   ┌─────────────────────┐
               │              │   │  OpenAI Client      │
               │              │   │  lib/ai/openai.ts   │
               │              │   └─────────┬───────────┘
               │              │             │
               │              │             └─► OpenAI API
               │              │                 (embeddings)
               │              │
               │              └─► Return vectors
               │
               └─► 4. Store in Database
                       ↓
                   ┌─────────────────────────┐
                   │  Supabase (PostgreSQL)  │
                   │  product_embeddings     │
                   └─────────────────────────┘
```

### Data Flow

```
Input: Products JSON
{
  "products": [
    {
      "product_id": "SKU-123",
      "name": "Nike Air Max",
      "description": "Comfortable running shoes",
      "price": 120,
      "category": "Footwear"
    }
  ]
}
    ↓
Text Preprocessing
"Nike Air Max. Comfortable running shoes. Category: Footwear. Price: $120"
    ↓
OpenAI API
embedding = [0.023, -0.451, 0.892, ... (1536 values)]
    ↓
Database Storage
product_embeddings table
    ↓
Output: Statistics
{
  "processed": 100,
  "created": 80,
  "updated": 20,
  "failed": 0,
  "cost": "$0.0002"
}
```

---

## 🛠️ Implementation Steps

### Step 1: Install Dependencies

```bash
npm install openai@^4.0.0
```

**Environment Variables** (add to `.env.local`):
```env
OPENAI_API_KEY=sk-proj-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_MAX_RETRIES=3
OPENAI_TIMEOUT_MS=30000
```

---

### Step 2: Create OpenAI Client Wrapper

**File:** `lib/ai/openai-client.ts`

**Purpose:** Centralized OpenAI API client with error handling

**Key Features:**
- Retry logic (exponential backoff)
- Timeout handling
- Error logging
- Cost tracking

**Interface:**
```typescript
interface OpenAIClient {
  createEmbedding(text: string): Promise<number[]>
  createEmbeddings(texts: string[]): Promise<number[][]>
  getCostEstimate(tokenCount: number): number
}
```

---

### Step 3: Create Embedding Service

**File:** `lib/ai/embedding-service.ts`

**Purpose:** Business logic for embedding generation

**Responsibilities:**
1. Text preprocessing (combine name + description)
2. Token counting (estimate costs)
3. Batch processing (10 products/batch)
4. Progress tracking
5. Error aggregation

**Key Functions:**
```typescript
async function generateProductEmbeddings(
  products: ProductInput[],
  options?: {
    batchSize?: number;
    onProgress?: (progress: number) => void;
  }
): Promise<ProductEmbeddingResult[]>
```

**Text Preprocessing Logic:**
```typescript
function prepareTextForEmbedding(product: ProductInput): string {
  const parts: string[] = [
    product.name,
    product.description
  ];

  if (product.category) {
    parts.push(`Category: ${product.category}`);
  }

  if (product.price) {
    parts.push(`Price: $${product.price}`);
  }

  return parts.join('. ').trim();
}
```

**Why include price/category in embedding?**
- Users search by price: "shoes under $100"
- Users search by category: "men's running shoes"
- Semantic understanding improved

---

### Step 4: Create Validation Schemas

**File:** `lib/validations/training.ts`

**Purpose:** Validate product inputs with Zod

**Schemas:**

```typescript
// Single product schema
const productInputSchema = z.object({
  product_id: z.string().min(1).max(100),
  name: z.string().min(2).max(500),
  description: z.string().min(10).max(5000),
  category: z.string().max(100).optional(),
  price: z.number().nonnegative().optional(),
  currency: z.string().length(3).default('USD'),
  url: z.string().url().optional(),
  image_url: z.string().url().optional(),
  metadata: z.record(z.any()).optional()
});

// Batch training request schema
const trainBotRequestSchema = z.object({
  organization_id: z.string().uuid(),
  products: z.array(productInputSchema).min(1).max(100),
  batch_size: z.number().int().min(1).max(20).default(10),
  overwrite_existing: z.boolean().default(false)
});
```

**Validation Example:**
```typescript
const result = trainBotRequestSchema.safeParse(requestBody);

if (!result.success) {
  return NextResponse.json({
    success: false,
    error: 'Validation failed',
    details: result.error.errors
  }, { status: 400 });
}
```

---

### Step 5: Create Supabase Helpers

**File:** `lib/supabase/embedding-helpers.ts`

**Purpose:** Database operations for embeddings

**Functions:**

```typescript
// Upsert single embedding
async function upsertProductEmbedding(
  supabase: SupabaseClient,
  embedding: ProductEmbeddingInsert
): Promise<{ success: boolean; error?: string }>

// Bulk upsert (more efficient)
async function bulkUpsertProductEmbeddings(
  supabase: SupabaseClient,
  embeddings: ProductEmbeddingInsert[]
): Promise<{ success: boolean; inserted: number; updated: number }>

// Delete embedding
async function deleteProductEmbedding(
  supabase: SupabaseClient,
  organizationId: string,
  productId: string
): Promise<{ success: boolean }>

// Get embeddings with pagination
async function getProductEmbeddings(
  supabase: SupabaseClient,
  organizationId: string,
  options?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
  }
): Promise<{ data: ProductEmbedding[]; total: number }>
```

---

### Step 6: Implement Training API Endpoint

**File:** `app/api/train-bot/route.ts`

**POST Handler Flow:**

```typescript
1. Parse request body
2. Validate with Zod schema
3. Check authentication (Supabase session)
4. Check authorization (admin/owner role)
5. Check rate limits (100 products/hour)
6. Generate embeddings (batch processing)
7. Store in database (upsert)
8. Return statistics
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "processed": 100,
    "created": 80,
    "updated": 20,
    "skipped": 0,
    "failed": 0,
    "errors": []
  },
  "metadata": {
    "processing_time_ms": 15234,
    "total_tokens_used": 5000,
    "estimated_cost": 0.0001
  }
}
```

---

## 📡 API Contract

### POST /api/train-bot

**Authentication:** Required (Supabase session)
**Authorization:** Admin or Owner role

**Request Headers:**
```
Content-Type: application/json
Cookie: sb-access-token=...
```

**Request Body:**
```typescript
{
  organization_id: string;        // UUID
  products: Array<{
    product_id: string;            // External ID
    name: string;                  // Product name
    description: string;           // Product description
    category?: string;             // Optional category
    price?: number;                // Optional price
    currency?: string;             // Default: USD
    url?: string;                  // Product page URL
    image_url?: string;            // Image URL
    metadata?: Record<string, any>; // Custom fields
  }>;
  batch_size?: number;             // Default: 10
  overwrite_existing?: boolean;    // Default: false
}
```

**Response (Success - 200):**
```typescript
{
  success: true;
  data: {
    processed: number;             // Total processed
    created: number;               // New embeddings
    updated: number;               // Updated embeddings
    skipped: number;               // Already exist (if !overwrite)
    failed: number;                // Failed to process
    errors: Array<{
      product_id: string;
      error: string;
    }>;
  };
  metadata: {
    processing_time_ms: number;
    total_tokens_used: number;
    estimated_cost: number;        // USD
  };
}
```

**Response (Error - 400/401/403/429/500):**
```typescript
{
  success: false;
  error: string;
  details?: any;
}
```

**Rate Limits:**
- 100 products per request (max)
- 1,000 products per hour per organization
- 10,000 requests per day per organization

---

## ✅ Testing & Validation

### Unit Tests

**Test File:** `__tests__/lib/ai/embedding-service.test.ts`

```typescript
describe('EmbeddingService', () => {
  it('should generate embeddings for single product', async () => {
    const product = {
      product_id: 'TEST-001',
      name: 'Test Product',
      description: 'Test description'
    };

    const result = await generateProductEmbeddings([product]);

    expect(result).toHaveLength(1);
    expect(result[0].embedding).toHaveLength(1536);
  });

  it('should batch products correctly', async () => {
    const products = Array.from({ length: 25 }, (_, i) => ({
      product_id: `TEST-${i}`,
      name: `Product ${i}`,
      description: `Description ${i}`
    }));

    const result = await generateProductEmbeddings(products, {
      batchSize: 10
    });

    expect(result).toHaveLength(25);
    // Should make 3 API calls (10 + 10 + 5)
  });

  it('should handle errors gracefully', async () => {
    // Mock OpenAI API failure
    mockOpenAI.createEmbedding.mockRejectedValue(new Error('API Error'));

    const result = await generateProductEmbeddings([product]);

    expect(result[0].error).toBeDefined();
  });
});
```

### Integration Tests

**Test File:** `__tests__/api/train-bot.test.ts`

```typescript
describe('POST /api/train-bot', () => {
  it('should train products successfully', async () => {
    const response = await fetch('/api/train-bot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sb-access-token=${authToken}`
      },
      body: JSON.stringify({
        organization_id: orgId,
        products: [
          {
            product_id: 'TEST-001',
            name: 'Test Product',
            description: 'Test description'
          }
        ]
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.created).toBe(1);
  });

  it('should reject unauthorized requests', async () => {
    const response = await fetch('/api/train-bot', {
      method: 'POST',
      body: JSON.stringify({
        organization_id: orgId,
        products: []
      })
    });

    expect(response.status).toBe(401);
  });

  it('should validate product inputs', async () => {
    const response = await fetch('/api/train-bot', {
      method: 'POST',
      headers: { 'Cookie': `sb-access-token=${authToken}` },
      body: JSON.stringify({
        organization_id: orgId,
        products: [
          {
            product_id: '',  // Invalid: empty
            name: 'X',        // Invalid: too short
            description: 'XYZ' // Invalid: too short
          }
        ]
      })
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Validation failed');
  });
});
```

### Manual Testing (curl)

```bash
# Get auth token from browser devtools
AUTH_TOKEN="your-supabase-access-token"
ORG_ID="your-organization-id"

# Test with single product
curl -X POST http://localhost:3000/api/train-bot \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=$AUTH_TOKEN" \
  -d '{
    "organization_id": "'$ORG_ID'",
    "products": [
      {
        "product_id": "TEST-001",
        "name": "Nike Air Max 90",
        "description": "Classic running shoes with Air cushioning",
        "category": "Footwear",
        "price": 120,
        "currency": "USD"
      }
    ]
  }'
```

### Verify in Database

```sql
-- Check if embedding was stored
SELECT
    product_id,
    product_name,
    embedding_model,
    array_length(embedding, 1) as dimensions,
    created_at
FROM product_embeddings
WHERE product_id = 'TEST-001';

-- Test vector search
SELECT product_name, similarity_score
FROM search_products_by_embedding(
    'your-org-id',
    (SELECT embedding FROM product_embeddings WHERE product_id = 'TEST-001'),
    5,
    0.7
);
```

---

## 💰 Cost Optimization

### Cost Breakdown

**OpenAI Pricing:**
- text-embedding-3-small: $0.00002 per 1K tokens

**Token Estimation:**
```
Average product text: 50 words = ~65 tokens
1,000 products × 65 tokens = 65,000 tokens
65,000 ÷ 1,000 × $0.00002 = $0.0013

→ 1,000 products ≈ $0.001 (tenth of a cent!)
```

### Optimization Strategies

**1. Cache Unchanged Products**
```typescript
// Only re-embed if description changed
if (existingProduct.product_description !== newProduct.description) {
  // Re-generate embedding
} else {
  // Skip, use existing embedding
}
```

**2. Batch Aggressively**
```typescript
// Good: 20 products/batch (1 API call)
const batches = chunk(products, 20);

// Bad: 1 product/batch (20 API calls)
```

**3. Use Webhooks for Async Training**
```
E-commerce Platform
    ↓
Webhook: Product Updated
    ↓
Queue Job (Background)
    ↓
Generate Embedding
```

**4. Monitor Costs**
```typescript
// Track costs in database
INSERT INTO embedding_costs (
    organization_id,
    tokens_used,
    cost,
    created_at
) VALUES (
    $1,
    $2,
    $3,
    NOW()
);
```

---

## 🎓 Key Learnings

### 1. OpenAI Rate Limits Are Generous

For typical use cases, rate limits aren't an issue:
- Tier 1: 500 requests/min = 30,000 requests/hour
- At 10 products/batch = 300,000 products/hour

**Bottleneck is usually your database, not OpenAI!**

### 2. Text Preprocessing Matters

**Bad embedding input:**
```
"Nike Shoes"
```

**Good embedding input:**
```
"Nike Air Max 90. Classic running shoes with visible Air cushioning unit in heel. Comfortable padded collar. Durable rubber outsole. Category: Men's Footwear. Price: $120 USD."
```

**Why:** More context → better semantic understanding

### 3. Upsert vs Insert Performance

**Upsert (ON CONFLICT):**
- Slower per operation (~2x)
- But handles updates gracefully
- Recommended for most use cases

**Insert-only:**
- Faster
- But requires manual duplicate handling
- Only use if you're certain no duplicates exist

### 4. Error Handling is Critical

**Don't fail entire batch if one product fails:**
```typescript
// Bad
const embeddings = await Promise.all(
  products.map(p => generateEmbedding(p))
);

// Good
const embeddings = await Promise.allSettled(
  products.map(p => generateEmbedding(p))
);

// Separate successes from failures
const successes = embeddings.filter(e => e.status === 'fulfilled');
const failures = embeddings.filter(e => e.status === 'rejected');
```

---

## 🚨 Common Issues

### Issue 1: OpenAI API Key Invalid

**Error:** `401 Unauthorized`

**Solution:**
```bash
# Verify API key is set
echo $OPENAI_API_KEY

# Test with curl
curl https://api.openai.com/v1/embeddings \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "text-embedding-3-small",
    "input": "test"
  }'
```

### Issue 2: Rate Limit Exceeded

**Error:** `429 Too Many Requests`

**Solution:** Implement exponential backoff
```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

### Issue 3: Database Timeout on Bulk Insert

**Error:** `PostgreSQL connection timeout`

**Solution:** Batch database inserts too
```typescript
// Bad: Insert 1000 rows at once
await supabase.from('product_embeddings').insert(allEmbeddings);

// Good: Insert in batches of 50
for (const batch of chunk(allEmbeddings, 50)) {
  await supabase.from('product_embeddings').insert(batch);
}
```

---

## 📈 Success Metrics

After implementing Phase 3B, measure:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Embedding generation time | < 0.5s per product | Log processing time |
| API success rate | > 99% | Track failed requests |
| Database insert time | < 50ms per product | Log DB operation time |
| Cost per 1,000 products | < $0.01 | Track OpenAI token usage |
| Batch processing throughput | > 100 products/min | End-to-end timing |

---

## 🎯 Next Steps

After completing Phase 3B:

✅ **Verify:**
- Products can be trained successfully
- Embeddings stored in database
- Vector search returns results
- Cost tracking accurate

**Ready for Phase 3C:** Chat Storage Layer

---

## 🐦 Share Your Progress

**Twitter/X:**
```
🧠 Just implemented OpenAI embeddings for product search!

Built a training API that:
✅ Generates 1536-dim vectors
✅ Batch processes 100+ products
✅ Costs $0.001 per 1,000 products
✅ Handles errors gracefully

Next: RAG chat API

#BuildInPublic #OpenAI #VectorSearch
```

**LinkedIn:**
```
📊 Technical Deep Dive: OpenAI Embeddings API

Implemented Phase 3B of our AI chatbot: Product training system

Architecture:
- OpenAI text-embedding-3-small (1536 dimensions)
- Batch processing (10 products/API call)
- PostgreSQL + pgvector storage
- Cost tracking ($0.001 per 1K products)

Key learnings:
1. Text preprocessing matters (include price/category)
2. Batch aggressively (rate limits are generous)
3. Error handling is critical (don't fail entire batch)

Performance: 100 products/min, 99%+ success rate

Next phase: RAG chat API with semantic search

Full writeup: [GitHub link]

#AI #OpenAI #ProductDevelopment
```

---

*Last Updated: 2025-12-25*
*Estimated Time: 8-10 hours*
*Prerequisites: Phase 3A complete*
