-- =====================================================
-- Fix All Organization Policies to Use Helper Function
-- =====================================================
-- Update all organization policies to use the SECURITY DEFINER
-- helper function to prevent any RLS recursion issues

-- First, create a helper to check if user is owner/admin
CREATE OR REPLACE FUNCTION public.is_user_org_admin(p_org_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = p_org_id
        AND user_id = p_user_id
        AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper to check if user is owner
CREATE OR REPLACE FUNCTION public.is_user_org_owner(p_org_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = p_org_id
        AND user_id = p_user_id
        AND role = 'owner'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_user_org_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_org_owner TO authenticated;

-- Drop old UPDATE policy
DROP POLICY IF EXISTS "Owners and admins can update organizations" ON public.organizations;

-- Create new UPDATE policy
CREATE POLICY "Owners and admins can update organizations"
    ON public.organizations
    FOR UPDATE
    USING (public.is_user_org_admin(id, auth.uid()))
    WITH CHECK (public.is_user_org_admin(id, auth.uid()));

-- Drop old DELETE policy
DROP POLICY IF EXISTS "Only owners can delete organizations" ON public.organizations;

-- Create new DELETE policy
CREATE POLICY "Only owners can delete organizations"
    ON public.organizations
    FOR DELETE
    USING (public.is_user_org_owner(id, auth.uid()));

-- =====================================================
-- Fix organization_members UPDATE and DELETE policies too
-- =====================================================

-- Drop old UPDATE policy
DROP POLICY IF EXISTS "Owners and admins can update member roles" ON public.organization_members;

-- Create new UPDATE policy
CREATE POLICY "Owners and admins can update member roles"
    ON public.organization_members
    FOR UPDATE
    USING (
        public.is_user_org_admin(organization_id, auth.uid())
        AND user_id != auth.uid()  -- Can't change own role
    )
    WITH CHECK (
        public.is_user_org_admin(organization_id, auth.uid())
        AND user_id != auth.uid()
    );

-- Drop old DELETE policy
DROP POLICY IF EXISTS "Users can leave, owners/admins can remove members" ON public.organization_members;

-- Create new DELETE policy
CREATE POLICY "Users can leave, owners/admins can remove members"
    ON public.organization_members
    FOR DELETE
    USING (
        user_id = auth.uid()  -- Can remove self
        OR public.is_user_org_admin(organization_id, auth.uid())  -- Or is admin/owner
    );

COMMENT ON FUNCTION public.is_user_org_admin IS
    'Helper function to check if user is owner or admin of organization (bypasses RLS)';
COMMENT ON FUNCTION public.is_user_org_owner IS
    'Helper function to check if user is owner of organization (bypasses RLS)';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
