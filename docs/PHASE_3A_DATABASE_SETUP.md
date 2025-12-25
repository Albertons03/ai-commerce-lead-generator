# Phase 3A: Database & Vector Setup 🗄️

> **Part 1 of 5** - Setting up PostgreSQL with pgvector for semantic search

## 📋 Table of Contents

- [What We're Building](#what-were-building)
- [Why These Design Decisions](#why-these-design-decisions)
- [Database Schema](#database-schema)
- [Implementation Steps](#implementation-steps)
- [Testing & Validation](#testing--validation)
- [Common Issues](#common-issues)

---

## 🎯 What We're Building

In Phase A, we're creating the database foundation for our AI chatbot:

1. **Vector Storage** - Store product embeddings for semantic search
2. **Conversation Tracking** - Persist chat sessions and metadata
3. **Message History** - Store every message with RAG context
4. **Search Functions** - Fast vector similarity queries
5. **Security** - Multi-tenant RLS policies

### Visual Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────┐  ┌──────────────────────┐   │
│  │ product_embeddings   │  │   conversations      │   │
│  │ ┌──────────────────┐ │  │ ┌──────────────────┐ │   │
│  │ │  product_name    │ │  │ │  session_id      │ │   │
│  │ │  description     │ │  │ │  visitor_email   │ │   │
│  │ │  price           │ │  │ │  lead_id         │ │   │
│  │ │  embedding       │ │  │ │  status          │ │   │
│  │ │  (vector 1536)   │ │  │ └──────────────────┘ │   │
│  │ └──────────────────┘ │  └──────────────────────┘   │
│  └──────────────────────┘                              │
│            │                          │                 │
│            │                          │                 │
│            └─────────┬────────────────┘                 │
│                      │                                  │
│             ┌────────▼─────────┐                        │
│             │    messages      │                        │
│             │ ┌──────────────┐ │                        │
│             │ │ role         │ │                        │
│             │ │ content      │ │                        │
│             │ │ retrieved_   │ │                        │
│             │ │   products   │ │                        │
│             │ └──────────────┘ │                        │
│             └──────────────────┘                        │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  search_products_by_embedding()                  │  │
│  │  - Cosine similarity search                      │  │
│  │  - Returns top K products                        │  │
│  │  - Filters by organization                       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🤔 Why These Design Decisions

### Why pgvector extension?

**Problem**: We need to search products using natural language queries like "comfortable running shoes under $100"

**Solution**: Vector embeddings + cosine similarity

**Why pgvector**:
- ✅ Native PostgreSQL extension (no separate service)
- ✅ Fast HNSW index (Hierarchical Navigable Small World)
- ✅ Battle-tested (used by Notion, Retool, Supabase)
- ✅ Supports cosine, L2, and inner product distances
- ✅ RLS policies work out of the box

**Alternatives considered**:
- Pinecone: ❌ Extra cost, external service
- Weaviate: ❌ Overkill for our scale
- Elasticsearch: ❌ Lexical search, not semantic

### Why 1536 dimensions?

**OpenAI's `text-embedding-3-small` produces 1536-dimensional vectors**

- Each dimension captures a semantic feature
- More dimensions = more nuanced understanding
- 1536 is the sweet spot (quality vs cost vs speed)

**Example**:
```
"red leather boots" → [0.023, -0.451, 0.892, ... (1536 values)]
"crimson leather footwear" → [0.019, -0.448, 0.889, ... (similar!)]
```

### Why separate conversations and messages tables?

**Pattern**: One-to-Many relationship

**Benefits**:
- ✅ Efficient queries (get all messages for a conversation)
- ✅ Metadata at conversation level (visitor, lead, status)
- ✅ Message-level context (retrieved products, token usage)
- ✅ Easy to archive old conversations

**Schema design**:
```sql
conversations (1) ←→ (many) messages
```

### Why JSONB for metadata?

**Flexibility**: Every organization has different needs

**Examples**:
```json
// Product metadata
{
  "color": "red",
  "size": "42",
  "material": "leather",
  "stock": 15
}

// Visitor metadata
{
  "utm_source": "google",
  "utm_campaign": "winter-sale",
  "device": "mobile"
}
```

**Benefits**:
- ✅ No schema migrations for custom fields
- ✅ JSON operators in PostgreSQL (fast queries)
- ✅ Easy to extend

---

## 📊 Database Schema

### Table 1: `product_embeddings`

**Purpose**: Store product catalog with vector embeddings for semantic search

**Key Fields**:
| Column | Type | Purpose |
|--------|------|---------|
| `embedding` | `vector(1536)` | OpenAI embedding for similarity search |
| `product_id` | `TEXT` | External product ID from e-commerce platform |
| `product_name` | `TEXT` | Product name (indexed for search) |
| `product_description` | `TEXT` | Combined with name for embedding |
| `product_price` | `DECIMAL` | Price for filtering/sorting |
| `is_active` | `BOOLEAN` | Soft delete (exclude discontinued products) |

**Indexes**:
```sql
-- HNSW index for fast approximate nearest neighbor search
CREATE INDEX idx_product_embeddings_vector
ON product_embeddings USING hnsw (embedding vector_cosine_ops);

-- Organization + active products
CREATE INDEX idx_product_embeddings_active
ON product_embeddings(organization_id, is_active)
WHERE is_active = true;
```

**Why HNSW index?**
- Approximate nearest neighbor (ANN) search
- 10-100x faster than exact search
- 95%+ recall (finds 95% of true matches)
- Trade-off: slight accuracy loss for massive speed gain

---

### Table 2: `conversations`

**Purpose**: Track chat sessions with visitors

**Key Fields**:
| Column | Type | Purpose |
|--------|------|---------|
| `session_id` | `TEXT` | Client-generated ID (survives page reloads) |
| `visitor_email` | `TEXT` | Captured during conversation |
| `lead_id` | `UUID` | Link to captured lead |
| `status` | `TEXT` | `active`, `completed`, `abandoned` |
| `intent` | `TEXT` | `browse`, `compare`, `purchase`, `support` |
| `sentiment` | `TEXT` | `positive`, `neutral`, `negative` |
| `message_count` | `INTEGER` | Auto-incremented via trigger |

**Lifecycle**:
```
1. User opens chatbot → Create conversation (status: active)
2. User sends messages → Increment message_count
3. Email provided → Update visitor_email
4. Lead captured → Set lead_id, lead_captured_at
5. User leaves → Status: abandoned (after 30min timeout)
6. Conversation ends → Status: completed (explicit close)
```

---

### Table 3: `messages`

**Purpose**: Store individual chat messages with RAG context

**Key Fields**:
| Column | Type | Purpose |
|--------|------|---------|
| `role` | `TEXT` | `user`, `assistant`, `system` |
| `content` | `TEXT` | Message text (max 10,000 chars) |
| `retrieved_products` | `JSONB` | Products used in this response |
| `retrieval_query` | `TEXT` | Query used for vector search |
| `retrieval_score` | `FLOAT` | Similarity score (0-1) |
| `model` | `TEXT` | AI model used (`gpt-4-turbo`) |
| `sequence_number` | `INTEGER` | Message order (1, 2, 3...) |

**RAG Context Example**:
```json
{
  "retrieved_products": [
    {
      "product_id": "SKU-123",
      "name": "Nike Air Max 90",
      "similarity_score": 0.92
    },
    {
      "product_id": "SKU-456",
      "name": "Adidas Ultraboost",
      "similarity_score": 0.87
    }
  ]
}
```

**Why store RAG context?**
- 🔍 Debug: Which products influenced this response?
- 📊 Analytics: What products are most recommended?
- 🎯 Improve: Retrain on low-scoring matches
- 🛡️ Audit: Prove zero hallucinations

---

## 🛠️ Implementation Steps

### Step 1: Enable pgvector Extension

**File**: `supabase/migrations/20250117000000_create_chatbot_system.sql`

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';
```

**What this does**:
- Adds `vector` data type to PostgreSQL
- Adds operators: `<=>` (cosine), `<->` (L2), `<#>` (inner product)
- Enables HNSW and IVFFlat indexes

**Test it**:
```sql
-- Create a test vector
SELECT '[1,2,3]'::vector(3);

-- Calculate cosine distance
SELECT '[1,2,3]'::vector(3) <=> '[4,5,6]'::vector(3);
-- Output: 0.025368... (small = similar, large = different)
```

---

### Step 2: Create Tables

**See full SQL in migration file** (`supabase/migrations/20250117000000_create_chatbot_system.sql`)

**Key constraints**:
```sql
-- Unique constraint (no duplicate products per org)
UNIQUE(organization_id, product_id)

-- Check constraint (positive prices)
CHECK (product_price IS NULL OR product_price >= 0)

-- Enum constraint (valid statuses only)
CHECK (status IN ('active', 'completed', 'abandoned'))
```

---

### Step 3: Create Vector Search Function

**Function**: `search_products_by_embedding()`

```sql
CREATE OR REPLACE FUNCTION search_products_by_embedding(
    p_organization_id UUID,
    p_query_embedding vector(1536),
    p_limit INTEGER DEFAULT 5,
    p_similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (...) AS $$
BEGIN
    RETURN QUERY
    SELECT
        product_id,
        product_name,
        1 - (embedding <=> p_query_embedding) AS similarity_score
    FROM product_embeddings
    WHERE organization_id = p_organization_id
      AND is_active = true
      AND 1 - (embedding <=> p_query_embedding) >= p_similarity_threshold
    ORDER BY embedding <=> p_query_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

**How it works**:
1. Input: Query embedding (1536 dimensions)
2. Calculate: Cosine similarity with all products
3. Filter: Only products above threshold (0.7 = 70% similar)
4. Sort: Most similar first
5. Limit: Return top K results

**Cosine similarity explained**:
```
Cosine Distance: 0.0 = identical, 2.0 = opposite
Cosine Similarity: 1 - distance (1.0 = identical, 0.0 = opposite)

Example:
embedding1 <=> embedding2 = 0.15  (distance)
1 - 0.15 = 0.85  (85% similar ✅)
```

---

### Step 4: Create Triggers

**Auto-update timestamps**:
```sql
CREATE TRIGGER update_product_embeddings_updated_at
    BEFORE UPDATE ON product_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

**Auto-increment message count**:
```sql
CREATE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET message_count = message_count + 1,
        last_message_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_message_count
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_message_count();
```

---

### Step 5: Set Up RLS Policies

**Multi-tenant security**: Users can only access their organization's data

```sql
-- Product embeddings
CREATE POLICY "Users view own org's products"
    ON product_embeddings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = product_embeddings.organization_id
            AND user_id = auth.uid()
        )
    );

-- Conversations (similar pattern)
-- Messages (similar pattern)
```

**Why RLS is critical**:
- 🛡️ Prevents data leaks between organizations
- ✅ Enforced at database level (can't bypass)
- 🔐 Works with Supabase Auth automatically

---

## ✅ Testing & Validation

### Test 1: Vector Operations

```sql
-- Create test embedding
INSERT INTO product_embeddings (
    organization_id,
    product_id,
    product_name,
    product_description,
    embedding
) VALUES (
    'test-org-id',
    'TEST-001',
    'Test Product',
    'Description',
    array_fill(0.5, ARRAY[1536])::vector(1536)
);

-- Test similarity search
SELECT * FROM search_products_by_embedding(
    'test-org-id'::uuid,
    array_fill(0.5, ARRAY[1536])::vector(1536),
    5,
    0.7
);
```

### Test 2: Index Performance

```sql
-- Check if HNSW index is being used
EXPLAIN ANALYZE
SELECT * FROM product_embeddings
WHERE organization_id = 'test-org-id'
ORDER BY embedding <=> '[...]'::vector(1536)
LIMIT 5;

-- Should show: "Index Scan using idx_product_embeddings_vector"
```

### Test 3: RLS Policies

```sql
-- As user A (org 1)
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims.sub TO 'user-a-id';

SELECT * FROM product_embeddings;
-- Should only see org 1 products

-- As user B (org 2)
SET LOCAL request.jwt.claims.sub TO 'user-b-id';

SELECT * FROM product_embeddings;
-- Should only see org 2 products
```

### Test 4: Trigger Functionality

```sql
-- Insert conversation
INSERT INTO conversations (organization_id, session_id)
VALUES ('test-org-id', 'session-123');

-- Insert message (should trigger count increment)
INSERT INTO messages (conversation_id, organization_id, role, content, sequence_number)
VALUES ('conv-id', 'test-org-id', 'user', 'Hello', 1);

-- Verify count updated
SELECT message_count FROM conversations WHERE id = 'conv-id';
-- Should return: 1
```

---

## 🚨 Common Issues

### Issue 1: pgvector extension not found

**Error**: `ERROR: extension "vector" is not available`

**Solution**:
```bash
# For Supabase (already included)
# No action needed

# For local PostgreSQL
sudo apt-get install postgresql-14-pgvector
```

### Issue 2: Slow vector search (> 500ms)

**Cause**: Missing HNSW index

**Solution**:
```sql
-- Verify index exists
SELECT indexname FROM pg_indexes
WHERE tablename = 'product_embeddings';

-- If missing, create it
CREATE INDEX idx_product_embeddings_vector
ON product_embeddings USING hnsw (embedding vector_cosine_ops);
```

### Issue 3: RLS policies blocking API routes

**Cause**: Service role key not used

**Solution**:
```typescript
// Use admin client in API routes
import { createAdminSupabaseClient } from '@/lib/supabase/client';

const supabase = createAdminSupabaseClient(); // Bypasses RLS
```

### Issue 4: Vector dimension mismatch

**Error**: `ERROR: expected 1536 dimensions, got 1024`

**Cause**: Using wrong embedding model

**Solution**:
```typescript
// Correct model
const embedding = await openai.embeddings.create({
  model: 'text-embedding-3-small', // 1536 dimensions
  input: text
});

// Wrong model
// model: 'text-embedding-ada-002' // 1024 dimensions
```

---

## 📈 Performance Benchmarks

After implementing Phase A, test these benchmarks:

| Operation | Target | How to Test |
|-----------|--------|-------------|
| Vector search | < 100ms | Query 10,000 products |
| Insert embedding | < 50ms | Single product insert |
| Get conversation history | < 200ms | 100 messages |
| RLS policy check | < 10ms | Should be negligible |

**Load test script**:
```typescript
const iterations = 1000;
const start = Date.now();

for (let i = 0; i < iterations; i++) {
  await supabase.rpc('search_products_by_embedding', {
    p_organization_id: orgId,
    p_query_embedding: testVector,
    p_limit: 5
  });
}

const avgTime = (Date.now() - start) / iterations;
console.log(`Average search time: ${avgTime}ms`);
```

---

## 🎓 Key Learnings

### 1. Vector Search is Approximate

HNSW index trades accuracy for speed:
- 95% recall = finds 95% of true top matches
- 5% of queries may miss the absolute best match
- **For our use case**: Acceptable (users won't notice)

### 2. Embeddings are Immutable

Once generated, embeddings should be versioned:
```sql
ALTER TABLE product_embeddings
ADD COLUMN embedding_model TEXT DEFAULT 'text-embedding-3-small';
```

**Why**: If OpenAI releases `text-embedding-4`, you'll need to:
1. Keep old embeddings with version tag
2. Regenerate with new model
3. Compare quality
4. Migrate when ready

### 3. RLS Can Impact Performance

Each query includes a subquery to check permissions:
```sql
-- Behind the scenes
SELECT * FROM product_embeddings
WHERE (
  -- Your filter
  organization_id = 'org-123'
)
AND (
  -- RLS policy check
  EXISTS (SELECT 1 FROM organization_members WHERE ...)
);
```

**Optimization**: Use service role in API routes (bypasses RLS)

### 4. JSONB is Powerful but Requires Discipline

**Good use**:
```json
{"color": "red", "size": "M"}
```

**Bad use**:
```json
{"c": "red", "s": "M"}  // Unclear keys
```

**Best practice**: Document JSONB schema in migration comments

---

## 🎯 Next Steps

After completing Phase A, you should have:

- ✅ pgvector extension enabled
- ✅ 3 tables created (product_embeddings, conversations, messages)
- ✅ Vector search function operational
- ✅ RLS policies enforcing multi-tenancy
- ✅ Triggers auto-updating counts and timestamps

**Ready for Phase B?** → [Product Training Endpoint Guide](./PHASE_3B_TRAINING_API.md)

---

## 🐦 Share Your Progress

Built Phase A? Share your learnings:

**Twitter/X**:
```
🎉 Just set up pgvector for semantic product search!

✅ 1536-dimensional embeddings
✅ HNSW index (<100ms searches)
✅ Multi-tenant RLS policies

Building an AI chatbot for e-commerce in public 🚀

#BuildInPublic #PostgreSQL #pgvector #RAG
```

**LinkedIn**:
```
📊 Database Architecture: Vector Search with pgvector

Implementing Phase A of our AI chatbot system. Key decisions:

1. PostgreSQL + pgvector (no separate vector DB)
2. HNSW index for fast approximate search
3. RLS policies for multi-tenant security

Performance: <100ms for 10K product searches

Full guide: [link to GitHub]

#AI #DatabaseDesign #PostgreSQL
```

---

## 📚 Additional Resources

- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [HNSW Algorithm Explained](https://towardsdatascience.com/similarity-search-hnsw-3f4f9e8e4e60)
- [Vector Embeddings Guide](https://www.pinecone.io/learn/vector-embeddings/)
- [Supabase Vector Docs](https://supabase.com/docs/guides/ai/vector-search)

---

*Last Updated: 2025-12-25*
*Phase Status: Ready to implement*
*Estimated Time: 4-6 hours*
