# API Key Management System - Implementation Guide

## Overview

This document describes the complete API Key Management system implementation for the AI E-Commerce Lead Generator application. The system allows organizations to securely generate, manage, and revoke API keys for authenticating public lead capture requests.

## Architecture

### Security Features

1. **Secure Key Generation**: Uses `crypto.randomBytes(32)` for cryptographically secure random key generation
2. **Bcrypt Hashing**: API keys are hashed using bcrypt with 10 rounds before storage
3. **One-Time Display**: Full API keys are shown only once during creation
4. **Masked Display**: Keys are masked in list views (e.g., `sk_live_****xyz789`)
5. **Soft Delete**: Keys are deactivated (not deleted) to maintain audit trail
6. **Rate Limiting**: Each key has configurable rate limits (default: 10 requests/minute)
7. **Domain Whitelisting**: Optional CORS domain restrictions per key

### Key Format

```
sk_live_[32_random_base64url_characters]
```

Example: `sk_live_abc123xyz789ABCDEF123456789012`

- `sk_` prefix indicates "secret key"
- `live_` indicates production environment
- 32 random base64url characters (URL-safe, no special characters)

## Files Created

### 1. Validation Schemas
**File**: `d:\ai-comerc-lead-generator\lib\validations\api-keys.ts`

Provides Zod schemas for:
- Creating API keys
- Listing API keys
- Deleting API keys
- Validating API key format
- Helper functions for masking and validation

### 2. Utility Functions
**File**: `d:\ai-comerc-lead-generator\lib\utils\api-keys.ts`

Core utilities:
- `generateApiKey()`: Creates secure random API keys
- `hashApiKey(key)`: Hashes keys using bcrypt
- `verifyApiKey(key, hash)`: Verifies keys against stored hashes
- `maskKey(prefix)`: Masks keys for safe display
- `generateAndHashApiKey()`: Convenience function for complete key generation

### 3. API Routes

#### GET /api/api-keys
**File**: `d:\ai-comerc-lead-generator\app\api\api-keys\route.ts`

Lists all API keys for an organization (masked).

**Query Parameters**:
```typescript
{
  organization_id: string (UUID, required)
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Production Chatbot",
      "key_display": "sk_live_****xyz789",
      "is_active": true,
      "last_used_at": "2025-12-16T10:30:00Z",
      "usage_count": 1523,
      "created_at": "2025-11-01T12:00:00Z",
      "allowed_domains": ["example.com", "www.example.com"],
      "rate_limit_per_minute": 10,
      "revoked_at": null
    }
  ]
}
```

#### POST /api/api-keys
**File**: `d:\ai-comerc-lead-generator\app\api\api-keys\route.ts`

Generates a new API key for an organization.

**Request Body**:
```json
{
  "organization_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Production Chatbot",
  "allowed_domains": ["example.com", "www.example.com"],
  "rate_limit_per_minute": 10
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Production Chatbot",
    "api_key": "sk_live_abc123xyz789ABCDEF123456789012",
    "key_prefix": "sk_live_abc123xyz789",
    "created_at": "2025-12-16T16:00:00Z",
    "allowed_domains": ["example.com", "www.example.com"],
    "rate_limit_per_minute": 10
  },
  "message": "API key created successfully. Save this key securely - it will not be shown again."
}
```

**Important**: The full `api_key` is returned only once. Store it securely!

#### DELETE /api/api-keys/[id]
**File**: `d:\ai-comerc-lead-generator\app\api\api-keys\[id]\route.ts`

Revokes an API key (soft delete).

**Query Parameters**:
```typescript
{
  organization_id: string (UUID, required)
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "API key revoked successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Production Chatbot",
    "revoked_at": "2025-12-16T17:00:00Z"
  }
}
```

#### GET /api/api-keys/[id]
**File**: `d:\ai-comerc-lead-generator\app\api\api-keys\[id]\route.ts`

Gets details of a specific API key (masked).

**Query Parameters**:
```typescript
{
  organization_id: string (UUID, required)
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Production Chatbot",
    "key_display": "sk_live_****xyz789",
    "is_active": true,
    "last_used_at": "2025-12-16T10:30:00Z",
    "usage_count": 1523,
    "created_at": "2025-11-01T12:00:00Z",
    "allowed_domains": ["example.com", "www.example.com"],
    "rate_limit_per_minute": 10,
    "revoked_at": null
  }
}
```

## Database Schema

The API keys table should have the following structure (as per Phase 2 specification):

```sql
CREATE TABLE public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Key identification
    name TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    key_hash TEXT NOT NULL,

    -- Usage tracking
    last_used_at TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,

    -- Security
    is_active BOOLEAN DEFAULT true,
    allowed_domains TEXT[],
    rate_limit_per_minute INTEGER DEFAULT 10,

    -- Metadata
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- Constraints
    UNIQUE(key_hash),
    CHECK(char_length(name) >= 3 AND char_length(name) <= 100)
);
```

## Installation Requirements

### 1. Install Dependencies

```bash
npm install bcrypt @types/bcrypt
```

### 2. Verify Database Schema

Ensure the `api_keys` table exists in your Supabase database with the schema shown above.

### 3. Set Up RLS Policies

Ensure Row Level Security policies are configured:

```sql
-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Users can view API keys for their organizations
CREATE POLICY "Users can view their organization's API keys"
    ON public.api_keys
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = public.api_keys.organization_id
            AND user_id = auth.uid()
        )
    );

-- Only owners/admins can create API keys
CREATE POLICY "Admins can create API keys"
    ON public.api_keys
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = public.api_keys.organization_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Only owners/admins can update/revoke API keys
CREATE POLICY "Admins can update API keys"
    ON public.api_keys
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = public.api_keys.organization_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );
```

## Usage Examples

### Creating an API Key (Frontend)

```typescript
async function createApiKey(organizationId: string, name: string) {
  const response = await fetch('/api/api-keys', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      organization_id: organizationId,
      name: name,
      allowed_domains: ['example.com'],
      rate_limit_per_minute: 10,
    }),
  })

  const result = await response.json()

  if (result.success) {
    // IMPORTANT: Display the full key to the user now
    // It will never be shown again!
    console.log('Your API key:', result.data.api_key)
    alert(`Save this key securely: ${result.data.api_key}`)
  }
}
```

### Listing API Keys (Frontend)

```typescript
async function listApiKeys(organizationId: string) {
  const response = await fetch(
    `/api/api-keys?organization_id=${organizationId}`
  )

  const result = await response.json()

  if (result.success) {
    result.data.forEach(key => {
      console.log(`${key.name}: ${key.key_display}`)
    })
  }
}
```

### Revoking an API Key (Frontend)

```typescript
async function revokeApiKey(keyId: string, organizationId: string) {
  const response = await fetch(
    `/api/api-keys/${keyId}?organization_id=${organizationId}`,
    {
      method: 'DELETE',
    }
  )

  const result = await response.json()

  if (result.success) {
    console.log('API key revoked successfully')
  }
}
```

### Using an API Key (External Application)

```typescript
// Example: Creating a lead using the API key
async function createLead(apiKey: string, leadData: any) {
  const response = await fetch('https://your-domain.com/api/public/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey, // Use the full API key here
    },
    body: JSON.stringify(leadData),
  })

  return await response.json()
}
```

## Security Considerations

### 1. Key Storage
- **Never** store plain API keys in the database
- Only store bcrypt hashes with the `key_hash` column
- Store `key_prefix` for display purposes only

### 2. Key Display
- Show full key only once during creation
- Mask keys in all subsequent displays
- Use format: `sk_live_****xyz789`

### 3. Key Limits
- Maximum 5 active keys per organization
- Enforce via application logic (already implemented)
- Prevents key proliferation

### 4. Key Revocation
- Soft delete (set `is_active = false`)
- Record `revoked_at` and `revoked_by` for audit trail
- Never hard delete keys from database

### 5. Access Control
- Only admin and owner roles can create/revoke keys
- All members can view masked keys
- Enforced via RLS policies and application logic

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "details": {} // Optional validation details
}
```

### Common Error Codes

- **400 Bad Request**: Invalid input or validation failure
- **401 Unauthorized**: User not authenticated
- **403 Forbidden**: User lacks required permissions
- **404 Not Found**: API key not found
- **409 Conflict**: Maximum key limit reached or duplicate
- **500 Internal Server Error**: Server-side error

## Testing

### Manual Testing

1. **Create API Key**:
   ```bash
   curl -X POST http://localhost:3000/api/api-keys \
     -H "Content-Type: application/json" \
     -d '{
       "organization_id": "YOUR_ORG_ID",
       "name": "Test Key",
       "rate_limit_per_minute": 10
     }'
   ```

2. **List API Keys**:
   ```bash
   curl http://localhost:3000/api/api-keys?organization_id=YOUR_ORG_ID
   ```

3. **Get API Key Details**:
   ```bash
   curl http://localhost:3000/api/api-keys/KEY_ID?organization_id=YOUR_ORG_ID
   ```

4. **Revoke API Key**:
   ```bash
   curl -X DELETE http://localhost:3000/api/api-keys/KEY_ID?organization_id=YOUR_ORG_ID
   ```

### Integration Testing

Test the following scenarios:
- ✅ Creating a key returns full key only once
- ✅ Listing keys shows masked values
- ✅ Maximum 5 active keys per organization
- ✅ Only admin/owner can create/revoke keys
- ✅ Keys are hashed before storage
- ✅ Revoking marks key as inactive (not deleted)
- ✅ Cannot revoke already revoked key

## Next Steps

### Frontend Implementation
1. Create API Keys management page at `/[orgSlug]/settings/api-keys`
2. Display list of API keys in a table
3. Add "Create API Key" form with modal
4. Show full key in a modal after creation (with copy button)
5. Add confirmation dialog for key revocation
6. Show usage statistics and last used timestamp

### Public API Integration
1. Implement `/api/public/leads` endpoint
2. Validate API keys using `verifyApiKey()` function
3. Update `last_used_at` and `usage_count` on each request
4. Implement rate limiting per API key
5. Check CORS against `allowed_domains`

## Support

For questions or issues with the API Key Management system:
1. Check the Phase 2 Technical Specification
2. Review this implementation guide
3. Verify database schema matches specification
4. Ensure bcrypt is properly installed

## Changelog

**Version 1.0** (2025-12-16)
- Initial implementation
- Complete CRUD operations for API keys
- Secure key generation with crypto.randomBytes
- Bcrypt hashing for key storage
- Masked key display
- Maximum 5 keys per organization
- Soft delete with audit trail
