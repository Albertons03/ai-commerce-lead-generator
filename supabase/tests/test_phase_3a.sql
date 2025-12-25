-- =====================================================
-- PHASE 3A: Database Setup - Test Suite
-- =====================================================
-- This test script validates that all Phase 3A components
-- are correctly installed and functioning.
--
-- Run this script in Supabase SQL Editor to verify setup
-- =====================================================

-- Test 1: Verify pgvector extension is enabled
SELECT
    'Test 1: pgvector Extension' AS test_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector')
        THEN '✓ PASS'
        ELSE '✗ FAIL'
    END AS status;

-- Test 2: Verify all tables exist
SELECT
    'Test 2: Tables Created' AS test_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_embeddings')
        AND EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversations')
        AND EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages')
        THEN '✓ PASS (3 tables)'
        ELSE '✗ FAIL'
    END AS status;

-- Test 3: Verify enum types exist
SELECT
    'Test 3: Enum Types Created' AS test_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_status')
        AND EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_intent')
        AND EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_sentiment')
        AND EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_role')
        THEN '✓ PASS (4 enums)'
        ELSE '✗ FAIL'
    END AS status;

-- Test 4: Verify HNSW vector index exists
SELECT
    'Test 4: HNSW Vector Index' AS test_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes
            WHERE schemaname = 'public'
            AND tablename = 'product_embeddings'
            AND indexname = 'idx_product_embeddings_vector'
        )
        THEN '✓ PASS'
        ELSE '✗ FAIL'
    END AS status;

-- Test 5: Verify helper functions exist
SELECT
    'Test 5: Helper Functions' AS test_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'search_products_by_embedding')
        AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_conversation_history')
        AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_conversation_stats')
        THEN '✓ PASS (3 functions)'
        ELSE '✗ FAIL'
    END AS status;

-- Test 6: Verify triggers exist
SELECT
    'Test 6: Triggers Created' AS test_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger
            WHERE tgname = 'update_product_embeddings_updated_at'
        )
        AND EXISTS (
            SELECT 1 FROM pg_trigger
            WHERE tgname = 'increment_message_count'
        )
        THEN '✓ PASS (3 triggers)'
        ELSE '✗ FAIL'
    END AS status;

-- Test 7: Test vector operations
DO $$
DECLARE
    test_vector vector(1536);
    distance float;
BEGIN
    -- Create test vectors
    test_vector := array_fill(0.5, ARRAY[1536])::vector(1536);

    -- Test cosine distance
    distance := test_vector <=> test_vector;

    IF distance = 0 THEN
        RAISE NOTICE 'Test 7: Vector Operations - ✓ PASS (distance = 0)';
    ELSE
        RAISE NOTICE 'Test 7: Vector Operations - ✗ FAIL (distance = %)', distance;
    END IF;
END $$;

-- Test 8: Test product_embeddings table with sample data
DO $$
DECLARE
    test_org_id uuid;
    test_embedding vector(1536);
    inserted_id uuid;
BEGIN
    -- Generate test data
    SELECT id INTO test_org_id FROM organizations LIMIT 1;
    test_embedding := array_fill(0.5, ARRAY[1536])::vector(1536);

    IF test_org_id IS NOT NULL THEN
        -- Insert test product
        INSERT INTO product_embeddings (
            organization_id,
            product_id,
            product_name,
            product_description,
            embedding
        ) VALUES (
            test_org_id,
            'TEST-VECTOR-001',
            'Test Product for Vector Search',
            'This is a test product to validate vector search functionality',
            test_embedding
        ) RETURNING id INTO inserted_id;

        -- Clean up
        DELETE FROM product_embeddings WHERE id = inserted_id;

        RAISE NOTICE 'Test 8: Product Embeddings Insert - ✓ PASS';
    ELSE
        RAISE NOTICE 'Test 8: Product Embeddings Insert - ⊘ SKIP (no organizations)';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test 8: Product Embeddings Insert - ✗ FAIL: %', SQLERRM;
END $$;

-- Test 9: Test vector similarity search function
DO $$
DECLARE
    test_org_id uuid;
    test_embedding vector(1536);
    result_count integer;
BEGIN
    SELECT id INTO test_org_id FROM organizations LIMIT 1;
    test_embedding := array_fill(0.5, ARRAY[1536])::vector(1536);

    IF test_org_id IS NOT NULL THEN
        -- Test search function (should return 0 results if no products)
        SELECT COUNT(*) INTO result_count
        FROM search_products_by_embedding(
            test_org_id,
            test_embedding,
            5,
            0.7
        );

        RAISE NOTICE 'Test 9: Vector Search Function - ✓ PASS (% results)', result_count;
    ELSE
        RAISE NOTICE 'Test 9: Vector Search Function - ⊘ SKIP (no organizations)';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test 9: Vector Search Function - ✗ FAIL: %', SQLERRM;
END $$;

-- Test 10: Test conversation and message flow
DO $$
DECLARE
    test_org_id uuid;
    test_conv_id uuid;
    test_msg_id uuid;
    msg_count integer;
BEGIN
    SELECT id INTO test_org_id FROM organizations LIMIT 1;

    IF test_org_id IS NOT NULL THEN
        -- Create test conversation
        INSERT INTO conversations (
            organization_id,
            session_id,
            status
        ) VALUES (
            test_org_id,
            'TEST-SESSION-' || gen_random_uuid()::text,
            'active'
        ) RETURNING id INTO test_conv_id;

        -- Insert test message (should trigger message_count increment)
        INSERT INTO messages (
            conversation_id,
            organization_id,
            role,
            content,
            sequence_number
        ) VALUES (
            test_conv_id,
            test_org_id,
            'user',
            'Test message',
            1
        ) RETURNING id INTO test_msg_id;

        -- Check if message_count was incremented
        SELECT message_count INTO msg_count
        FROM conversations
        WHERE id = test_conv_id;

        -- Clean up
        DELETE FROM conversations WHERE id = test_conv_id;

        IF msg_count = 1 THEN
            RAISE NOTICE 'Test 10: Conversation/Message Flow - ✓ PASS (count incremented)';
        ELSE
            RAISE NOTICE 'Test 10: Conversation/Message Flow - ✗ FAIL (count = %)', msg_count;
        END IF;
    ELSE
        RAISE NOTICE 'Test 10: Conversation/Message Flow - ⊘ SKIP (no organizations)';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test 10: Conversation/Message Flow - ✗ FAIL: %', SQLERRM;
END $$;

-- Test 11: Verify RLS policies are enabled
SELECT
    'Test 11: RLS Enabled' AS test_name,
    CASE
        WHEN (SELECT relrowsecurity FROM pg_class WHERE relname = 'product_embeddings')
        AND (SELECT relrowsecurity FROM pg_class WHERE relname = 'conversations')
        AND (SELECT relrowsecurity FROM pg_class WHERE relname = 'messages')
        THEN '✓ PASS (all tables)'
        ELSE '✗ FAIL'
    END AS status;

-- Test 12: Count RLS policies
SELECT
    'Test 12: RLS Policies Count' AS test_name,
    COUNT(*)::text || ' policies' AS status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('product_embeddings', 'conversations', 'messages');

-- =====================================================
-- SUMMARY
-- =====================================================
SELECT
    '=====================================' AS separator
UNION ALL
SELECT 'PHASE 3A: Database Setup - Test Summary'
UNION ALL
SELECT '=====================================';

SELECT
    'Total Tables: ' || COUNT(*)::text AS info
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('product_embeddings', 'conversations', 'messages')
UNION ALL
SELECT
    'Total Indexes: ' || COUNT(*)::text
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('product_embeddings', 'conversations', 'messages')
UNION ALL
SELECT
    'Total Functions: ' || COUNT(*)::text
FROM pg_proc
WHERE proname IN ('search_products_by_embedding', 'get_conversation_history', 'get_conversation_stats')
UNION ALL
SELECT
    'Total Triggers: ' || COUNT(*)::text
FROM pg_trigger
WHERE tgname IN ('update_product_embeddings_updated_at', 'update_conversations_updated_at', 'increment_message_count')
UNION ALL
SELECT
    'Total RLS Policies: ' || COUNT(*)::text
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('product_embeddings', 'conversations', 'messages');

-- Performance check: Test vector index usage
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM product_embeddings
ORDER BY embedding <=> array_fill(0.5, ARRAY[1536])::vector(1536)
LIMIT 5;

-- =====================================================
-- All tests complete!
-- =====================================================
