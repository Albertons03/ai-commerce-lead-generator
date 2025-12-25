-- =====================================================
-- Fix Organization Members Infinite Recursion
-- =====================================================
-- The INSERT policy for organization_members was causing
-- infinite recursion when creating the first owner of an
-- organization through the create_organization_with_owner function.
--
-- This migration fixes the issue by dropping the problematic policy
-- and not replacing it. The create_organization_with_owner function
-- is SECURITY DEFINER, so it bypasses RLS anyway. For manual inserts,
-- we rely on application-level validation.

-- Drop the problematic INSERT policy
DROP POLICY IF EXISTS "Owners and admins can add members" ON public.organization_members;

-- Note: We're not adding a new INSERT policy because:
-- 1. The create_organization_with_owner function is SECURITY DEFINER
--    and handles creating the first owner safely
-- 2. Adding members after organization creation should be done through
--    application functions that validate permissions
-- 3. This prevents the infinite recursion issue while maintaining security
--    through the SECURITY DEFINER functions

-- =====================================================
-- END OF MIGRATION
-- =====================================================
