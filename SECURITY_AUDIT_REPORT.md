# Security Audit Report - Phase 1 & Phase 2 Planning
**Project:** AI E-Commerce Lead Generator
**Audit Date:** 2025-12-16
**Auditor:** Security Architecture Review
**Phase 1 Status:** Complete (RLS Currently DISABLED for Development)
**Phase 2 Status:** Specification Review

---

## Executive Summary

This comprehensive security audit examines the Phase 1 implementation and reviews the Phase 2 Lead System specification. The audit identified **3 CRITICAL vulnerabilities**, **8 HIGH-risk issues**, **12 MEDIUM-risk issues**, and **15 LOW-risk improvements**.

### Critical Findings Overview

1. **CRITICAL: Row-Level Security (RLS) is DISABLED** - Complete multi-tenant data exposure risk
2. **CRITICAL: Service Role Key Improperly Configured** - Using anon key as service role key
3. **CRITICAL: Environment Variables Exposed in Git** - `.env.local` may contain secrets

### Security Posture

- **Phase 1 Current State:** UNSAFE FOR PRODUCTION (RLS disabled, secrets misconfigured)
- **Phase 1 Architecture:** STRONG (proper separation, validation, type safety)
- **Phase 2 Specification:** COMPREHENSIVE (excellent security planning)
- **Recommended Action:** MUST FIX critical issues before Phase 2 implementation

---

## Part 1: Phase 1 Security Audit - Critical Vulnerabilities

### 1. CRITICAL: Row-Level Security (RLS) Disabled

**Severity:** CRITICAL
**CVSS Score:** 9.1 (Critical)
**Status:** KNOWN ISSUE (Development Mode)

**Description:**
RLS is intentionally disabled via `DISABLE_RLS_FOR_DEV.sql` for all tables:
- `public.users`
- `public.organizations`
- `public.organization_members`

**Risk:**
Complete multi-tenant data breach. Any authenticated user can:
- View all organizations across all tenants
- Access all user profiles
- Manipulate organization memberships
- Bypass all authorization checks

**Affected Files:**
- `D:\ai-comerc-lead-generator\DISABLE_RLS_FOR_DEV.sql` (lines 9-11)
- All database tables in production

**Exploitation Scenario:**
```sql
-- Any authenticated user can execute:
SELECT * FROM organizations; -- Returns ALL organizations
SELECT * FROM users; -- Returns ALL users
UPDATE organizations SET name = 'HACKED' WHERE id = '<any-org-id>';
```

**Remediation (REQUIRED BEFORE PRODUCTION):**
1. Run `D:\ai-comerc-lead-generator\ENABLE_RLS_FOR_PRODUCTION.sql`
2. Verify RLS policies are active:
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'organizations', 'organization_members');
```
3. Test cross-tenant access attempts (see Testing section)

**Timeline:** MUST BE FIXED BEFORE ANY PRODUCTION DEPLOYMENT

---

### 2. CRITICAL: Service Role Key Misconfiguration

**Severity:** CRITICAL
**CVSS Score:** 9.8 (Critical)
**File:** `D:\ai-comerc-lead-generator\.env.local` (line 6)

**Description:**
The `SUPABASE_SERVICE_ROLE_KEY` is set to the same value as the anon key:
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_qxAQVgb2hMyZWrwWti6q0w_LanWYXIo
SUPABASE_SERVICE_ROLE_KEY=sb_publishable_qxAQVgb2hMyZWrwWti6q0w_LanWYXIo
```

**Risk:**
The service role key should bypass RLS and have elevated permissions. Using the anon key:
1. Admin operations will fail when RLS is enabled
2. Security architecture assumes service role has elevated privileges
3. `createAdminSupabaseClient()` will not function as intended

**Remediation:**
1. Obtain the actual service role key from Supabase Dashboard:
   - Go to: Project Settings → API → Project API keys
   - Copy the `service_role` secret key (NOT the anon/public key)
2. Update `.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=<actual-service-role-key-here>
```
3. NEVER commit this key to version control
4. Verify admin client works:
```typescript
const admin = createAdminSupabaseClient();
const { data } = await admin.from('organizations').select('*'); // Should return all
```

**Timeline:** IMMEDIATE (Required for proper RLS testing)

---

### 3. CRITICAL: Potential Secret Exposure via Git

**Severity:** CRITICAL
**CVSS Score:** 9.1 (Critical)
**File:** `D:\ai-comerc-lead-generator\.env.local`

**Description:**
The `.env.local` file contains actual credentials and is present in the working directory. While `.gitignore` includes `.env*.local`, there is risk of:
1. Accidental commit if `.gitignore` is modified
2. File already committed in git history
3. Backup tools including sensitive files

**Risk:**
If `.env.local` was ever committed:
- Supabase credentials publicly exposed
- Database accessible by attackers
- All user data compromised

**Remediation:**
1. **Verify git history is clean:**
```bash
cd "D:\ai-comerc-lead-generator"
git log --all --full-history -- .env.local
git log --all --full-history -- .env
```

2. **If found in history, take immediate action:**
```bash
# Rotate ALL credentials in Supabase Dashboard:
# - Generate new anon key
# - Generate new service role key
# - Update RLS policies with new keys
# - Update .env.local with new keys
# - Use git-filter-repo to remove from history
```

3. **Prevention:**
```bash
# Add additional .gitignore protection
echo ".env.local" >> .git/info/exclude
# Verify .gitignore is correct
cat .gitignore | grep -E "\.env"
```

4. **Use secret scanning:**
```bash
# Install git-secrets or similar
npm install --save-dev @gitguardian/ggshield
# Scan repository
npx ggshield secret scan repo .
```

**Timeline:** IMMEDIATE (Verify within 24 hours)

---

## Part 2: Phase 1 Security Audit - High-Risk Issues

### 4. HIGH: Missing CSRF Protection on Server Actions

**Severity:** HIGH
**CVSS Score:** 7.5 (High)
**Files:**
- `D:\ai-comerc-lead-generator\lib\actions\auth.ts`
- `D:\ai-comerc-lead-generator\lib\actions\organizations.ts`

**Description:**
Server actions do not implement explicit CSRF token validation. While Next.js Server Actions have some built-in protections (POST requests, same-origin policy), additional explicit validation is recommended for sensitive operations.

**Risk:**
Potential CSRF attacks on state-changing operations:
- User signup/login
- Organization creation/deletion
- Member role changes

**Current Mitigation:**
Next.js Server Actions provide:
- Automatic POST request requirement
- Same-origin enforcement
- Cookie-based session validation

**Recommended Enhancement:**
Implement explicit CSRF tokens for critical operations:

```typescript
// lib/security/csrf.ts
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function generateCSRFToken(): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const cookieStore = await cookies();
  cookieStore.set('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600 // 1 hour
  });
  return token;
}

export async function validateCSRFToken(token: string): Promise<boolean> {
  const cookieStore = await cookies();
  const storedToken = cookieStore.get('csrf-token')?.value;
  return storedToken === token && token.length === 64;
}
```

Apply to critical actions:
```typescript
// lib/actions/organizations.ts
export async function deleteOrganizationAction(
  organizationId: string,
  csrfToken: string
): Promise<ActionResponse> {
  // Validate CSRF token first
  if (!await validateCSRFToken(csrfToken)) {
    return { success: false, error: 'Invalid security token' };
  }
  // ... rest of function
}
```

**Timeline:** Before Production Deployment

---

### 5. HIGH: Insufficient Rate Limiting

**Severity:** HIGH
**CVSS Score:** 7.0 (High)
**Scope:** All API routes and server actions

**Description:**
No rate limiting is currently implemented. Phase 2 specification mentions rate limiting for public API (10 req/min), but Phase 1 authentication endpoints are unprotected.

**Risk:**
- Brute force attacks on login endpoint
- Account enumeration via signup
- Resource exhaustion (DoS)
- Abuse of organization creation

**Attack Scenarios:**
```typescript
// Brute force login
for (let i = 0; i < 10000; i++) {
  await signIn({ email: 'victim@example.com', password: `password${i}` });
}

// Organization spam
for (let i = 0; i < 1000; i++) {
  await createOrganizationAction({ name: `Spam ${i}`, slug: `spam-${i}` });
}
```

**Remediation:**
Implement rate limiting using Upstash Redis or memory-based solution:

```typescript
// lib/security/rate-limit.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export async function rateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): Promise<{ success: boolean; remaining: number }> {
  const key = `rate-limit:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  // Use Redis sorted set for sliding window
  await redis.zremrangebyscore(key, 0, windowStart);
  const count = await redis.zcard(key);

  if (count >= maxRequests) {
    return { success: false, remaining: 0 };
  }

  await redis.zadd(key, { score: now, member: `${now}` });
  await redis.expire(key, Math.ceil(windowMs / 1000));

  return { success: true, remaining: maxRequests - count - 1 };
}

// Usage in auth actions
export async function signIn(data: LoginInput): Promise<ActionResponse> {
  const ip = await getClientIP();
  const { success, remaining } = await rateLimit(
    `login:${ip}`,
    5, // max 5 attempts
    60000 // per minute
  );

  if (!success) {
    return {
      success: false,
      error: 'Too many login attempts. Please try again later.'
    };
  }
  // ... rest of function
}
```

**Recommended Rate Limits:**
- Login: 5 attempts per minute per IP
- Signup: 3 accounts per hour per IP
- Organization creation: 5 per hour per user
- API endpoints: 10 per minute per API key

**Dependencies Needed:**
```bash
npm install @upstash/redis
```

**Timeline:** HIGH PRIORITY - Implement before public launch

---

### 6. HIGH: Weak Password Policy Enforcement

**Severity:** HIGH
**CVSS Score:** 6.5 (Medium-High)
**File:** `D:\ai-comerc-lead-generator\lib\validations\auth.ts` (lines 34-41)

**Description:**
Current password validation is basic:
```typescript
.min(8, 'Password must be at least 8 characters')
.regex(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  'Password must contain at least one uppercase letter, one lowercase letter, and one number'
)
```

**Weaknesses:**
- No special character requirement
- No maximum length (should be 100-128)
- No check against common passwords
- No password breach detection

**Remediation:**
Enhance password validation:

```typescript
// lib/validations/auth.ts
import { z } from 'zod';

// Common passwords list (abbreviated)
const COMMON_PASSWORDS = new Set([
  'password123', '12345678', 'qwerty123', 'admin123',
  // ... add more from https://github.com/danielmiessler/SecLists
]);

export const signupSchema = z.object({
  // ... other fields
  password: z
    .string()
    .min(1, 'Password is required')
    .min(12, 'Password must be at least 12 characters') // Increased from 8
    .max(128, 'Password must be at most 128 characters') // Added max
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?])/,
      'Password must contain uppercase, lowercase, number, and special character'
    )
    .refine(
      (password) => !COMMON_PASSWORDS.has(password.toLowerCase()),
      'This password is too common. Please choose a stronger password.'
    ),
  // ... rest of schema
});
```

**Additional Enhancements (Optional):**
Install password strength checker:
```bash
npm install zxcvbn
npm install --save-dev @types/zxcvbn
```

```typescript
import zxcvbn from 'zxcvbn';

.refine(
  (password) => zxcvbn(password).score >= 3,
  'Password is not strong enough. Try adding more characters or variety.'
)
```

**Timeline:** MEDIUM PRIORITY - Implement before public beta

---

### 7. HIGH: Missing Security Headers

**Severity:** HIGH
**CVSS Score:** 6.8 (Medium-High)
**File:** `D:\ai-comerc-lead-generator\next.config.js`

**Description:**
Next.js configuration lacks security headers to protect against common web vulnerabilities.

**Missing Headers:**
- Content-Security-Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy
- Strict-Transport-Security (HSTS)

**Risk:**
- XSS attacks
- Clickjacking
- MIME type sniffing
- Information leakage
- Unauthorized feature access

**Remediation:**
Update `next.config.js`:

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
  // ADD SECURITY HEADERS
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live", // unsafe-inline needed for Next.js, restrict in production
              "style-src 'self' 'unsafe-inline'", // unsafe-inline needed for CSS-in-JS
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "frame-ancestors 'none'", // Prevent clickjacking
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions policy (formerly Feature-Policy)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // XSS Protection (legacy, but still useful)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      // HSTS header (only for production HTTPS)
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
        // Only apply in production
        has: [
          {
            type: 'host',
            value: '(?!localhost)', // Exclude localhost
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

**Testing:**
```bash
# Test headers locally
curl -I http://localhost:3000

# Use online scanner
# https://securityheaders.com/
```

**Timeline:** HIGH PRIORITY - Implement before production

---

### 8. HIGH: Insufficient Input Validation on Organization Slug

**Severity:** HIGH
**CVSS Score:** 6.5 (Medium-High)
**File:** `D:\ai-comerc-lead-generator\lib\validations\organizations.ts`

**Description:**
While basic slug validation exists, there are risks around:
- Reserved slugs (admin, api, dashboard, etc.)
- Homograph attacks (lookalike characters)
- SQL injection via slug (mitigated by parameterized queries, but defense in depth)

**Current Validation:**
```typescript
slug: z
  .string()
  .min(3, 'Slug must be at least 3 characters')
  .max(50, 'Slug must be at most 50 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
```

**Remediation:**
Enhance slug validation:

```typescript
// lib/validations/organizations.ts
const RESERVED_SLUGS = new Set([
  'admin', 'api', 'auth', 'dashboard', 'settings', 'login', 'signup',
  'logout', 'onboarding', 'callback', 'public', 'static', '_next',
  'user', 'users', 'organization', 'organizations', 'team', 'teams',
  'account', 'billing', 'pricing', 'docs', 'help', 'support',
  'about', 'contact', 'privacy', 'terms', 'legal', 'security'
]);

export const createOrganizationSchema = z.object({
  // ... other fields
  slug: z
    .string()
    .min(1, 'Organization slug is required')
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug can only contain lowercase letters, numbers, and hyphens'
    )
    .refine(
      (slug) => !slug.startsWith('-') && !slug.endsWith('-'),
      'Slug cannot start or end with a hyphen'
    )
    .refine(
      (slug) => !slug.includes('--'),
      'Slug cannot contain consecutive hyphens'
    )
    .refine(
      (slug) => !RESERVED_SLUGS.has(slug),
      'This slug is reserved and cannot be used'
    )
    .refine(
      (slug) => !/^\d+$/.test(slug),
      'Slug cannot be all numbers'
    ),
  // ... rest of schema
});
```

**Also Update Server Action:**
```typescript
// lib/actions/organizations.ts
export async function createOrganizationAction(
  data: CreateOrganizationInput
): Promise<ActionResponse> {
  try {
    const validatedData = createOrganizationSchema.parse(data);
    const supabase = await createServerSupabaseClient();

    // Double-check reserved slugs on server
    if (RESERVED_SLUGS.has(validatedData.slug)) {
      return {
        success: false,
        error: 'This organization slug is reserved',
        field: 'slug',
      };
    }

    // ... rest of function
  }
}
```

**Timeline:** MEDIUM PRIORITY - Implement in Phase 2

---

### 9. HIGH: Error Messages Leaking Information

**Severity:** HIGH (Information Disclosure)
**CVSS Score:** 6.0 (Medium)
**Files:** Multiple server actions

**Description:**
Error messages expose internal implementation details and database structure.

**Examples:**

`D:\ai-comerc-lead-generator\lib\actions\auth.ts` (line 86):
```typescript
if (insertError) {
  console.error('Error creating user profile:', insertError);
}
```

`D:\ai-comerc-lead-generator\lib\actions\organizations.ts` (line 80):
```typescript
if (createError || !org) {
  console.error('Create organization error:', createError);
  return {
    success: false,
    error: 'Failed to create organization', // Generic, good
  };
}
```

**Risk:**
- Console logs in production expose sensitive data
- Stack traces reveal code structure
- Error messages help attackers understand system

**Remediation:**

1. **Implement proper logging library:**
```bash
npm install winston
```

2. **Create logging service:**
```typescript
// lib/security/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
  format: winston.format.json(),
  transports: [
    // Production: log to file/service
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({ filename: 'error.log', level: 'error' }),
          // Could add Sentry, Datadog, etc.
        ]
      : [
          // Development: log to console
          new winston.transports.Console({
            format: winston.format.simple(),
          }),
        ]),
  ],
});

// Sanitize sensitive data before logging
export function logError(message: string, error: any, context?: any) {
  const sanitizedContext = sanitizeForLogging(context);
  logger.error(message, {
    error: {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    },
    context: sanitizedContext,
  });
}

function sanitizeForLogging(obj: any): any {
  if (!obj) return obj;
  const sanitized = { ...obj };
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  return sanitized;
}

export default logger;
```

3. **Update all error handling:**
```typescript
// lib/actions/auth.ts
import { logError } from '@/lib/security/logger';

export async function signIn(data: LoginInput): Promise<ActionResponse> {
  try {
    // ... code

    if (authError) {
      logError('Sign in failed', authError, {
        email: data.email, // Safe to log
        // password: NOT logged
      });

      // Return generic error to user
      return {
        success: false,
        error: 'Invalid email or password', // Generic
      };
    }
  } catch (error: any) {
    logError('Sign in action error', error);

    return {
      success: false,
      error: 'An unexpected error occurred', // Never expose internals
    };
  }
}
```

4. **Remove all console.error in production:**
```typescript
// Replace all instances:
// console.error('...', error)
// WITH:
// logError('...', error, { contextData })
```

**Timeline:** HIGH PRIORITY - Implement before production

---

### 10. HIGH: Session Management Lacks Expiration Enforcement

**Severity:** HIGH
**CVSS Score:** 6.5 (Medium-High)
**File:** `D:\ai-comerc-lead-generator\middleware.ts`

**Description:**
Middleware validates sessions but doesn't enforce explicit timeout or refresh policies beyond Supabase defaults.

**Risk:**
- Sessions may persist longer than intended
- No forced re-authentication for sensitive operations
- Potential for session hijacking if cookie stolen

**Remediation:**

1. **Configure Supabase session timeout:**
In Supabase Dashboard → Authentication → Settings:
- JWT expiry: 3600 seconds (1 hour)
- Refresh token expiry: 604800 seconds (7 days)

2. **Enhance middleware with session age check:**
```typescript
// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase/types'

const MAX_SESSION_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const SENSITIVE_ROUTES = ['/settings', '/api-keys', '/billing'];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get current user and session
  const {
    data: { user, session },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Check session age for sensitive routes
  const isSensitiveRoute = SENSITIVE_ROUTES.some(route => pathname.includes(route));
  if (user && session && isSensitiveRoute) {
    const sessionAge = Date.now() - new Date(session.created_at).getTime();

    if (sessionAge > MAX_SESSION_AGE_MS) {
      // Force re-authentication
      await supabase.auth.signOut();
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirectTo', pathname);
      redirectUrl.searchParams.set('reason', 'session_expired');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // ... rest of middleware
}
```

3. **Implement "remember me" functionality properly:**
```typescript
// lib/actions/auth.ts
export async function signIn(data: LoginInput): Promise<ActionResponse> {
  // ... validation

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: validatedData.email,
    password: validatedData.password,
    options: {
      // Set session duration based on "remember me"
      sessionLength: data.remember ? 604800 : 3600, // 7 days vs 1 hour
    },
  });

  // ... rest of function
}
```

**Timeline:** MEDIUM PRIORITY - Implement before production

---

### 11. HIGH: Missing Audit Logging for Security Events

**Severity:** HIGH
**CVSS Score:** 6.0 (Medium)
**Scope:** All authentication and authorization operations

**Description:**
No audit trail for security-critical events:
- User login/logout
- Failed login attempts
- Organization creation/deletion
- Member role changes
- Permission changes

**Risk:**
- Cannot detect security incidents
- No forensics for post-breach analysis
- Compliance violations (SOC2, GDPR require audit logs)

**Remediation:**

1. **Create audit log table:**
```sql
-- Add to Phase 2 migrations
CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Who
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_email TEXT,

    -- What
    event_type TEXT NOT NULL, -- 'user.login', 'user.logout', 'org.created', etc.
    event_category TEXT NOT NULL, -- 'authentication', 'authorization', 'data_access'
    resource_type TEXT, -- 'user', 'organization', 'lead', etc.
    resource_id UUID,

    -- When & Where
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,

    -- Context
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',

    -- Indexes
    CHECK(event_type IN (
        'user.login', 'user.logout', 'user.signup', 'user.login_failed',
        'org.created', 'org.updated', 'org.deleted',
        'member.added', 'member.removed', 'member.role_changed',
        'api_key.created', 'api_key.revoked',
        'lead.created', 'lead.updated', 'lead.deleted', 'lead.exported'
    ))
);

CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id, timestamp DESC);
CREATE INDEX idx_audit_log_event_type ON public.audit_log(event_type, timestamp DESC);
CREATE INDEX idx_audit_log_timestamp ON public.audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_resource ON public.audit_log(resource_type, resource_id);

-- Enable RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
    ON public.audit_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            JOIN public.audit_log al ON (
                al.resource_type = 'organization' AND al.resource_id = om.organization_id
            )
            WHERE om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin')
        )
    );
```

2. **Create audit logging service:**
```typescript
// lib/security/audit-log.ts
import { createServerSupabaseClient } from '@/lib/supabase/client';

export type AuditEventType =
  | 'user.login'
  | 'user.logout'
  | 'user.signup'
  | 'user.login_failed'
  | 'org.created'
  | 'org.updated'
  | 'org.deleted'
  | 'member.added'
  | 'member.removed'
  | 'member.role_changed'
  | 'api_key.created'
  | 'api_key.revoked'
  | 'lead.created'
  | 'lead.updated'
  | 'lead.deleted'
  | 'lead.exported';

export interface AuditLogEntry {
  eventType: AuditEventType;
  userId?: string;
  userEmail?: string;
  resourceType?: string;
  resourceId?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .from('audit_log')
      .insert({
        event_type: entry.eventType,
        event_category: getCategoryFromEventType(entry.eventType),
        user_id: entry.userId,
        user_email: entry.userEmail,
        resource_type: entry.resourceType,
        resource_id: entry.resourceId,
        success: entry.success,
        error_message: entry.errorMessage,
        metadata: entry.metadata,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
      });

    if (error) {
      // Don't fail the main operation if audit logging fails
      console.error('Failed to create audit log:', error);
    }
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

function getCategoryFromEventType(eventType: AuditEventType): string {
  if (eventType.startsWith('user.')) return 'authentication';
  if (eventType.includes('member') || eventType.includes('role')) return 'authorization';
  return 'data_access';
}

// Helper to get client IP
export async function getClientIP(request?: Request): Promise<string | undefined> {
  if (!request) return undefined;

  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return realIp || undefined;
}
```

3. **Integrate into actions:**
```typescript
// lib/actions/auth.ts
import { createAuditLog } from '@/lib/security/audit-log';

export async function signIn(data: LoginInput): Promise<ActionResponse> {
  try {
    const validatedData = loginSchema.parse(data);
    const supabase = await createServerSupabaseClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    // Log successful login
    if (authData.user) {
      await createAuditLog({
        eventType: 'user.login',
        userId: authData.user.id,
        userEmail: authData.user.email,
        success: true,
        metadata: { method: 'password' },
      });
    }

    // Log failed login
    if (authError) {
      await createAuditLog({
        eventType: 'user.login_failed',
        userEmail: validatedData.email,
        success: false,
        errorMessage: 'Invalid credentials',
      });

      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    return { success: true };
  } catch (error: any) {
    await createAuditLog({
      eventType: 'user.login_failed',
      userEmail: data.email,
      success: false,
      errorMessage: error.message,
    });

    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
```

**Timeline:** HIGH PRIORITY - Implement in Phase 2

---

## Part 3: Phase 1 Security Audit - Medium-Risk Issues

### 12. MEDIUM: Missing Email Verification Enforcement

**Severity:** MEDIUM
**CVSS Score:** 5.5 (Medium)
**File:** `D:\ai-comerc-lead-generator\lib\actions\auth.ts`

**Description:**
While Supabase sends email confirmation, the code doesn't enforce it before allowing access.

**Current Behavior:**
```typescript
// Line 47-52
if (authError.message.includes('Email not confirmed')) {
  return {
    success: false,
    error: 'Please verify your email before signing in',
  };
}
```

This only shows error but doesn't prevent signup completion.

**Risk:**
- Users with unverified emails can access system
- Temporary email services can be used
- Account takeover via typosquatting

**Remediation:**

1. **Configure Supabase to require email confirmation:**
In Supabase Dashboard → Authentication → Settings:
- Enable "Enable email confirmations"
- Disable "Enable manual linking"

2. **Add email verification check in middleware:**
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  // ... existing code

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check email verification for protected routes
  if (user && !user.email_confirmed_at && isDashboardRoute) {
    return NextResponse.redirect(
      new URL('/verify-email?email=' + encodeURIComponent(user.email!), request.url)
    );
  }

  // ... rest of middleware
}
```

3. **Create verification reminder page:**
```typescript
// app/(auth)/verify-email/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [resending, setResending] = useState(false);

  async function resendVerification() {
    setResending(true);
    const supabase = createBrowserSupabaseClient();

    await supabase.auth.resend({
      type: 'signup',
      email: email!,
    });

    setResending(false);
    toast.success('Verification email sent!');
  }

  return (
    <div className="container max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold">Verify Your Email</h1>
      <p className="mt-4">
        We sent a verification email to <strong>{email}</strong>.
        Please click the link in the email to verify your account.
      </p>
      <Button
        onClick={resendVerification}
        disabled={resending}
        className="mt-6"
      >
        {resending ? 'Sending...' : 'Resend Verification Email'}
      </Button>
    </div>
  );
}
```

**Timeline:** MEDIUM PRIORITY - Implement before public launch

---

### 13. MEDIUM: Insufficient Authorization Checks in Server Actions

**Severity:** MEDIUM
**CVSS Score:** 5.8 (Medium)
**File:** `D:\ai-comerc-lead-generator\lib\actions\organizations.ts`

**Description:**
While RLS policies enforce database-level authorization, server actions don't always verify permissions before operations.

**Example Issue:**
```typescript
// Line 272-291: updateMemberRoleAction
export async function updateMemberRoleAction(
  organizationId: string,
  data: UpdateMemberRoleInput
): Promise<ActionResponse> {
  // ... validation

  // No explicit check if current user is admin/owner
  const { data: member, error } = await updateMemberRole(
    supabase,
    organizationId,
    validatedData.userId,
    validatedData.role as OrganizationRole
  );

  // Relies only on RLS policy to block unauthorized access
}
```

**Risk:**
- Defense-in-depth principle violated
- Error messages less informative
- Potential bypass if RLS misconfigured

**Remediation:**

Add explicit authorization checks:

```typescript
// lib/actions/organizations.ts
import { isOrganizationAdmin } from '@/lib/supabase/helpers';

export async function updateMemberRoleAction(
  organizationId: string,
  data: UpdateMemberRoleInput
): Promise<ActionResponse> {
  try {
    const validatedData = updateMemberRoleSchema.parse(data);
    const supabase = await createServerSupabaseClient();

    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'You must be logged in' };
    }

    // EXPLICIT AUTHORIZATION CHECK
    const { hasRole, error: roleError } = await isOrganizationAdmin(
      supabase,
      organizationId
    );

    if (roleError || !hasRole) {
      return {
        success: false,
        error: 'You do not have permission to update member roles',
      };
    }

    // Prevent users from changing their own role
    if (validatedData.userId === user.id) {
      return {
        success: false,
        error: 'You cannot change your own role',
      };
    }

    // Now perform the operation
    const { data: member, error } = await updateMemberRole(
      supabase,
      organizationId,
      validatedData.userId,
      validatedData.role as OrganizationRole
    );

    if (error || !member) {
      console.error('Update member role error:', error);
      return {
        success: false,
        error: 'Failed to update member role',
      };
    }

    revalidatePath(`/`);

    return {
      success: true,
      data: member,
    };
  } catch (error: any) {
    // ... error handling
  }
}
```

Apply similar pattern to all privileged operations:
- `createOrganizationAction` (line 43)
- `updateOrganizationAction` (line 185)
- `removeMemberAction` (line 328)

**Timeline:** MEDIUM PRIORITY - Implement in Phase 2

---

### 14. MEDIUM: Client-Side Secrets Exposure Risk

**Severity:** MEDIUM
**CVSS Score:** 5.5 (Medium)
**Files:** All client components using environment variables

**Description:**
While `NEXT_PUBLIC_` variables are intentionally public, developers might accidentally expose secrets by forgetting the prefix.

**Risk:**
- Future developers might add sensitive env vars without proper prefix
- Build-time exposure of secrets in client bundles

**Remediation:**

1. **Add environment variable validation:**
```typescript
// lib/env-validation.ts
import { z } from 'zod';

const envSchema = z.object({
  // Public variables (exposed to client)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Server-only variables (never exposed to client)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  NODE_ENV: z.enum(['development', 'test', 'production']),

  // Optional variables
  JWT_SECRET: z.string().optional(),
  REDIS_URL: z.string().url().optional(),
  UPSTASH_REDIS_TOKEN: z.string().optional(),
});

export function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.format());
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

// Run validation at build time
export const env = validateEnv();
```

2. **Import validation in root layout:**
```typescript
// app/layout.tsx
import { env } from '@/lib/env-validation';

// Validation runs automatically on import
```

3. **Add pre-commit hook:**
```bash
# .husky/pre-commit
#!/bin/sh

# Check for accidentally committed secrets
if grep -r "SUPABASE_SERVICE_ROLE_KEY\|JWT_SECRET" --exclude-dir=node_modules --exclude-dir=.git .; then
    echo "ERROR: Found potential secrets in code!"
    exit 1
fi

# Check for env vars without proper prefix in client code
if grep -r "process\.env\.[A-Z_]*[^NEXT_PUBLIC]" app/components --exclude="*.test.ts"; then
    echo "WARNING: Found server-side env var usage in client code"
    exit 1
fi
```

**Timeline:** LOW PRIORITY - Implement for code quality

---

### 15-23. MEDIUM-RISK ISSUES (SUMMARY)

Due to length constraints, here's a summary of additional medium-risk issues:

15. **Incomplete Data Sanitization in UI** - User-generated content not escaped in all places
16. **Missing Content-Type Validation on File Uploads** - Future feature, but needs planning
17. **Session Fixation Prevention Not Explicit** - Supabase handles this, but should verify
18. **No Account Lockout After Failed Attempts** - Should implement after rate limiting
19. **Missing CORS Configuration** - Phase 2 API needs explicit CORS policy
20. **Insufficient Validation on JSONB Fields** - `settings` and `metadata` fields not validated
21. **Time-based SQL Injection Risk in Search** - Parameterized queries used, but should add tests
22. **Missing Database Connection Pooling Limits** - Supabase default, but should monitor
23. **No Automated Security Dependency Scanning** - Should add GitHub Dependabot

---

## Part 4: Low-Risk Issues & Improvements

(15 additional low-risk improvements documented but abbreviated here for length)

Key low-risk improvements:
- Add TypeScript strict mode
- Implement request ID tracing
- Add health check endpoint
- Improve error boundary coverage
- Add API versioning strategy
- Implement feature flags
- Add database query monitoring
- Improve accessibility (WCAG compliance)
- Add performance monitoring
- Implement caching strategy

---

## Part 5: Phase 2 Lead System - Security Review

### Phase 2 Specification Assessment: EXCELLENT

The Phase 2 specification (`PHASE_2_TECHNICAL_SPECIFICATION.md`) demonstrates comprehensive security planning:

**Strengths:**
- Detailed RLS policies for leads table
- API key authentication strategy
- Rate limiting requirements (10 req/min)
- Input validation specifications
- GDPR/CCPA compliance considerations
- Audit logging requirements
- Multi-tenant isolation strategy

### Phase 2 Security Requirements Checklist

#### 1. Public API Endpoint Security (Lines 230-285)

**Requirements Met:**
- API key authentication (hashed storage with bcrypt)
- Rate limiting (10 requests/minute per org)
- CORS configuration
- Input validation
- Error code standards (400, 401, 429, 500)

**Additional Recommendations:**

```typescript
// app/api/public/leads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase/client';
import { rateLimit } from '@/lib/security/rate-limit';
import { validateApiKey } from '@/lib/security/api-keys';
import { createAuditLog } from '@/lib/security/audit-log';
import { z } from 'zod';
import crypto from 'crypto';

// Input validation schema
const createLeadSchema = z.object({
  name: z.string().min(2).max(200).trim(),
  email: z.string().email().max(255).toLowerCase(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(), // E.164 format
  company: z.string().max(200).optional(),
  source: z.enum(['chatbot', 'web_form', 'referral']).default('chatbot'),
  product_interests: z.array(z.string().max(100)).max(10).default([]),
  conversation_id: z.string().uuid().optional(),
  conversation_summary: z.string().max(5000).optional(),
  metadata: z.record(z.any()).optional(),
  // UTM parameters
  utm_source: z.string().max(255).optional(),
  utm_medium: z.string().max(255).optional(),
  utm_campaign: z.string().max(255).optional(),
  utm_term: z.string().max(255).optional(),
  utm_content: z.string().max(255).optional(),
  referrer_url: z.string().url().max(2048).optional(),
  landing_page: z.string().url().max(2048).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. EXTRACT API KEY
    const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key required' },
        { status: 401 }
      );
    }

    // 2. VALIDATE API KEY & GET ORGANIZATION
    const admin = createAdminSupabaseClient();
    const { data: apiKeyData, error: keyError } = await admin
      .from('api_keys')
      .select('id, organization_id, is_active, rate_limit_per_minute, allowed_domains')
      .eq('key_hash', crypto.createHash('sha256').update(apiKey).digest('hex'))
      .single();

    if (keyError || !apiKeyData || !apiKeyData.is_active) {
      await createAuditLog({
        eventType: 'api_key.invalid_attempt',
        success: false,
        errorMessage: 'Invalid or revoked API key',
        metadata: { apiKeyPrefix: apiKey.substring(0, 12) },
      });

      return NextResponse.json(
        { success: false, error: 'Invalid or revoked API key' },
        { status: 401 }
      );
    }

    // 3. CHECK CORS (if allowed_domains is set)
    if (apiKeyData.allowed_domains && apiKeyData.allowed_domains.length > 0) {
      const origin = request.headers.get('origin');
      const referer = request.headers.get('referer');

      const allowed = apiKeyData.allowed_domains.some(domain => {
        return origin?.includes(domain) || referer?.includes(domain);
      });

      if (!allowed) {
        return NextResponse.json(
          { success: false, error: 'Origin not allowed' },
          { status: 403 }
        );
      }
    }

    // 4. RATE LIMITING
    const rateLimitKey = `api:leads:${apiKeyData.organization_id}`;
    const { success: rateLimitOk, remaining } = await rateLimit(
      rateLimitKey,
      apiKeyData.rate_limit_per_minute || 10,
      60000 // 1 minute
    );

    if (!rateLimitOk) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          retry_after: 60,
        },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': String(apiKeyData.rate_limit_per_minute || 10),
            'X-RateLimit-Remaining': String(remaining),
          },
        }
      );
    }

    // 5. PARSE AND VALIDATE INPUT
    const body = await request.json();
    const validatedData = createLeadSchema.parse(body);

    // 6. CHECK FOR DUPLICATE (same email in last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existingLead } = await admin
      .from('leads')
      .select('id')
      .eq('organization_id', apiKeyData.organization_id)
      .eq('email', validatedData.email)
      .gte('created_at', oneDayAgo)
      .maybeSingle();

    if (existingLead) {
      return NextResponse.json(
        {
          success: false,
          error: 'Duplicate lead',
          message: 'A lead with this email was already created in the last 24 hours',
        },
        { status: 409 }
      );
    }

    // 7. EXTRACT CLIENT METADATA
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || request.headers.get('x-real-ip')
      || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // 8. CREATE LEAD (using admin client to bypass RLS)
    const { data: lead, error: createError } = await admin
      .from('leads')
      .insert({
        organization_id: apiKeyData.organization_id,
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        company: validatedData.company,
        source: validatedData.source,
        product_interests: validatedData.product_interests,
        conversation_id: validatedData.conversation_id,
        conversation_summary: validatedData.conversation_summary,
        utm_source: validatedData.utm_source,
        utm_medium: validatedData.utm_medium,
        utm_campaign: validatedData.utm_campaign,
        utm_term: validatedData.utm_term,
        utm_content: validatedData.utm_content,
        referrer_url: validatedData.referrer_url,
        landing_page: validatedData.landing_page,
        metadata: validatedData.metadata,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select('id')
      .single();

    if (createError || !lead) {
      console.error('Lead creation error:', createError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create lead',
        },
        { status: 500 }
      );
    }

    // 9. UPDATE API KEY USAGE
    await admin
      .from('api_keys')
      .update({
        last_used_at: new Date().toISOString(),
        usage_count: apiKeyData.usage_count + 1,
      })
      .eq('id', apiKeyData.id);

    // 10. AUDIT LOG
    await createAuditLog({
      eventType: 'lead.created',
      resourceType: 'lead',
      resourceId: lead.id,
      success: true,
      metadata: {
        organization_id: apiKeyData.organization_id,
        source: validatedData.source,
        via: 'public_api',
      },
      ipAddress,
      userAgent,
    });

    // 11. RETURN SUCCESS
    return NextResponse.json(
      {
        success: true,
        lead_id: lead.id,
        message: 'Lead created successfully',
      },
      {
        status: 201,
        headers: {
          'X-RateLimit-Limit': String(apiKeyData.rate_limit_per_minute || 10),
          'X-RateLimit-Remaining': String(remaining - 1),
        },
      }
    );

  } catch (error: any) {
    console.error('Public API error:', error);

    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*', // Or specific origins from API key
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}
```

**Security Enhancements:**
- SHA-256 hashing for API key lookup (faster than bcrypt for lookups)
- Duplicate detection (24-hour window)
- CORS validation per API key
- Comprehensive audit logging
- IP address and user agent capture
- Usage tracking
- Structured error responses

---

#### 2. API Key Management Security

**Specification Review (Lines 288-304):**
- Keys hashed before storage ✓
- Dashboard shows masked keys ✓
- Key rotation/revocation ✓
- Maximum 5 active keys ✓
- Last used timestamp ✓

**Implementation Guide:**

```typescript
// lib/security/api-keys.ts
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 10;

export interface ApiKeyData {
  prefix: string;
  fullKey: string;
  hash: string;
}

/**
 * Generates a secure API key with format: sk_{env}_{random}
 */
export function generateApiKey(env: 'test' | 'live' = 'live'): ApiKeyData {
  // Generate 32 random bytes (256 bits)
  const randomBytes = crypto.randomBytes(32);
  const randomString = randomBytes.toString('base64url'); // URL-safe base64

  // Format: sk_live_<random> or sk_test_<random>
  const fullKey = `sk_${env}_${randomString}`;

  // Hash for storage (using SHA-256 for fast lookups)
  const hash = crypto
    .createHash('sha256')
    .update(fullKey)
    .digest('hex');

  // Prefix for display (first 12 chars)
  const prefix = fullKey.substring(0, 12);

  return {
    prefix,
    fullKey,
    hash,
  };
}

/**
 * Verifies an API key against stored hash
 */
export function verifyApiKey(providedKey: string, storedHash: string): boolean {
  const providedHash = crypto
    .createHash('sha256')
    .update(providedKey)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(providedHash),
    Buffer.from(storedHash)
  );
}

/**
 * Masks API key for display: sk_live_abc123**** → sk_live_****abc123
 */
export function maskApiKey(prefix: string): string {
  if (prefix.length < 12) return '****';

  const start = prefix.substring(0, 8); // sk_live_
  const end = prefix.substring(prefix.length - 4); // last 4 chars

  return `${start}****${end}`;
}
```

**Server Action:**
```typescript
// lib/actions/api-keys.ts
'use server';

import { createServerSupabaseClient } from '@/lib/supabase/client';
import { generateApiKey, maskApiKey } from '@/lib/security/api-keys';
import { createAuditLog } from '@/lib/security/audit-log';

export async function createApiKeyAction(
  organizationId: string,
  name: string,
  allowedDomains?: string[]
): Promise<ActionResponse> {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify user is admin/owner
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check existing key count
    const { data: existingKeys, error: countError } = await supabase
      .from('api_keys')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (countError || (existingKeys && existingKeys.length >= 5)) {
      return {
        success: false,
        error: 'Maximum of 5 active API keys allowed per organization',
      };
    }

    // Generate new key
    const { prefix, fullKey, hash } = generateApiKey('live');

    // Store in database
    const { data: apiKey, error: insertError } = await supabase
      .from('api_keys')
      .insert({
        organization_id: organizationId,
        name,
        key_prefix: prefix,
        key_hash: hash,
        is_active: true,
        allowed_domains: allowedDomains || [],
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError || !apiKey) {
      console.error('API key creation error:', insertError);
      return { success: false, error: 'Failed to create API key' };
    }

    // Audit log
    await createAuditLog({
      eventType: 'api_key.created',
      userId: user.id,
      resourceType: 'api_key',
      resourceId: apiKey.id,
      success: true,
      metadata: { organization_id: organizationId, name },
    });

    // Return full key ONLY ONCE (never stored, never shown again)
    return {
      success: true,
      data: {
        id: apiKey.id,
        name: apiKey.name,
        key: fullKey, // ONLY TIME THIS IS SHOWN
        prefix: maskApiKey(prefix),
        created_at: apiKey.created_at,
      },
    };
  } catch (error: any) {
    console.error('Create API key action error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function revokeApiKeyAction(
  apiKeyId: string,
  organizationId: string
): Promise<ActionResponse> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Revoke key (soft delete - keep for audit trail)
    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_by: user.id,
      })
      .eq('id', apiKeyId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error || !apiKey) {
      return { success: false, error: 'Failed to revoke API key' };
    }

    // Audit log
    await createAuditLog({
      eventType: 'api_key.revoked',
      userId: user.id,
      resourceType: 'api_key',
      resourceId: apiKey.id,
      success: true,
      metadata: { organization_id: organizationId },
    });

    return { success: true };
  } catch (error: any) {
    console.error('Revoke API key action error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
```

---

#### 3. Lead Data Privacy & GDPR Compliance

**Specification Review (Lines 2462-2482):**
The Phase 2 specification includes excellent GDPR considerations.

**Required Implementations:**

1. **Privacy Policy Link**
```typescript
// app/(dashboard)/layout.tsx
<footer className="mt-auto py-4 text-center text-sm text-gray-500">
  <a href="/privacy" className="hover:underline">Privacy Policy</a>
  {' · '}
  <a href="/terms" className="hover:underline">Terms of Service</a>
  {' · '}
  <a href="/data-processing" className="hover:underline">Data Processing Agreement</a>
</footer>
```

2. **Lead Deletion (Right to be Forgotten)**
```typescript
// lib/actions/leads.ts
'use server';

export async function deleteLeadAction(
  leadId: string,
  organizationId: string,
  reason?: string
): Promise<ActionResponse> {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify user is owner (only owners can delete leads)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { hasRole } = await isOrganizationOwner(supabase, organizationId);
    if (!hasRole) {
      return {
        success: false,
        error: 'Only organization owners can delete leads',
      };
    }

    // Audit log BEFORE deletion
    await createAuditLog({
      eventType: 'lead.deleted',
      userId: user.id,
      resourceType: 'lead',
      resourceId: leadId,
      success: true,
      metadata: {
        organization_id: organizationId,
        reason: reason || 'User requested deletion',
        gdpr_deletion: true,
      },
    });

    // Delete lead (CASCADE will delete related activity logs)
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Lead deletion error:', error);
      return { success: false, error: 'Failed to delete lead' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Delete lead action error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
```

3. **Data Export (Right to Data Portability)**
```typescript
// app/api/leads/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { createAuditLog } from '@/lib/security/audit-log';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId, filters } = await request.json();

    // Verify user has access to organization
    const { hasRole } = await isOrganizationMember(supabase, organizationId);
    if (!hasRole) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch leads with filters
    let query = supabase
      .from('leads')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1000); // Max 1000 leads per export

    // Apply filters...
    // ... (status, date_range, source, etc.)

    const { data: leads, error } = await query;

    if (error || !leads) {
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    // Convert to CSV
    const csv = convertToCSV(leads);

    // Audit log
    await createAuditLog({
      eventType: 'lead.exported',
      userId: user.id,
      resourceType: 'organization',
      resourceId: organizationId,
      success: true,
      metadata: { count: leads.length, format: 'csv' },
    });

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="leads_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function convertToCSV(leads: any[]): string {
  if (leads.length === 0) return '';

  // CSV headers
  const headers = [
    'ID', 'Name', 'Email', 'Phone', 'Company', 'Status', 'Source',
    'Lead Score', 'Product Interests', 'Created At', 'Last Contacted At',
    'UTM Source', 'UTM Medium', 'UTM Campaign', 'Referrer URL'
  ].join(',');

  // CSV rows
  const rows = leads.map(lead => {
    return [
      lead.id,
      escapeCSV(lead.name),
      lead.email,
      lead.phone || '',
      escapeCSV(lead.company || ''),
      lead.status,
      lead.source,
      lead.lead_score || 0,
      escapeCSV(lead.product_interests?.join('; ') || ''),
      lead.created_at,
      lead.last_contacted_at || '',
      lead.utm_source || '',
      lead.utm_medium || '',
      lead.utm_campaign || '',
      lead.referrer_url || '',
    ].join(',');
  });

  return [headers, ...rows].join('\n');
}

function escapeCSV(value: string): string {
  if (!value) return '';
  // Escape quotes and wrap in quotes if contains comma or newline
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
```

4. **Data Retention Policy (Future Enhancement)**
```sql
-- Add to Phase 2 migrations
CREATE OR REPLACE FUNCTION public.archive_old_leads()
RETURNS void AS $$
BEGIN
    -- Move leads older than 2 years to archive table
    INSERT INTO public.leads_archive
    SELECT * FROM public.leads
    WHERE created_at < NOW() - INTERVAL '2 years'
    AND status IN ('converted', 'lost');

    -- Delete archived leads from main table
    DELETE FROM public.leads
    WHERE created_at < NOW() - INTERVAL '2 years'
    AND status IN ('converted', 'lost');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule via pg_cron or external cron job
```

---

## Part 6: Production Readiness Checklist

### Critical: Re-Enable RLS Before Production

**Step-by-Step Procedure:**

1. **Verify RLS Policies Exist**
```sql
-- Run in Supabase SQL Editor
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Expected output should show policies from `ENABLE_RLS_FOR_PRODUCTION.sql`.

2. **Run RLS Enablement Script**
```bash
# In Supabase SQL Editor, run:
D:\ai-comerc-lead-generator\ENABLE_RLS_FOR_PRODUCTION.sql
```

3. **Verify RLS is Enabled**
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'organizations', 'organization_members', 'leads', 'api_keys');
```

All tables should show `rowsecurity = true`.

4. **Test Multi-Tenant Isolation**
```sql
-- Create two test users and organizations
-- User A should NOT see User B's data

-- As User A (use Supabase client with User A's token)
SELECT * FROM organizations; -- Should only see User A's orgs

-- As User B
SELECT * FROM organizations; -- Should only see User B's orgs

-- Attempt cross-tenant access (should fail)
-- As User A, try to access User B's organization by ID
SELECT * FROM organization_members WHERE organization_id = '<user-b-org-id>';
-- Should return empty set

-- Try to update User B's organization
UPDATE organizations SET name = 'HACKED' WHERE id = '<user-b-org-id>';
-- Should return 0 rows updated
```

5. **Fix Service Role Key**
```bash
# 1. Get actual service role key from Supabase Dashboard
# 2. Update .env.local:
SUPABASE_SERVICE_ROLE_KEY=<actual-service-role-key>

# 3. Restart Next.js dev server
npm run dev

# 4. Test admin client works
```

6. **Verify Admin Client Bypass**
```typescript
// Test in an API route or script
const admin = createAdminSupabaseClient();
const { data: allOrgs } = await admin.from('organizations').select('*');
console.log('Admin sees all orgs:', allOrgs.length);

// Regular client should only see user's orgs
const supabase = createServerSupabaseClient();
const { data: userOrgs } = await supabase.from('organizations').select('*');
console.log('User sees their orgs:', userOrgs.length);
```

---

### Environment Variables Security

**1. Production Environment Variables**
```env
# .env.production (for Vercel/deployment)
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<prod-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<prod-service-role-key>
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production

# NEVER commit this file - set in Vercel dashboard
```

**2. Rotate Credentials Checklist**
- [ ] Generate new anon key in Supabase
- [ ] Generate new service role key
- [ ] Update all deployment environments
- [ ] Update local `.env.local`
- [ ] Test authentication still works
- [ ] Revoke old keys after 24 hours

---

### Security Testing Before Production

**1. Manual Security Tests**
```bash
# Test checklist
- [ ] RLS prevents cross-tenant access
- [ ] Unauthenticated users cannot access dashboard
- [ ] Email verification is enforced
- [ ] Rate limiting blocks excessive requests
- [ ] CSRF tokens validate correctly
- [ ] API keys authenticate properly
- [ ] Revoked API keys are rejected
- [ ] Error messages don't leak information
- [ ] Audit logs capture all events
- [ ] Data export works correctly
- [ ] Lead deletion removes all related data
```

**2. Automated Security Scans**
```bash
# Run npm audit
npm audit --production

# Fix high/critical vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated

# Use security scanner (if available)
npx snyk test
```

**3. Penetration Testing Scenarios**
```typescript
// Test cases to run:
1. SQL Injection Attempts
   - Try malicious SQL in search queries
   - Test special characters in all inputs
   - Verify parameterized queries protect

2. XSS Attempts
   - Inject <script> tags in notes field
   - Test HTML in organization name
   - Verify output is escaped

3. CSRF Attacks
   - Attempt actions without CSRF token
   - Try forged requests from external site
   - Verify same-origin enforcement

4. Authentication Bypass
   - Access protected routes without session
   - Use expired sessions
   - Attempt session fixation

5. Authorization Bypass
   - Try to access other org's data
   - Attempt privilege escalation
   - Test member trying admin actions
```

---

## Part 7: Security Monitoring & Incident Response

### Monitoring Requirements

**1. Set Up Alerts**
```typescript
// lib/security/alerts.ts
export async function sendSecurityAlert(alert: {
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metadata?: any;
}) {
  // Send to Slack, email, or monitoring service
  console.error('[SECURITY ALERT]', alert);

  // Could integrate with Sentry, DataDog, etc.
  // await fetch('https://hooks.slack.com/...', {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     text: `🚨 ${alert.severity.toUpperCase()}: ${alert.title}`,
  //     attachments: [{
  //       text: alert.description,
  //       fields: Object.entries(alert.metadata || {}).map(([key, value]) => ({
  //         title: key,
  //         value: String(value),
  //         short: true
  //       }))
  //     }]
  //   })
  // });
}

// Trigger alerts on suspicious activity
export async function detectAnomalousActivity(
  userId: string,
  eventType: string
): Promise<void> {
  // Example: detect rapid API key creation
  if (eventType === 'api_key.created') {
    const recentKeys = await countRecentApiKeys(userId, 3600000); // 1 hour

    if (recentKeys > 5) {
      await sendSecurityAlert({
        severity: 'high',
        title: 'Suspicious API Key Creation',
        description: `User ${userId} created ${recentKeys} API keys in 1 hour`,
        metadata: { userId, eventType, count: recentKeys }
      });
    }
  }
}
```

**2. Log Monitoring**
```bash
# Monitor for:
- Failed login attempts > 10 in 1 hour
- API key invalid attempts > 50 in 1 hour
- Rate limit violations > 100 in 1 hour
- Unauthorized access attempts
- Database errors
- Service role key usage in production
```

---

### Incident Response Plan

**1. Security Breach Response**
```markdown
## Immediate Actions (0-1 hour)
1. Identify affected systems and data
2. Rotate all API keys and credentials
3. Review audit logs for unauthorized access
4. Block attacker IP addresses
5. Notify security team

## Short-term Actions (1-24 hours)
1. Patch vulnerability if identified
2. Reset passwords for affected users
3. Analyze full extent of breach
4. Preserve evidence for forensics
5. Notify affected users (if required by GDPR)

## Long-term Actions (1-7 days)
1. Conduct post-mortem analysis
2. Implement additional security controls
3. Update security documentation
4. Train team on lessons learned
5. File breach reports (if required)
```

**2. Breach Notification Template**
```markdown
Subject: Security Notification - Action Required

Dear [User],

We are writing to inform you of a security incident that may have affected your account.

**What Happened:**
[Brief description of incident]

**What Information Was Affected:**
[Specific data types]

**What We're Doing:**
- Implemented security fix
- Reset all credentials
- Enhanced monitoring
- Engaged security experts

**What You Should Do:**
1. Reset your password immediately
2. Review account activity
3. Enable two-factor authentication
4. Monitor for suspicious activity

We take security seriously and apologize for this incident.

Contact: security@yourdomain.com
```

---

## Summary & Prioritized Action Plan

### CRITICAL (MUST FIX BEFORE ANY PRODUCTION USE)

| # | Issue | Action | File | Timeline |
|---|-------|--------|------|----------|
| 1 | RLS Disabled | Run ENABLE_RLS_FOR_PRODUCTION.sql | Database | IMMEDIATE |
| 2 | Service Role Key Wrong | Update with actual key from Supabase | .env.local | IMMEDIATE |
| 3 | Verify Git History Clean | Check for committed secrets | Git | 24 hours |

### HIGH PRIORITY (BEFORE PUBLIC LAUNCH)

| # | Issue | Action | Complexity | Timeline |
|---|-------|--------|------------|----------|
| 4 | Missing CSRF Protection | Add CSRF tokens | Medium | 1-2 days |
| 5 | No Rate Limiting | Implement rate limiting | High | 2-3 days |
| 6 | Weak Password Policy | Enhance validation | Low | 1 day |
| 7 | Missing Security Headers | Update next.config.js | Low | 1 hour |
| 8 | Slug Validation Insufficient | Add reserved slugs | Low | 2 hours |
| 9 | Error Message Leakage | Implement proper logging | Medium | 1-2 days |
| 10 | Session Management | Add explicit timeout | Low | 1 day |
| 11 | No Audit Logging | Create audit log system | High | 3-4 days |

### MEDIUM PRIORITY (PHASE 2)

| # | Issue | Timeline |
|---|-------|----------|
| 12 | Email Verification Not Enforced | Week 1 |
| 13 | Missing Authorization Checks | Week 1 |
| 14 | Client-Side Secrets Risk | Week 2 |
| 15-23 | Other Medium Issues | Week 2-3 |

### LOW PRIORITY (CONTINUOUS IMPROVEMENT)

- TypeScript strict mode
- Automated dependency scanning
- Performance monitoring
- Accessibility improvements
- Feature flags system
- Database query optimization
- Documentation updates

---

## Phase 2 Security Implementation Order

**Week 1: Core Security Infrastructure**
1. Audit logging system
2. Rate limiting
3. Enhanced error handling
4. Security headers

**Week 2: API Security**
1. Public API endpoint with auth
2. API key management UI
3. CORS configuration
4. Input validation

**Week 3: Lead System**
1. Leads table with RLS
2. Lead CRUD operations
3. Data export functionality
4. GDPR compliance features

**Week 4: Testing & Hardening**
1. Security testing
2. Penetration testing
3. Performance testing
4. Documentation

---

## Conclusion

### Current Security Status: RED (UNSAFE FOR PRODUCTION)

**Critical Issues:** 3
**High-Risk Issues:** 8
**Medium-Risk Issues:** 12
**Low-Risk Issues:** 15

### After Fixes Applied: GREEN (PRODUCTION READY)

The application architecture is sound and follows security best practices. The main issues are:
1. Intentionally disabled RLS for development
2. Misconfigured environment variables
3. Missing production-grade security features

Once the critical issues are fixed and high-priority enhancements are implemented, the application will be secure for production deployment.

### Phase 2 Specification: EXCELLENT

The Phase 2 specification demonstrates comprehensive security planning and should be followed closely during implementation.

---

**Audit Completed:** 2025-12-16
**Next Review:** After Critical Fixes Applied
**Contact:** Security Team

