-- =====================================================
-- Seed Data for Local Development
-- =====================================================
-- This script creates sample data for testing and development.
-- Run with: supabase db reset (automatically runs seed.sql)
-- Or manually: psql -d postgres -f supabase/seed.sql
--
-- WARNING: Do NOT run this in production!
-- =====================================================

-- Only run in development
DO $$
BEGIN
    IF current_setting('app.environment', true) = 'production' THEN
        RAISE EXCEPTION 'Cannot run seed data in production!';
    END IF;
EXCEPTION
    WHEN undefined_object THEN
        -- app.environment not set, assume development
        NULL;
END $$;

-- =====================================================
-- Create Test Users
-- =====================================================

-- Create test users in auth.users
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    recovery_token
) VALUES
    -- Owner User
    (
        '11111111-1111-1111-1111-111111111111',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'owner@example.com',
        crypt('password123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"John Owner"}',
        false,
        '',
        ''
    ),
    -- Admin User
    (
        '22222222-2222-2222-2222-222222222222',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'admin@example.com',
        crypt('password123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Jane Admin"}',
        false,
        '',
        ''
    ),
    -- Member User
    (
        '33333333-3333-3333-3333-333333333333',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'member@example.com',
        crypt('password123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Bob Member"}',
        false,
        '',
        ''
    ),
    -- Another Owner (for second organization)
    (
        '44444444-4444-4444-4444-444444444444',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'owner2@example.com',
        crypt('password123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Alice Owner"}',
        false,
        '',
        ''
    )
ON CONFLICT (id) DO NOTHING;

-- The trigger will automatically create entries in public.users

-- =====================================================
-- Create Test Organizations
-- =====================================================

-- Set the authenticated user context for the first owner
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

-- Create first organization
DO $$
DECLARE
    org1_id UUID;
    org2_id UUID;
BEGIN
    -- Organization 1: Acme Corp
    SELECT create_organization_with_owner(
        'Acme Corporation',
        'acme-corp',
        'Leading provider of AI-powered e-commerce solutions',
        'https://via.placeholder.com/150/FF6B6B/FFFFFF?text=Acme',
        'https://acme-corp.example.com'
    ) INTO org1_id;

    -- Add admin and member to Organization 1
    INSERT INTO public.organization_members (organization_id, user_id, role, invited_by)
    VALUES
        (org1_id, '22222222-2222-2222-2222-222222222222', 'admin', '11111111-1111-1111-1111-111111111111'),
        (org1_id, '33333333-3333-3333-3333-333333333333', 'member', '11111111-1111-1111-1111-111111111111');

    -- Update organization settings for Acme Corp
    UPDATE public.organizations
    SET settings = jsonb_build_object(
        'timezone', 'America/New_York',
        'date_format', 'MM/DD/YYYY',
        'notifications', jsonb_build_object(
            'email', true,
            'in_app', true,
            'weekly_digest', true
        ),
        'features', jsonb_build_object(
            'ai_insights', true,
            'advanced_analytics', true
        ),
        'branding', jsonb_build_object(
            'primary_color', '#FF6B6B',
            'logo_url', 'https://via.placeholder.com/150/FF6B6B/FFFFFF?text=Acme'
        )
    )
    WHERE id = org1_id;

    RAISE NOTICE 'Created Organization 1: Acme Corporation (ID: %)', org1_id;
END $$;

-- Switch to second owner
SET request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

-- Create second organization
DO $$
DECLARE
    org2_id UUID;
BEGIN
    -- Organization 2: TechStart Inc
    SELECT create_organization_with_owner(
        'TechStart Inc',
        'techstart-inc',
        'Innovative startup focused on lead generation',
        'https://via.placeholder.com/150/4ECDC4/FFFFFF?text=TechStart',
        'https://techstart-inc.example.com'
    ) INTO org2_id;

    -- Update organization settings for TechStart Inc
    UPDATE public.organizations
    SET
        subscription_tier = 'professional',
        settings = jsonb_build_object(
            'timezone', 'America/Los_Angeles',
            'date_format', 'YYYY-MM-DD',
            'notifications', jsonb_build_object(
                'email', true,
                'in_app', false,
                'weekly_digest', false
            ),
            'features', jsonb_build_object(
                'ai_insights', true,
                'advanced_analytics', false
            ),
            'branding', jsonb_build_object(
                'primary_color', '#4ECDC4',
                'logo_url', 'https://via.placeholder.com/150/4ECDC4/FFFFFF?text=TechStart'
            )
        )
    WHERE id = org2_id;

    RAISE NOTICE 'Created Organization 2: TechStart Inc (ID: %)', org2_id;
END $$;

-- Create a third organization for testing
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

DO $$
DECLARE
    org3_id UUID;
BEGIN
    -- Organization 3: Demo Company (for testing/demos)
    SELECT create_organization_with_owner(
        'Demo Company',
        'demo-company',
        'Sample organization for testing and demonstrations',
        'https://via.placeholder.com/150/95E1D3/FFFFFF?text=Demo',
        'https://demo-company.example.com'
    ) INTO org3_id;

    -- Add all test users as members
    INSERT INTO public.organization_members (organization_id, user_id, role, invited_by)
    VALUES
        (org3_id, '22222222-2222-2222-2222-222222222222', 'admin', '11111111-1111-1111-1111-111111111111'),
        (org3_id, '33333333-3333-3333-3333-333333333333', 'member', '11111111-1111-1111-1111-111111111111'),
        (org3_id, '44444444-4444-4444-4444-444444444444', 'member', '11111111-1111-1111-1111-111111111111');

    -- Update organization settings
    UPDATE public.organizations
    SET
        subscription_tier = 'starter',
        settings = jsonb_build_object(
            'timezone', 'UTC',
            'date_format', 'DD/MM/YYYY',
            'notifications', jsonb_build_object(
                'email', false,
                'in_app', true,
                'weekly_digest', false
            ),
            'features', jsonb_build_object(
                'ai_insights', false,
                'advanced_analytics', false
            )
        )
    WHERE id = org3_id;

    RAISE NOTICE 'Created Organization 3: Demo Company (ID: %)', org3_id;
END $$;

-- =====================================================
-- Verification
-- =====================================================

DO $$
DECLARE
    user_count INTEGER;
    org_count INTEGER;
    member_count INTEGER;
BEGIN
    -- Count users
    SELECT COUNT(*) INTO user_count FROM public.users;
    RAISE NOTICE 'Total users created: %', user_count;

    -- Count organizations
    SELECT COUNT(*) INTO org_count FROM public.organizations;
    RAISE NOTICE 'Total organizations created: %', org_count;

    -- Count memberships
    SELECT COUNT(*) INTO member_count FROM public.organization_members;
    RAISE NOTICE 'Total organization memberships: %', member_count;

    -- Verify each organization has an owner
    IF EXISTS (
        SELECT 1 FROM public.organizations o
        WHERE NOT EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = o.id AND om.role = 'owner'
        )
    ) THEN
        RAISE WARNING 'Some organizations do not have an owner!';
    ELSE
        RAISE NOTICE 'All organizations have at least one owner ✓';
    END IF;
END $$;

-- =====================================================
-- Display Summary
-- =====================================================

-- List all users with their organizations
SELECT
    u.email,
    u.full_name,
    COUNT(om.id) as organization_count,
    STRING_AGG(DISTINCT om.role::text, ', ') as roles
FROM public.users u
LEFT JOIN public.organization_members om ON om.user_id = u.id
GROUP BY u.id, u.email, u.full_name
ORDER BY u.email;

-- List all organizations with member counts
SELECT
    o.name,
    o.slug,
    o.subscription_tier,
    COUNT(om.id) as member_count,
    STRING_AGG(u.email || ' (' || om.role || ')', ', ' ORDER BY om.role DESC) as members
FROM public.organizations o
LEFT JOIN public.organization_members om ON om.organization_id = o.id
LEFT JOIN public.users u ON u.id = om.user_id
GROUP BY o.id, o.name, o.slug, o.subscription_tier
ORDER BY o.name;

-- =====================================================
-- Test Credentials
-- =====================================================

-- Display login credentials for testing
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SEED DATA CREATED SUCCESSFULLY';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Test User Credentials:';
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'Owner:  owner@example.com / password123';
    RAISE NOTICE 'Admin:  admin@example.com / password123';
    RAISE NOTICE 'Member: member@example.com / password123';
    RAISE NOTICE 'Owner2: owner2@example.com / password123';
    RAISE NOTICE '';
    RAISE NOTICE 'Organizations Created:';
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE '1. Acme Corporation (acme-corp)';
    RAISE NOTICE '2. TechStart Inc (techstart-inc)';
    RAISE NOTICE '3. Demo Company (demo-company)';
    RAISE NOTICE '';
    RAISE NOTICE 'Access Supabase Studio:';
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'http://localhost:54323';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
