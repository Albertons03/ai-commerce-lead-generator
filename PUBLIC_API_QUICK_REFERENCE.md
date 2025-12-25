# Public Lead Capture API - Quick Reference

## Installation (One-Time Setup)

```bash
# 1. Install dependencies
npm install bcryptjs @types/bcryptjs

# 2. Start dev server
npm run dev

# 3. Create test API key (see SETUP_PUBLIC_API.md)
```

## API Endpoint

```
POST http://localhost:3000/api/public/leads
```

## Request Headers

```
Content-Type: application/json
X-API-Key: sk_live_abc123xyz789...
```

## Minimal Request Body

```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

## Full Request Example

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1-555-123-4567",
  "company": "Acme Corp",
  "source": "chatbot",
  "product_interests": ["Product A", "Product B"],
  "conversation_id": "uuid-here",
  "conversation_summary": "Interested in bulk pricing",
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "spring_sale",
  "metadata": {
    "custom_field": "value"
  }
}
```

## Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 201 | Success | Lead created |
| 400 | Validation Error | Fix request data |
| 401 | Unauthorized | Check API key |
| 403 | Forbidden | Check CORS settings |
| 409 | Duplicate | Lead exists (24h) |
| 429 | Rate Limited | Wait & retry |
| 500 | Server Error | Check logs |

## Success Response (201)

```json
{
  "success": true,
  "lead_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Lead created successfully"
}
```

## Error Response Example

```json
{
  "success": false,
  "error": "Invalid email format",
  "field": "email"
}
```

## cURL Examples

### Success
```bash
curl -X POST http://localhost:3000/api/public/leads \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"name":"John Doe","email":"john@example.com"}'
```

### With All Fields
```bash
curl -X POST http://localhost:3000/api/public/leads \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-123-4567",
    "company": "Acme Corp",
    "source": "chatbot",
    "product_interests": ["Widget A"],
    "utm_source": "google",
    "utm_campaign": "spring_sale"
  }'
```

## JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:3000/api/public/leads', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'YOUR_API_KEY',
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1-555-123-4567',
    company: 'Acme Corp',
  }),
});

const data = await response.json();

if (response.ok) {
  console.log('Lead created:', data.lead_id);
} else {
  console.error('Error:', data.error);
}
```

## Python

```python
import requests

url = 'http://localhost:3000/api/public/leads'
headers = {
    'Content-Type': 'application/json',
    'X-API-Key': 'YOUR_API_KEY',
}
data = {
    'name': 'John Doe',
    'email': 'john@example.com',
    'phone': '+1-555-123-4567',
    'company': 'Acme Corp',
}

response = requests.post(url, json=data, headers=headers)

if response.status_code == 201:
    print('Lead created:', response.json()['lead_id'])
else:
    print('Error:', response.json()['error'])
```

## Rate Limiting

- **Default:** 10 requests per minute per organization
- **Headers returned:**
  - `X-RateLimit-Limit`: Total allowed
  - `X-RateLimit-Remaining`: Requests left
  - `X-RateLimit-Reset`: Reset timestamp
  - `Retry-After`: Seconds to wait (if exceeded)

## CORS

- Configured per API key
- Use `*` for all domains (testing only)
- Production: Specific domains like `example.com` or `*.example.com`

## Validation Rules

| Field | Required | Rules |
|-------|----------|-------|
| name | Yes | 2-200 chars |
| email | Yes | Valid email |
| phone | No | Max 50 chars |
| company | No | Max 200 chars |
| source | No | Enum: chatbot, manual, import, web_form, referral |
| product_interests | No | Array of strings |
| utm_* | No | Max 100-200 chars each |
| metadata | No | Any JSON object |

## Auto-Captured Fields

These are automatically extracted if not provided:
- `ip_address` - From X-Forwarded-For or X-Real-IP
- `user_agent` - From User-Agent header

## Duplicate Detection

- Same email + organization within 24 hours = 409 Conflict
- Returns existing lead ID
- Use PUT/PATCH to update existing lead instead

## Common Issues

**401 Unauthorized**
- Check API key is correct
- Verify key is active in database
- Ensure key not revoked

**403 Forbidden**
- Add origin to allowed_domains in API key
- Use wildcard (*) for testing

**429 Rate Limited**
- Wait for reset time (check Retry-After header)
- Request higher limit if needed

**409 Duplicate**
- Expected behavior for same email < 24h
- Use existing lead_id to update

## Testing Commands

```bash
# Test success
curl -X POST http://localhost:3000/api/public/leads \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_KEY" \
  -d '{"name":"Test","email":"test@example.com"}'

# Test validation error (missing email)
curl -X POST http://localhost:3000/api/public/leads \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_KEY" \
  -d '{"name":"Test"}'

# Test no API key
curl -X POST http://localhost:3000/api/public/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com"}'

# Test rate limit (send 11 quick requests)
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/public/leads \
    -H "Content-Type: application/json" \
    -H "X-API-Key: YOUR_KEY" \
    -d "{\"name\":\"Test $i\",\"email\":\"test$i@example.com\"}"
done
```

## Database Queries

```sql
-- View recent leads
SELECT id, name, email, status, created_at
FROM leads
ORDER BY created_at DESC
LIMIT 10;

-- Check API key usage
SELECT name, usage_count, last_used_at
FROM api_keys
WHERE is_active = true;

-- View activity log
SELECT activity_type, description, created_at
FROM lead_activity_log
ORDER BY created_at DESC
LIMIT 10;
```

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional
NODE_ENV=development
```

## File Locations

- **API Route:** `app/api/public/leads/route.ts`
- **Validations:** `lib/validations/leads.ts`
- **Rate Limiter:** `lib/utils/rate-limiter.ts`
- **Types:** `lib/supabase/types.ts`

## Documentation

- **Full API Docs:** `app/api/public/leads/README.md`
- **Setup Guide:** `SETUP_PUBLIC_API.md`
- **Installation:** `INSTALLATION_PHASE2.md`
- **Summary:** `PUBLIC_API_IMPLEMENTATION_SUMMARY.md`

## Support

For detailed information:
1. Check full documentation files above
2. Review server logs: `npm run dev`
3. Check Supabase logs in dashboard
4. Verify database schema and data

## Quick Troubleshooting

```bash
# Check if bcryptjs installed
npm list bcryptjs

# Verify API running
curl http://localhost:3000/api/public/leads -X OPTIONS

# Check database tables exist
# Run in Supabase SQL Editor:
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('leads', 'api_keys', 'lead_activity_log');

# View server logs
npm run dev
# Watch terminal for errors
```

---

**Quick Start:** Install bcryptjs, create API key, test endpoint!
