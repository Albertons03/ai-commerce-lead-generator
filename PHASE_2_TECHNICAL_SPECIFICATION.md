# Phase 2 - Lead System: Technical Implementation Specification

**Document Version:** 1.0
**Date:** 2025-12-16
**Status:** Ready for Implementation
**Dependencies:** Phase 1 (Foundation) - COMPLETE

---

## Table of Contents

1. [Business Requirements Analysis](#1-business-requirements-analysis)
2. [User Personas](#2-user-personas)
3. [User Stories & Acceptance Criteria](#3-user-stories--acceptance-criteria)
4. [Database Schema Design](#4-database-schema-design)
5. [API Design Specification](#5-api-design-specification)
6. [Dashboard Requirements](#6-dashboard-requirements)
7. [Data Flow Architecture](#7-data-flow-architecture)
8. [Implementation Phases](#8-implementation-phases)
9. [Security Considerations](#9-security-considerations)
10. [Testing Strategy](#10-testing-strategy)

---

## 1. Business Requirements Analysis

### 1.1 What is a "Lead" in this E-Commerce Context?

A **lead** is a potential customer who has interacted with the AI chatbot embedded on an e-commerce website and has provided contact information or expressed purchase intent. The lead represents a sales opportunity that requires follow-up.

**Key Characteristics:**
- Generated through AI chatbot interactions (future Phase 3)
- Contains contact information (email, phone, name)
- Linked to specific organization (multi-tenant)
- Has metadata about their interests and conversation context
- Tracks lead quality/score
- Has a lifecycle status (new, contacted, qualified, converted, lost)

### 1.2 Business Objectives

1. **Capture Opportunity**: Store all potential customer interactions from chatbot
2. **Prioritize Action**: Help sales teams identify high-value leads
3. **Track Progress**: Monitor lead lifecycle from first contact to conversion
4. **Measure Success**: Enable analytics on lead generation effectiveness
5. **Multi-Tenant Isolation**: Ensure each organization only sees their own leads

### 1.3 Success Metrics (KPIs)

| Metric | Description | Target (MVP) |
|--------|-------------|--------------|
| Lead Capture Rate | % of chatbot conversations that become leads | 100% (all qualifying conversations) |
| Lead Response Time | Time from lead creation to first view in dashboard | < 5 minutes |
| Dashboard Load Time | Time to display lead list | < 2 seconds |
| Data Accuracy | % of leads with complete required fields | > 95% |
| Multi-Tenant Isolation | Zero cross-tenant data leaks | 100% |

### 1.4 What Triggers Lead Creation?

**For Phase 2 (MVP):**
- Manual lead creation through API (for testing and data import)
- Public API endpoint that embedded chatbot will call

**For Future Phases:**
- AI chatbot detects purchase intent
- User provides contact information in chat
- User requests product information or pricing
- User abandons cart (with integration)
- User fills web forms

### 1.5 Essential Metadata to Capture

**Required Fields:**
- Full name
- Email address
- Phone number (optional but encouraged)
- Organization ID (for multi-tenancy)

**Contextual Fields:**
- Lead source (chatbot, manual, import, web form)
- Lead status (new, contacted, qualified, converted, lost)
- Lead score (0-100, calculated or manual)
- Product interests (array of product names/IDs)
- Conversation summary (AI-generated summary of chatbot interaction)
- Original conversation ID (link to Phase 3 conversations table)

**Metadata Fields:**
- Company name (if B2B)
- UTM parameters (source, medium, campaign)
- Referrer URL
- User agent / device info
- Geographic location (derived from IP)
- Custom fields (JSONB for flexible storage)

**Timestamps:**
- Created at
- Updated at
- Last contacted at
- Converted at

---

## 2. User Personas

### Persona 1: Sarah - E-Commerce Store Owner

**Demographics:**
- Age: 32
- Role: Owner/Founder
- Technical Level: Medium (comfortable with SaaS tools, not a developer)

**Goals:**
- Capture every potential customer who visits her store
- Quickly identify high-intent buyers
- Convert chatbot conversations into sales
- Understand which products generate most interest

**Pain Points:**
- Misses sales opportunities from anonymous site visitors
- Can't track which visitors are serious buyers
- Struggles to prioritize follow-ups
- Lacks visibility into customer interests before purchase

**Usage Pattern:**
- Checks dashboard 3-5 times per day
- Exports leads weekly for email campaigns
- Filters leads by product interest
- Wants mobile-friendly dashboard

### Persona 2: Marcus - Sales Manager (B2B)

**Demographics:**
- Age: 28
- Role: Sales Manager for small e-commerce agency
- Technical Level: High (former developer, now in sales)

**Goals:**
- Manage leads across multiple client stores (multiple orgs)
- Assign leads to sales team members
- Track lead lifecycle and conversion rates
- Integrate leads with CRM (future)

**Pain Points:**
- Juggling multiple client dashboards
- No lead assignment or workflow
- Can't see lead quality at a glance
- Needs bulk export for CRM import

**Usage Pattern:**
- Reviews all new leads every morning
- Filters by date range and status
- Exports leads to CSV for reporting
- Needs API access for custom integrations

### Persona 3: Jenny - Marketing Manager

**Demographics:**
- Age: 35
- Role: Marketing Manager
- Technical Level: Low-Medium (uses marketing tools, not technical)

**Goals:**
- Measure effectiveness of marketing campaigns
- Understand which traffic sources produce best leads
- Segment leads for targeted email campaigns
- Track ROI on ad spend

**Pain Points:**
- Can't correlate leads to marketing campaigns
- Missing UTM tracking data
- No easy way to segment leads by source
- Wants visual analytics (future)

**Usage Pattern:**
- Reviews leads weekly
- Exports leads with UTM data
- Filters by date range and source
- Shares reports with team

---

## 3. User Stories & Acceptance Criteria

### Epic 1: Lead Data Model & Storage

#### Story 1.1: Define Lead Database Schema

**As a** system architect
**I want to** create a robust, scalable lead database schema
**So that** we can store lead data securely with proper relationships and constraints

**Acceptance Criteria:**
- [ ] Leads table created with all required fields
- [ ] Foreign key relationship to organizations table established
- [ ] Indexes created on frequently queried fields (org_id, status, created_at, email)
- [ ] Row-Level Security (RLS) policies prevent cross-tenant data access
- [ ] Triggers for updated_at timestamp automation
- [ ] Database migration runs without errors
- [ ] Schema documented with comments

**Technical Requirements:**
- PostgreSQL 14+
- Supabase RLS enabled
- UUID primary keys
- JSONB for flexible metadata
- Text search index on name/email fields

**Story Points:** 3

---

#### Story 1.2: Implement Lead Creation Function

**As a** backend developer
**I want to** create a database function for safe lead creation
**So that** leads are validated and properly associated with organizations

**Acceptance Criteria:**
- [ ] create_lead() function created with proper validation
- [ ] Function checks user has access to specified organization
- [ ] Function validates required fields (email format, name length)
- [ ] Function prevents duplicate leads (same email + org within 24 hours)
- [ ] Function returns newly created lead ID
- [ ] Function logs errors appropriately
- [ ] SECURITY DEFINER properly scoped

**Story Points:** 2

---

### Epic 2: Lead Capture API

#### Story 2.1: Create Public API for Lead Capture

**As an** embedded chatbot
**I want to** submit lead information via a public API
**So that** chatbot conversations can create leads without user authentication

**Acceptance Criteria:**
- [ ] POST /api/public/leads endpoint created
- [ ] Endpoint accepts JSON payload with lead data
- [ ] API key authentication validates organization ownership
- [ ] Rate limiting prevents abuse (10 requests/minute per org)
- [ ] CORS configured for embedded chatbot domains
- [ ] Validates required fields (name, email, organization_id)
- [ ] Returns 201 with lead ID on success
- [ ] Returns appropriate error codes (400, 401, 429, 500)
- [ ] Endpoint logs all requests for audit

**API Contract:**
```typescript
POST /api/public/leads
Content-Type: application/json
X-API-Key: <organization_api_key>

Request Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "source": "chatbot",
  "conversation_id": "uuid",
  "product_interests": ["Product A", "Product B"],
  "metadata": {
    "utm_source": "google",
    "utm_campaign": "spring_sale"
  }
}

Response (201):
{
  "success": true,
  "lead_id": "uuid",
  "message": "Lead created successfully"
}

Response (400):
{
  "success": false,
  "error": "Invalid email format",
  "field": "email"
}
```

**Story Points:** 5

---

#### Story 2.2: Implement API Key Management

**As an** organization owner
**I want to** generate and manage API keys for my organization
**So that** I can securely authenticate public lead capture requests

**Acceptance Criteria:**
- [ ] API keys table created (organization_id, key_hash, created_at, last_used_at)
- [ ] Generate API key function creates secure random keys
- [ ] Keys are hashed before storage (bcrypt or similar)
- [ ] Dashboard shows masked keys (sk_live_****1234)
- [ ] Keys can be rotated/revoked by owner/admin
- [ ] Last used timestamp updated on each request
- [ ] Maximum 5 active keys per organization

**Story Points:** 3

---

### Epic 3: Internal Lead Management API

#### Story 3.1: Create Lead List API

**As a** dashboard user
**I want to** fetch paginated lead lists with filters
**So that** I can view and manage leads efficiently

**Acceptance Criteria:**
- [ ] GET /api/leads endpoint created
- [ ] Requires authenticated user session
- [ ] Returns only leads for user's current organization
- [ ] Supports pagination (limit, offset)
- [ ] Supports filtering (status, date_range, source)
- [ ] Supports search (name, email)
- [ ] Supports sorting (created_at, lead_score, status)
- [ ] Returns lead count for pagination
- [ ] Performance: < 500ms for 100 leads

**API Contract:**
```typescript
GET /api/leads?organization_id=uuid&page=1&limit=20&status=new&sort=created_at:desc&search=john

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "status": "new",
      "lead_score": 75,
      "source": "chatbot",
      "created_at": "2025-12-16T10:30:00Z",
      "product_interests": ["Product A"]
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "total_pages": 8
  }
}
```

**Story Points:** 5

---

#### Story 3.2: Create Lead Detail API

**As a** dashboard user
**I want to** view complete details for a single lead
**So that** I can see all information and conversation history

**Acceptance Criteria:**
- [ ] GET /api/leads/[id] endpoint created
- [ ] Returns full lead details including metadata
- [ ] Returns related conversation summary (if exists)
- [ ] Returns activity timeline (created, status changes)
- [ ] Verifies user has access to lead's organization
- [ ] Returns 404 if lead not found or no access
- [ ] Performance: < 200ms response time

**Story Points:** 2

---

#### Story 3.3: Create Lead Update API

**As a** dashboard user
**I want to** update lead status and add notes
**So that** I can track lead progress through the sales funnel

**Acceptance Criteria:**
- [ ] PATCH /api/leads/[id] endpoint created
- [ ] Allows updating: status, lead_score, notes, custom_fields
- [ ] Validates enum values for status
- [ ] Logs status change history
- [ ] Updates last_contacted_at when status changes
- [ ] Returns updated lead data
- [ ] Requires admin or owner role for bulk updates

**Story Points:** 3

---

### Epic 4: Lead Dashboard UI

#### Story 4.1: Build Lead List Page

**As a** Sarah (store owner)
**I want to** see a list of all my leads in a table view
**So that** I can quickly scan recent leads and their status

**Acceptance Criteria:**
- [ ] Page accessible at /[orgSlug]/leads
- [ ] Displays leads in sortable table (name, email, status, score, date)
- [ ] Shows lead count at top of page
- [ ] Table is responsive (mobile-friendly)
- [ ] Pagination controls at bottom
- [ ] Loading state shows skeleton
- [ ] Empty state for no leads
- [ ] Clicking row navigates to detail page

**UI Components:**
- Data table with shadcn/ui Table component
- Status badges (New=blue, Contacted=yellow, Qualified=green, etc.)
- Lead score visualized as progress bar or badge
- Relative timestamps ("2 hours ago")

**Story Points:** 5

---

#### Story 4.2: Build Lead Filters & Search

**As a** Marcus (sales manager)
**I want to** filter and search leads
**So that** I can find specific leads or segments quickly

**Acceptance Criteria:**
- [ ] Search bar filters by name or email (client-side or API)
- [ ] Status dropdown filter (All, New, Contacted, Qualified, etc.)
- [ ] Date range picker (Today, Last 7 days, Last 30 days, Custom)
- [ ] Source filter (Chatbot, Manual, Import)
- [ ] Filters update URL params for shareability
- [ ] "Clear filters" button resets all filters
- [ ] Filter state persists on page refresh
- [ ] Shows active filter count badge

**Story Points:** 5

---

#### Story 4.3: Build Lead Detail Page

**As a** Sarah (store owner)
**I want to** view detailed information about a single lead
**So that** I can see their conversation history and context

**Acceptance Criteria:**
- [ ] Page accessible at /[orgSlug]/leads/[leadId]
- [ ] Displays all lead fields in organized sections
- [ ] Contact info section (name, email, phone) with copy buttons
- [ ] Lead info section (status, score, source, interests)
- [ ] Metadata section (UTM params, referrer, device)
- [ ] Timeline section (created, status changes)
- [ ] Status change dropdown (updates via API)
- [ ] "Add note" text area (saves to notes field)
- [ ] Back button to return to list
- [ ] Loading state and error handling

**UI Sections:**
1. Header: Name, email, status badge, score
2. Contact Card: Phone, company, copy buttons
3. Lead Details: Source, interests, UTM data
4. Activity Timeline: Chronological events
5. Notes Section: Add/view notes

**Story Points:** 8

---

#### Story 4.4: Implement Lead Export

**As a** Jenny (marketing manager)
**I want to** export leads to CSV
**So that** I can import them into email tools or analyze in Excel

**Acceptance Criteria:**
- [ ] "Export" button on lead list page
- [ ] Exports currently filtered leads (respects active filters)
- [ ] CSV includes: name, email, phone, status, score, source, created_at, UTM fields
- [ ] File named: leads_export_YYYY-MM-DD.csv
- [ ] Shows export progress indicator
- [ ] Limits export to 1000 leads (shows warning if more)
- [ ] Logs export action for audit

**Story Points:** 3

---

### Epic 5: Lead Analytics (Dashboard Stats)

#### Story 5.1: Update Dashboard Stats

**As a** Sarah (store owner)
**I want to** see lead statistics on my dashboard
**So that** I can track lead generation performance at a glance

**Acceptance Criteria:**
- [ ] "Total Leads" card shows current lead count
- [ ] Shows percentage change vs. previous period
- [ ] "New Leads (7 days)" shows recent lead count
- [ ] "Avg Lead Score" shows quality metric
- [ ] Stats update in real-time (or with refresh)
- [ ] Stats only count leads for current organization
- [ ] Performance: < 500ms query time

**Technical Implementation:**
- Create database functions for efficient stat queries
- Use COUNT, AVG aggregations with date filters
- Cache results for 5 minutes (optional optimization)

**Story Points:** 3

---

## 4. Database Schema Design

### 4.1 Leads Table

```sql
-- =====================================================
-- LEADS TABLE - Phase 2
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

-- Leads table
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
    CONSTRAINT lead_score_range CHECK (lead_score >= 0 AND lead_score <= 100),

    -- Unique constraint: same email can exist multiple times for different orgs,
    -- but only once per org per day (prevents duplicate submissions)
    UNIQUE(organization_id, email, date_trunc('day', created_at))
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
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
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update last_contacted_at when status changes
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
-- COMMENTS (Documentation)
-- =====================================================

COMMENT ON TABLE public.leads IS 'Leads captured from AI chatbot and other sources';
COMMENT ON COLUMN public.leads.lead_score IS 'Lead quality score (0-100), higher = better quality';
COMMENT ON COLUMN public.leads.conversation_summary IS 'AI-generated summary of chatbot interaction';
COMMENT ON COLUMN public.leads.metadata IS 'Flexible JSONB field for custom lead attributes';
COMMENT ON COLUMN public.leads.internal_notes IS 'Private notes visible only to team members, not shared with lead';
```

### 4.2 API Keys Table (for Public Lead Capture)

```sql
-- =====================================================
-- API KEYS TABLE - For Public Lead Capture
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

-- Indexes
CREATE INDEX idx_api_keys_organization_id ON public.api_keys(organization_id);
CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash) WHERE is_active = true;
CREATE INDEX idx_api_keys_active ON public.api_keys(is_active, organization_id);

-- Triggers
CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON public.api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.api_keys IS 'API keys for public lead capture endpoint authentication';
```

### 4.3 Lead Activity Log (Optional Enhancement)

```sql
-- =====================================================
-- LEAD ACTIVITY LOG - Audit Trail
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

-- Indexes
CREATE INDEX idx_lead_activity_lead_id ON public.lead_activity_log(lead_id, created_at DESC);
CREATE INDEX idx_lead_activity_organization_id ON public.lead_activity_log(organization_id);

COMMENT ON TABLE public.lead_activity_log IS 'Audit trail of all lead-related activities';
```

### 4.4 Row-Level Security (RLS) Policies

```sql
-- =====================================================
-- ROW LEVEL SECURITY POLICIES - LEADS
-- =====================================================

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activity_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- LEADS TABLE POLICIES
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
-- API KEYS TABLE POLICIES
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
-- LEAD ACTIVITY LOG POLICIES
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
-- GRANTS
-- =====================================================

-- Grant table access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.api_keys TO authenticated;
GRANT SELECT ON public.lead_activity_log TO authenticated;

-- Grant usage on custom types
GRANT USAGE ON TYPE lead_status TO authenticated;
GRANT USAGE ON TYPE lead_source TO authenticated;
```

### 4.5 Helper Functions

```sql
-- =====================================================
-- HELPER FUNCTIONS FOR LEADS
-- =====================================================

-- Function to create a lead with validation
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

-- Function to get lead statistics for an organization
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

-- Function to search leads (full-text search)
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_lead TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_lead_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_leads TO authenticated;
```

### 4.6 Database Migration File

**File:** `supabase/migrations/20250116000000_create_leads_system.sql`

This migration should include all the SQL from sections 4.1 through 4.5 in the following order:

1. Create ENUM types (lead_status, lead_source)
2. Create tables (leads, api_keys, lead_activity_log)
3. Create indexes
4. Create triggers
5. Enable RLS
6. Create RLS policies
7. Create helper functions
8. Grant permissions
9. Add comments

---

## 5. API Design Specification

### 5.1 Public Lead Capture API

#### Endpoint: POST /api/public/leads

**Purpose:** Allow embedded chatbot to create leads without user authentication.

**Authentication:** API Key (X-API-Key header)

**Rate Limiting:** 10 requests per minute per organization

**Request:**
```typescript
POST /api/public/leads
Content-Type: application/json
X-API-Key: sk_live_abc123xyz789

{
  // Required fields
  "name": "John Doe",
  "email": "john@example.com",

  // Optional fields
  "phone": "+1-555-123-4567",
  "company": "Acme Corp",
  "source": "chatbot", // Default: "chatbot"
  "product_interests": ["Product A", "Product B"],
  "conversation_id": "uuid-of-conversation", // Link to conversation (Phase 3)
  "conversation_summary": "Customer interested in bulk pricing for Product A",

  // Marketing attribution
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "spring_sale_2025",
  "utm_term": "best+widgets",
  "utm_content": "ad_variant_a",
  "referrer_url": "https://google.com",
  "landing_page": "https://example.com/products/widget-a",

  // Technical metadata (auto-captured if not provided)
  "user_agent": "Mozilla/5.0...",
  "ip_address": "192.168.1.1",

  // Custom fields
  "metadata": {
    "custom_field_1": "value",
    "lead_magnet": "free_ebook"
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "lead_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Lead created successfully"
}
```

**Error Responses:**

```json
// 400 Bad Request - Validation Error
{
  "success": false,
  "error": "Invalid email format",
  "field": "email"
}

// 401 Unauthorized - Invalid API Key
{
  "success": false,
  "error": "Invalid or missing API key"
}

// 409 Conflict - Duplicate Lead (same email within 24 hours)
{
  "success": false,
  "error": "Duplicate lead detected",
  "existing_lead_id": "uuid"
}

// 429 Too Many Requests - Rate Limit Exceeded
{
  "success": false,
  "error": "Rate limit exceeded",
  "retry_after": 45
}

// 500 Internal Server Error
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

**Implementation Requirements:**
- Validate API key from `api_keys` table
- Verify API key is active and not revoked
- Check CORS origin against allowed_domains
- Increment usage_count and update last_used_at
- Extract IP address and user agent from request headers
- Validate required fields (name, email)
- Prevent duplicate leads (same email + org within 24 hours)
- Log all requests for audit (even failures)
- Return appropriate HTTP status codes
- Handle database errors gracefully

**File:** `app/api/public/leads/route.ts`

---

### 5.2 Internal Lead Management APIs

#### Endpoint: GET /api/leads

**Purpose:** Fetch paginated, filtered, searchable lead list for dashboard.

**Authentication:** Requires authenticated Supabase session

**Authorization:** User must be member of organization

**Query Parameters:**
```typescript
{
  organization_id: string;  // Required: UUID of organization
  page?: number;            // Default: 1
  limit?: number;           // Default: 20, Max: 100
  status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost' | 'all';
  source?: 'chatbot' | 'manual' | 'import' | 'web_form' | 'referral' | 'all';
  date_from?: string;       // ISO date: '2025-01-01'
  date_to?: string;         // ISO date: '2025-12-31'
  search?: string;          // Search name or email
  sort?: 'created_at' | 'lead_score' | 'name' | 'status';
  order?: 'asc' | 'desc';   // Default: 'desc'
}
```

**Example Request:**
```
GET /api/leads?organization_id=uuid&page=1&limit=20&status=new&sort=created_at&order=desc&search=john
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1-555-123-4567",
      "company": "Acme Corp",
      "status": "new",
      "source": "chatbot",
      "lead_score": 75,
      "product_interests": ["Product A", "Product B"],
      "created_at": "2025-12-16T10:30:00Z",
      "last_contacted_at": null
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  },
  "filters": {
    "status": "new",
    "source": "all",
    "date_from": null,
    "date_to": null,
    "search": "john"
  }
}
```

**Error Response (403):**
```json
{
  "success": false,
  "error": "Access denied: User is not a member of this organization"
}
```

**File:** `app/api/leads/route.ts`

---

#### Endpoint: GET /api/leads/[id]

**Purpose:** Fetch complete details for a single lead.

**Authentication:** Requires authenticated Supabase session

**Authorization:** User must be member of lead's organization

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "organization_id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-123-4567",
    "company": "Acme Corp",
    "status": "new",
    "source": "chatbot",
    "lead_score": 75,
    "product_interests": ["Product A", "Product B"],
    "conversation_id": "uuid",
    "conversation_summary": "Customer asked about bulk pricing...",
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "spring_sale",
    "referrer_url": "https://google.com",
    "landing_page": "https://example.com/products",
    "user_agent": "Mozilla/5.0...",
    "ip_address": "192.168.1.1",
    "location_country": "US",
    "location_city": "San Francisco",
    "metadata": {
      "custom_field": "value"
    },
    "notes": "Customer seems interested in premium package",
    "internal_notes": "Follow up next week",
    "created_at": "2025-12-16T10:30:00Z",
    "updated_at": "2025-12-16T15:45:00Z",
    "last_contacted_at": null,
    "converted_at": null,

    // Activity timeline
    "activity": [
      {
        "id": "uuid",
        "activity_type": "created",
        "description": "Lead created via chatbot",
        "performed_by": null,
        "created_at": "2025-12-16T10:30:00Z"
      },
      {
        "activity_type": "note_added",
        "description": "Added note",
        "performed_by": "user-uuid",
        "performed_by_name": "Sarah Smith",
        "created_at": "2025-12-16T15:45:00Z"
      }
    ]
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Lead not found or access denied"
}
```

**File:** `app/api/leads/[id]/route.ts`

---

#### Endpoint: PATCH /api/leads/[id]

**Purpose:** Update lead fields (status, score, notes).

**Authentication:** Requires authenticated Supabase session

**Authorization:** User must be admin or owner of lead's organization

**Request Body:**
```json
{
  "status": "contacted",
  "lead_score": 85,
  "notes": "Customer responded positively, scheduling demo",
  "internal_notes": "High priority - mentioned $50k budget",
  "metadata": {
    "demo_scheduled": "2025-12-20T14:00:00Z"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "contacted",
    "lead_score": 85,
    "notes": "Customer responded positively...",
    "updated_at": "2025-12-16T16:00:00Z",
    "last_contacted_at": "2025-12-16T16:00:00Z"
  },
  "message": "Lead updated successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid status value",
  "field": "status"
}
```

**File:** `app/api/leads/[id]/route.ts`

---

#### Endpoint: GET /api/leads/stats

**Purpose:** Get lead statistics for dashboard cards.

**Authentication:** Requires authenticated Supabase session

**Query Parameters:**
```typescript
{
  organization_id: string;  // Required
  days_back?: number;       // Default: 30
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "total_leads": 150,
    "new_leads": 23,
    "qualified_leads": 45,
    "converted_leads": 18,
    "avg_lead_score": 67.5,
    "conversion_rate": 12.0,

    // Comparison to previous period
    "change": {
      "total_leads": "+15%",
      "new_leads": "+8%",
      "conversion_rate": "+2.3%"
    }
  },
  "period": {
    "days": 30,
    "start_date": "2025-11-16",
    "end_date": "2025-12-16"
  }
}
```

**File:** `app/api/leads/stats/route.ts`

---

#### Endpoint: POST /api/leads/export

**Purpose:** Export filtered leads to CSV.

**Authentication:** Requires authenticated Supabase session

**Request Body:** (same filters as GET /api/leads)
```json
{
  "organization_id": "uuid",
  "status": "all",
  "date_from": "2025-01-01",
  "date_to": "2025-12-31"
}
```

**Success Response (200):**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="leads_export_2025-12-16.csv"

"Name","Email","Phone","Company","Status","Score","Source","Created At","UTM Source","UTM Campaign"
"John Doe","john@example.com","+1-555-123-4567","Acme Corp","new","75","chatbot","2025-12-16T10:30:00Z","google","spring_sale"
...
```

**File:** `app/api/leads/export/route.ts`

---

### 5.3 API Key Management APIs

#### Endpoint: GET /api/api-keys

**Purpose:** List all API keys for an organization.

**Authentication:** Requires authenticated Supabase session

**Authorization:** User must be member of organization

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Production Chatbot",
      "key_prefix": "sk_live_abc123",
      "is_active": true,
      "last_used_at": "2025-12-16T10:30:00Z",
      "usage_count": 1523,
      "created_at": "2025-11-01T12:00:00Z",
      "allowed_domains": ["example.com", "www.example.com"]
    }
  ]
}
```

**File:** `app/api/api-keys/route.ts`

---

#### Endpoint: POST /api/api-keys

**Purpose:** Generate new API key for organization.

**Authentication:** Requires authenticated Supabase session

**Authorization:** User must be admin or owner

**Request Body:**
```json
{
  "organization_id": "uuid",
  "name": "Production Chatbot",
  "allowed_domains": ["example.com", "www.example.com"],
  "rate_limit_per_minute": 10
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Production Chatbot",
    "api_key": "sk_live_abc123xyz789_FULL_KEY_SHOWN_ONCE",
    "key_prefix": "sk_live_abc123",
    "created_at": "2025-12-16T16:00:00Z"
  },
  "message": "API key created successfully. Save this key securely - it will not be shown again."
}
```

**File:** `app/api/api-keys/route.ts`

---

#### Endpoint: DELETE /api/api-keys/[id]

**Purpose:** Revoke an API key.

**Authentication:** Requires authenticated Supabase session

**Authorization:** User must be admin or owner

**Success Response (200):**
```json
{
  "success": true,
  "message": "API key revoked successfully"
}
```

**File:** `app/api/api-keys/[id]/route.ts`

---

## 6. Dashboard Requirements

### 6.1 Lead List Page

**Route:** `/[orgSlug]/leads`

**Purpose:** Display paginated, filterable, searchable table of leads.

**Page Structure:**

```
┌─────────────────────────────────────────────────────────┐
│  Leads                                    [Export CSV ▼] │
│  150 total leads                                         │
├─────────────────────────────────────────────────────────┤
│  [🔍 Search...] [Status ▼] [Source ▼] [Date Range ▼]   │
│  [Clear Filters]                                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐│
│  │ Name ↓  Email      Phone     Status  Score  Created ││
│  ├─────────────────────────────────────────────────────┤│
│  │ John Doe john@...  +1-555... ◉ New    75   2h ago  ││
│  │ Jane Smith jane@... +1-555... ◉ Cont.  82   5h ago ││
│  │ ...                                                  ││
│  └─────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────┤
│  ← Previous  [1] 2 3 4 5 ... 8  Next →                  │
└─────────────────────────────────────────────────────────┘
```

**UI Components:**

1. **Header Section**
   - Page title: "Leads"
   - Total lead count badge
   - Export button (dropdown: CSV, JSON)

2. **Filter Bar**
   - Search input (debounced, searches name + email)
   - Status dropdown (All, New, Contacted, Qualified, Converted, Lost)
   - Source dropdown (All, Chatbot, Manual, Import, Web Form, Referral)
   - Date range picker (Today, Last 7 days, Last 30 days, Custom range)
   - "Clear Filters" button (visible when filters active)
   - Active filter count badge

3. **Data Table**
   - Columns: Name, Email, Phone, Status, Score, Created At
   - Sortable columns (click header to sort)
   - Status rendered as colored badge
   - Lead score rendered as progress bar or colored badge
   - Relative timestamps ("2 hours ago", "3 days ago")
   - Row hover effect
   - Click row to navigate to detail page
   - Responsive: stacks on mobile

4. **Pagination Controls**
   - Previous/Next buttons
   - Page numbers (with ellipsis for many pages)
   - "Showing X-Y of Z leads"

5. **Empty States**
   - No leads: "No leads yet. Create your first lead or connect your chatbot."
   - No results: "No leads match your filters. Try adjusting your search."

6. **Loading States**
   - Skeleton loaders for table rows
   - Spinner for filter/search operations

**Interactions:**
- Clicking row navigates to `/[orgSlug]/leads/[leadId]`
- Filters update URL params (shareable links)
- Filter state persists across navigation (stored in URL)
- Export button triggers download

**Performance Requirements:**
- Initial page load: < 2 seconds
- Filter/search response: < 500ms
- Smooth scrolling on large tables
- Pagination prevents loading all leads at once

**Accessibility:**
- Keyboard navigation for table
- Screen reader labels for status badges
- Focus management for filters
- Skip to content link

**File:** `app/(dashboard)/[orgSlug]/leads/page.tsx`

---

### 6.2 Lead Detail Page

**Route:** `/[orgSlug]/leads/[leadId]`

**Purpose:** Display comprehensive lead information and activity timeline.

**Page Structure:**

```
┌─────────────────────────────────────────────────────────┐
│  ← Back to Leads                         [Edit] [Delete]│
├─────────────────────────────────────────────────────────┤
│  John Doe                         ◉ New    Score: 75/100│
│  john@example.com                                        │
├──────────────────────┬──────────────────────────────────┤
│  Contact Information │  Lead Details                    │
│  ┌──────────────────┐│  ┌──────────────────────────────┐│
│  │ Email: john@...  ││  │ Source: Chatbot              ││
│  │ [Copy]           ││  │ Status: [New ▼]              ││
│  │                  ││  │ Score: 75                    ││
│  │ Phone: +1-555... ││  │ Created: Dec 16, 2025 10:30 ││
│  │ [Copy] [Call]    ││  │                              ││
│  │                  ││  │ Product Interests:           ││
│  │ Company: Acme    ││  │ • Product A                  ││
│  │                  ││  │ • Product B                  ││
│  └──────────────────┘│  └──────────────────────────────┘│
├──────────────────────┴──────────────────────────────────┤
│  Marketing Attribution                                   │
│  ┌─────────────────────────────────────────────────────┐│
│  │ UTM Source: google    Campaign: spring_sale         ││
│  │ UTM Medium: cpc       Referrer: google.com          ││
│  │ Landing Page: /products/widget-a                    ││
│  └─────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────┤
│  Conversation Summary                                    │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Customer asked about bulk pricing for Product A.    ││
│  │ Interested in quantities of 100+ units.             ││
│  │ [View Full Conversation →]                          ││
│  └─────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────┤
│  Notes                                                   │
│  ┌─────────────────────────────────────────────────────┐│
│  │ [Add a note...]                         [Save Note] ││
│  └─────────────────────────────────────────────────────┘│
│  • Follow up next week - Sarah, 2 hours ago             │
│  • High priority lead - Marcus, 5 hours ago             │
├─────────────────────────────────────────────────────────┤
│  Activity Timeline                                       │
│  ┌─────────────────────────────────────────────────────┐│
│  │ ● Status changed to "Contacted" - Sarah, 1 hour ago ││
│  │ ● Note added - Marcus, 5 hours ago                  ││
│  │ ● Lead created via chatbot - System, 10 hours ago   ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

**UI Sections:**

1. **Header**
   - Back button
   - Lead name and email
   - Status badge (editable dropdown)
   - Lead score badge
   - Action buttons (Edit, Delete)

2. **Contact Information Card**
   - Email with copy button
   - Phone with copy and call (mailto:) buttons
   - Company name
   - Copy all contact info button

3. **Lead Details Card**
   - Source badge
   - Status dropdown (inline edit)
   - Lead score (editable input)
   - Created timestamp
   - Product interests (tags)
   - View conversation link (if exists)

4. **Marketing Attribution Card** (collapsible)
   - All UTM parameters
   - Referrer URL
   - Landing page URL
   - User agent, IP, location

5. **Conversation Summary Card**
   - AI-generated summary text
   - Link to full conversation (Phase 3)
   - Visible only if conversation exists

6. **Notes Section**
   - Add note textarea
   - Save button
   - List of existing notes with author and timestamp
   - Separate internal notes (team-only, marked with lock icon)

7. **Activity Timeline**
   - Chronological list of all activities
   - Icons for each activity type
   - Actor name and timestamp
   - Description of action

8. **Metadata Section** (collapsible, admin-only)
   - Raw JSON viewer for metadata field
   - Custom fields

**Interactions:**
- Status dropdown auto-saves on change
- Copy buttons show "Copied!" toast
- Notes auto-save on blur or Save click
- Edit button opens modal or inline edit mode
- Delete button shows confirmation dialog

**Validations:**
- Lead score must be 0-100
- Status must be valid enum value
- Notes character limit (5000 chars)

**File:** `app/(dashboard)/[orgSlug]/leads/[leadId]/page.tsx`

---

### 6.3 API Key Management Page

**Route:** `/[orgSlug]/settings/api-keys`

**Purpose:** Generate and manage API keys for public lead capture.

**Page Structure:**

```
┌─────────────────────────────────────────────────────────┐
│  API Keys                               [+ Generate Key] │
│  Manage API keys for chatbot integration                │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐│
│  │ Production Chatbot                                   ││
│  │ sk_live_abc123****                                   ││
│  │ Last used: 2 hours ago (1,523 requests)             ││
│  │ Domains: example.com, www.example.com               ││
│  │ [Revoke]                                             ││
│  ├─────────────────────────────────────────────────────┤│
│  │ Test Key                                             ││
│  │ sk_test_xyz789****                                   ││
│  │ Last used: Never                                     ││
│  │ Domains: localhost:3000                              ││
│  │ [Revoke]                                             ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

**UI Components:**

1. **Header**
   - Page title and description
   - "Generate New Key" button

2. **API Key Cards**
   - Key name
   - Masked key (sk_live_****1234)
   - Last used timestamp and usage count
   - Allowed domains list
   - Revoke button (with confirmation)

3. **Generate Key Modal**
   - Key name input
   - Allowed domains multi-input
   - Rate limit slider (1-100 requests/minute)
   - Generate button
   - Shows full API key ONCE after generation
   - Copy button and "Save this key" warning

**File:** `app/(dashboard)/[orgSlug]/settings/api-keys/page.tsx`

---

### 6.4 Dashboard Stats Update

**Route:** `/[orgSlug]` (main dashboard)

**Purpose:** Update existing dashboard stats cards with real lead data.

**Changes to Existing Dashboard:**

Update the "Total Leads" card:
```typescript
// Before: hardcoded 0
<div className="text-3xl font-bold text-white">0</div>

// After: fetch from API
const stats = await getLeadStats(orgId);
<div className="text-3xl font-bold text-white">{stats.total_leads}</div>
<p className="text-xs text-gray-500 mt-1">
  {stats.change.total_leads} from last month
</p>
```

Add new stats:
- New Leads (7 days): count of leads with status="new" in last 7 days
- Avg Lead Score: average lead_score across all leads
- Conversion Rate: percentage of leads with status="converted"

**File:** `app/(dashboard)/[orgSlug]/page.tsx` (update existing)

---

## 7. Data Flow Architecture

### 7.1 Lead Creation Flow (Public API)

```
┌──────────────────┐
│  Chatbot Widget  │
│  (Embedded on    │
│  Client Website) │
└────────┬─────────┘
         │ 1. User provides contact info
         ▼
┌──────────────────┐
│  POST /api/      │
│  public/leads    │
│  + API Key       │
└────────┬─────────┘
         │ 2. Validate API key
         ▼
┌──────────────────┐
│  api_keys table  │
│  (verify active, │
│  get org_id)     │
└────────┬─────────┘
         │ 3. Validate request
         ▼
┌──────────────────┐
│  Validate:       │
│  - Email format  │
│  - Required flds │
│  - Rate limit    │
└────────┬─────────┘
         │ 4. Check duplicates
         ▼
┌──────────────────┐
│  Query leads     │
│  table for       │
│  duplicate email │
└────────┬─────────┘
         │ 5. Insert lead
         ▼
┌──────────────────┐
│  INSERT INTO     │
│  leads table     │
└────────┬─────────┘
         │ 6. Log activity
         ▼
┌──────────────────┐
│  INSERT INTO     │
│  lead_activity   │
│  _log            │
└────────┬─────────┘
         │ 7. Return success
         ▼
┌──────────────────┐
│  { success: true,│
│   lead_id: uuid }│
└──────────────────┘
```

**Error Handling:**
- Invalid API key → 401 Unauthorized
- Validation error → 400 Bad Request
- Duplicate lead → 409 Conflict (return existing lead_id)
- Rate limit exceeded → 429 Too Many Requests
- Database error → 500 Internal Server Error
- All errors logged for monitoring

---

### 7.2 Lead List Display Flow (Dashboard)

```
┌──────────────────┐
│  User navigates  │
│  to /leads page  │
└────────┬─────────┘
         │ 1. Check auth
         ▼
┌──────────────────┐
│  Verify Supabase │
│  session exists  │
└────────┬─────────┘
         │ 2. Get organization
         ▼
┌──────────────────┐
│  Get org from    │
│  URL slug        │
└────────┬─────────┘
         │ 3. Verify membership
         ▼
┌──────────────────┐
│  Check user is   │
│  org member      │
│  (RLS enforces)  │
└────────┬─────────┘
         │ 4. Parse filters from URL
         ▼
┌──────────────────┐
│  Extract query   │
│  params: status, │
│  date, search    │
└────────┬─────────┘
         │ 5. Fetch leads
         ▼
┌──────────────────┐
│  GET /api/leads  │
│  with filters    │
└────────┬─────────┘
         │ 6. Query database
         ▼
┌──────────────────┐
│  SELECT FROM     │
│  leads WHERE     │
│  org_id = ...    │
│  AND status = ...│
│  LIMIT/OFFSET    │
└────────┬─────────┘
         │ 7. Render table
         ▼
┌──────────────────┐
│  Display leads   │
│  with pagination │
└──────────────────┘
```

**Optimization:**
- Server-side rendering for initial page load
- Client-side filtering for fast interactions
- Debounced search to reduce API calls
- Pagination prevents loading all leads
- RLS ensures multi-tenant isolation

---

### 7.3 Lead Status Update Flow

```
┌──────────────────┐
│  User changes    │
│  status dropdown │
│  on detail page  │
└────────┬─────────┘
         │ 1. Optimistic UI update
         ▼
┌──────────────────┐
│  Update UI       │
│  immediately     │
│  (show new badge)│
└────────┬─────────┘
         │ 2. API request
         ▼
┌──────────────────┐
│  PATCH /api/     │
│  leads/[id]      │
└────────┬─────────┘
         │ 3. Verify permissions
         ▼
┌──────────────────┐
│  Check user is   │
│  admin/owner     │
└────────┬─────────┘
         │ 4. Update lead
         ▼
┌──────────────────┐
│  UPDATE leads    │
│  SET status =... │
│  WHERE id = ...  │
└────────┬─────────┘
         │ 5. Trigger updates
         ▼
┌──────────────────┐
│  Trigger sets:   │
│  - updated_at    │
│  - last_contact  │
│  - converted_at  │
└────────┬─────────┘
         │ 6. Log activity
         ▼
┌──────────────────┐
│  INSERT INTO     │
│  lead_activity   │
│  _log            │
└────────┬─────────┘
         │ 7. Return updated lead
         ▼
┌──────────────────┐
│  Confirm UI      │
│  update or       │
│  rollback on err │
└──────────────────┘
```

**Rollback Strategy:**
- Optimistic UI updates for instant feedback
- Rollback UI on API error
- Show toast notification on success/failure

---

## 8. Implementation Phases

### Phase 2A: Database & Core API (Week 1)

**Goal:** Establish data foundation and basic API endpoints.

**Tasks:**

1. **Database Setup**
   - [ ] Create migration file: `20250116000000_create_leads_system.sql`
   - [ ] Define ENUM types (lead_status, lead_source)
   - [ ] Create leads table with all fields
   - [ ] Create api_keys table
   - [ ] Create lead_activity_log table
   - [ ] Create indexes for performance
   - [ ] Create triggers (updated_at, last_contacted_at)
   - [ ] Test migration locally
   - [ ] Apply migration to dev Supabase

2. **RLS Policies**
   - [ ] Enable RLS on all tables
   - [ ] Create SELECT policies (org membership check)
   - [ ] Create INSERT policies (admin/owner only)
   - [ ] Create UPDATE policies (admin/owner only)
   - [ ] Create DELETE policies (owner only)
   - [ ] Test RLS with multiple users
   - [ ] Test cross-tenant isolation

3. **Helper Functions**
   - [ ] Create create_lead() function
   - [ ] Create get_lead_stats() function
   - [ ] Create search_leads() function
   - [ ] Test functions with sample data
   - [ ] Grant execute permissions

4. **Internal Leads API**
   - [ ] Create GET /api/leads route
   - [ ] Implement pagination logic
   - [ ] Implement filtering (status, source, date)
   - [ ] Implement search (name, email)
   - [ ] Implement sorting
   - [ ] Test with sample data
   - [ ] Create GET /api/leads/[id] route
   - [ ] Test detail endpoint

**Deliverables:**
- Working database schema
- Tested RLS policies
- Internal API endpoints (list + detail)

**Testing:**
- Unit tests for validation logic
- Integration tests for API endpoints
- RLS tests for multi-tenancy
- Load test pagination with 1000+ leads

**Blockers/Dependencies:**
- None (Phase 1 complete)

---

### Phase 2B: Public Lead Capture API (Week 1-2)

**Goal:** Enable external chatbot to create leads.

**Tasks:**

1. **API Key Management Backend**
   - [ ] Create GET /api/api-keys route
   - [ ] Create POST /api/api-keys route (generate key)
   - [ ] Implement secure key generation (crypto.randomBytes)
   - [ ] Implement key hashing (bcrypt)
   - [ ] Create DELETE /api/api-keys/[id] route (revoke)
   - [ ] Test key generation and revocation

2. **Public Lead Capture API**
   - [ ] Create POST /api/public/leads route
   - [ ] Implement API key authentication middleware
   - [ ] Implement rate limiting (10 req/min per org)
   - [ ] Implement CORS configuration
   - [ ] Implement request validation (Zod schema)
   - [ ] Implement duplicate detection (24h window)
   - [ ] Extract IP address and user agent
   - [ ] Log all requests (audit trail)
   - [ ] Test with valid/invalid API keys
   - [ ] Test rate limiting
   - [ ] Test duplicate prevention

3. **Error Handling**
   - [ ] Define error response format
   - [ ] Implement error codes (400, 401, 409, 429, 500)
   - [ ] Add error logging (Sentry/LogRocket)
   - [ ] Test all error scenarios

**Deliverables:**
- Working public lead capture endpoint
- API key generation system
- Rate limiting and security measures

**Testing:**
- Test valid lead creation
- Test invalid API keys
- Test rate limit enforcement
- Test duplicate lead prevention
- Test CORS headers
- Load test with 100 concurrent requests

---

### Phase 2C: Lead Dashboard UI (Week 2)

**Goal:** Build user-facing dashboard pages.

**Tasks:**

1. **Lead List Page**
   - [ ] Create page: /[orgSlug]/leads/page.tsx
   - [ ] Build table component (shadcn/ui Table)
   - [ ] Implement pagination controls
   - [ ] Implement search bar (debounced)
   - [ ] Implement status filter dropdown
   - [ ] Implement source filter dropdown
   - [ ] Implement date range picker
   - [ ] Implement sort controls
   - [ ] Add loading skeleton
   - [ ] Add empty state
   - [ ] Add error state
   - [ ] Make responsive (mobile-friendly)
   - [ ] Test with 0, 10, 100, 1000+ leads

2. **Lead Detail Page**
   - [ ] Create page: /[orgSlug]/leads/[leadId]/page.tsx
   - [ ] Build header section
   - [ ] Build contact information card
   - [ ] Build lead details card
   - [ ] Build marketing attribution card
   - [ ] Build conversation summary card
   - [ ] Build notes section (add/view notes)
   - [ ] Build activity timeline
   - [ ] Implement inline status editing
   - [ ] Implement copy-to-clipboard buttons
   - [ ] Add loading state
   - [ ] Add error state (404)
   - [ ] Make responsive

3. **Shared Components**
   - [ ] Create StatusBadge component
   - [ ] Create LeadScoreBadge component
   - [ ] Create CopyButton component
   - [ ] Create RelativeTime component
   - [ ] Create DateRangePicker component

**Deliverables:**
- Fully functional lead list page
- Fully functional lead detail page
- Reusable UI components

**Testing:**
- Visual regression tests
- Accessibility tests (keyboard nav, screen reader)
- Responsive tests (mobile, tablet, desktop)
- User acceptance testing

---

### Phase 2D: Lead Export & Stats (Week 2-3)

**Goal:** Enable data export and dashboard analytics.

**Tasks:**

1. **Lead Export**
   - [ ] Create POST /api/leads/export route
   - [ ] Implement CSV generation
   - [ ] Apply current filters to export
   - [ ] Limit export to 1000 leads
   - [ ] Add export button to lead list page
   - [ ] Show export progress indicator
   - [ ] Test CSV format
   - [ ] Test with various filters

2. **Dashboard Stats**
   - [ ] Create GET /api/leads/stats route
   - [ ] Implement get_lead_stats() function
   - [ ] Calculate total leads
   - [ ] Calculate new leads (7 days)
   - [ ] Calculate avg lead score
   - [ ] Calculate conversion rate
   - [ ] Calculate period-over-period changes
   - [ ] Update dashboard page with real data
   - [ ] Test stat calculations

3. **API Key Management UI**
   - [ ] Create page: /[orgSlug]/settings/api-keys/page.tsx
   - [ ] Build API key list cards
   - [ ] Build generate key modal
   - [ ] Build revoke key confirmation dialog
   - [ ] Show key once after generation (security)
   - [ ] Test key generation flow
   - [ ] Test key revocation flow

**Deliverables:**
- CSV export functionality
- Live dashboard stats
- API key management UI

**Testing:**
- Test CSV export with filters
- Test stat calculations accuracy
- Test API key generation and revocation
- Test one-time key display security

---

### Phase 2E: Polish & Documentation (Week 3)

**Goal:** Finalize Phase 2 and prepare for Phase 3.

**Tasks:**

1. **Performance Optimization**
   - [ ] Add database query caching (if needed)
   - [ ] Optimize slow queries (EXPLAIN ANALYZE)
   - [ ] Add CDN for static assets
   - [ ] Implement lazy loading for large lists
   - [ ] Test page load times
   - [ ] Test API response times

2. **Error Handling & Validation**
   - [ ] Add comprehensive error messages
   - [ ] Add form validation feedback
   - [ ] Add toast notifications for actions
   - [ ] Test all error scenarios

3. **Documentation**
   - [ ] Write API documentation (OpenAPI/Swagger)
   - [ ] Write database schema documentation
   - [ ] Write user guide for dashboard
   - [ ] Write developer guide for API integration
   - [ ] Add code comments
   - [ ] Create README for Phase 2

4. **Security Audit**
   - [ ] Review RLS policies
   - [ ] Review API key security
   - [ ] Review rate limiting
   - [ ] Test for SQL injection
   - [ ] Test for XSS vulnerabilities
   - [ ] Test CORS configuration
   - [ ] Run security scan (npm audit)

5. **Testing**
   - [ ] Write unit tests (>80% coverage)
   - [ ] Write integration tests
   - [ ] Write E2E tests (Playwright)
   - [ ] Perform load testing
   - [ ] Perform security testing

**Deliverables:**
- Performance-optimized system
- Comprehensive documentation
- Security audit report
- Test suite (unit + integration + E2E)

**Sign-off Criteria:**
- All user stories completed
- All tests passing
- Performance metrics met (< 2s page load, < 500ms API)
- Security audit passed
- Documentation complete
- Stakeholder approval

---

## 9. Security Considerations

### 9.1 Multi-Tenant Isolation

**Risk:** Cross-tenant data leakage (User A sees User B's leads).

**Mitigation:**
- Row-Level Security (RLS) policies on all tables
- All queries filter by organization_id
- Helper functions verify org membership
- API endpoints verify user access before returning data
- Test cross-tenant access attempts

**Testing:**
- Create two orgs with different users
- Attempt to access Org A's leads from Org B's user
- Verify RLS blocks unauthorized access
- Test with direct database queries
- Test with API endpoints

---

### 9.2 API Key Security

**Risk:** Leaked API keys allow unauthorized lead creation.

**Mitigation:**
- Store hashed keys only (bcrypt, cost=10)
- Show full key only once during generation
- Implement rate limiting (10 req/min default)
- Allow key revocation at any time
- Log all API key usage
- CORS whitelist per key
- Monitor for unusual activity

**Best Practices:**
- Key format: `sk_{env}_{random}` (e.g., sk_live_abc123xyz789)
- Prefix visible in dashboard (sk_live_abc123****)
- Rotate keys regularly (encourage monthly rotation)
- Separate test and production keys
- Never log full API keys

---

### 9.3 Rate Limiting & Abuse Prevention

**Risk:** API abuse, DDoS, spam lead creation.

**Mitigation:**
- Rate limit: 10 requests/minute per organization (configurable)
- Track usage_count per API key
- Block suspicious IP addresses
- Implement CAPTCHA for high-volume keys (future)
- Monitor for duplicate lead spam
- Alert on unusual patterns

**Implementation:**
- Use Upstash Redis for rate limit tracking
- Return 429 status with Retry-After header
- Log rate limit violations
- Dashboard shows usage metrics

---

### 9.4 Input Validation & Sanitization

**Risk:** SQL injection, XSS, malformed data.

**Mitigation:**
- Validate all inputs with Zod schemas
- Sanitize HTML in notes field
- Validate email format (regex + DNS check optional)
- Validate phone format (E.164 standard)
- Limit text field lengths (prevent DOS)
- Escape user-generated content in UI

**Validation Rules:**
- Name: 2-200 characters, no HTML
- Email: RFC 5322 format
- Phone: optional, E.164 format recommended
- Lead score: 0-100 integer
- Status: must be valid enum value
- Notes: max 5000 characters

---

### 9.5 Authentication & Authorization

**Risk:** Unauthorized access to dashboard or API.

**Mitigation:**
- Supabase session-based auth for dashboard
- API key authentication for public endpoint
- Role-based access control (owner/admin/member)
- RLS enforces org membership on all queries
- Protected routes redirect to login
- Session timeout after 24 hours

**Permission Matrix:**

| Action | Member | Admin | Owner |
|--------|--------|-------|-------|
| View leads | ✅ | ✅ | ✅ |
| Create leads | ❌ | ✅ | ✅ |
| Update leads | ❌ | ✅ | ✅ |
| Delete leads | ❌ | ❌ | ✅ |
| Generate API keys | ❌ | ✅ | ✅ |
| Revoke API keys | ❌ | ✅ | ✅ |
| Export leads | ✅ | ✅ | ✅ |

---

### 9.6 Data Privacy & Compliance

**Risk:** GDPR, CCPA violations, PII exposure.

**Mitigation:**
- Store only necessary PII (name, email, phone)
- Encrypt sensitive fields at rest (Supabase default)
- Implement data retention policy (future)
- Allow lead deletion (GDPR right to be forgotten)
- Audit log for all data access
- Anonymize IP addresses (optional)
- Add privacy policy link in dashboard

**GDPR Considerations:**
- Legal basis: legitimate interest (lead gen)
- User consent: implied via chatbot interaction
- Right to access: lead detail page
- Right to deletion: delete lead button (owner only)
- Right to portability: CSV export
- Data processor agreement: Supabase DPA

---

## 10. Testing Strategy

### 10.1 Unit Tests

**Scope:** Individual functions, components, utilities.

**Framework:** Jest + React Testing Library

**Coverage Target:** >80%

**Test Cases:**

1. **Validation Functions**
   - Valid/invalid email formats
   - Valid/invalid phone formats
   - Lead score range validation
   - Status enum validation

2. **Helper Functions**
   - create_lead() function
   - get_lead_stats() function
   - search_leads() function

3. **UI Components**
   - StatusBadge renders correct color
   - LeadScoreBadge renders correct value
   - CopyButton copies to clipboard
   - DateRangePicker updates filters

**Example:**
```typescript
describe('Email Validation', () => {
  it('accepts valid email', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
  });
});
```

---

### 10.2 Integration Tests

**Scope:** API endpoints, database operations, RLS policies.

**Framework:** Jest + Supertest + Supabase Test Helpers

**Test Cases:**

1. **Lead Creation API**
   - Create lead with valid data → 201
   - Create lead with invalid email → 400
   - Create duplicate lead → 409
   - Create lead without API key → 401
   - Create lead with revoked API key → 401
   - Rate limit enforcement → 429

2. **Lead List API**
   - Fetch leads for org → 200
   - Fetch leads for different org → 403
   - Fetch with filters → correct results
   - Fetch with pagination → correct page
   - Fetch with search → correct results

3. **RLS Policies**
   - User A cannot see User B's leads
   - Admin can update leads
   - Member cannot update leads
   - Owner can delete leads

**Example:**
```typescript
describe('POST /api/public/leads', () => {
  it('creates lead with valid API key', async () => {
    const response = await request(app)
      .post('/api/public/leads')
      .set('X-API-Key', validApiKey)
      .send({
        name: 'John Doe',
        email: 'john@example.com'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.lead_id).toBeDefined();
  });
});
```

---

### 10.3 End-to-End Tests

**Scope:** User workflows, full application flow.

**Framework:** Playwright

**Test Cases:**

1. **Lead Management Workflow**
   - User logs in
   - User navigates to leads page
   - User filters leads by status
   - User clicks lead to view details
   - User updates lead status
   - User adds note
   - User exports leads to CSV

2. **API Key Management Workflow**
   - User navigates to API keys page
   - User generates new API key
   - User copies API key
   - User revokes API key

3. **Public API Workflow**
   - External system creates lead via API
   - Lead appears in dashboard
   - User views lead details
   - User updates lead status

**Example:**
```typescript
test('create and view lead', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.goto('/acme-corp/leads');
  await expect(page.locator('h1')).toContainText('Leads');

  // Create lead via API
  const response = await fetch('/api/public/leads', {
    method: 'POST',
    headers: { 'X-API-Key': apiKey },
    body: JSON.stringify({ name: 'Test Lead', email: 'test@lead.com' })
  });

  // Verify lead appears in dashboard
  await page.reload();
  await expect(page.locator('table')).toContainText('test@lead.com');
});
```

---

### 10.4 Performance Tests

**Scope:** API response times, page load times, database query performance.

**Tools:** k6, Lighthouse, PostgreSQL EXPLAIN ANALYZE

**Metrics:**

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page load time | < 2 seconds | Lighthouse |
| API response time | < 500ms | k6 |
| Database query time | < 100ms | EXPLAIN ANALYZE |
| Pagination query | < 200ms | k6 |
| Export 1000 leads | < 5 seconds | Manual test |

**Load Test Scenarios:**
1. 100 concurrent users viewing lead list
2. 10 concurrent API requests creating leads
3. 1000 leads in database, pagination performance

**Example k6 Test:**
```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 100, // 100 virtual users
  duration: '30s',
};

export default function () {
  let response = http.get('https://app.example.com/api/leads?organization_id=uuid');

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

---

### 10.5 Security Tests

**Scope:** Authentication, authorization, injection attacks, XSS, CSRF.

**Tools:** OWASP ZAP, npm audit, manual testing

**Test Cases:**

1. **Authentication**
   - Access protected route without session → redirect to login
   - Access API endpoint without API key → 401
   - Use revoked API key → 401

2. **Authorization**
   - Member tries to update lead → 403
   - User A tries to access User B's org leads → 403
   - User tries to bypass RLS with direct SQL → blocked

3. **Injection Attacks**
   - SQL injection in search query → sanitized
   - XSS in notes field → escaped
   - Command injection in API → blocked

4. **Rate Limiting**
   - Exceed rate limit → 429
   - Retry after limit reset → success

**Example Security Test:**
```typescript
describe('SQL Injection Protection', () => {
  it('does not execute malicious SQL', async () => {
    const response = await request(app)
      .get('/api/leads')
      .query({ search: "'; DROP TABLE leads; --" });

    expect(response.status).toBe(200);
    // Verify leads table still exists
    const leads = await supabase.from('leads').select('*');
    expect(leads.data).toBeDefined();
  });
});
```

---

## Appendix A: File Structure

```
ai-comerc-lead-generator/
├── app/
│   ├── api/
│   │   ├── public/
│   │   │   └── leads/
│   │   │       └── route.ts          # Public lead capture API
│   │   ├── leads/
│   │   │   ├── route.ts              # GET/POST leads
│   │   │   ├── [id]/
│   │   │   │   └── route.ts          # GET/PATCH/DELETE single lead
│   │   │   ├── stats/
│   │   │   │   └── route.ts          # GET lead statistics
│   │   │   └── export/
│   │   │       └── route.ts          # POST export to CSV
│   │   └── api-keys/
│   │       ├── route.ts              # GET/POST API keys
│   │       └── [id]/
│   │           └── route.ts          # DELETE API key
│   └── (dashboard)/
│       └── [orgSlug]/
│           ├── leads/
│           │   ├── page.tsx          # Lead list page
│           │   └── [leadId]/
│           │       └── page.tsx      # Lead detail page
│           └── settings/
│               └── api-keys/
│                   └── page.tsx      # API key management
│
├── components/
│   ├── leads/
│   │   ├── LeadTable.tsx             # Lead list table component
│   │   ├── LeadFilters.tsx           # Filter controls
│   │   ├── LeadDetail.tsx            # Lead detail view
│   │   ├── StatusBadge.tsx           # Status badge component
│   │   ├── LeadScoreBadge.tsx        # Lead score display
│   │   ├── ActivityTimeline.tsx      # Activity log component
│   │   └── ExportButton.tsx          # CSV export button
│   └── api-keys/
│       ├── ApiKeyList.tsx            # API key list
│       ├── GenerateKeyModal.tsx      # Generate key dialog
│       └── ApiKeyCard.tsx            # Single key display card
│
├── lib/
│   ├── validations/
│   │   ├── leads.ts                  # Zod schemas for leads
│   │   └── api-keys.ts               # Zod schemas for API keys
│   ├── actions/
│   │   ├── leads.ts                  # Server actions for leads
│   │   └── api-keys.ts               # Server actions for API keys
│   ├── utils/
│   │   ├── rate-limit.ts             # Rate limiting utility
│   │   ├── api-key-hash.ts           # API key hashing utility
│   │   └── csv-export.ts             # CSV generation utility
│   └── supabase/
│       └── types.ts                  # TypeScript types for database
│
├── supabase/
│   └── migrations/
│       └── 20250116000000_create_leads_system.sql
│
├── tests/
│   ├── unit/
│   │   ├── validations.test.ts
│   │   └── components.test.tsx
│   ├── integration/
│   │   ├── leads-api.test.ts
│   │   └── api-keys-api.test.ts
│   └── e2e/
│       ├── lead-workflow.spec.ts
│       └── api-key-workflow.spec.ts
│
└── PHASE_2_TECHNICAL_SPECIFICATION.md
```

---

## Appendix B: TypeScript Types

```typescript
// lib/supabase/types.ts

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
export type LeadSource = 'chatbot' | 'manual' | 'import' | 'web_form' | 'referral';

export interface Lead {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: LeadStatus;
  source: LeadSource;
  lead_score: number;
  product_interests?: string[];
  conversation_id?: string;
  conversation_summary?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer_url?: string;
  landing_page?: string;
  user_agent?: string;
  ip_address?: string;
  location_country?: string;
  location_city?: string;
  metadata?: Record<string, any>;
  notes?: string;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
  last_contacted_at?: string;
  converted_at?: string;
}

export interface ApiKey {
  id: string;
  organization_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  is_active: boolean;
  last_used_at?: string;
  usage_count: number;
  allowed_domains?: string[];
  rate_limit_per_minute: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  revoked_at?: string;
  revoked_by?: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  organization_id: string;
  activity_type: 'created' | 'status_change' | 'note_added' | 'score_change' | 'contacted';
  old_value?: string;
  new_value?: string;
  description?: string;
  performed_by?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface LeadStats {
  total_leads: number;
  new_leads: number;
  qualified_leads: number;
  converted_leads: number;
  avg_lead_score: number;
  conversion_rate: number;
  change?: {
    total_leads: string;
    new_leads: string;
    conversion_rate: string;
  };
}

export interface LeadFilters {
  status?: LeadStatus | 'all';
  source?: LeadSource | 'all';
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}
```

---

## Appendix C: Validation Schemas

```typescript
// lib/validations/leads.ts

import { z } from 'zod';

export const leadStatusEnum = z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']);
export const leadSourceEnum = z.enum(['chatbot', 'manual', 'import', 'web_form', 'referral']);

export const createLeadSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().max(200).optional(),
  source: leadSourceEnum.default('chatbot'),
  product_interests: z.array(z.string()).optional(),
  conversation_id: z.string().uuid().optional(),
  conversation_summary: z.string().max(5000).optional(),
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(100).optional(),
  utm_term: z.string().max(100).optional(),
  utm_content: z.string().max(100).optional(),
  referrer_url: z.string().url().optional(),
  landing_page: z.string().url().optional(),
  user_agent: z.string().max(500).optional(),
  ip_address: z.string().ip().optional(),
  metadata: z.record(z.any()).optional(),
});

export const updateLeadSchema = z.object({
  status: leadStatusEnum.optional(),
  lead_score: z.number().int().min(0).max(100).optional(),
  notes: z.string().max(5000).optional(),
  internal_notes: z.string().max(5000).optional(),
  metadata: z.record(z.any()).optional(),
});

export const leadFiltersSchema = z.object({
  organization_id: z.string().uuid(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  status: z.union([leadStatusEnum, z.literal('all')]).optional(),
  source: z.union([leadSourceEnum, z.literal('all')]).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  search: z.string().max(200).optional(),
  sort: z.enum(['created_at', 'lead_score', 'name', 'status']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
```

---

## Summary

This technical specification provides a complete, actionable plan for implementing **Phase 2 - Lead System**. It includes:

1. Business requirements with user personas and success metrics
2. Detailed user stories with acceptance criteria
3. Complete database schema with RLS policies
4. API design specifications with request/response examples
5. Dashboard UI requirements with wireframe descriptions
6. Data flow architecture diagrams
7. Step-by-step implementation phases
8. Security considerations and mitigation strategies
9. Comprehensive testing strategy

**Next Steps:**

1. Review and approve this specification with stakeholders
2. Begin Phase 2A (Database & Core API)
3. Assign tasks to appropriate agents:
   - **backend-logic-implementer**: API endpoints, database functions
   - **frontend-implementer**: Dashboard UI, components
   - **security-auditor**: RLS policies, API key security
   - **quality-assurance-expert**: Test suite, E2E tests

**Estimated Timeline:** 2-3 weeks (depending on team size)

**Success Criteria:**
- All user stories complete with acceptance criteria met
- All tests passing (unit + integration + E2E)
- Performance targets met (< 2s page load, < 500ms API)
- Security audit passed with no critical issues
- Documentation complete
- Stakeholder sign-off

---

**End of Phase 2 Technical Specification**
