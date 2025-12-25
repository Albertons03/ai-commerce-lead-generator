# Public Lead Capture API - Setup Guide

## Overview

This guide walks you through setting up and testing the Public Lead Capture API endpoint (`POST /api/public/leads`) for Phase 2 of the AI E-Commerce Lead Generator.

## Prerequisites

- Node.js 18+ installed
- Supabase project configured
- Database migrations applied (Phase 1 + Phase 2)

## Step 1: Install Dependencies

The Public Lead Capture API requires `bcryptjs` for API key verification:

```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

## Step 2: Verify Database Setup

Ensure the Phase 2 database migration has been applied:

```bash
# Check if migration exists
ls supabase/migrations/20250116000000_create_leads_system.sql

# Apply migration (if using Supabase CLI)
supabase db push

# Or apply via Supabase Dashboard
# Dashboard > SQL Editor > paste migration file > Run
```

Verify these tables exist:
- `leads`
- `api_keys`
- `lead_activity_log`

## Step 3: Environment Variables

Ensure your `.env.local` file has the required variables:

```bash
# Required for Public API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional
NODE_ENV=development
```

## Step 4: Start Development Server

```bash
npm run dev
```

The API will be available at:
```
http://localhost:3000/api/public/leads
```

## Step 5: Create Test API Key

You'll need to create an API key in the database to test the endpoint.

### Option A: Using SQL (Supabase Dashboard)

1. Go to Supabase Dashboard > SQL Editor
2. Run this script to create a test API key:

```sql
-- First, get your organization ID
SELECT id, name FROM organizations;

-- Create a test API key (replace organization_id and user_id)
DO $$
DECLARE
    v_organization_id UUID := 'YOUR_ORG_ID_HERE'; -- Replace with actual org ID
    v_user_id UUID := 'YOUR_USER_ID_HERE'; -- Replace with actual user ID
    v_raw_key TEXT := 'sk_test_' || encode(gen_random_bytes(32), 'hex');
    v_key_hash TEXT;
BEGIN
    -- Generate bcrypt hash of the key
    -- Note: You'll need to hash this outside SQL (see Option B)
    -- For now, we'll use a placeholder
    RAISE NOTICE 'Raw API Key: %', v_raw_key;
    RAISE NOTICE 'You need to hash this key with bcrypt and insert manually';
END $$;
```

### Option B: Using Node.js Script (Recommended)

Create a file `scripts/create-api-key.ts`:

```typescript
import bcrypt from 'bcryptjs';
import { createAdminSupabaseClient } from '@/lib/supabase/client';

async function createApiKey() {
  // Generate a random API key
  const randomBytes = require('crypto').randomBytes(32).toString('hex');
  const rawKey = `sk_test_${randomBytes}`;

  // Hash the key with bcrypt
  const keyHash = await bcrypt.hash(rawKey, 10);

  // Get organization ID (you'll need to replace this)
  const organizationId = 'YOUR_ORG_ID'; // Replace with actual ID
  const userId = 'YOUR_USER_ID'; // Replace with actual ID

  // Insert into database
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      organization_id: organizationId,
      name: 'Test API Key',
      key_prefix: rawKey.substring(0, 8),
      key_hash: keyHash,
      is_active: true,
      allowed_domains: ['*'], // Allow all domains for testing
      rate_limit_per_minute: 10,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating API key:', error);
    return;
  }

  console.log('✅ API Key created successfully!');
  console.log('\nIMPORTANT: Save this key securely - it will not be shown again!');
  console.log('\nAPI Key:', rawKey);
  console.log('\nKey ID:', data.id);
  console.log('Key Prefix:', data.key_prefix);
  console.log('Organization ID:', data.organization_id);
}

createApiKey().catch(console.error);
```

Run the script:
```bash
npx ts-node scripts/create-api-key.ts
```

**IMPORTANT:** Save the generated API key securely! It will not be retrievable later.

## Step 6: Test the Endpoint

### Test 1: Successful Lead Creation

```bash
curl -X POST http://localhost:3000/api/public/leads \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-123-4567",
    "company": "Acme Corp",
    "product_interests": ["Product A", "Product B"],
    "utm_source": "google",
    "utm_campaign": "test_campaign"
  }'
```

Expected response (201):
```json
{
  "success": true,
  "lead_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Lead created successfully"
}
```

### Test 2: Validation Error (Missing Email)

```bash
curl -X POST http://localhost:3000/api/public/leads \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -d '{
    "name": "John Doe"
  }'
```

Expected response (400):
```json
{
  "success": false,
  "error": "Invalid email format",
  "field": "email"
}
```

### Test 3: Unauthorized (No API Key)

```bash
curl -X POST http://localhost:3000/api/public/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com"
  }'
```

Expected response (401):
```json
{
  "success": false,
  "error": "Invalid or missing API key"
}
```

### Test 4: Duplicate Lead Detection

Run the same successful request twice within 24 hours:

```bash
# First request - succeeds
curl -X POST http://localhost:3000/api/public/leads \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -d '{"name":"Jane Smith","email":"jane@example.com"}'

# Second request - fails with 409
curl -X POST http://localhost:3000/api/public/leads \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -d '{"name":"Jane Smith","email":"jane@example.com"}'
```

Expected second response (409):
```json
{
  "success": false,
  "error": "Duplicate lead detected",
  "existing_lead_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Test 5: Rate Limiting

Send 11 requests quickly to trigger rate limit:

```bash
for i in {1..11}; do
  echo "Request $i"
  curl -X POST http://localhost:3000/api/public/leads \
    -H "Content-Type: application/json" \
    -H "X-API-Key: YOUR_API_KEY_HERE" \
    -d "{\"name\":\"Test User $i\",\"email\":\"test$i@example.com\"}"
  echo ""
done
```

Expected 11th response (429):
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "retry_after": 45
}
```

### Test 6: CORS Preflight

```bash
curl -X OPTIONS http://localhost:3000/api/public/leads \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, X-API-Key" \
  -v
```

Expected headers in response:
```
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, X-API-Key, ...
```

## Step 7: Verify Data in Database

Check that leads were created:

```sql
-- View all leads
SELECT id, name, email, status, source, created_at
FROM leads
ORDER BY created_at DESC
LIMIT 10;

-- View API key usage
SELECT name, usage_count, last_used_at
FROM api_keys
WHERE is_active = true;

-- View activity log
SELECT *
FROM lead_activity_log
ORDER BY created_at DESC
LIMIT 10;
```

## Troubleshooting

### Error: "bcryptjs module not found"

```bash
npm install bcryptjs @types/bcryptjs
```

### Error: "SUPABASE_SERVICE_ROLE_KEY is not set"

Add to `.env.local`:
```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Get the service role key from:
Supabase Dashboard > Settings > API > service_role key

### Error: "Table 'leads' does not exist"

Run the Phase 2 migration:
```bash
supabase db push
# OR
# Apply manually via Supabase Dashboard SQL Editor
```

### Error: "Invalid API key"

- Verify the API key was created correctly
- Check that `is_active = true`
- Ensure `revoked_at IS NULL`
- Verify the key hash matches

### Error: "Origin not allowed"

- Check `allowed_domains` in the API key record
- Use `['*']` to allow all domains during testing
- For production, specify exact domains: `['example.com', '*.example.com']`

## Performance Monitoring

### Check Rate Limit Store Size

```typescript
import { getRateLimitStoreSize } from '@/lib/utils/rate-limiter';

console.log('Rate limit entries:', getRateLimitStoreSize());
```

### Monitor Response Times

Check the `X-Response-Time` header in responses:

```bash
curl -X POST http://localhost:3000/api/public/leads \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"name":"Test","email":"test@example.com"}' \
  -v 2>&1 | grep "X-Response-Time"
```

### View API Usage Statistics

```sql
SELECT
  ak.name,
  ak.usage_count,
  ak.last_used_at,
  ak.rate_limit_per_minute,
  COUNT(lal.id) as activity_count
FROM api_keys ak
LEFT JOIN lead_activity_log lal ON lal.organization_id = ak.organization_id
WHERE ak.is_active = true
GROUP BY ak.id, ak.name, ak.usage_count, ak.last_used_at, ak.rate_limit_per_minute
ORDER BY ak.usage_count DESC;
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] All dependencies installed (`bcryptjs`, etc.)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] API keys created for production
- [ ] CORS domains configured (no wildcards)
- [ ] Rate limits configured appropriately
- [ ] HTTPS enabled
- [ ] Monitoring/logging configured

### Security Best Practices

1. **Never commit API keys to version control**
2. **Use environment variables** for sensitive data
3. **Enable HTTPS only** in production
4. **Configure strict CORS** (no wildcards)
5. **Monitor rate limit violations**
6. **Rotate API keys regularly**
7. **Set up alerts** for errors and unusual activity

### Scaling Considerations

For high-traffic production deployments:

1. **Use Redis for rate limiting** instead of in-memory store
2. **Add database read replicas** for lead queries
3. **Enable connection pooling** in Supabase
4. **Add CDN/caching** for static assets
5. **Monitor database indexes** for performance
6. **Set up auto-scaling** for API servers

## Next Steps

Once the Public API is working:

1. **Create API Key Management UI** (Phase 2.5)
   - Create/list/revoke API keys
   - View usage statistics
   - Configure CORS domains

2. **Integrate with Chatbot** (Phase 3)
   - Send leads from chatbot to API
   - Link conversation history
   - Add AI-generated summaries

3. **Add Webhooks** (Future)
   - Notify on new leads
   - Send to CRM/email tools
   - Real-time integrations

## Resources

- [API Documentation](./app/api/public/leads/README.md)
- [Phase 2 Technical Specification](./PHASE_2_TECHNICAL_SPECIFICATION.md)
- [Database Schema](./supabase/migrations/20250116000000_create_leads_system.sql)
- [Supabase Documentation](https://supabase.com/docs)

## Support

For issues or questions:
- Review server logs: `npm run dev`
- Check Supabase logs: Dashboard > Logs
- Review this guide
- Contact: support@example.com
