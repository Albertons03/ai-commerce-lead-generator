-- =====================================================
-- ENABLE RLS FOR PRODUCTION
-- =====================================================
-- Run this before deploying to production!
-- This re-enables Row Level Security with working policies.
-- =====================================================

-- Step 1: Re-enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Step 2: Create helper functions (if not exist)
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

GRANT EXECUTE ON FUNCTION public.user_is_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_owner(UUID) TO authenticated;

-- Step 3: Create policies for USERS table
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_insert_own" ON public.users;
CREATE POLICY "users_insert_own"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Step 4: Create policies for ORGANIZATIONS table
DROP POLICY IF EXISTS "orgs_select_member" ON public.organizations;
CREATE POLICY "orgs_select_member"
    ON public.organizations FOR SELECT
    USING (public.user_is_member(id));

DROP POLICY IF EXISTS "orgs_update_admin" ON public.organizations;
CREATE POLICY "orgs_update_admin"
    ON public.organizations FOR UPDATE
    USING (public.user_is_admin(id))
    WITH CHECK (public.user_is_admin(id));

DROP POLICY IF EXISTS "orgs_delete_owner" ON public.organizations;
CREATE POLICY "orgs_delete_owner"
    ON public.organizations FOR DELETE
    USING (public.user_is_owner(id));

-- Step 5: Create policies for ORGANIZATION_MEMBERS table
DROP POLICY IF EXISTS "members_select_same_org" ON public.organization_members;
CREATE POLICY "members_select_same_org"
    ON public.organization_members FOR SELECT
    USING (public.user_is_member(organization_id));

DROP POLICY IF EXISTS "members_update_admin" ON public.organization_members;
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

DROP POLICY IF EXISTS "members_delete_self_or_admin" ON public.organization_members;
CREATE POLICY "members_delete_self_or_admin"
    ON public.organization_members FOR DELETE
    USING (
        user_id = auth.uid()
        OR public.user_is_admin(organization_id)
    );

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'organizations', 'organization_members');

-- =====================================================
-- RLS is now ENABLED and secured for production!
-- =====================================================
