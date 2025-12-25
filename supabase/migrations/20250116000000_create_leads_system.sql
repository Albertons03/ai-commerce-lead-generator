-- =====================================================
-- PHASE 2: LEADS SYSTEM - Database Migration
-- =====================================================
-- This migration creates all tables, indexes, triggers, RLS policies,
-- and helper functions for the lead management system.
--
-- Created: 2025-12-16
-- Dependencies: 20250106000000_fix_all_org_policies.sql (Phase 1)
-- =====================================================

-- =====================================================
-- 1. CREATE ENUM TYPES
-- =====================================================

-- Lead status enumeration
CREATE TYPE lead_status AS ENUM (
  'new',        -- Just created, not yet reviewed
  'contacted',  -- Sales team has reached out
  'qualified',  -- Confirmed as legitimate prospect
  'converted',  -- Successfully became a customer
  'lost'        -- Not interested or unresponsive
);

-- Lead source enumeration
CREATE TYPE lead_source AS ENUM (
  'chatbot',    -- Created from AI chatbot interaction
  'manual',     -- Manually added by user
  'import',     -- Bulk imported from CSV/API
  'web_form',   -- From website contact form
  'referral'    -- Referred by existing customer
);

-- =====================================================
-- 2. CREATE TABLES
-- =====================================================

-- =====================================================
-- 2.1 LEADS TABLE
-- =====================================================

CREATE TABLE public.leads (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Contact information
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,

    -- Lead classification
    status lead_status NOT NULL DEFAULT 'new',
    source lead_source NOT NULL DEFAULT 'chatbot',
    lead_score INTEGER DEFAULT 0,

    -- Product interests (array of product names/IDs)
    product_interests TEXT[] DEFAULT '{}',

    -- Conversation context
    conversation_id UUID, -- Link to conversations table (Phase 3)
    conversation_summary TEXT,

    -- Marketing attribution
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    referrer_url TEXT,
    landing_page TEXT,

    -- Technical metadata
    user_agent TEXT,
    ip_address INET,
    location_country TEXT,
    location_city TEXT,

    -- Flexible metadata (JSONB for custom fields)
    metadata JSONB DEFAULT '{}',

    -- Notes and activity
    notes TEXT,
    internal_notes TEXT, -- Private notes not visible to lead

    -- Lifecycle timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_contacted_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 200),
    CONSTRAINT lead_score_range CHECK (lead_score >= 0 AND lead_score <= 100)
);

-- =====================================================
-- 2.2 API KEYS TABLE (For Public Lead Capture)
-- =====================================================

CREATE TABLE public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Key identification
    name TEXT NOT NULL, -- User-friendly name: "Production Chatbot", "Test Key"
    key_prefix TEXT NOT NULL, -- First 8 chars for display: "sk_live_"
    key_hash TEXT NOT NULL, -- Bcrypt hash of full key

    -- Usage tracking
    last_used_at TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,

    -- Security
    is_active BOOLEAN DEFAULT true,
    allowed_domains TEXT[], -- CORS whitelist
    rate_limit_per_minute INTEGER DEFAULT 10,

    -- Metadata
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- Constraints
    UNIQUE(key_hash),
    CHECK(char_length(name) >= 3 AND char_length(name) <= 100)
);

-- =====================================================
-- 2.3 LEAD ACTIVITY LOG (Audit Trail)
-- =====================================================

CREATE TABLE public.lead_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Activity details
    activity_type TEXT NOT NULL, -- 'status_change', 'note_added', 'email_sent', etc.
    old_value TEXT,
    new_value TEXT,
    description TEXT,

    -- Actor (user who performed action, null if system-generated)
    performed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CHECK(activity_type IN ('created', 'status_change', 'note_added', 'score_change', 'contacted'))
);

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- =====================================================
-- 3.1 LEADS TABLE INDEXES
-- =====================================================

-- Primary lookup indexes
CREATE INDEX idx_leads_organization_id ON public.leads(organization_id);
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);

-- Status and filtering indexes
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_source ON public.leads(source);
CREATE INDEX idx_leads_score ON public.leads(lead_score DESC);

-- Composite indexes for common queries
CREATE INDEX idx_leads_org_status ON public.leads(organization_id, status);
CREATE INDEX idx_leads_org_created ON public.leads(organization_id, created_at DESC);
CREATE INDEX idx_leads_org_score ON public.leads(organization_id, lead_score DESC);

-- Full-text search index on name and email
CREATE INDEX idx_leads_search ON public.leads
  USING gin(to_tsvector('english', name || ' ' || email));

-- Marketing attribution index
CREATE INDEX idx_leads_utm_source ON public.leads(utm_source) WHERE utm_source IS NOT NULL;

-- Conversation link index (for Phase 3)
CREATE INDEX idx_leads_conversation_id ON public.leads(conversation_id)
  WHERE conversation_id IS NOT NULL;

-- =====================================================
-- 3.2 API KEYS TABLE INDEXES
-- =====================================================

CREATE INDEX idx_api_keys_organization_id ON public.api_keys(organization_id);
CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash) WHERE is_active = true;
CREATE INDEX idx_api_keys_active ON public.api_keys(is_active, organization_id);

-- =====================================================
-- 3.3 LEAD ACTIVITY LOG INDEXES
-- =====================================================

CREATE INDEX idx_lead_activity_lead_id ON public.lead_activity_log(lead_id, created_at DESC);
CREATE INDEX idx_lead_activity_organization_id ON public.lead_activity_log(organization_id);

-- =====================================================
-- 4. CREATE TRIGGERS
-- =====================================================

-- =====================================================
-- 4.1 Auto-update updated_at timestamp
-- =====================================================

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON public.api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 4.2 Auto-update last_contacted_at when status changes
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_lead_contacted_at()
RETURNS TRIGGER AS $$
BEGIN
    -- If status changed from 'new' to anything else, update last_contacted_at
    IF OLD.status = 'new' AND NEW.status != 'new' THEN
        NEW.last_contacted_at = NOW();
    END IF;

    -- If status changed to 'converted', update converted_at
    IF NEW.status = 'converted' AND OLD.status != 'converted' THEN
        NEW.converted_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lead_contacted_at_trigger
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_lead_contacted_at();

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activity_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREATE RLS POLICIES
-- =====================================================

-- =====================================================
-- 6.1 LEADS TABLE POLICIES
-- =====================================================

-- Users can view leads from their organizations
CREATE POLICY "Users can view their organization's leads"
    ON public.leads
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = public.leads.organization_id
            AND user_id = auth.uid()
        )
    );

-- Users can create leads for their organizations (admins/owners only)
CREATE POLICY "Admins can create leads"
    ON public.leads
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = public.leads.organization_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Users can update leads in their organizations (admins/owners only)
CREATE POLICY "Admins can update leads"
    ON public.leads
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = public.leads.organization_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = public.leads.organization_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Only owners can delete leads
CREATE POLICY "Owners can delete leads"
    ON public.leads
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = public.leads.organization_id
            AND user_id = auth.uid()
            AND role = 'owner'
        )
    );

-- =====================================================
-- 6.2 API KEYS TABLE POLICIES
-- =====================================================

-- Users can view API keys for their organizations
CREATE POLICY "Users can view their organization's API keys"
    ON public.api_keys
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = public.api_keys.organization_id
            AND user_id = auth.uid()
        )
    );

-- Only owners/admins can create API keys
CREATE POLICY "Admins can create API keys"
    ON public.api_keys
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = public.api_keys.organization_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Only owners/admins can update/revoke API keys
CREATE POLICY "Admins can update API keys"
    ON public.api_keys
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = public.api_keys.organization_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- =====================================================
-- 6.3 LEAD ACTIVITY LOG POLICIES
-- =====================================================

-- Users can view activity logs for their organization's leads
CREATE POLICY "Users can view lead activity logs"
    ON public.lead_activity_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = public.lead_activity_log.organization_id
            AND user_id = auth.uid()
        )
    );

-- System can insert activity logs (via service role)
-- No user-facing INSERT policy needed

-- =====================================================
-- 7. CREATE HELPER FUNCTIONS
-- =====================================================

-- =====================================================
-- 7.1 Function to create a lead with validation
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_lead(
    p_organization_id UUID,
    p_name TEXT,
    p_email TEXT,
    p_phone TEXT DEFAULT NULL,
    p_source lead_source DEFAULT 'manual',
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_lead_id UUID;
    v_user_id UUID;
BEGIN
    -- Get authenticated user
    v_user_id := auth.uid();

    -- Verify user has access to organization
    IF NOT EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = p_organization_id
        AND user_id = v_user_id
        AND role IN ('owner', 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied: User does not have permission to create leads for this organization';
    END IF;

    -- Insert lead
    INSERT INTO public.leads (
        organization_id,
        name,
        email,
        phone,
        source,
        metadata
    ) VALUES (
        p_organization_id,
        p_name,
        p_email,
        p_phone,
        p_source,
        p_metadata
    )
    RETURNING id INTO v_lead_id;

    -- Log activity
    INSERT INTO public.lead_activity_log (
        lead_id,
        organization_id,
        activity_type,
        description,
        performed_by
    ) VALUES (
        v_lead_id,
        p_organization_id,
        'created',
        'Lead created via manual entry',
        v_user_id
    );

    RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7.2 Function to get lead statistics for an organization
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_lead_stats(
    p_organization_id UUID,
    p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    total_leads BIGINT,
    new_leads BIGINT,
    qualified_leads BIGINT,
    converted_leads BIGINT,
    avg_lead_score NUMERIC,
    conversion_rate NUMERIC
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();

    -- Verify user has access
    IF NOT EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = p_organization_id
        AND user_id = v_user_id
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_leads,
        COUNT(*) FILTER (WHERE status = 'new')::BIGINT as new_leads,
        COUNT(*) FILTER (WHERE status = 'qualified')::BIGINT as qualified_leads,
        COUNT(*) FILTER (WHERE status = 'converted')::BIGINT as converted_leads,
        ROUND(AVG(lead_score), 1) as avg_lead_score,
        CASE
            WHEN COUNT(*) > 0 THEN
                ROUND(COUNT(*) FILTER (WHERE status = 'converted')::NUMERIC / COUNT(*)::NUMERIC * 100, 2)
            ELSE 0
        END as conversion_rate
    FROM public.leads
    WHERE organization_id = p_organization_id
    AND created_at >= NOW() - (p_days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7.3 Function to search leads (full-text search)
-- =====================================================

CREATE OR REPLACE FUNCTION public.search_leads(
    p_organization_id UUID,
    p_search_term TEXT,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    status lead_status,
    lead_score INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id,
        l.name,
        l.email,
        l.status,
        l.lead_score,
        l.created_at
    FROM public.leads l
    WHERE l.organization_id = p_organization_id
    AND to_tsvector('english', l.name || ' ' || l.email) @@ plainto_tsquery('english', p_search_term)
    ORDER BY l.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

-- Grant table access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.api_keys TO authenticated;
GRANT SELECT ON public.lead_activity_log TO authenticated;

-- Grant usage on custom types
GRANT USAGE ON TYPE lead_status TO authenticated;
GRANT USAGE ON TYPE lead_source TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.create_lead TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_lead_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_leads TO authenticated;

-- =====================================================
-- 9. ADD COMMENTS (Documentation)
-- =====================================================

COMMENT ON TABLE public.leads IS 'Leads captured from AI chatbot and other sources';
COMMENT ON COLUMN public.leads.lead_score IS 'Lead quality score (0-100), higher = better quality';
COMMENT ON COLUMN public.leads.conversation_summary IS 'AI-generated summary of chatbot interaction';
COMMENT ON COLUMN public.leads.metadata IS 'Flexible JSONB field for custom lead attributes';
COMMENT ON COLUMN public.leads.internal_notes IS 'Private notes visible only to team members, not shared with lead';

COMMENT ON TABLE public.api_keys IS 'API keys for public lead capture endpoint authentication';
COMMENT ON COLUMN public.api_keys.key_hash IS 'Bcrypt hash of the full API key for security';
COMMENT ON COLUMN public.api_keys.key_prefix IS 'First 8 characters of key for display purposes (e.g., sk_live_)';
COMMENT ON COLUMN public.api_keys.allowed_domains IS 'Whitelist of domains allowed to use this API key (CORS)';

COMMENT ON TABLE public.lead_activity_log IS 'Audit trail of all lead-related activities';
COMMENT ON FUNCTION public.create_lead IS 'Securely creates a new lead with validation and activity logging';
COMMENT ON FUNCTION public.get_lead_stats IS 'Retrieves aggregated statistics for leads within a date range';
COMMENT ON FUNCTION public.search_leads IS 'Full-text search across lead names and emails';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
