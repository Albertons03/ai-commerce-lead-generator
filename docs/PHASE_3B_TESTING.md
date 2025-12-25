# Phase 3B: Testing Guide

## Overview

This guide helps you test the Product Training API endpoint that generates and stores embeddings for your product catalog.

---

## Prerequisites

### 1. Add OpenAI API Key

Open `.env.local` and replace the placeholder with your actual OpenAI API key:

```env
OPENAI_API_KEY=sk-proj-YOUR-ACTUAL-KEY-HERE
```

Get your API key from: https://platform.openai.com/api-keys

### 2. Start Development Server

```bash
npm run dev
```

The server should start on http://localhost:3000

---

## Manual Testing with curl

### Test 1: Simple Training Request

```bash
curl -X POST http://localhost:3000/api/train-bot \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "YOUR-ORG-ID",
    "products": [
      {
        "product_id": "PROD-001",
        "product_name": "Wireless Headphones",
        "product_description": "Premium noise-cancelling wireless headphones with 30-hour battery life",
        "category": "Electronics",
        "price": 199.99
      },
      {
        "product_id": "PROD-002",
        "product_name": "Smart Watch",
        "product_description": "Fitness tracking smartwatch with heart rate monitor and GPS",
        "category": "Electronics",
        "price": 299.99
      }
    ],
    "batch_size": 10,
    "overwrite_existing": false
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "processed": 2,
    "inserted": 2,
    "updated": 0,
    "failed": 0,
    "totalTokens": 52,
    "estimatedCost": 0.00000104,
    "duration": 1234
  },
  "message": "Successfully processed 2 products"
}
```

---

### Test 2: Get Your Organization ID

First, you need to find your organization ID:

```bash
# Log into your app at http://localhost:3000
# Open browser console and run:
localStorage.getItem('selected_organization')
```

Or query Supabase directly:

```sql
SELECT id, name FROM organizations LIMIT 1;
```

---

### Test 3: Batch Training (10 Products)

```bash
curl -X POST http://localhost:3000/api/train-bot \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "YOUR-ORG-ID",
    "products": [
      {
        "product_id": "LAPTOP-001",
        "product_name": "MacBook Pro 16-inch",
        "product_description": "Powerful laptop with M3 Pro chip, 18GB RAM, 512GB SSD",
        "category": "Computers",
        "price": 2499.00
      },
      {
        "product_id": "PHONE-001",
        "product_name": "iPhone 15 Pro",
        "product_description": "Latest iPhone with A17 Pro chip, titanium design, 256GB",
        "category": "Smartphones",
        "price": 1199.00
      },
      {
        "product_id": "TABLET-001",
        "product_name": "iPad Air",
        "product_description": "Versatile tablet with M2 chip, 11-inch display, 128GB",
        "category": "Tablets",
        "price": 599.00
      },
      {
        "product_id": "WATCH-001",
        "product_name": "Apple Watch Series 9",
        "product_description": "Advanced health tracking smartwatch with always-on display",
        "category": "Wearables",
        "price": 399.00
      },
      {
        "product_id": "HEADPHONES-001",
        "product_name": "AirPods Max",
        "product_description": "Over-ear headphones with active noise cancellation",
        "category": "Audio",
        "price": 549.00
      },
      {
        "product_id": "SPEAKER-001",
        "product_name": "HomePod",
        "product_description": "Smart speaker with spatial audio and Siri integration",
        "category": "Audio",
        "price": 299.00
      },
      {
        "product_id": "KEYBOARD-001",
        "product_name": "Magic Keyboard",
        "product_description": "Wireless keyboard with numeric keypad and rechargeable battery",
        "category": "Accessories",
        "price": 149.00
      },
      {
        "product_id": "MOUSE-001",
        "product_name": "Magic Mouse",
        "product_description": "Multi-touch wireless mouse with rechargeable battery",
        "category": "Accessories",
        "price": 79.00
      },
      {
        "product_id": "MONITOR-001",
        "product_name": "Studio Display",
        "product_description": "27-inch 5K Retina display with built-in camera and speakers",
        "category": "Displays",
        "price": 1599.00
      },
      {
        "product_id": "CHARGER-001",
        "product_name": "MagSafe Charger",
        "product_description": "Magnetic wireless charging pad for iPhone",
        "category": "Accessories",
        "price": 39.00
      }
    ],
    "batch_size": 10,
    "overwrite_existing": false
  }'
```

---

### Test 4: Overwrite Existing Embeddings

```bash
curl -X POST http://localhost:3000/api/train-bot \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "YOUR-ORG-ID",
    "products": [
      {
        "product_id": "PROD-001",
        "product_name": "Wireless Headphones UPDATED",
        "product_description": "Premium noise-cancelling wireless headphones with 40-hour battery life and improved sound quality",
        "category": "Electronics",
        "price": 249.99
      }
    ],
    "overwrite_existing": true
  }'
```

**Expected:** `updated: 1`

---

## Error Testing

### Test 5: Missing Required Fields

```bash
curl -X POST http://localhost:3000/api/train-bot \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "YOUR-ORG-ID",
    "products": [
      {
        "product_id": "PROD-003"
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "code": "validation_error",
    "message": "Invalid request body",
    "details": [
      {
        "path": "products.0.product_name",
        "message": "product_name is required"
      },
      {
        "path": "products.0.product_description",
        "message": "product_description is required"
      }
    ]
  }
}
```

---

### Test 6: Invalid Organization ID

```bash
curl -X POST http://localhost:3000/api/train-bot \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "invalid-uuid",
    "products": [
      {
        "product_id": "PROD-001",
        "product_name": "Test",
        "product_description": "Test"
      }
    ]
  }'
```

**Expected:** Validation error for invalid UUID

---

### Test 7: Unauthorized Access

```bash
# Without authentication cookie
curl -X POST http://localhost:3000/api/train-bot \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "YOUR-ORG-ID",
    "products": [
      {
        "product_id": "PROD-001",
        "product_name": "Test",
        "product_description": "Test"
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": {
    "code": "unauthorized",
    "message": "You must be logged in to train the bot"
  }
}
```

---

## Verification

### Check Embeddings in Supabase

Run this SQL query in Supabase SQL Editor:

```sql
SELECT
  product_id,
  product_name,
  embedding_model,
  is_active,
  created_at,
  updated_at
FROM product_embeddings
WHERE organization_id = 'YOUR-ORG-ID'
ORDER BY created_at DESC;
```

**Expected:** All test products should appear

---

### Test Vector Search

```sql
-- Create a test vector (all 0.5 values)
SELECT
  product_id,
  product_name,
  similarity_score
FROM search_products_by_embedding(
  'YOUR-ORG-ID',
  array_fill(0.5, ARRAY[1536])::vector(1536),
  5,
  0.0
);
```

**Expected:** Your products should be returned with similarity scores

---

## Performance Testing

### Test 8: Large Batch (100 Products)

Create a JSON file with 100 products and measure:
- Total duration
- Cost per product
- Success rate

```bash
# Expected:
# - Duration: 5-10 seconds
# - Cost: ~$0.001 for 100 products
# - Success rate: 100%
```

---

## Cost Tracking

Monitor your OpenAI costs:

1. Go to: https://platform.openai.com/usage
2. Check "Embeddings" usage
3. Verify costs match estimates in API responses

**Expected Costs:**
- 1,000 products ≈ $0.001 (1 cent per 10,000 products)
- 10,000 products ≈ $0.01
- 100,000 products ≈ $0.10

---

## Common Issues

### Issue 1: OpenAI API Key Not Set

**Error:** `OPENAI_API_KEY is not configured`

**Solution:** Add your API key to `.env.local` and restart dev server

---

### Issue 2: Rate Limiting

**Error:** `rate_limit_exceeded`

**Solution:**
- Wait and retry (automatic retry is built-in)
- Reduce batch_size to 5 or less
- Upgrade OpenAI API tier

---

### Issue 3: Organization Not Found

**Error:** `You do not have access to this organization`

**Solution:**
- Verify organization ID is correct
- Check that your user is a member of the organization
- Query: `SELECT * FROM organization_members WHERE user_id = 'YOUR-USER-ID'`

---

### Issue 4: Supabase Service Role Key

**Error:** Database operations fail

**Solution:** Verify `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` is correct

---

## Success Criteria

✅ All validation tests return correct error messages
✅ Simple training request succeeds
✅ Batch training (10 products) completes in <5 seconds
✅ Embeddings appear in `product_embeddings` table
✅ Vector search returns relevant products
✅ Cost estimates match actual OpenAI usage
✅ Overwrite mode correctly updates existing embeddings

---

## Next Steps

After testing Phase 3B:

1. ✅ **All tests pass** → Ready for Phase 3C (Chat Storage)!
2. ❌ **Some tests fail** → Debug and fix issues
3. 📊 **Performance concerns** → Optimize batch size
4. 📸 **Take screenshots** → Share on social media!

---

*Last Updated: 2025-12-25*
