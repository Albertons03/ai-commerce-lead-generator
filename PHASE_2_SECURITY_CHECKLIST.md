# Phase 2 Lead System - Security Implementation Checklist

**Project:** AI E-Commerce Lead Generator
**Phase:** 2 - Lead System
**Created:** 2025-12-16
**Status:** Ready for Implementation

---

## Table of Contents

1. [Pre-Implementation Requirements](#pre-implementation-requirements)
2. [Database Security](#database-security)
3. [API Endpoint Security](#api-endpoint-security)
4. [Authentication & Authorization](#authentication--authorization)
5. [Input Validation](#input-validation)
6. [Rate Limiting & Abuse Prevention](#rate-limiting--abuse-prevention)
7. [Data Privacy & Compliance](#data-privacy--compliance)
8. [Audit Logging](#audit-logging)
9. [Error Handling](#error-handling)
10. [Testing Requirements](#testing-requirements)
11. [Deployment Security](#deployment-security)

---

## Pre-Implementation Requirements

### Must Be Completed BEFORE Starting Phase 2

- [ ] **CRITICAL: RLS is re-enabled on all Phase 1 tables**
  - Run `ENABLE_RLS_FOR_PRODUCTION.sql`
  - Verify with: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
  - All tables must show `rowsecurity = true`

- [ ] **CRITICAL: Service role key correctly configured**
  - Obtain actual service role key from Supabase Dashboard
  - Update `.env.local` with correct key
  - Verify admin client works: `createAdminSupabaseClient()`

- [ ] **CRITICAL: Git history verified clean**
  - Run: `git log --all --full-history -- .env.local .env`
  - If secrets found, rotate all credentials immediately

- [ ] **Rate limiting infrastructure ready**
  - Upstash Redis account created OR
  - Memory-based rate limiting implemented
  - Test rate limit function works

- [ ] **Security headers implemented**
  - Update `next.config.js` with CSP, X-Frame-Options, etc.
  - Test headers: `curl -I http://localhost:3000`

- [ ] **Audit logging system created**
  - `audit_log` table created in database
  - Audit logging functions implemented
  - Test audit log creation works

---

## Database Security

### Leads Table Creation

- [ ] **Create leads table with proper schema**
  - Location: `supabase/migrations/20250116000000_create_leads_table.sql`
  - Columns match Phase 2 specification
  - Proper data types and constraints
  - Email format validation CHECK constraint
  - Lead score range CHECK constraint (0-100)
  - Unique constraint: `(organization_id, email, date_trunc('day', created_at))`

- [ ] **Create lead status enum**
  ```sql
  CREATE TYPE lead_status AS ENUM (
    'new', 'contacted', 'qualified', 'converted', 'lost'
  );
  ```

- [ ] **Create lead source enum**
  ```sql
  CREATE TYPE lead_source AS ENUM (
    'chatbot', 'manual', 'import', 'web_form', 'referral'
  );
  ```

- [ ] **Create proper indexes**
  - [ ] `idx_leads_organization_id` on `organization_id`
  - [ ] `idx_leads_email` on `email`
  - [ ] `idx_leads_created_at` on `created_at DESC`
  - [ ] `idx_leads_status` on `status`
  - [ ] `idx_leads_source` on `source`
  - [ ] `idx_leads_score` on `lead_score DESC`
  - [ ] `idx_leads_org_status` on `(organization_id, status)`
  - [ ] `idx_leads_org_created` on `(organization_id, created_at DESC)`
  - [ ] `idx_leads_org_score` on `(organization_id, lead_score DESC)`
  - [ ] Full-text search index on `(name, email)`

### RLS Policies for Leads

- [ ] **Enable RLS on leads table**
  ```sql
  ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
  ```

- [ ] **SELECT policy: Members can view their org's leads**
  ```sql
  CREATE POLICY "Users can view their organization's leads"
      ON public.leads FOR SELECT
      USING (
          EXISTS (
              SELECT 1 FROM public.organization_members
              WHERE organization_id = public.leads.organization_id
              AND user_id = auth.uid()
          )
      );
  ```

- [ ] **INSERT policy: Admins can create leads**
  ```sql
  CREATE POLICY "Admins can create leads"
      ON public.leads FOR INSERT
      WITH CHECK (
          EXISTS (
              SELECT 1 FROM public.organization_members
              WHERE organization_id = public.leads.organization_id
              AND user_id = auth.uid()
              AND role IN ('owner', 'admin')
          )
      );
  ```

- [ ] **UPDATE policy: Admins can update leads**
  ```sql
  CREATE POLICY "Admins can update leads"
      ON public.leads FOR UPDATE
      USING (...) WITH CHECK (...);
  ```

- [ ] **DELETE policy: Only owners can delete leads**
  ```sql
  CREATE POLICY "Owners can delete leads"
      ON public.leads FOR DELETE
      USING (
          EXISTS (
              SELECT 1 FROM public.organization_members
              WHERE organization_id = public.leads.organization_id
              AND user_id = auth.uid()
              AND role = 'owner'
          )
      );
  ```

### API Keys Table

- [ ] **Create api_keys table**
  - Columns: id, organization_id, name, key_prefix, key_hash, is_active, allowed_domains, rate_limit_per_minute, last_used_at, usage_count, created_by, created_at, updated_at, revoked_at, revoked_by

- [ ] **Enable RLS on api_keys table**
  ```sql
  ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
  ```

- [ ] **RLS policies for api_keys**
  - [ ] SELECT: All org members can view keys
  - [ ] INSERT: Only admins/owners can create keys
  - [ ] UPDATE: Only admins/owners can update/revoke keys
  - [ ] DELETE: Not allowed (soft delete via revocation)

- [ ] **Create indexes**
  - [ ] `idx_api_keys_organization_id`
  - [ ] `idx_api_keys_key_hash` WHERE is_active = true
  - [ ] `idx_api_keys_active`

### Lead Activity Log (Optional but Recommended)

- [ ] **Create lead_activity_log table**
  - Audit trail for all lead-related activities

- [ ] **Enable RLS on activity log**

- [ ] **RLS policies: Only admins can view**

### Database Functions

- [ ] **Create helper functions**
  - [ ] `create_lead()` - Validates and creates lead
  - [ ] `get_lead_stats()` - Returns lead statistics for dashboard
  - [ ] `search_leads()` - Full-text search function
  - [ ] All functions use `SECURITY DEFINER` properly

- [ ] **Grant execute permissions**
  ```sql
  GRANT EXECUTE ON FUNCTION public.create_lead TO authenticated;
  GRANT EXECUTE ON FUNCTION public.get_lead_stats TO authenticated;
  ```

### Test Database Security

- [ ] **Test RLS policies prevent cross-tenant access**
  - Create two test users in different orgs
  - Verify User A cannot see User B's leads
  - Verify direct SQL queries are blocked

- [ ] **Test member permissions**
  - Member can view but not create/update/delete
  - Admin can create and update
  - Owner can delete

- [ ] **Test duplicate prevention**
  - Try to create same lead twice in 24 hours
  - Verify unique constraint works

---

## API Endpoint Security

### Public Lead Capture API

- [ ] **Create `/api/public/leads/route.ts`**
  - Location: `D:\ai-comerc-lead-generator\app\api\public\leads\route.ts`
  - POST method only
  - OPTIONS method for CORS preflight

- [ ] **Implement API key authentication**
  - Extract key from `X-API-Key` header or `Authorization: Bearer <key>`
  - Hash provided key with SHA-256
  - Lookup in `api_keys` table by hash
  - Verify key is active (`is_active = true`)
  - Verify key not revoked (`revoked_at IS NULL`)

- [ ] **Implement rate limiting**
  - Use per-organization rate limit from API key settings
  - Default: 10 requests per minute
  - Return 429 with `Retry-After` header
  - Set rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

- [ ] **Implement CORS validation**
  - Check `allowed_domains` from API key
  - Validate request origin against whitelist
  - Return 403 if origin not allowed
  - Handle OPTIONS preflight requests

- [ ] **Implement duplicate detection**
  - Check for existing lead with same email in last 24 hours
  - Return 409 if duplicate found
  - Include helpful error message

- [ ] **Capture client metadata**
  - IP address from `x-forwarded-for` or `x-real-ip`
  - User agent from headers
  - Referrer URL
  - Landing page

- [ ] **Update API key usage**
  - Increment `usage_count`
  - Update `last_used_at` timestamp

- [ ] **Return proper response codes**
  - 201: Lead created successfully
  - 400: Invalid request data
  - 401: Invalid or missing API key
  - 403: Origin not allowed
  - 409: Duplicate lead
  - 429: Rate limit exceeded
  - 500: Internal server error

### Internal Lead Management APIs

- [ ] **Create `/api/leads/route.ts`**
  - GET: List leads with pagination and filters
  - POST: Create lead (authenticated users only)

- [ ] **Create `/api/leads/[id]/route.ts`**
  - GET: Get single lead details
  - PATCH: Update lead
  - DELETE: Delete lead (owners only)

- [ ] **Create `/api/leads/stats/route.ts`**
  - GET: Lead statistics for dashboard
  - Requires authentication
  - Filters by organization_id

- [ ] **Create `/api/leads/export/route.ts`**
  - POST: Export leads to CSV
  - Respects filters
  - Limits to 1000 leads per export
  - Audit logs export action

### API Key Management APIs

- [ ] **Create `/api/api-keys/route.ts`**
  - GET: List API keys for organization (masked)
  - POST: Generate new API key

- [ ] **Create `/api/api-keys/[id]/route.ts`**
  - PATCH: Update API key settings (name, domains, rate limit)
  - DELETE: Revoke API key (soft delete)

### Test API Security

- [ ] **Test public API authentication**
  - [ ] Request without API key returns 401
  - [ ] Request with invalid key returns 401
  - [ ] Request with revoked key returns 401
  - [ ] Request with valid key succeeds

- [ ] **Test rate limiting**
  - [ ] Exceeding limit returns 429
  - [ ] Retry-After header is set
  - [ ] Rate resets after window

- [ ] **Test CORS**
  - [ ] Allowed origin succeeds
  - [ ] Disallowed origin returns 403
  - [ ] OPTIONS preflight handled

- [ ] **Test internal APIs**
  - [ ] Unauthenticated request returns 401
  - [ ] Wrong org member cannot access
  - [ ] Member cannot delete leads
  - [ ] Owner can delete leads

---

## Authentication & Authorization

### Session Management

- [ ] **Implement session age check for sensitive routes**
  - Force re-auth after 24 hours for `/settings`, `/api-keys`
  - Add to middleware.ts

- [ ] **Implement "Remember Me" functionality**
  - Short session (1 hour) by default
  - Long session (7 days) if "Remember me" checked

### Authorization Checks

- [ ] **Add explicit role checks in server actions**
  - Don't rely only on RLS
  - Check permissions before operations
  - Return clear error messages

- [ ] **Implement permission matrix**
  | Action | Member | Admin | Owner |
  |--------|--------|-------|-------|
  | View leads | Yes | Yes | Yes |
  | Create leads | No | Yes | Yes |
  | Update leads | No | Yes | Yes |
  | Delete leads | No | No | Yes |
  | Generate API keys | No | Yes | Yes |
  | Revoke API keys | No | Yes | Yes |
  | Export leads | Yes | Yes | Yes |

### Test Authorization

- [ ] **Test role-based access**
  - Member cannot create leads
  - Admin can create/update but not delete
  - Owner can delete

- [ ] **Test cross-tenant isolation**
  - User A cannot access User B's leads
  - Direct API calls blocked

---

## Input Validation

### Zod Schemas

- [ ] **Create lead validation schemas**
  - Location: `lib/validations/leads.ts`
  - `createLeadSchema` for public API
  - `updateLeadSchema` for internal updates
  - `leadFiltersSchema` for list queries

- [ ] **Lead creation validation**
  ```typescript
  const createLeadSchema = z.object({
    name: z.string().min(2).max(200).trim(),
    email: z.string().email().max(255).toLowerCase(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(), // E.164
    company: z.string().max(200).optional(),
    source: z.enum(['chatbot', 'web_form', 'referral']),
    product_interests: z.array(z.string().max(100)).max(10),
    // ... other fields
  });
  ```

- [ ] **Validate all user inputs**
  - Server actions
  - API endpoints
  - URL parameters
  - Query strings

### Sanitization

- [ ] **Implement HTML sanitization**
  - Install: `npm install dompurify isomorphic-dompurify`
  - Sanitize notes field
  - Sanitize conversation_summary
  - Escape output in UI

- [ ] **Prevent SQL injection**
  - Use parameterized queries (Supabase default)
  - Never interpolate user input into SQL
  - Test with injection payloads

### Test Input Validation

- [ ] **Test invalid inputs**
  - Malformed email addresses
  - Oversized strings
  - Invalid enum values
  - SQL injection attempts
  - XSS payloads
  - Special characters

---

## Rate Limiting & Abuse Prevention

### Implementation

- [ ] **Install rate limiting library**
  ```bash
  npm install @upstash/redis @upstash/ratelimit
  ```

- [ ] **Create rate limit service**
  - Location: `lib/security/rate-limit.ts`
  - Sliding window algorithm
  - Per-IP and per-user limits
  - Configurable windows and limits

- [ ] **Apply rate limits**
  - [ ] Login: 5 attempts per minute per IP
  - [ ] Signup: 3 accounts per hour per IP
  - [ ] Organization creation: 5 per hour per user
  - [ ] Public API: 10 per minute per API key (configurable)
  - [ ] Internal API: 100 per minute per user
  - [ ] Export: 5 per hour per user

### Abuse Prevention

- [ ] **Implement duplicate lead prevention**
  - Same email + org within 24 hours = duplicate
  - Return 409 Conflict

- [ ] **Monitor suspicious patterns**
  - Rapid API key creation
  - Unusual lead volume
  - Failed auth attempts
  - Rate limit violations

- [ ] **Implement IP blocking (optional)**
  - Block IPs with excessive violations
  - Temporary blocks (1 hour, 24 hours)
  - Whitelist for known IPs

### Test Rate Limiting

- [ ] **Test limits enforced**
  - Exceed login limit → 429
  - Exceed API limit → 429
  - Retry-After header set
  - Limits reset after window

- [ ] **Test legitimate use not blocked**
  - Normal usage succeeds
  - Multiple users don't share limits

---

## Data Privacy & Compliance

### GDPR Requirements

- [ ] **Create privacy policy page**
  - Location: `app/(public)/privacy/page.tsx`
  - Explain data collection
  - Describe purpose and legal basis
  - List data processing partners (Supabase, Vercel)
  - Contact information

- [ ] **Create data processing agreement page**
  - Link to Supabase DPA
  - Explain data processor relationship

- [ ] **Implement right to access**
  - Users can view their leads
  - Lead detail page shows all data

- [ ] **Implement right to deletion**
  - Lead deletion functionality
  - Cascade deletes to activity log
  - Audit log preserved (legal requirement)

- [ ] **Implement right to portability**
  - CSV export functionality
  - JSON export option
  - All lead data included

- [ ] **Implement consent mechanism**
  - Terms & privacy policy checkboxes
  - Log consent in audit trail

### Data Retention

- [ ] **Define retention policy**
  - Active leads: Indefinite
  - Converted leads: 2 years
  - Lost leads: 2 years
  - Deleted leads: 30 days (soft delete)

- [ ] **Implement data archival (optional)**
  - Archive old leads to separate table
  - Automatic archival via cron

### Data Security

- [ ] **Verify encryption at rest**
  - Supabase provides by default
  - No action needed

- [ ] **Verify encryption in transit**
  - HTTPS enforced
  - HSTS header set

- [ ] **Anonymize IP addresses (optional)**
  - Mask last octet: 192.168.1.xxx → 192.168.1.0
  - GDPR compliance measure

### Test Compliance

- [ ] **Test data export**
  - Export includes all lead data
  - CSV format correct
  - No data leakage to other orgs

- [ ] **Test data deletion**
  - Lead deleted successfully
  - Activity log deleted (CASCADE)
  - Audit log preserved

- [ ] **Test consent**
  - Cannot signup without accepting terms
  - Consent recorded in database

---

## Audit Logging

### Implementation

- [ ] **Create audit_log table**
  - Schema includes: user_id, event_type, resource_type, resource_id, success, metadata, ip_address, timestamp

- [ ] **Create audit logging service**
  - Location: `lib/security/audit-log.ts`
  - Function: `createAuditLog(entry: AuditLogEntry)`
  - Error handling (don't fail main operation)

- [ ] **Log all security events**
  - [ ] User login/logout
  - [ ] Failed login attempts
  - [ ] User signup
  - [ ] Organization created/updated/deleted
  - [ ] Member added/removed
  - [ ] Member role changed
  - [ ] API key created/revoked
  - [ ] Lead created/updated/deleted
  - [ ] Lead exported
  - [ ] RLS policy violations

### Audit Log UI (Optional)

- [ ] **Create audit log viewer page**
  - Location: `app/(dashboard)/[orgSlug]/settings/audit-log/page.tsx`
  - Only admins/owners can view
  - Filterable by date, event type, user
  - Exportable to CSV

### Test Audit Logging

- [ ] **Test events are logged**
  - Perform action
  - Verify audit log entry created
  - Verify metadata captured

- [ ] **Test log cannot be tampered**
  - RLS policy prevents updates/deletes
  - Only INSERT allowed (via service)

---

## Error Handling

### Logging Infrastructure

- [ ] **Install logging library**
  ```bash
  npm install winston
  ```

- [ ] **Create logging service**
  - Location: `lib/security/logger.ts`
  - Functions: `logError()`, `logWarning()`, `logInfo()`
  - Sanitize sensitive data before logging
  - Different transports for dev/prod

- [ ] **Replace all console.error**
  - Use structured logging
  - Include context
  - Never log passwords, API keys, tokens

### Error Messages

- [ ] **Generic error messages for users**
  - "An unexpected error occurred"
  - "Invalid email or password" (not "User not found")
  - "Access denied" (not "User not member of org")

- [ ] **Detailed errors in logs (server-side only)**
  - Full error object
  - Stack trace (dev only)
  - Request context
  - User context (sanitized)

### Test Error Handling

- [ ] **Test generic errors returned**
  - Trigger error
  - Verify generic message
  - Check logs for details

- [ ] **Test no information leakage**
  - Database errors don't expose schema
  - Stack traces not returned to client
  - Internal paths not exposed

---

## Testing Requirements

### Unit Tests

- [ ] **Test validation functions**
  - `lib/validations/leads.ts`
  - Valid inputs pass
  - Invalid inputs fail with correct errors

- [ ] **Test helper functions**
  - API key generation
  - API key verification
  - CSV conversion
  - Slug generation

### Integration Tests

- [ ] **Test public API endpoint**
  - Valid request creates lead
  - Invalid API key returns 401
  - Rate limit returns 429
  - Duplicate returns 409
  - Invalid data returns 400

- [ ] **Test internal APIs**
  - List leads with pagination
  - Filter leads by status
  - Search leads by name/email
  - Update lead status
  - Delete lead

- [ ] **Test RLS policies**
  - Cross-tenant access blocked
  - Role-based permissions enforced

### Security Tests

- [ ] **SQL injection tests**
  - Try injection in search query
  - Try injection in all text inputs
  - Verify parameterized queries protect

- [ ] **XSS tests**
  - Inject `<script>` in notes
  - Inject HTML in name/email
  - Verify output escaped

- [ ] **CSRF tests**
  - Attempt action without token
  - Verify protection works

- [ ] **Authentication bypass tests**
  - Access protected routes without session
  - Use expired session
  - Try session fixation

- [ ] **Authorization bypass tests**
  - Member tries admin action
  - User A tries to access User B's data

### Performance Tests

- [ ] **Test with 1000+ leads**
  - Page load time < 2 seconds
  - API response time < 500ms
  - Pagination works smoothly

- [ ] **Test concurrent requests**
  - 100 users viewing leads
  - 10 users creating leads simultaneously

---

## Deployment Security

### Pre-Deployment Checklist

- [ ] **Environment variables set**
  - Vercel dashboard or deployment platform
  - NEVER commit to git
  - Verify all required vars present

- [ ] **RLS enabled and tested**
  - Run final RLS test
  - Verify policies active
  - Test cross-tenant isolation

- [ ] **Security headers configured**
  - CSP header set
  - HSTS header set (production only)
  - X-Frame-Options set

- [ ] **Rate limiting active**
  - Redis connection working
  - Rate limits enforced
  - Test with production config

- [ ] **Audit logging working**
  - Logs being created
  - Audit log queries performant

- [ ] **Error handling tested**
  - Errors logged to monitoring service
  - Users see generic messages

### Post-Deployment Verification

- [ ] **Test production environment**
  - Create test lead via public API
  - Login to dashboard
  - View leads
  - Export leads
  - Delete test data

- [ ] **Monitor for issues**
  - Check error logs
  - Check audit logs
  - Monitor rate limit violations
  - Monitor API usage

- [ ] **Security scan**
  - Run npm audit
  - Use online security scanner
  - Check security headers

### Rollback Plan

- [ ] **Document rollback procedure**
  - How to revert database migrations
  - How to rollback deployment
  - Who to contact

---

## Security Review Sign-Off

Before marking Phase 2 as complete, ensure:

- [ ] All CRITICAL items from audit report fixed
- [ ] All HIGH priority items from audit report implemented
- [ ] This checklist 100% complete
- [ ] Security testing passed
- [ ] Code review completed
- [ ] Documentation updated

**Reviewed By:** _________________
**Date:** _________________
**Approved for Production:** YES / NO

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [GDPR Compliance Checklist](https://gdpr.eu/checklist/)

---

**Document Version:** 1.0
**Last Updated:** 2025-12-16
**Next Review:** After Phase 2 Complete
