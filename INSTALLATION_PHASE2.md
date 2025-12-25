# Phase 2 Installation Guide - Public Lead Capture API

## Overview

This guide covers the installation and setup requirements for Phase 2: Public Lead Capture API implementation.

## Required Dependencies

### 1. Install bcryptjs

The Public Lead Capture API uses bcryptjs for API key hashing and verification:

```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

**Why bcryptjs?**
- Secure password/key hashing with salt rounds
- Compatible with serverless environments (unlike native bcrypt)
- Industry-standard for password hashing
- Works in Next.js Edge runtime

### 2. Verify Existing Dependencies

These should already be installed from Phase 1:

```bash
# Check package.json includes:
- zod (for validation)
- @supabase/supabase-js (for database)
- next (framework)
```

## Database Setup

### 1. Apply Phase 2 Migration

The migration creates the leads system tables:

**File:** `supabase/migrations/20250116000000_create_leads_system.sql`

**Tables created:**
- `leads` - Main lead storage
- `api_keys` - API key management
- `lead_activity_log` - Audit trail

**Apply migration:**

```bash
# Option A: Using Supabase CLI
supabase db push

# Option B: Using Supabase Dashboard
# 1. Go to Dashboard > SQL Editor
# 2. Copy contents of migration file
# 3. Run the SQL
```

### 2. Verify Migration Success

Run this SQL to check tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('leads', 'api_keys', 'lead_activity_log');
```

Expected result: 3 rows (all three tables)

## Environment Configuration

### 1. Update .env.local

Ensure these variables are set:

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App (optional)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Where to find Supabase keys:**
1. Go to Supabase Dashboard
2. Settings > API
3. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

**⚠️ IMPORTANT:** Never commit `.env.local` to version control!

## File Structure

Verify these files were created:

```
D:\ai-comerc-lead-generator\
├── app/
│   └── api/
│       └── public/
│           └── leads/
│               ├── route.ts          # Main API endpoint
│               └── README.md         # API documentation
├── lib/
│   ├── utils/
│   │   └── rate-limiter.ts          # Rate limiting utility
│   ├── validations/
│   │   └── leads.ts                  # Lead validation schemas (updated)
│   └── supabase/
│       ├── types.ts                  # Database types (updated)
│       └── client.ts                 # Supabase clients
├── scripts/
│   └── create-test-api-key.ts       # API key generator script
├── SETUP_PUBLIC_API.md              # Setup and testing guide
└── INSTALLATION_PHASE2.md           # This file
```

## Verification Steps

### 1. Check Dependencies

```bash
# Verify bcryptjs is installed
npm list bcryptjs

# Expected output:
# ai-comerc-lead-generator@0.1.0
# └── bcryptjs@2.x.x

# Check TypeScript types
npm list @types/bcryptjs

# Expected output:
# ai-comerc-lead-generator@0.1.0
# └── @types/bcryptjs@2.x.x
```

### 2. Start Development Server

```bash
npm run dev
```

Expected output:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Ready in [time]ms
```

### 3. Test API Endpoint (Health Check)

```bash
# Test OPTIONS (CORS preflight)
curl -X OPTIONS http://localhost:3000/api/public/leads -v

# Expected: 204 No Content with CORS headers
```

### 4. Test TypeScript Compilation

```bash
npm run type-check
```

Expected: No TypeScript errors

## Common Installation Issues

### Issue: "bcryptjs module not found"

**Solution:**
```bash
npm install bcryptjs @types/bcryptjs
# If that doesn't work, try:
npm install --legacy-peer-deps bcryptjs @types/bcryptjs
```

### Issue: "Cannot find module '@/lib/utils/rate-limiter'"

**Solution:**
Verify the file exists at:
```
D:\ai-comerc-lead-generator\lib\utils\rate-limiter.ts
```

If missing, copy from the implementation files provided.

### Issue: "SUPABASE_SERVICE_ROLE_KEY is not set"

**Solution:**
1. Check `.env.local` exists in project root
2. Add the service role key:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```
3. Restart dev server

### Issue: "Table 'leads' does not exist"

**Solution:**
Apply the Phase 2 migration:
```bash
supabase db push
# OR manually via Supabase Dashboard SQL Editor
```

### Issue: TypeScript errors in route.ts

**Solution:**
1. Verify all dependencies installed:
   ```bash
   npm install
   ```
2. Check TypeScript version:
   ```bash
   npm list typescript
   # Should be 5.x or higher
   ```
3. Rebuild:
   ```bash
   npm run build
   ```

## Testing Installation

Once installation is complete, follow these steps:

### 1. Create Test API Key

See `SETUP_PUBLIC_API.md` for detailed instructions on creating an API key.

Quick version:
1. Generate random key: Run `scripts/create-test-api-key.ts`
2. Hash with bcrypt
3. Insert into `api_keys` table

### 2. Test Endpoint

```bash
# Test with valid API key
curl -X POST http://localhost:3000/api/public/leads \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"name":"Test Lead","email":"test@example.com"}'

# Expected: 201 Created with lead_id
```

### 3. Verify in Database

```sql
-- Check lead was created
SELECT * FROM leads ORDER BY created_at DESC LIMIT 1;

-- Check activity log
SELECT * FROM lead_activity_log ORDER BY created_at DESC LIMIT 1;

-- Check API key usage updated
SELECT name, usage_count, last_used_at FROM api_keys;
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] All dependencies installed (check `package.json`)
- [ ] Database migrations applied on production database
- [ ] Environment variables configured in deployment platform
- [ ] API keys created for production use
- [ ] CORS domains configured (no wildcards)
- [ ] Rate limits set appropriately
- [ ] Monitoring/logging configured
- [ ] HTTPS enabled

### Deployment Platforms

**Vercel (Recommended):**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

**Other Platforms:**
- Set environment variables via platform dashboard
- Ensure Node.js 18+ runtime
- Configure build command: `npm run build`
- Configure start command: `npm start`

## Rollback Procedure

If you need to rollback Phase 2:

### 1. Remove Dependencies

```bash
npm uninstall bcryptjs @types/bcryptjs
```

### 2. Revert Database (CAUTION!)

**⚠️ WARNING: This will delete all leads data!**

```sql
-- Drop Phase 2 tables
DROP TABLE IF EXISTS lead_activity_log CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS leads CASCADE;

-- Drop Phase 2 enums
DROP TYPE IF EXISTS lead_status CASCADE;
DROP TYPE IF EXISTS lead_source CASCADE;

-- Drop Phase 2 functions
DROP FUNCTION IF EXISTS create_lead CASCADE;
DROP FUNCTION IF EXISTS get_lead_stats CASCADE;
DROP FUNCTION IF EXISTS search_leads CASCADE;
DROP FUNCTION IF EXISTS update_lead_contacted_at CASCADE;
```

### 3. Remove Files

```bash
# Remove Phase 2 files
rm -rf app/api/public/
rm lib/utils/rate-limiter.ts
rm scripts/create-test-api-key.ts
rm SETUP_PUBLIC_API.md
rm INSTALLATION_PHASE2.md
```

### 4. Revert Code Changes

```bash
git checkout lib/validations/leads.ts
git checkout lib/supabase/types.ts
```

## Next Steps

After successful installation:

1. **Read API Documentation**
   - See `app/api/public/leads/README.md`

2. **Create API Keys**
   - Follow `SETUP_PUBLIC_API.md`

3. **Test Thoroughly**
   - Test all error cases
   - Test rate limiting
   - Test CORS
   - Test duplicate detection

4. **Integrate with Frontend**
   - Create API key management UI
   - Add lead dashboard
   - Build lead detail views

5. **Prepare for Phase 3**
   - Plan chatbot integration
   - Design conversation tracking
   - Plan AI summarization

## Support Resources

- **API Documentation:** `app/api/public/leads/README.md`
- **Setup Guide:** `SETUP_PUBLIC_API.md`
- **Technical Spec:** `PHASE_2_TECHNICAL_SPECIFICATION.md`
- **Database Schema:** `supabase/migrations/20250116000000_create_leads_system.sql`

## Troubleshooting

If you encounter issues:

1. **Check logs:**
   ```bash
   npm run dev
   # Watch for errors in terminal
   ```

2. **Check Supabase logs:**
   - Dashboard > Logs
   - Look for database errors

3. **Verify environment:**
   ```bash
   node -v  # Should be 18+
   npm -v   # Should be 9+
   ```

4. **Clean rebuild:**
   ```bash
   rm -rf .next node_modules
   npm install
   npm run dev
   ```

## Contact

For issues or questions:
- Review documentation files
- Check server and database logs
- Verify environment configuration
- Contact: support@example.com

---

**Installation Complete!** 🎉

You can now proceed to test the Public Lead Capture API following the `SETUP_PUBLIC_API.md` guide.
