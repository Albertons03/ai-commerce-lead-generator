# Public Lead Capture API

## Overview

The Public Lead Capture API (`POST /api/public/leads`) allows external applications, chatbots, and embedded widgets to submit leads without user authentication. This endpoint is designed for Phase 3 chatbot integration and supports robust security, rate limiting, and CORS configuration.

## Endpoint

```
POST /api/public/leads
```

## Authentication

**API Key Authentication via Header:**
```
X-API-Key: sk_live_abc123xyz789...
```

API keys are:
- Hashed with bcrypt for secure storage
- Organization-specific
- Can be created/revoked through the dashboard
- Track usage statistics

## Rate Limiting

- **Default:** 10 requests per minute per organization
- Configurable per API key
- Uses sliding window algorithm
- Returns 429 status when exceeded

**Rate Limit Headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 2025-12-16T10:30:00Z
Retry-After: 45
```

## CORS Support

The API supports Cross-Origin Resource Sharing (CORS) for embedded chatbots:
- Allowed origins are configured per API key
- Supports wildcard domains (e.g., `*.example.com`)
- Handles preflight OPTIONS requests
- Returns appropriate CORS headers

## Request Format

### Headers

```
Content-Type: application/json
X-API-Key: your-api-key-here
```

### Body (JSON)

**Required Fields:**
- `name` (string, 2-200 chars): Lead's full name
- `email` (string, valid email): Lead's email address

**Optional Fields:**

```typescript
{
  // Contact Information
  "phone": "+1-555-123-4567",
  "company": "Acme Corp",

  // Lead Classification
  "source": "chatbot", // Default: "chatbot"
  "product_interests": ["Product A", "Product B"],

  // Conversation Context (Phase 3)
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "conversation_summary": "Customer interested in bulk pricing",

  // Marketing Attribution
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "spring_sale_2025",
  "utm_term": "best+widgets",
  "utm_content": "ad_variant_a",
  "referrer_url": "https://google.com",
  "landing_page": "https://example.com/products/widget-a",

  // Technical Metadata (auto-captured if not provided)
  "user_agent": "Mozilla/5.0...",
  "ip_address": "192.168.1.1",

  // Custom Fields
  "metadata": {
    "custom_field_1": "value",
    "lead_magnet": "free_ebook"
  }
}
```

## Response Format

### Success (201 Created)

```json
{
  "success": true,
  "lead_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Lead created successfully"
}
```

### Error Responses

**400 Bad Request - Validation Error**
```json
{
  "success": false,
  "error": "Invalid email format",
  "field": "email"
}
```

**401 Unauthorized - Invalid API Key**
```json
{
  "success": false,
  "error": "Invalid or missing API key"
}
```

**403 Forbidden - Origin Not Allowed**
```json
{
  "success": false,
  "error": "Origin not allowed"
}
```

**409 Conflict - Duplicate Lead**
```json
{
  "success": false,
  "error": "Duplicate lead detected",
  "existing_lead_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**429 Too Many Requests - Rate Limit Exceeded**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "retry_after": 45
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## Features

### 1. Automatic IP & User Agent Capture

The API automatically extracts:
- IP address from `X-Forwarded-For` or `X-Real-IP` headers
- User agent from `User-Agent` header

These are captured even if not explicitly provided in the request body.

### 2. Duplicate Detection

Prevents duplicate leads based on:
- Same email address
- Same organization
- Created within 24 hours

Returns 409 status with existing lead ID if duplicate detected.

### 3. Request Logging

All requests are logged to `lead_activity_log` table for audit trail:
- Successful lead creation
- Failed requests with error messages
- Timestamp and metadata

### 4. API Key Usage Tracking

Each successful request:
- Increments `usage_count`
- Updates `last_used_at` timestamp
- Useful for analytics and billing

## Example Usage

### cURL

```bash
curl -X POST https://your-domain.com/api/public/leads \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_live_abc123xyz789" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-123-4567",
    "company": "Acme Corp",
    "product_interests": ["Widget A"],
    "utm_source": "google",
    "utm_campaign": "spring_sale"
  }'
```

### JavaScript (Fetch)

```javascript
const response = await fetch('https://your-domain.com/api/public/leads', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'sk_live_abc123xyz789',
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1-555-123-4567',
    company: 'Acme Corp',
    product_interests: ['Widget A'],
    utm_source: 'google',
    utm_campaign: 'spring_sale',
  }),
});

const data = await response.json();
console.log(data);
```

### Python

```python
import requests

url = 'https://your-domain.com/api/public/leads'
headers = {
    'Content-Type': 'application/json',
    'X-API-Key': 'sk_live_abc123xyz789',
}
data = {
    'name': 'John Doe',
    'email': 'john@example.com',
    'phone': '+1-555-123-4567',
    'company': 'Acme Corp',
    'product_interests': ['Widget A'],
    'utm_source': 'google',
    'utm_campaign': 'spring_sale',
}

response = requests.post(url, json=data, headers=headers)
print(response.json())
```

## Security Best Practices

### For API Key Holders

1. **Keep API keys secure**: Never commit them to version control
2. **Use environment variables**: Store keys in `.env.local` or secure vaults
3. **Rotate keys regularly**: Create new keys and revoke old ones periodically
4. **Monitor usage**: Check API key usage statistics in dashboard
5. **Set CORS domains**: Restrict API key usage to specific domains

### For API Implementers

1. **Validate all inputs**: All fields are validated with Zod schemas
2. **Rate limiting**: Prevent abuse with per-organization rate limits
3. **Duplicate detection**: Prevent spam with 24-hour duplicate window
4. **Audit logging**: All requests are logged for security review
5. **HTTPS only**: Always use HTTPS in production

## Testing

### Test API Key Creation

Before testing the endpoint, you need an API key:

1. Log into the dashboard
2. Navigate to Settings > API Keys
3. Click "Create API Key"
4. Copy the full API key (shown only once)
5. Configure allowed domains if needed

### Test Request

```bash
# Success case
curl -X POST http://localhost:3000/api/public/leads \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"name":"Test Lead","email":"test@example.com"}'

# Validation error (missing email)
curl -X POST http://localhost:3000/api/public/leads \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"name":"Test Lead"}'

# Unauthorized (no API key)
curl -X POST http://localhost:3000/api/public/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Lead","email":"test@example.com"}'

# Rate limit (send 11 requests quickly)
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/public/leads \
    -H "Content-Type: application/json" \
    -H "X-API-Key: YOUR_API_KEY" \
    -d "{\"name\":\"Test $i\",\"email\":\"test$i@example.com\"}"
done
```

## Performance

- Average response time: < 100ms
- Rate limit: 10 req/min (configurable)
- Duplicate check: Indexed query on email + organization
- API key verification: bcrypt compare (cached in memory)

## Monitoring

Monitor these metrics:
- Request count per API key
- Error rates by status code
- Rate limit violations
- Duplicate lead attempts
- Average response time

## Troubleshooting

### 401 Unauthorized
- Check API key is correct
- Verify API key is active (not revoked)
- Ensure key hasn't been deleted

### 403 Forbidden
- Check CORS allowed domains
- Verify origin header matches allowed domain
- Try wildcard domain pattern (*.example.com)

### 409 Duplicate Lead
- Same email submitted within 24 hours
- Use existing lead ID to update instead
- Wait 24 hours or use different email

### 429 Rate Limit
- Wait for rate limit window to reset
- Check Retry-After header
- Consider requesting higher rate limit

### 500 Internal Server Error
- Check server logs for details
- Verify database connection
- Ensure all environment variables are set

## Next Steps

For Phase 3 chatbot integration:
1. Implement conversation tracking
2. Link leads to conversation history
3. Add AI-generated conversation summaries
4. Enable lead scoring based on conversation quality

## Support

For issues or questions:
- Check server logs: `npm run dev`
- Review database migrations: `supabase/migrations/`
- Contact: support@example.com
