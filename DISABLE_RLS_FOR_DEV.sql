-- =====================================================
-- DISABLE RLS FOR DEVELOPMENT
-- =====================================================
-- WARNING: This disables Row Level Security!
-- Only use during development, NOT in production!
-- =====================================================

-- Disable RLS on all tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'organizations', 'organization_members');

-- =====================================================
-- Now your app will work without RLS blocking queries!
-- You can re-enable RLS later once everything works.
-- =====================================================
