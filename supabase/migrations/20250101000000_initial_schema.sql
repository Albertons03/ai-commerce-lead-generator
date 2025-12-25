-- =====================================================
-- AI E-Commerce Lead Generator - Initial Schema
-- Phase 1: Multi-tenant Foundation
-- =====================================================
-- This migration creates the foundational database schema
-- for a multi-tenant SaaS application with organization
-- management and role-based access control.
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CUSTOM TYPES
-- =====================================================

-- Role enumeration for organization members
CREATE TYPE organization_role AS ENUM ('owner', 'admin', 'member');

-- =====================================================
-- TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
-- Stores additional user profile information
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure email is properly formatted
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Organizations table
-- Represents a tenant in the multi-tenant architecture
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,

    -- Billing and subscription (for future use)
    subscription_tier TEXT DEFAULT 'free',
    subscription_status TEXT DEFAULT 'active',

    -- Metadata
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT slug_format CHECK (slug ~* '^[a-z0-9-]+$'),
    CONSTRAINT slug_length CHECK (char_length(slug) >= 3 AND char_length(slug) <= 50),
    CONSTRAINT name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 100)
);

-- Organization members table (junction table with role)
-- Links users to organizations with specific roles
CREATE TABLE public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role organization_role NOT NULL DEFAULT 'member',

    -- Invitation metadata
    invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    -- Each user can only be a member of an organization once
    UNIQUE(organization_id, user_id),

    -- Each organization must have at least one owner (enforced by trigger)
    -- Each organization can have multiple admins and members
    CHECK (role IN ('owner', 'admin', 'member'))
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Users table indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_created_at ON public.users(created_at DESC);

-- Organizations table indexes
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_created_at ON public.organizations(created_at DESC);
CREATE INDEX idx_organizations_subscription ON public.organizations(subscription_tier, subscription_status);

-- Organization members table indexes
CREATE INDEX idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_org_members_role ON public.organization_members(organization_id, role);
CREATE INDEX idx_org_members_joined_at ON public.organization_members(joined_at DESC);

-- Composite index for common queries (user's organizations)
CREATE INDEX idx_org_members_user_org ON public.organization_members(user_id, organization_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at
    BEFORE UPDATE ON public.organization_members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile when auth.users row is inserted
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to prevent removing the last owner from an organization
CREATE OR REPLACE FUNCTION public.prevent_last_owner_removal()
RETURNS TRIGGER AS $$
DECLARE
    owner_count INTEGER;
BEGIN
    -- Check if we're deleting or updating an owner
    IF (TG_OP = 'DELETE' AND OLD.role = 'owner') OR
       (TG_OP = 'UPDATE' AND OLD.role = 'owner' AND NEW.role != 'owner') THEN

        -- Count remaining owners for this organization
        SELECT COUNT(*) INTO owner_count
        FROM public.organization_members
        WHERE organization_id = OLD.organization_id
        AND role = 'owner'
        AND id != OLD.id;

        -- Prevent removal if this is the last owner
        IF owner_count = 0 THEN
            RAISE EXCEPTION 'Cannot remove the last owner from an organization';
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent removing the last owner
CREATE TRIGGER prevent_last_owner_removal
    BEFORE UPDATE OR DELETE ON public.organization_members
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_last_owner_removal();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Users can view profiles of other members in their organizations
CREATE POLICY "Users can view org members profiles"
    ON public.users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om1
            WHERE om1.user_id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM public.organization_members om2
                WHERE om2.user_id = public.users.id
                AND om2.organization_id = om1.organization_id
            )
        )
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Note: INSERT is handled by the trigger on auth.users
-- Note: DELETE is handled by CASCADE from auth.users

-- =====================================================
-- ORGANIZATIONS TABLE POLICIES
-- =====================================================

-- Users can view organizations they are members of
CREATE POLICY "Users can view their organizations"
    ON public.organizations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = public.organizations.id
            AND user_id = auth.uid()
        )
    );

-- Owners and admins can update their organizations
CREATE POLICY "Owners and admins can update organizations"
    ON public.organizations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = public.organizations.id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = public.organizations.id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Only owners can delete organizations
CREATE POLICY "Only owners can delete organizations"
    ON public.organizations
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = public.organizations.id
            AND user_id = auth.uid()
            AND role = 'owner'
        )
    );

-- Organizations are created through the helper function
-- (INSERT policy intentionally omitted - use create_organization_with_owner function)

-- =====================================================
-- ORGANIZATION MEMBERS TABLE POLICIES
-- =====================================================

-- Users can view members of organizations they belong to
CREATE POLICY "Users can view their org members"
    ON public.organization_members
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = public.organization_members.organization_id
            AND om.user_id = auth.uid()
        )
    );

-- Owners and admins can add new members to their organizations
CREATE POLICY "Owners and admins can add members"
    ON public.organization_members
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = public.organization_members.organization_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Owners and admins can update member roles (but not their own to prevent self-demotion)
CREATE POLICY "Owners and admins can update member roles"
    ON public.organization_members
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = public.organization_members.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
        -- Prevent users from changing their own role
        AND user_id != auth.uid()
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = public.organization_members.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
        AND user_id != auth.uid()
    );

-- Users can remove themselves from organizations (leave)
-- Owners and admins can remove other members
CREATE POLICY "Users can leave, owners/admins can remove members"
    ON public.organization_members
    FOR DELETE
    USING (
        -- User can remove themselves
        user_id = auth.uid()
        OR
        -- Or user is owner/admin in the organization
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = public.organization_members.organization_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
    );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to create an organization with the creator as owner
-- This is the recommended way to create organizations
CREATE OR REPLACE FUNCTION public.create_organization_with_owner(
    p_name TEXT,
    p_slug TEXT,
    p_description TEXT DEFAULT NULL,
    p_logo_url TEXT DEFAULT NULL,
    p_website_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_organization_id UUID;
    v_user_id UUID;
BEGIN
    -- Get the authenticated user's ID
    v_user_id := auth.uid();

    -- Verify user is authenticated
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Insert the organization
    INSERT INTO public.organizations (name, slug, description, logo_url, website_url)
    VALUES (p_name, p_slug, p_description, p_logo_url, p_website_url)
    RETURNING id INTO v_organization_id;

    -- Add the creator as owner
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (v_organization_id, v_user_id, 'owner');

    RETURN v_organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all organizations for the current user
-- Returns organization details with the user's role
CREATE OR REPLACE FUNCTION public.get_user_organizations()
RETURNS TABLE (
    organization_id UUID,
    organization_name TEXT,
    organization_slug TEXT,
    organization_description TEXT,
    organization_logo_url TEXT,
    organization_website_url TEXT,
    organization_subscription_tier TEXT,
    organization_subscription_status TEXT,
    organization_created_at TIMESTAMPTZ,
    user_role organization_role,
    user_joined_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.name,
        o.slug,
        o.description,
        o.logo_url,
        o.website_url,
        o.subscription_tier,
        o.subscription_status,
        o.created_at,
        om.role,
        om.joined_at
    FROM public.organizations o
    INNER JOIN public.organization_members om ON om.organization_id = o.id
    WHERE om.user_id = auth.uid()
    ORDER BY om.joined_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has a specific role in an organization
-- Useful for application-level authorization checks
CREATE OR REPLACE FUNCTION public.user_has_role_in_org(
    p_organization_id UUID,
    p_required_role organization_role
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_role organization_role;
BEGIN
    -- Get user's role in the organization
    SELECT role INTO v_user_role
    FROM public.organization_members
    WHERE organization_id = p_organization_id
    AND user_id = auth.uid();

    -- Return false if user is not a member
    IF v_user_role IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check role hierarchy: owner > admin > member
    CASE p_required_role
        WHEN 'owner' THEN
            RETURN v_user_role = 'owner';
        WHEN 'admin' THEN
            RETURN v_user_role IN ('owner', 'admin');
        WHEN 'member' THEN
            RETURN TRUE; -- Any member satisfies 'member' requirement
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get member count for an organization
CREATE OR REPLACE FUNCTION public.get_organization_member_count(
    p_organization_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Verify user has access to this organization
    IF NOT EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = p_organization_id
        AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Count members
    SELECT COUNT(*) INTO v_count
    FROM public.organization_members
    WHERE organization_id = p_organization_id;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant usage on custom types
GRANT USAGE ON TYPE organization_role TO authenticated;

-- Grant appropriate permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION public.create_organization_with_owner TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_organizations TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_role_in_org TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_member_count TO authenticated;

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================

COMMENT ON TABLE public.users IS 'Extended user profiles linked to Supabase auth.users';
COMMENT ON TABLE public.organizations IS 'Organizations/tenants in the multi-tenant system';
COMMENT ON TABLE public.organization_members IS 'Junction table linking users to organizations with roles';

COMMENT ON COLUMN public.organization_members.role IS 'User role: owner (full control), admin (manage members/settings), member (read/write)';
COMMENT ON COLUMN public.organizations.settings IS 'Organization-specific settings stored as JSONB';

COMMENT ON FUNCTION public.create_organization_with_owner IS 'Creates a new organization and assigns the creator as owner. This is the recommended way to create organizations.';
COMMENT ON FUNCTION public.get_user_organizations IS 'Returns all organizations for the authenticated user with their role and join date';
COMMENT ON FUNCTION public.user_has_role_in_org IS 'Checks if the authenticated user has at least the specified role in an organization (respects role hierarchy)';
COMMENT ON FUNCTION public.get_organization_member_count IS 'Returns the number of members in an organization (requires membership to view)';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
