# Supabase Quick Start Guide

Get your Supabase backend up and running in 5 minutes.

## Local Development (Recommended for First Time)

### Step 1: Install Dependencies

```bash
# Install Supabase CLI
npm install -g supabase

# Install Docker Desktop (required for local Supabase)
# Download from: https://www.docker.com/products/docker-desktop
```

### Step 2: Start Supabase

```bash
# Navigate to project root
cd D:\ai-comerc-lead-generator

# Start Supabase (first time will download Docker images)
supabase start
```

Wait for startup to complete. You'll see:

```
Started supabase local development setup.

         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Apply Migrations

```bash
# Apply the initial schema migration
supabase db push
```

You should see:
```
Applying migration 20250101000000_initial_schema.sql...
Finished supabase db push.
```

### Step 4: Configure Environment

```bash
# Copy environment template
cp .env.example .env.local
```

Edit `.env.local` and update with values from Step 2:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste-anon-key-from-step-2>
SUPABASE_SERVICE_ROLE_KEY=<paste-service-role-key-from-step-2>
```

### Step 5: Verify Installation

Open Supabase Studio: [http://localhost:54323](http://localhost:54323)

You should see:
- 3 tables: `users`, `organizations`, `organization_members`
- RLS enabled on all tables
- 4 database functions

---

## Production Setup

### Step 1: Create Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - Name: `ai-comerc-lead-generator`
   - Database Password: (generate strong password)
   - Region: (closest to your users)
4. Click "Create new project"
5. Wait for provisioning (2-3 minutes)

### Step 2: Link Local to Production

```bash
# Login to Supabase
supabase login

# Link your project (get project-ref from dashboard URL)
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 3: Push Migrations

```bash
# Push migrations to production
supabase db push --linked
```

### Step 4: Get API Keys

1. Go to Project Settings > API
2. Copy:
   - Project URL
   - `anon` `public` key
   - `service_role` `secret` key

### Step 5: Configure Production Environment

In your hosting platform (Vercel, Netlify, etc.), add these environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

---

## Testing Your Setup

### Test 1: Create an Organization

Open Supabase Studio SQL Editor and run:

```sql
-- Create a test user (simulating signup)
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
    raw_user_meta_data
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'test@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Test User"}'
) RETURNING id;

-- Note the returned UUID, then use it below
SET request.jwt.claim.sub = 'PASTE_USER_UUID_HERE';

-- Create an organization
SELECT create_organization_with_owner(
    'My Test Company',
    'my-test-company',
    'This is a test organization',
    NULL,
    NULL
);
```

### Test 2: Verify RLS Works

```sql
-- Set user context
SET request.jwt.claim.sub = 'YOUR_USER_UUID';

-- Should see your organizations
SELECT * FROM public.organizations;

-- Should see your profile
SELECT * FROM public.users;

-- Try to access another user's data (should return empty)
SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000000';
SELECT * FROM public.organizations; -- Returns nothing
```

### Test 3: Test Functions

```sql
SET request.jwt.claim.sub = 'YOUR_USER_UUID';

-- Get user's organizations with roles
SELECT * FROM get_user_organizations();

-- Check permissions
SELECT user_has_role_in_org(
    'YOUR_ORG_UUID',
    'owner'::organization_role
);
```

---

## Common Commands

```bash
# Start Supabase
supabase start

# Stop Supabase
supabase stop

# Reset database (WARNING: deletes all data)
supabase db reset

# View logs
supabase db logs

# Generate TypeScript types
supabase gen types typescript --local > lib/supabase/database.types.ts

# Create a new migration
supabase migration new migration_name

# Apply migrations
supabase db push

# Check status
supabase status
```

---

## Next Steps

After successful setup:

1. **Review the schema**: Open Studio and explore tables
2. **Test RLS policies**: Use the RLS_TESTING_CHECKLIST.md
3. **Generate types**: Run type generation for TypeScript
4. **Build authentication**: Integrate Supabase Auth in your Next.js app
5. **Create API routes**: Build endpoints using Supabase client

---

## Troubleshooting

### Supabase won't start

```bash
# Make sure Docker is running
docker ps

# Stop and remove containers
supabase stop --no-backup
docker system prune -a

# Start fresh
supabase start
```

### Migration fails

```bash
# Reset database and reapply
supabase db reset

# Or manually fix and push
supabase db push
```

### Can't connect to database

```bash
# Check status
supabase status

# View connection string
supabase status | grep "DB URL"

# Test connection
psql "postgresql://postgres:postgres@localhost:54322/postgres"
```

### RLS blocking everything

```sql
-- Verify you're setting the user context
SELECT auth.uid(); -- Should return your user UUID

-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

---

## Getting Help

- Full documentation: `supabase/README.md`
- RLS testing guide: `supabase/RLS_TESTING_CHECKLIST.md`
- Supabase docs: [https://supabase.com/docs](https://supabase.com/docs)
- Discord: [https://discord.supabase.com](https://discord.supabase.com)

---

**Setup Time:** ~5 minutes
**Last Updated:** 2025-01-01
