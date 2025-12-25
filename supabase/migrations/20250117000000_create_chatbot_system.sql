-- =====================================================
-- PHASE 3A: AI CHATBOT SYSTEM - Database Migration
-- =====================================================
-- This migration creates the complete database infrastructure for
-- the RAG-based AI chatbot system including:
-- - Vector storage (pgvector)
-- - Conversation tracking
-- - Message history
-- - Similarity search functions
-- - RLS policies for multi-tenant security
--
-- Created: 2025-12-25
-- Dependencies: 20250116000000_create_leads_system.sql (Phase 2)
-- Documentation: docs/PHASE_3A_DATABASE_SETUP.md
-- =====================================================

-- =====================================================
-- 1. ENABLE PGVECTOR EXTENSION
-- =====================================================

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

COMMENT ON EXTENSION vector IS 'PostgreSQL vector extension for similarity search using embeddings';

-- =====================================================
-- 2. CREATE ENUM TYPES
-- =====================================================

-- Conversation status enumeration
CREATE TYPE conversation_status AS ENUM (
  'active',      -- Conversation in progress
  'completed',   -- User explicitly ended conversation
  'abandoned'    -- User left without closing (timeout)
);

-- Conversation intent enumeration
CREATE TYPE conversation_intent AS ENUM (
  'browse',      -- Just looking around
  'compare',     -- Comparing multiple products
  'purchase',    -- Ready to buy
  'support',     -- Need help/support
  'other'        -- Other intent
);

-- Conversation sentiment enumeration
CREATE TYPE conversation_sentiment AS ENUM (
  'positive',    -- Happy, satisfied
  'neutral',     -- Neutral tone
  'negative'     -- Frustrated, unhappy
);

-- Message role enumeration
CREATE TYPE message_role AS ENUM (
  'user',        -- Message from visitor
  'assistant',   -- Message from AI chatbot
  'system'       -- System messages (e.g., "Conversation started")
);

-- =====================================================
-- 3. CREATE TABLES
-- =====================================================

-- =====================================================
-- 3.1 PRODUCT EMBEDDINGS TABLE
-- =====================================================

CREATE TABLE public.product_embeddings (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Product information
    product_id TEXT NOT NULL, -- External product ID from e-commerce platform
    product_name TEXT NOT NULL,
    product_description TEXT NOT NULL,
    product_category TEXT,
    product_price DECIMAL(10,2),
    product_currency TEXT DEFAULT 'USD',
    product_url TEXT,
    product_image_url TEXT,

    -- Vector embedding (1536 dimensions for OpenAI text-embedding-3-small)
    embedding vector(1536) NOT NULL,

    -- Embedding metadata
    embedding_model TEXT DEFAULT 'text-embedding-3-small' NOT NULL,
    embedding_tokens INTEGER, -- Number of tokens used to generate embedding

    -- Product metadata (flexible JSONB for custom attributes)
    metadata JSONB DEFAULT '{}',

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    UNIQUE(organization_id, product_id),
    CONSTRAINT product_name_length CHECK (char_length(product_name) >= 2 AND char_length(product_name) <= 500),
    CONSTRAINT product_description_length CHECK (char_length(product_description) >= 10 AND char_length(product_description) <= 5000),
    CONSTRAINT product_price_positive CHECK (product_price IS NULL OR product_price >= 0),
    CONSTRAINT product_category_length CHECK (product_category IS NULL OR char_length(product_category) <= 100)
);

-- Indexes for product_embeddings
CREATE INDEX idx_product_embeddings_org_id ON public.product_embeddings(organization_id);
CREATE INDEX idx_product_embeddings_product_id ON public.product_embeddings(product_id);
CREATE INDEX idx_product_embeddings_active ON public.product_embeddings(organization_id, is_active) WHERE is_active = true;
CREATE INDEX idx_product_embeddings_category ON public.product_embeddings(organization_id, product_category) WHERE product_category IS NOT NULL;
CREATE INDEX idx_product_embeddings_price ON public.product_embeddings(organization_id, product_price) WHERE product_price IS NOT NULL;

-- HNSW index for fast approximate nearest neighbor search (cosine similarity)
CREATE INDEX idx_product_embeddings_vector ON public.product_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

COMMENT ON TABLE public.product_embeddings IS 'Product catalog with OpenAI embeddings for semantic search';
COMMENT ON COLUMN public.product_embeddings.embedding IS 'OpenAI text-embedding-3-small vector (1536 dimensions) for similarity search';
COMMENT ON COLUMN public.product_embeddings.product_id IS 'External product ID from e-commerce platform (SKU, slug, etc.)';
COMMENT ON COLUMN public.product_embeddings.metadata IS 'Custom product attributes (color, size, stock, etc.) stored as JSON';

-- =====================================================
-- 3.2 CONVERSATIONS TABLE
-- =====================================================

CREATE TABLE public.conversations (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Session tracking
    session_id TEXT NOT NULL, -- Client-provided session identifier (survives page reloads)
    channel TEXT DEFAULT 'web', -- 'web', 'mobile', 'api', 'embed', 'whatsapp', etc.

    -- Visitor information (may be anonymous initially)
    visitor_name TEXT,
    visitor_email TEXT,
    visitor_phone TEXT,
    visitor_company TEXT,
    visitor_metadata JSONB DEFAULT '{}',

    -- Conversation state
    status conversation_status DEFAULT 'active' NOT NULL,
    message_count INTEGER DEFAULT 0 NOT NULL,

    -- AI analysis (filled after conversation or periodically)
    intent conversation_intent,
    sentiment conversation_sentiment,
    summary TEXT, -- AI-generated conversation summary

    -- Lead association
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    lead_captured_at TIMESTAMPTZ,

    -- Technical metadata
    user_agent TEXT,
    ip_address INET,
    referrer_url TEXT,
    landing_page TEXT,

    -- UTM tracking
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Constraints
    UNIQUE(organization_id, session_id),
    CONSTRAINT visitor_email_format CHECK (visitor_email IS NULL OR visitor_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT message_count_positive CHECK (message_count >= 0)
);

-- Indexes for conversations
CREATE INDEX idx_conversations_org_id ON public.conversations(organization_id);
CREATE INDEX idx_conversations_session_id ON public.conversations(session_id);
CREATE INDEX idx_conversations_lead_id ON public.conversations(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_conversations_status ON public.conversations(organization_id, status);
CREATE INDEX idx_conversations_created_at ON public.conversations(organization_id, created_at DESC);
CREATE INDEX idx_conversations_email ON public.conversations(organization_id, visitor_email) WHERE visitor_email IS NOT NULL;
CREATE INDEX idx_conversations_intent ON public.conversations(organization_id, intent) WHERE intent IS NOT NULL;

COMMENT ON TABLE public.conversations IS 'Chat conversation sessions with visitors';
COMMENT ON COLUMN public.conversations.session_id IS 'Client-provided session identifier for tracking across page loads';
COMMENT ON COLUMN public.conversations.visitor_metadata IS 'Custom visitor attributes (device, location, preferences, etc.) stored as JSON';
COMMENT ON COLUMN public.conversations.summary IS 'AI-generated summary of conversation topics and outcome';

-- =====================================================
-- 3.3 MESSAGES TABLE
-- =====================================================

CREATE TABLE public.messages (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Message content
    role message_role NOT NULL,
    content TEXT NOT NULL,

    -- RAG context (for assistant messages)
    retrieved_products JSONB, -- Array of product IDs and similarity scores
    retrieval_query TEXT, -- The query used for vector search
    retrieval_score FLOAT, -- Similarity score of top match (0-1)

    -- AI metadata (for assistant messages)
    model TEXT, -- 'gpt-4-turbo', 'gpt-3.5-turbo', etc.
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    temperature FLOAT,

    -- Message metadata
    metadata JSONB DEFAULT '{}',

    -- Sequence and timing
    sequence_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    UNIQUE(conversation_id, sequence_number),
    CONSTRAINT content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 10000),
    CONSTRAINT sequence_positive CHECK (sequence_number > 0),
    CONSTRAINT retrieval_score_range CHECK (retrieval_score IS NULL OR (retrieval_score >= 0 AND retrieval_score <= 1))
);

-- Indexes for messages
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id, sequence_number);
CREATE INDEX idx_messages_organization_id ON public.messages(organization_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_role ON public.messages(conversation_id, role);

-- GIN index for JSONB queries on retrieved_products
CREATE INDEX idx_messages_retrieved_products ON public.messages USING gin(retrieved_products);

COMMENT ON TABLE public.messages IS 'Individual messages within conversations with RAG context';
COMMENT ON COLUMN public.messages.retrieved_products IS 'JSON array of product IDs and scores retrieved from vector search';
COMMENT ON COLUMN public.messages.retrieval_query IS 'The user query or intent used for product similarity search';
COMMENT ON COLUMN public.messages.retrieval_score IS 'Cosine similarity score (0-1) of the top matching product';

-- =====================================================
-- 4. CREATE TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_product_embeddings_updated_at
    BEFORE UPDATE ON public.product_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-increment message count and update last_message_at
CREATE OR REPLACE FUNCTION public.update_conversation_message_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.conversations
    SET
        message_count = message_count + 1,
        last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;

    RETURN NEW;
END;
$$;

CREATE TRIGGER increment_message_count
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_conversation_message_count();

COMMENT ON FUNCTION public.update_conversation_message_count IS 'Auto-increment message_count and update last_message_at when new message inserted';

-- =====================================================
-- 5. CREATE HELPER FUNCTIONS
-- =====================================================

-- =====================================================
-- 5.1 VECTOR SIMILARITY SEARCH FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.search_products_by_embedding(
    p_organization_id UUID,
    p_query_embedding vector(1536),
    p_limit INTEGER DEFAULT 5,
    p_similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    product_id TEXT,
    product_name TEXT,
    product_description TEXT,
    product_category TEXT,
    product_price DECIMAL,
    product_currency TEXT,
    product_url TEXT,
    product_image_url TEXT,
    similarity_score FLOAT,
    metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pe.product_id,
        pe.product_name,
        pe.product_description,
        pe.product_category,
        pe.product_price,
        pe.product_currency,
        pe.product_url,
        pe.product_image_url,
        1 - (pe.embedding <=> p_query_embedding) AS similarity_score,
        pe.metadata
    FROM public.product_embeddings pe
    WHERE pe.organization_id = p_organization_id
      AND pe.is_active = true
      AND 1 - (pe.embedding <=> p_query_embedding) >= p_similarity_threshold
    ORDER BY pe.embedding <=> p_query_embedding
    LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.search_products_by_embedding IS 'Performs cosine similarity search on product embeddings and returns top K matches above threshold';

-- =====================================================
-- 5.2 GET CONVERSATION HISTORY
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_conversation_history(
    p_conversation_id UUID,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    role TEXT,
    content TEXT,
    sequence_number INTEGER,
    created_at TIMESTAMPTZ,
    retrieved_products JSONB,
    model TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.role::TEXT,
        m.content,
        m.sequence_number,
        m.created_at,
        m.retrieved_products,
        m.model
    FROM public.messages m
    WHERE m.conversation_id = p_conversation_id
    ORDER BY m.sequence_number ASC
    LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_conversation_history IS 'Retrieves message history for a conversation in chronological order';

-- =====================================================
-- 5.3 GET CONVERSATION STATS
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_conversation_stats(
    p_organization_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    total_conversations INTEGER,
    active_conversations INTEGER,
    completed_conversations INTEGER,
    abandoned_conversations INTEGER,
    total_messages INTEGER,
    avg_messages_per_conversation FLOAT,
    lead_capture_rate FLOAT,
    total_leads_captured INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER AS total_conversations,
        COUNT(*) FILTER (WHERE status = 'active')::INTEGER AS active_conversations,
        COUNT(*) FILTER (WHERE status = 'completed')::INTEGER AS completed_conversations,
        COUNT(*) FILTER (WHERE status = 'abandoned')::INTEGER AS abandoned_conversations,
        COALESCE(SUM(message_count), 0)::INTEGER AS total_messages,
        COALESCE(AVG(message_count), 0)::FLOAT AS avg_messages_per_conversation,
        CASE
            WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE lead_id IS NOT NULL)::FLOAT / COUNT(*)::FLOAT * 100)
            ELSE 0
        END AS lead_capture_rate,
        COUNT(*) FILTER (WHERE lead_id IS NOT NULL)::INTEGER AS total_leads_captured
    FROM public.conversations
    WHERE organization_id = p_organization_id
      AND created_at >= p_start_date
      AND created_at <= p_end_date;
END;
$$;

COMMENT ON FUNCTION public.get_conversation_stats IS 'Returns conversation statistics for an organization within a date range';

-- =====================================================
-- 6. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.product_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. CREATE RLS POLICIES
-- =====================================================

-- =====================================================
-- 7.1 PRODUCT EMBEDDINGS POLICIES
-- =====================================================

-- Users can view their organization's product embeddings
CREATE POLICY "Users can view their org's product embeddings"
    ON public.product_embeddings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = product_embeddings.organization_id
            AND user_id = auth.uid()
        )
    );

-- Admins can insert product embeddings
CREATE POLICY "Admins can create product embeddings"
    ON public.product_embeddings
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = product_embeddings.organization_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Admins can update product embeddings
CREATE POLICY "Admins can update product embeddings"
    ON public.product_embeddings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = product_embeddings.organization_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Admins can delete product embeddings
CREATE POLICY "Admins can delete product embeddings"
    ON public.product_embeddings
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = product_embeddings.organization_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- =====================================================
-- 7.2 CONVERSATIONS POLICIES
-- =====================================================

-- Users can view their organization's conversations
CREATE POLICY "Users can view their org's conversations"
    ON public.conversations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = conversations.organization_id
            AND user_id = auth.uid()
        )
    );

-- Service role can create conversations (API routes)
CREATE POLICY "Service role can create conversations"
    ON public.conversations
    FOR INSERT
    WITH CHECK (true);

-- Service role can update conversations (API routes)
CREATE POLICY "Service role can update conversations"
    ON public.conversations
    FOR UPDATE
    USING (true);

-- =====================================================
-- 7.3 MESSAGES POLICIES
-- =====================================================

-- Users can view their organization's messages
CREATE POLICY "Users can view their org's messages"
    ON public.messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = messages.organization_id
            AND user_id = auth.uid()
        )
    );

-- Service role can insert messages (API routes)
CREATE POLICY "Service role can insert messages"
    ON public.messages
    FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

-- Grant SELECT access to authenticated users
GRANT SELECT ON public.product_embeddings TO authenticated;
GRANT SELECT ON public.conversations TO authenticated;
GRANT SELECT ON public.messages TO authenticated;

-- Grant INSERT/UPDATE/DELETE to authenticated users (RLS policies will control actual access)
GRANT INSERT, UPDATE, DELETE ON public.product_embeddings TO authenticated;
GRANT INSERT, UPDATE ON public.conversations TO authenticated;
GRANT INSERT ON public.messages TO authenticated;

-- Grant EXECUTE on helper functions
GRANT EXECUTE ON FUNCTION public.search_products_by_embedding TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversation_history TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversation_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_conversation_message_count TO authenticated;

-- =====================================================
-- 9. VERIFICATION QUERIES
-- =====================================================

-- Verify pgvector extension is enabled
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        RAISE EXCEPTION 'pgvector extension is not enabled';
    END IF;
    RAISE NOTICE 'pgvector extension is enabled ✓';
END $$;

-- Verify tables are created
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_embeddings') THEN
        RAISE EXCEPTION 'product_embeddings table not created';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversations') THEN
        RAISE EXCEPTION 'conversations table not created';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
        RAISE EXCEPTION 'messages table not created';
    END IF;
    RAISE NOTICE 'All chatbot tables created successfully ✓';
END $$;

-- Verify HNSW index is created
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = 'product_embeddings'
        AND indexname = 'idx_product_embeddings_vector'
    ) THEN
        RAISE EXCEPTION 'HNSW vector index not created';
    END IF;
    RAISE NOTICE 'HNSW vector index created successfully ✓';
END $$;

-- =====================================================
-- 10. COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'PHASE 3A: AI CHATBOT SYSTEM - Migration Complete ✓';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '  - pgvector extension enabled';
    RAISE NOTICE '  - 4 enum types (conversation_status, intent, sentiment, message_role)';
    RAISE NOTICE '  - 3 tables (product_embeddings, conversations, messages)';
    RAISE NOTICE '  - 15+ indexes including HNSW for vector search';
    RAISE NOTICE '  - 3 helper functions (search, history, stats)';
    RAISE NOTICE '  - 3 triggers (auto-update, message count)';
    RAISE NOTICE '  - RLS policies for multi-tenant security';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  - Phase B: Product Training Endpoint';
    RAISE NOTICE '  - Phase C: Chat Storage Layer';
    RAISE NOTICE '  - Phase D: RAG Chat API';
    RAISE NOTICE '  - Phase E: Lead Capture & Scoring';
    RAISE NOTICE '';
    RAISE NOTICE 'Documentation: docs/PHASE_3A_DATABASE_SETUP.md';
    RAISE NOTICE '=====================================================';
END $$;
