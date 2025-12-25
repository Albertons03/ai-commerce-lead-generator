-- =====================================================
-- COMPLETE RLS FIX - Run this ONCE in Supabase SQL Editor
-- =====================================================
-- This script completely resets all RLS policies and
-- creates simple, non-recursive policies that actually work.

-- =====================================================
-- STEP 1: Drop ALL existing policies
-- =====================================================

-- Drop users policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view org members profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Drop organizations policies
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Owners and admins can update organizations" ON public.organizations;
DROP POLICY IF EXISTS "Only owners can delete organizations" ON public.organizations;

-- Drop organization_members policies
DROP POLICY IF EXISTS "Users can view their org members" ON public.organization_members;
DROP POLICY IF EXISTS "Owners and admins can add members" ON public.organization_members;
DROP POLICY IF EXISTS "Owners and admins can update member roles" ON public.organization_members;
DROP POLICY IF EXISTS "Users can leave, owners/admins can remove members" ON public.organization_members;

-- =====================================================
-- STEP 2: Drop old helper functions (if they exist)
-- =====================================================

DROP FUNCTION IF EXISTS public.is_user_member_of_org(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_user_org_admin(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_user_org_owner(UUID, UUID);

-- =====================================================
-- STEP 3: Create SECURITY DEFINER helper functions
-- =====================================================
-- These bypass RLS, preventing infinite recursion

CREATE OR REPLACE FUNCTION public.user_is_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.user_is_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.user_is_owner(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id
        AND user_id = auth.uid()
        AND role = 'owner'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.user_is_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_owner(UUID) TO authenticated;

-- =====================================================
-- STEP 4: Create NEW simple policies for USERS table
-- =====================================================

-- Users can view their own profile
CREATE POLICY "users_select_own"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_update_own"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "users_insert_own"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- STEP 5: Create NEW simple policies for ORGANIZATIONS
-- =====================================================

-- Users can view organizations they are members of
CREATE POLICY "orgs_select_member"
    ON public.organizations FOR SELECT
    USING (public.user_is_member(id));

-- Admins and owners can update organizations
CREATE POLICY "orgs_update_admin"
    ON public.organizations FOR UPDATE
    USING (public.user_is_admin(id))
    WITH CHECK (public.user_is_admin(id));

-- Only owners can delete organizations
CREATE POLICY "orgs_delete_owner"
    ON public.organizations FOR DELETE
    USING (public.user_is_owner(id));

-- =====================================================
-- STEP 6: Create NEW simple policies for ORG_MEMBERS
-- =====================================================

-- Members can view other members in their organizations
CREATE POLICY "members_select_same_org"
    ON public.organization_members FOR SELECT
    USING (public.user_is_member(organization_id));

-- Admins can update member roles (but not their own)
CREATE POLICY "members_update_admin"
    ON public.organization_members FOR UPDATE
    USING (
        public.user_is_admin(organization_id)
        AND user_id != auth.uid()
    )
    WITH CHECK (
        public.user_is_admin(organization_id)
        AND user_id != auth.uid()
    );

-- Users can remove themselves OR admins can remove others
CREATE POLICY "members_delete_self_or_admin"
    ON public.organization_members FOR DELETE
    USING (
        user_id = auth.uid()
        OR public.user_is_admin(organization_id)
    );

-- NOTE: No INSERT policy - use create_organization_with_owner function
-- which is SECURITY DEFINER and bypasses RLS

-- =====================================================
-- STEP 7: Verify everything is set up
-- =====================================================

-- Show all policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- DONE! Your RLS policies are now fixed!
-- =====================================================
