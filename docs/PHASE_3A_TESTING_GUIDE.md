# Phase 3A: Testing Guide 🧪

## Quick Start

1. **Open Supabase SQL Editor**
   - Navigate to: https://supabase.com/dashboard/project/neqvzxaabhvfureehakr/sql

2. **Run Test Suite**
   - Copy the entire content of `supabase/tests/test_phase_3a.sql`
   - Paste into SQL Editor
   - Click "Run"

3. **Expected Results**
   - All tests should show "✓ PASS"
   - Summary shows correct counts
   - EXPLAIN ANALYZE shows HNSW index usage

---

## Test Checklist

Run each test and check the results:

### ✅ Test 1: pgvector Extension
```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```
**Expected**: 1 row returned

### ✅ Test 2: Tables Created
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('product_embeddings', 'conversations', 'messages');
```
**Expected**: 3 rows

### ✅ Test 3: Enum Types
```sql
SELECT typname FROM pg_type
WHERE typname IN ('conversation_status', 'conversation_intent', 'conversation_sentiment', 'message_role');
```
**Expected**: 4 rows

### ✅ Test 4: HNSW Index
```sql
SELECT indexname FROM pg_indexes
WHERE tablename = 'product_embeddings'
AND indexname = 'idx_product_embeddings_vector';
```
**Expected**: 1 row

### ✅ Test 5: Helper Functions
```sql
SELECT proname FROM pg_proc
WHERE proname IN ('search_products_by_embedding', 'get_conversation_history', 'get_conversation_stats');
```
**Expected**: 3 rows

### ✅ Test 6: RLS Policies
```sql
SELECT COUNT(*) FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('product_embeddings', 'conversations', 'messages');
```
**Expected**: 9 or more policies

---

## Manual Testing

### Test Vector Operations

```sql
-- Create test embedding
DO $$
DECLARE
    test_org_id uuid;
    test_vector vector(1536);
BEGIN
    -- Get your organization ID
    SELECT id INTO test_org_id FROM organizations LIMIT 1;

    -- Create test vector (all 0.5 values)
    test_vector := array_fill(0.5, ARRAY[1536])::vector(1536);

    -- Insert test product
    INSERT INTO product_embeddings (
        organization_id,
        product_id,
        product_name,
        product_description,
        embedding
    ) VALUES (
        test_org_id,
        'TEST-001',
        'Test Product',
        'This is a test product for vector search validation',
        test_vector
    );

    RAISE NOTICE 'Test product inserted successfully!';
END $$;
```

### Test Vector Search Function

```sql
-- Search for products similar to test vector
SELECT
    product_id,
    product_name,
    similarity_score
FROM search_products_by_embedding(
    (SELECT id FROM organizations LIMIT 1), -- Your org ID
    array_fill(0.5, ARRAY[1536])::vector(1536), -- Query vector
    5, -- Limit
    0.0 -- Threshold (0 = return all)
);
```

**Expected**: Should return the test product with similarity_score = 1.0 (perfect match)

### Test Conversation Flow

```sql
-- Create test conversation
INSERT INTO conversations (
    organization_id,
    session_id,
    status
) VALUES (
    (SELECT id FROM organizations LIMIT 1),
    'TEST-SESSION-' || gen_random_uuid()::text,
    'active'
)
RETURNING id, session_id, message_count;
```

**Expected**: Returns new conversation with message_count = 0

### Test Message Insertion + Trigger

```sql
-- Insert message (will trigger message_count increment)
WITH new_conv AS (
    SELECT id FROM conversations
    WHERE session_id LIKE 'TEST-SESSION-%'
    ORDER BY created_at DESC
    LIMIT 1
)
INSERT INTO messages (
    conversation_id,
    organization_id,
    role,
    content,
    sequence_number
)
SELECT
    id,
    (SELECT organization_id FROM conversations WHERE id = new_conv.id),
    'user',
    'Test message',
    1
FROM new_conv
RETURNING id;

-- Check if message_count was incremented
SELECT
    session_id,
    message_count,
    last_message_at
FROM conversations
WHERE session_id LIKE 'TEST-SESSION-%'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected**: message_count = 1, last_message_at = NOW()

---

## Performance Testing

### Vector Search Performance

```sql
-- Test search speed with EXPLAIN ANALYZE
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT
    product_id,
    product_name,
    1 - (embedding <=> array_fill(0.5, ARRAY[1536])::vector(1536)) AS similarity
FROM product_embeddings
WHERE organization_id = (SELECT id FROM organizations LIMIT 1)
ORDER BY embedding <=> array_fill(0.5, ARRAY[1536])::vector(1536)
LIMIT 5;
```

**What to Look For**:
- ✅ "Index Scan using idx_product_embeddings_vector" (HNSW index is used)
- ✅ Execution time < 100ms
- ✅ Buffers: shared hit > shared read (cache efficiency)

### Index Statistics

```sql
-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as times_used,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'product_embeddings';
```

---

## Cleanup Test Data

After testing, clean up:

```sql
-- Delete test products
DELETE FROM product_embeddings
WHERE product_id LIKE 'TEST-%';

-- Delete test conversations
DELETE FROM conversations
WHERE session_id LIKE 'TEST-SESSION-%';

-- Verify cleanup
SELECT COUNT(*) FROM product_embeddings WHERE product_id LIKE 'TEST-%';
SELECT COUNT(*) FROM conversations WHERE session_id LIKE 'TEST-SESSION-%';
```

**Expected**: Both should return 0

---

## Common Issues & Solutions

### Issue 1: pgvector extension not found
**Error**: `type "vector" does not exist`

**Solution**:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Issue 2: HNSW index not used
**Error**: Query uses Sequential Scan instead of Index Scan

**Solution**: Rebuild index
```sql
REINDEX INDEX idx_product_embeddings_vector;
```

### Issue 3: RLS blocking queries
**Error**: No rows returned even though data exists

**Solution**: Check if you're using the correct organization_id
```sql
-- Check your organization
SELECT id, name FROM organizations WHERE id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
);
```

### Issue 4: Trigger not firing
**Error**: message_count not incrementing

**Solution**: Verify trigger exists
```sql
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'increment_message_count';
```

---

## Success Criteria

✅ All 12 automated tests pass
✅ Manual vector search returns results
✅ HNSW index is used (EXPLAIN shows Index Scan)
✅ Message count trigger works
✅ RLS policies enforce multi-tenancy
✅ Performance: Vector search < 100ms

---

## Next Steps After Testing

1. ✅ **All tests pass** → Ready for Phase 3B!
2. ❌ **Some tests fail** → Debug and fix issues
3. 📊 **Performance concerns** → Tune HNSW parameters
4. 📸 **Take screenshots** → Share on social media!

---

*Last Updated: 2025-12-25*
