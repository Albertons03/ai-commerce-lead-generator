# RLS Policy Testing Checklist

Comprehensive checklist for testing all Row Level Security (RLS) policies in the AI E-Commerce Lead Generator database.

## Overview

This document provides a systematic approach to testing all RLS policies to ensure proper data isolation and security in the multi-tenant architecture.

## Test Environment Setup

### Prerequisites

1. Local Supabase instance running (`supabase start`)
2. Initial migration applied (`supabase db push`)
3. Supabase Studio access ([http://localhost:54323](http://localhost:54323))
4. Test users created in auth.users table

### Create Test Data

Run this SQL in Supabase Studio to create test users and organizations:

```sql
-- Create test users
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
    (
        '11111111-1111-1111-1111-111111111111',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'owner@test.com',
        crypt('password123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Owner User"}',
        false,
        '',
        ''
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'admin@test.com',
        crypt('password123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Admin User"}',
        false,
        '',
        ''
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'member@test.com',
        crypt('password123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Member User"}',
        false,
        '',
        ''
    ),
    (
        '44444444-4444-4444-4444-444444444444',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'outsider@test.com',
        crypt('password123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Outsider User"}',
        false,
        '',
        ''
    );

-- Create test organizations using the helper function
-- Switch to owner user context
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

-- Create Organization A (owner user owns this)
SELECT create_organization_with_owner(
    'Organization A',
    'org-a',
    'First test organization',
    NULL,
    NULL
);

-- Switch to outsider user context
SET request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

-- Create Organization B (outsider user owns this)
SELECT create_organization_with_owner(
    'Organization B',
    'org-b',
    'Second test organization',
    NULL,
    NULL
);

-- Add admin and member to Organization A
-- Switch back to owner user
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

-- Get Organization A ID (store this for testing)
DO $$
DECLARE
    org_a_id UUID;
BEGIN
    SELECT id INTO org_a_id FROM public.organizations WHERE slug = 'org-a';

    -- Add admin user
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (org_a_id, '22222222-2222-2222-2222-222222222222', 'admin');

    -- Add member user
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (org_a_id, '33333333-3333-3333-3333-333333333333', 'member');
END $$;
```

---

## Testing Methodology

For each test case:

1. Set the user context using JWT claims
2. Execute the test query
3. Verify expected behavior (success/failure)
4. Document results

### Setting User Context

Before each test, set the authenticated user:

```sql
-- Set authenticated user
SET request.jwt.claim.sub = 'USER_UUID_HERE';

-- Verify current user
SELECT auth.uid();
```

---

## Test Cases

### Section 1: Users Table RLS Policies

#### Test 1.1: Users Can View Own Profile

**Expected Result:** PASS

```sql
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

SELECT * FROM public.users WHERE id = '11111111-1111-1111-1111-111111111111';
```

- [ ] Query returns exactly 1 row
- [ ] Row contains correct user data
- [ ] No error occurs

#### Test 1.2: Users Cannot View Unrelated Profiles

**Expected Result:** PASS (returns 0 rows)

```sql
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

SELECT * FROM public.users WHERE id = '44444444-4444-4444-4444-444444444444';
```

- [ ] Query returns 0 rows
- [ ] No error occurs (RLS silently filters)

#### Test 1.3: Users Can View Organization Members' Profiles

**Expected Result:** PASS

```sql
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

-- Should see admin and member from same org
SELECT * FROM public.users
WHERE id IN ('22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333');
```

- [ ] Query returns 2 rows
- [ ] Contains admin and member profiles
- [ ] No error occurs

#### Test 1.4: Users Can Update Own Profile

**Expected Result:** PASS

```sql
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

UPDATE public.users
SET full_name = 'Updated Owner Name'
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Verify update
SELECT full_name FROM public.users WHERE id = '11111111-1111-1111-1111-111111111111';
```

- [ ] Update succeeds (1 row affected)
- [ ] full_name is updated
- [ ] updated_at timestamp changes
- [ ] No error occurs

#### Test 1.5: Users Cannot Update Other Profiles

**Expected Result:** PASS (0 rows affected)

```sql
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

UPDATE public.users
SET full_name = 'Attempted Unauthorized Update'
WHERE id = '44444444-4444-4444-4444-444444444444';
```

- [ ] Update affects 0 rows
- [ ] Target user's data unchanged
- [ ] No error occurs

---

### Section 2: Organizations Table RLS Policies

#### Test 2.1: Users Can View Their Organizations

**Expected Result:** PASS

```sql
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

SELECT * FROM public.organizations WHERE slug = 'org-a';
```

- [ ] Query returns 1 row
- [ ] Organization data is correct
- [ ] No error occurs

#### Test 2.2: Users Cannot View Organizations They Don't Belong To

**Expected Result:** PASS (0 rows)

```sql
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

SELECT * FROM public.organizations WHERE slug = 'org-b';
```

- [ ] Query returns 0 rows
- [ ] No error occurs

#### Test 2.3: Owner Can Update Organization

**Expected Result:** PASS

```sql
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

UPDATE public.organizations
SET name = 'Updated Organization A'
WHERE slug = 'org-a';
```

- [ ] Update succeeds (1 row affected)
- [ ] Name is updated
- [ ] No error occurs

#### Test 2.4: Admin Can Update Organization

**Expected Result:** PASS

```sql
SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

UPDATE public.organizations
SET description = 'Updated by admin'
WHERE slug = 'org-a';
```

- [ ] Update succeeds (1 row affected)
- [ ] Description is updated
- [ ] No error occurs

#### Test 2.5: Member Cannot Update Organization

**Expected Result:** PASS (0 rows affected)

```sql
SET request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

UPDATE public.organizations
SET name = 'Attempted Member Update'
WHERE slug = 'org-a';
```

- [ ] Update affects 0 rows
- [ ] Organization data unchanged
- [ ] No error occurs

#### Test 2.6: Owner Can Delete Organization

**Expected Result:** PASS

```sql
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

-- Create a temporary org to delete
SELECT create_organization_with_owner('Temp Org', 'temp-org', NULL, NULL, NULL);

-- Delete it
DELETE FROM public.organizations WHERE slug = 'temp-org';
```

- [ ] Delete succeeds (1 row affected)
- [ ] Organization is removed
- [ ] Associated members are cascade deleted
- [ ] No error occurs

#### Test 2.7: Admin Cannot Delete Organization

**Expected Result:** PASS (0 rows affected)

```sql
SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

DELETE FROM public.organizations WHERE slug = 'org-a';
```

- [ ] Delete affects 0 rows
- [ ] Organization still exists
- [ ] No error occurs

#### Test 2.8: Member Cannot Delete Organization

**Expected Result:** PASS (0 rows affected)

```sql
SET request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

DELETE FROM public.organizations WHERE slug = 'org-a';
```

- [ ] Delete affects 0 rows
- [ ] Organization still exists
- [ ] No error occurs

---

### Section 3: Organization Members Table RLS Policies

#### Test 3.1: Users Can View Members of Their Organizations

**Expected Result:** PASS

```sql
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

SELECT om.*, u.email
FROM public.organization_members om
JOIN public.organizations o ON o.id = om.organization_id
JOIN public.users u ON u.id = om.user_id
WHERE o.slug = 'org-a';
```

- [ ] Query returns 3 rows (owner, admin, member)
- [ ] All member details visible
- [ ] No error occurs

#### Test 3.2: Users Cannot View Members of Other Organizations

**Expected Result:** PASS (0 rows)

```sql
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

SELECT om.*
FROM public.organization_members om
JOIN public.organizations o ON o.id = om.organization_id
WHERE o.slug = 'org-b';
```

- [ ] Query returns 0 rows
- [ ] No error occurs

#### Test 3.3: Owner Can Add New Members

**Expected Result:** PASS

```sql
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

-- Get org ID
DO $$
DECLARE
    org_id UUID;
    new_user_id UUID := '55555555-5555-5555-5555-555555555555';
BEGIN
    -- Create new test user
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
    VALUES (new_user_id, 'newmember@test.com', '', NOW());

    -- Get org A ID
    SELECT id INTO org_id FROM public.organizations WHERE slug = 'org-a';

    -- Add new member
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (org_id, new_user_id, 'member');
END $$;
```

- [ ] Insert succeeds
- [ ] New member appears in organization_members table
- [ ] No error occurs

#### Test 3.4: Admin Can Add New Members

**Expected Result:** PASS

```sql
SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

-- Similar to Test 3.3 but as admin user
```

- [ ] Insert succeeds
- [ ] Admin can add members
- [ ] No error occurs

#### Test 3.5: Member Cannot Add New Members

**Expected Result:** FAIL (permission denied)

```sql
SET request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

DO $$
DECLARE
    org_id UUID;
BEGIN
    SELECT id INTO org_id FROM public.organizations WHERE slug = 'org-a';

    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (org_id, '66666666-6666-6666-6666-666666666666', 'member');
END $$;
```

- [ ] Insert fails or affects 0 rows
- [ ] Error message or silent failure
- [ ] No new member added

#### Test 3.6: Owner Can Change Member Roles

**Expected Result:** PASS

```sql
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

DO $$
DECLARE
    org_id UUID;
BEGIN
    SELECT id INTO org_id FROM public.organizations WHERE slug = 'org-a';

    UPDATE public.organization_members
    SET role = 'admin'
    WHERE organization_id = org_id AND user_id = '33333333-3333-3333-3333-333333333333';
END $$;
```

- [ ] Update succeeds
- [ ] Member role changed to admin
- [ ] No error occurs

#### Test 3.7: Admin Can Change Member Roles (But Not Other Admins)

**Expected Result:** PASS

```sql
SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

-- Admin can change regular member's role
-- (Test with a regular member, not owner)
```

- [ ] Update succeeds for members
- [ ] Cannot change owner's role
- [ ] No error occurs

#### Test 3.8: Users Cannot Change Their Own Role

**Expected Result:** PASS (0 rows affected)

```sql
SET request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

DO $$
DECLARE
    org_id UUID;
BEGIN
    SELECT id INTO org_id FROM public.organizations WHERE slug = 'org-a';

    UPDATE public.organization_members
    SET role = 'owner'
    WHERE organization_id = org_id AND user_id = '33333333-3333-3333-3333-333333333333';
END $$;
```

- [ ] Update affects 0 rows
- [ ] User's role unchanged
- [ ] No error occurs

#### Test 3.9: Members Can Leave Organization

**Expected Result:** PASS

```sql
SET request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

DO $$
DECLARE
    org_id UUID;
BEGIN
    SELECT id INTO org_id FROM public.organizations WHERE slug = 'org-a';

    DELETE FROM public.organization_members
    WHERE organization_id = org_id AND user_id = '33333333-3333-3333-3333-333333333333';
END $$;
```

- [ ] Delete succeeds
- [ ] User removed from organization
- [ ] No error occurs

#### Test 3.10: Owner Cannot Leave If They're the Last Owner

**Expected Result:** FAIL (error)

```sql
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

DO $$
DECLARE
    org_id UUID;
BEGIN
    SELECT id INTO org_id FROM public.organizations WHERE slug = 'org-a';

    DELETE FROM public.organization_members
    WHERE organization_id = org_id AND user_id = '11111111-1111-1111-1111-111111111111' AND role = 'owner';
END $$;
```

- [ ] Delete fails with error
- [ ] Error message: "Cannot remove the last owner from an organization"
- [ ] Owner still in organization

#### Test 3.11: Owner Can Remove Other Members

**Expected Result:** PASS

```sql
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

-- Add a test member first, then remove them
```

- [ ] Delete succeeds
- [ ] Member removed
- [ ] No error occurs

#### Test 3.12: Admin Can Remove Members (But Not Owners)

**Expected Result:** PASS for members, FAIL for owners

```sql
SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

-- Test removing a regular member: should succeed
-- Test removing owner: should fail due to last owner protection
```

- [ ] Can remove regular members
- [ ] Cannot remove owners
- [ ] Appropriate behavior for each case

---

### Section 4: Database Functions

#### Test 4.1: create_organization_with_owner()

**Expected Result:** PASS

```sql
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

SELECT create_organization_with_owner(
    'New Test Org',
    'new-test-org',
    'Testing function',
    NULL,
    NULL
);

-- Verify organization created
SELECT * FROM public.organizations WHERE slug = 'new-test-org';

-- Verify creator is owner
SELECT * FROM public.organization_members
WHERE organization_id = (SELECT id FROM public.organizations WHERE slug = 'new-test-org')
AND role = 'owner';
```

- [ ] Function returns UUID
- [ ] Organization created successfully
- [ ] Creator automatically added as owner
- [ ] No error occurs

#### Test 4.2: get_user_organizations()

**Expected Result:** PASS

```sql
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

SELECT * FROM get_user_organizations();
```

- [ ] Returns all user's organizations
- [ ] Includes correct role for each
- [ ] Includes joined_at timestamp
- [ ] No error occurs

#### Test 4.3: user_has_role_in_org()

**Expected Result:** PASS

```sql
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

DO $$
DECLARE
    org_id UUID;
    has_owner BOOLEAN;
    has_admin BOOLEAN;
    has_member BOOLEAN;
BEGIN
    SELECT id INTO org_id FROM public.organizations WHERE slug = 'org-a';

    -- Check owner
    SELECT user_has_role_in_org(org_id, 'owner') INTO has_owner;
    ASSERT has_owner = TRUE, 'User should have owner role';

    -- Check admin (owner should also satisfy admin requirement)
    SELECT user_has_role_in_org(org_id, 'admin') INTO has_admin;
    ASSERT has_admin = TRUE, 'Owner should satisfy admin role';

    -- Check member (owner should also satisfy member requirement)
    SELECT user_has_role_in_org(org_id, 'member') INTO has_member;
    ASSERT has_member = TRUE, 'Owner should satisfy member role';
END $$;
```

- [ ] Correctly identifies owner role
- [ ] Respects role hierarchy (owner >= admin >= member)
- [ ] Returns false for organizations user doesn't belong to
- [ ] No error occurs

#### Test 4.4: get_organization_member_count()

**Expected Result:** PASS

```sql
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

DO $$
DECLARE
    org_id UUID;
    member_count INTEGER;
BEGIN
    SELECT id INTO org_id FROM public.organizations WHERE slug = 'org-a';

    SELECT get_organization_member_count(org_id) INTO member_count;

    ASSERT member_count >= 3, 'Organization should have at least 3 members';
END $$;
```

- [ ] Returns correct member count
- [ ] Only accessible to organization members
- [ ] No error occurs

---

## Summary Checklist

After completing all tests, verify:

- [ ] All users table policies tested and passing
- [ ] All organizations table policies tested and passing
- [ ] All organization_members table policies tested and passing
- [ ] All database functions tested and working correctly
- [ ] No unauthorized access allowed
- [ ] Proper error handling for restricted operations
- [ ] Triggers working (updated_at, prevent_last_owner_removal, etc.)
- [ ] Cascade deletes functioning correctly
- [ ] Role hierarchy respected (owner > admin > member)

## Cleanup Test Data

After testing, clean up test data:

```sql
-- Delete test organizations (cascade will handle members)
DELETE FROM public.organizations WHERE slug IN ('org-a', 'org-b', 'temp-org', 'new-test-org');

-- Delete test users
DELETE FROM auth.users WHERE email LIKE '%@test.com';
```

---

## Reporting Issues

If any test fails:

1. Document the exact SQL query that failed
2. Note the expected vs actual behavior
3. Check Supabase logs for error messages
4. Verify user context was set correctly
5. Review the specific RLS policy in question
6. Open an issue with full details

---

## Automated Testing

For CI/CD integration, consider using:

- pgTAP for PostgreSQL unit testing
- Supabase Test Helpers
- Jest with Supabase JS client for integration tests

Example automated test structure:

```typescript
// tests/rls/users.test.ts
describe('Users Table RLS', () => {
  it('should allow users to view their own profile', async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.id).toBe(testUserId);
  });

  // Additional tests...
});
```

---

## Security Audit Notes

- All RLS policies reviewed: [ ]
- No direct table access without RLS: [ ]
- Service role key usage documented: [ ]
- Sensitive data properly masked: [ ]
- Audit logging implemented: [ ]
- Performance impact assessed: [ ]

---

**Last Updated:** 2025-01-01
**Version:** 1.0
**Status:** Ready for Testing
