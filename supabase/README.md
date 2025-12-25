# Supabase Backend Setup Guide

Complete guide for setting up and managing the Supabase backend infrastructure for the AI E-Commerce Lead Generator.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Production Setup](#production-setup)
4. [Running Migrations](#running-migrations)
5. [Testing RLS Policies](#testing-rls-policies)
6. [Database Functions](#database-functions)
7. [Type Generation](#type-generation)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 18+ and npm/pnpm/yarn
- Supabase CLI ([Installation Guide](https://supabase.com/docs/guides/cli))
- Docker Desktop (for local Supabase development)
- Git

### Install Supabase CLI

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows (PowerShell)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or via npm (cross-platform)
npm install -g supabase
```

Verify installation:
```bash
supabase --version
```

---

## Local Development Setup

### 1. Initialize Supabase Project

If not already initialized:

```bash
# Navigate to project root
cd D:\ai-comerc-lead-generator

# Initialize Supabase (this creates supabase/ directory)
supabase init
```

The `supabase/config.toml` is already configured for you.

### 2. Start Local Supabase

```bash
# Start all Supabase services (requires Docker)
supabase start
```

This will start:
- PostgreSQL database (port 54322)
- API server (port 54321)
- Studio (port 54323)
- Inbucket email testing (port 54324)

You'll see output with connection details:

```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update `.env.local` with the connection details from `supabase start`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-output>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-from-output>
```

### 4. Run Migrations

Apply the initial schema migration:

```bash
# Apply all pending migrations
supabase db push

# Or reset and apply all migrations
supabase db reset
```

### 5. Access Supabase Studio

Open [http://localhost:54323](http://localhost:54323) in your browser to access the Supabase Studio interface. Here you can:

- View tables and data
- Test SQL queries
- Manage RLS policies
- View API documentation
- Test authentication flows

---

## Production Setup

### 1. Create Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Choose organization and project name
4. Select a region (choose closest to your users)
5. Set a strong database password (save it securely)
6. Wait for project to be provisioned

### 2. Link Local Project to Production

```bash
# Login to Supabase
supabase login

# Link your local project to production
supabase link --project-ref YOUR_PROJECT_REF
```

Find your project ref in the Supabase dashboard URL:
`https://app.supabase.com/project/YOUR_PROJECT_REF`

### 3. Push Migrations to Production

```bash
# Push local migrations to production
supabase db push --linked

# Or push specific migration
supabase db push --linked --include 20250101000000_initial_schema.sql
```

### 4. Configure Production Environment

In your hosting platform (Vercel, Netlify, etc.), set these environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from-supabase-dashboard>
SUPABASE_SERVICE_ROLE_KEY=<from-supabase-dashboard>
```

Get these values from: Project Settings > API

---

## Running Migrations

### Create a New Migration

```bash
# Create a new migration file
supabase migration new migration_name

# This creates: supabase/migrations/TIMESTAMP_migration_name.sql
```

### Apply Migrations

```bash
# Apply all pending migrations (local)
supabase db push

# Apply migrations to production
supabase db push --linked

# Reset database and reapply all migrations (local only)
supabase db reset
```

### Check Migration Status

```bash
# View migration history
supabase migration list

# Check which migrations have been applied
supabase db status
```

---

## Testing RLS Policies

Row Level Security (RLS) is critical for data security. Here's how to test all policies:

### Testing Checklist

#### 1. Users Table Policies

**Test: Users can view their own profile**

```sql
-- Run this in Supabase Studio SQL Editor
-- Set the authenticated user context
SET request.jwt.claims TO '{"sub": "USER_UUID"}';

-- Should return the user's profile
SELECT * FROM public.users WHERE id = 'USER_UUID';
```

**Test: Users can view org members' profiles**

```sql
-- User A should see User B's profile if they're in the same org
SET request.jwt.claims TO '{"sub": "USER_A_UUID"}';

SELECT u.*
FROM public.users u
INNER JOIN public.organization_members om ON om.user_id = u.id
WHERE om.organization_id = (
    SELECT organization_id
    FROM public.organization_members
    WHERE user_id = 'USER_A_UUID'
    LIMIT 1
);
```

**Test: Users can update their own profile**

```sql
SET request.jwt.claims TO '{"sub": "USER_UUID"}';

UPDATE public.users
SET full_name = 'New Name'
WHERE id = 'USER_UUID';
-- Should succeed
```

#### 2. Organizations Table Policies

**Test: Users can view their organizations**

```sql
SET request.jwt.claims TO '{"sub": "USER_UUID"}';

SELECT * FROM public.organizations
WHERE id IN (
    SELECT organization_id
    FROM public.organization_members
    WHERE user_id = 'USER_UUID'
);
-- Should return all user's organizations
```

**Test: Owners/admins can update organizations**

```sql
-- User with admin/owner role
SET request.jwt.claims TO '{"sub": "ADMIN_USER_UUID"}';

UPDATE public.organizations
SET name = 'Updated Name'
WHERE id = 'ORG_UUID';
-- Should succeed if user is admin/owner

-- User with member role
SET request.jwt.claims TO '{"sub": "MEMBER_USER_UUID"}';

UPDATE public.organizations
SET name = 'Updated Name'
WHERE id = 'ORG_UUID';
-- Should fail
```

**Test: Only owners can delete organizations**

```sql
-- User with owner role
SET request.jwt.claims TO '{"sub": "OWNER_USER_UUID"}';

DELETE FROM public.organizations WHERE id = 'ORG_UUID';
-- Should succeed

-- User with admin/member role
SET request.jwt.claims TO '{"sub": "ADMIN_USER_UUID"}';

DELETE FROM public.organizations WHERE id = 'ORG_UUID';
-- Should fail
```

#### 3. Organization Members Table Policies

**Test: Users can view their org members**

```sql
SET request.jwt.claims TO '{"sub": "USER_UUID"}';

SELECT * FROM public.organization_members
WHERE organization_id = 'ORG_UUID';
-- Should return all members if user is a member
```

**Test: Owners/admins can add members**

```sql
SET request.jwt.claims TO '{"sub": "ADMIN_USER_UUID"}';

INSERT INTO public.organization_members (organization_id, user_id, role)
VALUES ('ORG_UUID', 'NEW_USER_UUID', 'member');
-- Should succeed if user is admin/owner
```

**Test: Users cannot change their own role**

```sql
SET request.jwt.claims TO '{"sub": "USER_UUID"}';

UPDATE public.organization_members
SET role = 'owner'
WHERE user_id = 'USER_UUID' AND organization_id = 'ORG_UUID';
-- Should fail
```

**Test: Users can leave organizations**

```sql
SET request.jwt.claims TO '{"sub": "USER_UUID"}';

DELETE FROM public.organization_members
WHERE user_id = 'USER_UUID' AND organization_id = 'ORG_UUID';
-- Should succeed (unless they're the last owner - protected by trigger)
```

### Automated RLS Testing Script

Create a test file `supabase/tests/rls_policies.test.sql`:

```sql
-- RLS Policy Tests
-- Run with: psql -d postgres -f supabase/tests/rls_policies.test.sql

BEGIN;

-- Setup test users and organizations
INSERT INTO auth.users (id, email) VALUES
    ('11111111-1111-1111-1111-111111111111', 'owner@test.com'),
    ('22222222-2222-2222-2222-222222222222', 'admin@test.com'),
    ('33333333-3333-3333-3333-333333333333', 'member@test.com'),
    ('44444444-4444-4444-4444-444444444444', 'outsider@test.com');

-- Create test organization
SELECT create_organization_with_owner('Test Org', 'test-org', 'Test description');

-- Add test members with different roles
-- (Continue with test assertions...)

ROLLBACK; -- Don't persist test data
```

---

## Database Functions

### Available Functions

#### 1. `create_organization_with_owner()`

Creates a new organization and assigns the creator as owner.

**Usage:**

```sql
SELECT create_organization_with_owner(
    'My Company',           -- name
    'my-company',           -- slug
    'Company description',  -- description (optional)
    'https://logo.png',     -- logo_url (optional)
    'https://website.com'   -- website_url (optional)
);
```

**TypeScript Example:**

```typescript
const { data, error } = await supabase.rpc('create_organization_with_owner', {
  p_name: 'My Company',
  p_slug: 'my-company',
  p_description: 'Company description',
  p_logo_url: 'https://logo.png',
  p_website_url: 'https://website.com'
});
```

#### 2. `get_user_organizations()`

Returns all organizations for the authenticated user with their role.

**Usage:**

```sql
SELECT * FROM get_user_organizations();
```

**TypeScript Example:**

```typescript
const { data, error } = await supabase.rpc('get_user_organizations');

// Returns:
// [
//   {
//     organization_id: 'uuid',
//     organization_name: 'My Company',
//     organization_slug: 'my-company',
//     user_role: 'owner',
//     user_joined_at: '2025-01-01T00:00:00Z',
//     ...
//   }
// ]
```

#### 3. `user_has_role_in_org()`

Checks if the authenticated user has a specific role in an organization.

**Usage:**

```sql
SELECT user_has_role_in_org(
    '123e4567-e89b-12d3-a456-426614174000'::uuid,  -- organization_id
    'admin'::organization_role                      -- required_role
);
```

**TypeScript Example:**

```typescript
const { data, error } = await supabase.rpc('user_has_role_in_org', {
  p_organization_id: organizationId,
  p_required_role: 'admin'
});

// Returns: true or false
```

#### 4. `get_organization_member_count()`

Returns the number of members in an organization.

**Usage:**

```sql
SELECT get_organization_member_count('123e4567-e89b-12d3-a456-426614174000'::uuid);
```

**TypeScript Example:**

```typescript
const { data, error } = await supabase.rpc('get_organization_member_count', {
  p_organization_id: organizationId
});

// Returns: integer (member count)
```

---

## Type Generation

Generate TypeScript types from your Supabase schema for type-safe database queries.

### Generate Types from Production

```bash
# Generate types from your production database
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/database.types.ts
```

### Generate Types from Local Database

```bash
# Generate types from local database
npx supabase gen types typescript --local > lib/supabase/database.types.ts
```

### Usage in TypeScript

```typescript
import { Database } from '@/lib/supabase/database.types';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Now all queries are type-safe
const { data, error } = await supabase
  .from('organizations')
  .select('*')
  .single();

// data is typed as Organization
```

---

## Troubleshooting

### Common Issues

#### 1. "relation does not exist" error

**Cause:** Migrations haven't been applied

**Solution:**
```bash
supabase db push
```

#### 2. RLS policy blocks my query

**Cause:** RLS is enabled but policy doesn't cover your use case

**Solution:**
- Check if you're authenticated: `auth.uid()` must return a valid UUID
- Verify the user has proper permissions
- Test the policy manually in SQL Editor
- Temporarily disable RLS for testing (NOT in production):
  ```sql
  ALTER TABLE public.table_name DISABLE ROW LEVEL SECURITY;
  ```

#### 3. Cannot delete last owner

**Cause:** Trigger prevents removing the last owner from an organization

**Solution:** This is intentional. Either:
- Transfer ownership to another user first
- Delete the entire organization (if you're the owner)

#### 4. Supabase CLI won't start

**Cause:** Docker isn't running or port conflicts

**Solution:**
```bash
# Check Docker is running
docker ps

# Stop Supabase and start fresh
supabase stop
supabase start

# Check for port conflicts
lsof -i :54321  # On macOS/Linux
netstat -ano | findstr :54321  # On Windows
```

#### 5. Type generation fails

**Cause:** Database schema not accessible or CLI not authenticated

**Solution:**
```bash
# Re-authenticate
supabase login

# Verify connection
supabase db status

# Try local generation instead
supabase gen types typescript --local > lib/supabase/database.types.ts
```

### Getting Help

- Supabase Documentation: [https://supabase.com/docs](https://supabase.com/docs)
- Supabase Discord: [https://discord.supabase.com](https://discord.supabase.com)
- GitHub Issues: [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues)

---

## Best Practices

1. **Always use migrations** - Never manually alter production database
2. **Test RLS policies thoroughly** - Security depends on it
3. **Use database functions** - Encapsulate business logic in the database
4. **Keep types in sync** - Regenerate types after schema changes
5. **Use transactions** - For operations that must succeed or fail together
6. **Monitor performance** - Use Supabase dashboard to track slow queries
7. **Backup regularly** - Supabase auto-backups, but test restore procedures
8. **Version control** - Commit all migration files to Git

---

## Next Steps

After completing the setup:

1. **Test all RLS policies** using the checklist above
2. **Generate TypeScript types** for your schema
3. **Create seed data** for local development (optional)
4. **Set up CI/CD** to auto-run migrations on deploy
5. **Implement authentication** in your Next.js application
6. **Build API routes** that use Supabase client

Refer to the main project documentation for frontend integration examples.
