# Production Readiness Checklist
**Project:** AI E-Commerce Lead Generator
**Created:** 2025-12-16
**Purpose:** Ensure safe transition from development to production

---

## CRITICAL: Complete Before ANY Production Deployment

### 1. Re-Enable Row-Level Security (RLS)

#### Current Status
RLS is **DISABLED** on all tables for development. This is a **CRITICAL SECURITY RISK** in production.

#### Steps to Re-Enable

**Step 1: Verify RLS Policies Exist**
```sql
-- Run in Supabase SQL Editor
SELECT
    schemaname,
    tablename,
    policyname,
    cmd AS operation,
    roles,
    permissive
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Expected Output:**
You should see policies for:
- `users` table: 3 policies (select_own, update_own, insert_own)
- `organizations` table: 3 policies (select_member, update_admin, delete_owner)
- `organization_members` table: 3 policies (select_same_org, update_admin, delete_self_or_admin)

**Step 2: Run RLS Enablement Script**
```bash
# Location: D:\ai-comerc-lead-generator\ENABLE_RLS_FOR_PRODUCTION.sql

# In Supabase SQL Editor:
1. Open the file content
2. Copy and paste into SQL Editor
3. Click "Run"
4. Verify "Success" message
```

**Step 3: Verify RLS is Enabled**
```sql
-- Run in Supabase SQL Editor
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'organizations', 'organization_members');
```

**Expected Output:**
```
schemaname | tablename              | rls_enabled
-----------|------------------------|------------
public     | users                  | true
public     | organizations          | true
public     | organization_members   | true
```

All tables MUST show `rls_enabled = true`.

**Step 4: Test RLS Policies**

Create two test users and organizations, then verify isolation:

```sql
-- Test 1: User A can only see their organizations
-- Run as User A (use Supabase client with User A's auth token)
SELECT * FROM organizations;
-- Should only return User A's organizations

-- Test 2: User B can only see their organizations
-- Run as User B
SELECT * FROM organizations;
-- Should only return User B's organizations

-- Test 3: Cross-tenant access blocked
-- As User A, try to access User B's organization
SELECT * FROM organization_members
WHERE organization_id = '<user-b-org-id>';
-- Should return empty set (0 rows)

-- Test 4: Attempt to update another org
UPDATE organizations
SET name = 'HACKED'
WHERE id = '<user-b-org-id>';
-- Should return: 0 rows updated

-- Test 5: Attempt to view another user's profile
SELECT * FROM users
WHERE id = '<user-b-id>';
-- Should return empty set (0 rows)
```

**Checklist:**
- [ ] RLS policies exist in database
- [ ] `ENABLE_RLS_FOR_PRODUCTION.sql` script executed successfully
- [ ] All tables show `rowsecurity = true`
- [ ] Test User A cannot see User B's data
- [ ] Test User B cannot see User A's data
- [ ] Cross-tenant SELECT blocked
- [ ] Cross-tenant UPDATE blocked
- [ ] Cross-tenant DELETE blocked
- [ ] Test script documented for future use

---

### 2. Fix Service Role Key Configuration

#### Current Issue
The service role key in `.env.local` is set to the same value as the anon key. This is incorrect.

**Current (WRONG):**
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_qxAQVgb2hMyZWrwWti6q0w_LanWYXIo
SUPABASE_SERVICE_ROLE_KEY=sb_publishable_qxAQVgb2hMyZWrwWti6q0w_LanWYXIo
```

#### Steps to Fix

**Step 1: Obtain Actual Service Role Key**
1. Go to Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to: Settings → API
4. Scroll to "Project API keys"
5. Find the `service_role` secret key
6. Click "Reveal" and copy the key

**NOTE:** The service role key is different from the anon key. It has elevated privileges.

**Step 2: Update Environment Variables**
```env
# .env.local (Development)
NEXT_PUBLIC_SUPABASE_URL=https://neqvzxaabhvfureehakr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_qxAQVgb2hMyZWrwWti6q0w_LanWYXIo
SUPABASE_SERVICE_ROLE_KEY=<PASTE-ACTUAL-SERVICE-ROLE-KEY-HERE>
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**For Production (Vercel/Deployment Platform):**
1. Go to deployment platform dashboard (e.g., Vercel)
2. Navigate to: Project Settings → Environment Variables
3. Set the following variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = Production Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Production anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = Production service role key (DIFFERENT from dev)
   - `NEXT_PUBLIC_APP_URL` = Production URL (e.g., https://yourdomain.com)
   - `NODE_ENV` = production

**Step 3: Restart Development Server**
```bash
# Stop current server (Ctrl+C)
# Restart
npm run dev
```

**Step 4: Verify Admin Client Works**
```typescript
// Create a test file: test-admin-client.ts
import { createAdminSupabaseClient } from './lib/supabase/client';

async function testAdminClient() {
  try {
    const admin = createAdminSupabaseClient();

    // This should bypass RLS and return ALL organizations
    const { data: allOrgs, error } = await admin
      .from('organizations')
      .select('*');

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('Admin client works!');
    console.log('Total organizations (bypassing RLS):', allOrgs.length);

    // Compare with regular client
    const { createServerSupabaseClient } = await import('./lib/supabase/client');
    const supabase = await createServerSupabaseClient();
    const { data: userOrgs } = await supabase
      .from('organizations')
      .select('*');

    console.log('User client organizations:', userOrgs?.length || 0);
    console.log('Admin sees more orgs?', allOrgs.length > (userOrgs?.length || 0));
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAdminClient();
```

Run:
```bash
npx tsx test-admin-client.ts
```

Expected output:
```
Admin client works!
Total organizations (bypassing RLS): 5
User client organizations: 1
Admin sees more orgs? true
```

**Checklist:**
- [ ] Actual service role key obtained from Supabase Dashboard
- [ ] `.env.local` updated with correct service role key
- [ ] Production environment variables configured
- [ ] Development server restarted
- [ ] Admin client test passed
- [ ] Admin client bypasses RLS (sees all orgs)
- [ ] Regular client respects RLS (sees only user's orgs)
- [ ] No errors in console

---

### 3. Verify Git History is Clean (No Committed Secrets)

#### Risk
If `.env.local` or `.env` files were ever committed to Git, your Supabase credentials are exposed publicly.

#### Steps to Verify

**Step 1: Check Git History**
```bash
# Navigate to project directory
cd "D:\ai-comerc-lead-generator"

# Check if .env.local was ever committed
git log --all --full-history -- .env.local

# Check if .env was ever committed
git log --all --full-history -- .env

# Check for any files with "env" in name
git log --all --full-history -- *env*
```

**If Output is EMPTY:**
✅ Good! No secrets were committed.

**If Output Shows Commits:**
🚨 CRITICAL! Secrets were committed. Follow rotation procedure below.

**Step 2: Check Remote Repository (if applicable)**
```bash
# If you have a GitHub/GitLab repo, check it
# Go to: https://github.com/your-username/your-repo
# Search for: "SUPABASE_SERVICE_ROLE_KEY"
# Search for: "sb_publishable_"
```

**Step 3: Use Git Secrets Scanner (Recommended)**
```bash
# Install git-secrets (optional but recommended)
npm install -g git-secrets

# Or use GitGuardian
npm install --save-dev @gitguardian/ggshield

# Scan repository
npx ggshield secret scan repo .
```

#### If Secrets Were Committed: Emergency Rotation

**IMMEDIATE ACTIONS (within 1 hour):**

1. **Rotate ALL Supabase Credentials**
   - Go to Supabase Dashboard
   - Navigate to: Settings → API
   - Click "Reset Database Password"
   - Generate new anon key (revoke old one)
   - Generate new service role key (revoke old one)

2. **Update All Environments**
   ```env
   # Update .env.local
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<new-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<new-service-role-key>

   # Update production environment variables
   # (Vercel dashboard, etc.)
   ```

3. **Remove Secrets from Git History**
   ```bash
   # Install git-filter-repo
   pip install git-filter-repo

   # Remove .env.local from all history
   git filter-repo --invert-paths --path .env.local

   # Force push (if remote exists)
   git push origin --force --all
   ```

4. **Verify Database Not Compromised**
   - Check audit logs for unauthorized access
   - Review organization list for suspicious entries
   - Check user accounts for unauthorized signups
   - Monitor for unusual activity

**Checklist:**
- [ ] Git history checked for `.env.local`
- [ ] Git history checked for `.env`
- [ ] Remote repository checked (if applicable)
- [ ] Git secrets scanner run
- [ ] If secrets found: Credentials rotated immediately
- [ ] If secrets found: Git history cleaned
- [ ] If secrets found: Database audited for breaches
- [ ] `.gitignore` includes `.env*.local` and `.env`
- [ ] `.git/info/exclude` includes `.env.local` (extra protection)

---

### 4. Configure Security Headers

#### Current Status
Security headers are missing from Next.js configuration.

#### Implementation

**Update `next.config.js`:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

**Test Headers:**
```bash
# Start dev server
npm run dev

# Test in another terminal
curl -I http://localhost:3000

# Check for headers:
# - Content-Security-Policy
# - X-Frame-Options: DENY
# - X-Content-Type-Options: nosniff
# - Referrer-Policy
# - Permissions-Policy
```

**Use Online Security Header Scanner:**
1. Deploy to production
2. Go to: https://securityheaders.com/
3. Enter your domain
4. Verify grade is A or A+

**Checklist:**
- [ ] `next.config.js` updated with security headers
- [ ] Dev server restarted
- [ ] Headers present in `curl -I` output
- [ ] CSP header set
- [ ] X-Frame-Options header set
- [ ] X-Content-Type-Options header set
- [ ] Referrer-Policy header set
- [ ] Permissions-Policy header set
- [ ] Online scanner shows grade A/A+

---

### 5. Environment Variable Security

#### Development Environment

**`.env.local` Checklist:**
- [ ] File exists: `D:\ai-comerc-lead-generator\.env.local`
- [ ] Contains correct Supabase URL
- [ ] Contains correct anon key
- [ ] Contains correct service role key (NOT same as anon key)
- [ ] Contains correct app URL
- [ ] NODE_ENV set to "development"
- [ ] No extra spaces or quotes
- [ ] File is in `.gitignore`

**Example `.env.local`:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...actual-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...actual-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
```

#### Production Environment

**Vercel Configuration:**
1. Go to: https://vercel.com/dashboard
2. Select your project
3. Navigate to: Settings → Environment Variables
4. Add/Update variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Production Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Production anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Production service role key
   - `NEXT_PUBLIC_APP_URL`: Production domain (https://yourdomain.com)
   - `NODE_ENV`: production

**IMPORTANT:**
- Use DIFFERENT credentials for production vs development
- NEVER use production credentials in development
- NEVER commit environment variables to Git
- Rotate production credentials every 90 days

**Checklist:**
- [ ] Development `.env.local` configured correctly
- [ ] Production environment variables set in deployment platform
- [ ] Different credentials for dev vs production
- [ ] All required variables present
- [ ] No variables committed to Git
- [ ] `.gitignore` includes `.env*.local`
- [ ] Deployment platform shows all variables

---

## Security Testing

### Pre-Production Testing Checklist

#### 1. Authentication Testing

- [ ] **Login Flow**
  - [ ] Valid credentials → success
  - [ ] Invalid credentials → error message
  - [ ] SQL injection attempt → blocked
  - [ ] XSS in email field → sanitized

- [ ] **Signup Flow**
  - [ ] Valid data → account created
  - [ ] Duplicate email → error
  - [ ] Weak password → rejected
  - [ ] Terms not accepted → blocked

- [ ] **Session Management**
  - [ ] Session persists on page refresh
  - [ ] Logout clears session
  - [ ] Expired session redirects to login

#### 2. Authorization Testing

- [ ] **Route Protection**
  - [ ] Unauthenticated user cannot access dashboard
  - [ ] Unauthenticated user redirected to login
  - [ ] Authenticated user can access dashboard

- [ ] **Role-Based Access**
  - [ ] Member can view organizations
  - [ ] Member cannot update organizations
  - [ ] Admin can update organizations
  - [ ] Owner can delete organizations

- [ ] **Multi-Tenant Isolation**
  - [ ] User A cannot see User B's organizations
  - [ ] User A cannot update User B's organizations
  - [ ] Direct API calls to other org data blocked

#### 3. RLS Policy Testing

- [ ] **Users Table**
  - [ ] User can view own profile
  - [ ] User cannot view other users (outside org)
  - [ ] User can update own profile
  - [ ] User cannot update other users

- [ ] **Organizations Table**
  - [ ] User can view their organizations
  - [ ] User cannot view other organizations
  - [ ] Admin can update organization
  - [ ] Member cannot update organization
  - [ ] Owner can delete organization

- [ ] **Organization Members Table**
  - [ ] Member can view other members in same org
  - [ ] Member cannot view members in other org
  - [ ] Admin can update member roles
  - [ ] Member cannot update roles

#### 4. Input Validation Testing

- [ ] **Email Validation**
  - [ ] Valid email accepted
  - [ ] Invalid format rejected
  - [ ] SQL injection blocked

- [ ] **Organization Slug**
  - [ ] Valid slug accepted
  - [ ] Invalid characters rejected
  - [ ] Reserved slugs rejected
  - [ ] Duplicate slug rejected

- [ ] **Text Fields**
  - [ ] HTML escaped in output
  - [ ] Max length enforced
  - [ ] Special characters handled

#### 5. Security Headers Testing

- [ ] **CSP Header**
  - [ ] Present in response
  - [ ] Inline scripts blocked (if strict)
  - [ ] External scripts allowed only from whitelist

- [ ] **X-Frame-Options**
  - [ ] Set to DENY or SAMEORIGIN
  - [ ] Prevents clickjacking

- [ ] **Other Headers**
  - [ ] X-Content-Type-Options: nosniff
  - [ ] Referrer-Policy set
  - [ ] Permissions-Policy set

---

## Database Security

### Pre-Production Database Checklist

- [ ] **RLS Enabled**
  - [ ] All tables have RLS enabled
  - [ ] RLS policies exist and tested
  - [ ] No tables with RLS disabled

- [ ] **Indexes Optimized**
  - [ ] Frequently queried columns indexed
  - [ ] Composite indexes for common queries
  - [ ] No missing indexes on foreign keys

- [ ] **Constraints Applied**
  - [ ] Email format validation
  - [ ] Slug format validation
  - [ ] Unique constraints on emails/slugs
  - [ ] Foreign key constraints

- [ ] **Functions Secured**
  - [ ] SECURITY DEFINER used appropriately
  - [ ] No SQL injection vulnerabilities
  - [ ] Proper error handling

- [ ] **Backup Strategy**
  - [ ] Supabase automatic backups enabled
  - [ ] Backup retention policy set (7-30 days)
  - [ ] Tested database restore

---

## Deployment Checklist

### Pre-Deployment

- [ ] **Code Review**
  - [ ] Security audit report reviewed
  - [ ] All CRITICAL issues fixed
  - [ ] All HIGH priority issues fixed
  - [ ] Code reviewed by at least one other developer

- [ ] **Testing**
  - [ ] All tests pass
  - [ ] Security tests pass
  - [ ] Manual testing complete

- [ ] **Configuration**
  - [ ] Environment variables set
  - [ ] Security headers configured
  - [ ] RLS enabled and tested

- [ ] **Documentation**
  - [ ] README updated
  - [ ] API documentation complete
  - [ ] Security documentation reviewed

### Deployment

- [ ] **Deploy to Production**
  - [ ] Use production branch
  - [ ] Use production environment variables
  - [ ] Monitor deployment logs
  - [ ] No errors during deployment

- [ ] **Post-Deployment Verification**
  - [ ] Site loads successfully
  - [ ] Login/signup works
  - [ ] Create test organization
  - [ ] Delete test organization
  - [ ] Check error logs (should be empty)

### Post-Deployment

- [ ] **Monitoring**
  - [ ] Error monitoring active
  - [ ] Performance monitoring active
  - [ ] Uptime monitoring active

- [ ] **Security Verification**
  - [ ] Run security headers scan
  - [ ] Test authentication
  - [ ] Test RLS policies
  - [ ] Review audit logs

---

## Rollback Plan

### If Issues Detected Post-Deployment

**Step 1: Assess Severity**
- **Critical (data breach, site down):** Rollback immediately
- **High (feature broken):** Rollback within 1 hour
- **Medium (UI issue):** Fix forward or rollback within 24 hours

**Step 2: Execute Rollback**

**Vercel:**
```bash
# Go to Vercel dashboard
# Navigate to: Deployments
# Find previous working deployment
# Click "..." → "Promote to Production"
```

**Database:**
```sql
-- If database changes were made, restore from backup
-- Go to Supabase Dashboard → Database → Backups
-- Select backup before deployment
-- Click "Restore"
```

**Step 3: Verify Rollback**
- [ ] Site loads
- [ ] Authentication works
- [ ] Data intact
- [ ] No errors in logs

**Step 4: Post-Mortem**
- Document what went wrong
- Identify root cause
- Plan fix
- Add tests to prevent recurrence

---

## Continuous Security

### Weekly Tasks

- [ ] Review audit logs for suspicious activity
- [ ] Check error logs for security errors
- [ ] Monitor rate limit violations
- [ ] Review new user signups

### Monthly Tasks

- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Review and update dependencies
- [ ] Test RLS policies still working
- [ ] Review access logs
- [ ] Backup verification (test restore)

### Quarterly Tasks

- [ ] Rotate production credentials
- [ ] Security audit of new features
- [ ] Penetration testing
- [ ] Update security documentation
- [ ] Review and update security policies

---

## Emergency Contacts

**Security Incidents:**
- Security Team: security@yourdomain.com
- On-Call: [Phone Number]

**Infrastructure Issues:**
- DevOps: devops@yourdomain.com
- On-Call: [Phone Number]

**External Services:**
- Supabase Support: https://supabase.com/support
- Vercel Support: https://vercel.com/support

---

## Sign-Off

**Production Readiness Confirmed:**

- [ ] All CRITICAL items completed
- [ ] RLS enabled and tested
- [ ] Security headers configured
- [ ] Environment variables secured
- [ ] Testing complete
- [ ] Documentation updated
- [ ] Rollback plan documented

**Approved By:**
- Tech Lead: _________________ Date: _______
- Security: _________________ Date: _______
- Product: _________________ Date: _______

**Production Deployment Date:** _________________

---

**Document Version:** 1.0
**Last Updated:** 2025-12-16
**Next Review:** After Production Deployment
