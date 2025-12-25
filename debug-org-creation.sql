-- =====================================================
-- Debug Script for Organization Creation Issues
-- =====================================================
-- Run these queries in Supabase SQL Editor to diagnose issues

-- 1. Check if organizations exist
SELECT 'Organizations:' as check;
SELECT * FROM public.organizations;

-- 2. Check if organization members exist
SELECT 'Organization Members:' as check;
SELECT * FROM public.organization_members;

-- 3. Check if users table has records
SELECT 'Users:' as check;
SELECT id, email, full_name FROM public.users;

-- 4. Test the get_user_organizations function
SELECT 'Testing get_user_organizations():' as check;
SELECT * FROM public.get_user_organizations();

-- 5. Check RLS policies on organization_members
SELECT 'RLS Policies on organization_members:' as check;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'organization_members';

-- 6. Check if the helper function exists
SELECT 'Helper Functions:' as check;
SELECT routine_name, routine_type, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%member%';

-- =====================================================
-- If organizations table is empty, you can manually create one:
-- =====================================================

-- First, get your user ID from auth.users:
-- SELECT id, email FROM auth.users;

-- Then create an organization manually (replace USER_ID with your actual user ID):
/*
SELECT public.create_organization_with_owner(
    'Test Organization',
    'test-org',
    'A test organization',
    NULL,
    NULL
);
*/
