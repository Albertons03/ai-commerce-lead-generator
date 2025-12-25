-- =====================================================
-- Fix Organization Members SELECT Policy Recursion
-- =====================================================
-- The SELECT policy for organization_members was causing
-- infinite recursion because it referenced itself in a subquery.
--
-- Solution: Use a SECURITY DEFINER helper function that bypasses
-- RLS to check membership, preventing the recursive policy check.

-- Create a helper function to check if user is member of an org
-- This function bypasses RLS (SECURITY DEFINER) to prevent recursion
CREATE OR REPLACE FUNCTION public.is_user_member_of_org(p_org_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = p_org_id
        AND user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_user_member_of_org TO authenticated;

-- Drop the old recursive policy
DROP POLICY IF EXISTS "Users can view their org members" ON public.organization_members;

-- Create new non-recursive policy using the helper function
CREATE POLICY "Users can view their org members"
    ON public.organization_members
    FOR SELECT
    USING (
        -- User can view members of organizations they belong to
        -- The helper function bypasses RLS, preventing infinite recursion
        public.is_user_member_of_org(organization_id, auth.uid())
    );

COMMENT ON FUNCTION public.is_user_member_of_org IS
    'Helper function to check organization membership without triggering RLS policies (prevents infinite recursion)';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
