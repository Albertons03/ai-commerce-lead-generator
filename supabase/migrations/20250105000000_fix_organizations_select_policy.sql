-- =====================================================
-- Fix Organizations SELECT Policy Recursion
-- =====================================================
-- The SELECT policy for organizations was indirectly causing
-- issues because it queries organization_members which is also
-- under RLS. Use the SECURITY DEFINER helper function to prevent
-- any potential recursion issues.

-- Drop the old policy
DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;

-- Create new policy using the helper function
CREATE POLICY "Users can view their organizations"
    ON public.organizations
    FOR SELECT
    USING (
        -- Use the helper function that bypasses RLS
        public.is_user_member_of_org(id, auth.uid())
    );

-- =====================================================
-- END OF MIGRATION
-- =====================================================
