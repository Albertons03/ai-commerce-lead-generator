# Internal Leads API Documentation

This directory contains the Internal Leads Management API implementation for Phase 2 of the AI E-Commerce Lead Generator project.

## Overview

The Internal Leads API provides secure, authenticated endpoints for managing leads captured from chatbot interactions and other sources. All endpoints require user authentication and respect Row Level Security (RLS) policies defined in the database.

## Authentication & Authorization

- **Authentication**: All endpoints require a valid Supabase session cookie
- **Authorization**: Users must be members of the organization to access leads
- **Admin/Owner Requirements**: Updating leads requires admin or owner role

## API Endpoints

### 1. GET /api/leads

Fetch paginated, filtered, searchable lead list for dashboard.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `organization_id` | UUID | Yes | - | Organization UUID |
| `page` | number | No | 1 | Page number (min: 1) |
| `limit` | number | No | 20 | Items per page (min: 1, max: 100) |
| `status` | enum | No | 'all' | Filter by status: 'new', 'contacted', 'qualified', 'converted', 'lost', 'all' |
| `source` | enum | No | 'all' | Filter by source: 'chatbot', 'manual', 'import', 'web_form', 'referral', 'all' |
| `date_from` | string | No | - | Start date (YYYY-MM-DD) |
| `date_to` | string | No | - | End date (YYYY-MM-DD) |
| `search` | string | No | - | Search name or email (max 100 chars) |
| `sort` | enum | No | 'created_at' | Sort by: 'created_at', 'lead_score', 'name', 'status' |
| `order` | enum | No | 'desc' | Sort order: 'asc', 'desc' |

**Example Request:**
```bash
GET /api/leads?organization_id=550e8400-e29b-41d4-a716-446655440000&page=1&limit=20&status=new&search=john&sort=created_at&order=desc
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1-555-123-4567",
      "company": "Acme Corp",
      "status": "new",
      "source": "chatbot",
      "lead_score": 75,
      "product_interests": ["Product A", "Product B"],
      "created_at": "2025-12-16T10:30:00Z",
      "last_contacted_at": null
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  },
  "filters": {
    "status": "new",
    "source": "all",
    "date_from": null,
    "date_to": null,
    "search": "john"
  }
}
```

**Error Responses:**
- `400`: Invalid query parameters
- `401`: Unauthorized (not authenticated)
- `403`: Access denied (not member of organization)
- `500`: Internal server error

---

### 2. GET /api/leads/[id]

Fetch complete details for a single lead including activity timeline.

**URL Parameters:**
- `id` (UUID): Lead ID

**Example Request:**
```bash
GET /api/leads/550e8400-e29b-41d4-a716-446655440000
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "organization_id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-123-4567",
    "company": "Acme Corp",
    "status": "new",
    "source": "chatbot",
    "lead_score": 75,
    "product_interests": ["Product A", "Product B"],
    "conversation_id": "uuid",
    "conversation_summary": "Customer asked about bulk pricing...",
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "spring_sale",
    "utm_term": "best widgets",
    "utm_content": "ad_variant_a",
    "referrer_url": "https://google.com",
    "landing_page": "https://example.com/products",
    "user_agent": "Mozilla/5.0...",
    "ip_address": "192.168.1.1",
    "location_country": "US",
    "location_city": "San Francisco",
    "metadata": {
      "custom_field": "value"
    },
    "notes": "Customer seems interested in premium package",
    "internal_notes": "Follow up next week",
    "created_at": "2025-12-16T10:30:00Z",
    "updated_at": "2025-12-16T15:45:00Z",
    "last_contacted_at": null,
    "converted_at": null,
    "activity": [
      {
        "id": "uuid",
        "activity_type": "created",
        "description": "Lead created via chatbot",
        "performed_by": null,
        "performed_by_name": null,
        "created_at": "2025-12-16T10:30:00Z"
      },
      {
        "id": "uuid",
        "activity_type": "note_added",
        "description": "Note added",
        "performed_by": "user-uuid",
        "performed_by_name": "Sarah Smith",
        "created_at": "2025-12-16T15:45:00Z"
      }
    ]
  }
}
```

**Error Responses:**
- `400`: Invalid lead ID format
- `401`: Unauthorized (not authenticated)
- `404`: Lead not found or access denied
- `500`: Internal server error

---

### 3. PATCH /api/leads/[id]

Update lead fields (status, score, notes, metadata).

**URL Parameters:**
- `id` (UUID): Lead ID

**Request Body:**
```json
{
  "status": "contacted",
  "lead_score": 85,
  "notes": "Customer responded positively, scheduling demo",
  "internal_notes": "High priority - mentioned $50k budget",
  "metadata": {
    "demo_scheduled": "2025-12-20T14:00:00Z"
  }
}
```

**Validation Rules:**
- At least one field must be provided
- `status`: Must be one of: 'new', 'contacted', 'qualified', 'converted', 'lost'
- `lead_score`: Integer between 0 and 100
- `notes`: Max 5000 characters
- `internal_notes`: Max 5000 characters
- `metadata`: Valid JSON object

**Example Request:**
```bash
PATCH /api/leads/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "status": "contacted",
  "lead_score": 85,
  "notes": "Customer responded positively..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "contacted",
    "lead_score": 85,
    "notes": "Customer responded positively...",
    "internal_notes": "High priority...",
    "metadata": {},
    "updated_at": "2025-12-16T16:00:00Z",
    "last_contacted_at": "2025-12-16T16:00:00Z"
  },
  "message": "Lead updated successfully"
}
```

**Activity Logging:**
- Status changes are automatically logged to `lead_activity_log` table
- Note additions are logged with activity type 'note_added'
- All activities include `performed_by` user ID

**Error Responses:**
- `400`: Invalid request body or validation error
- `401`: Unauthorized (not authenticated)
- `403`: Access denied (requires admin or owner role)
- `404`: Lead not found or access denied
- `500`: Internal server error

---

### 4. GET /api/leads/stats

Get lead statistics for dashboard cards.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `organization_id` | UUID | Yes | - | Organization UUID |
| `days_back` | number | No | 30 | Number of days to look back (min: 1, max: 365) |

**Example Request:**
```bash
GET /api/leads/stats?organization_id=550e8400-e29b-41d4-a716-446655440000&days_back=30
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "total_leads": 150,
    "new_leads": 23,
    "qualified_leads": 45,
    "converted_leads": 18,
    "avg_lead_score": 67.5,
    "conversion_rate": 12.0,
    "change": {
      "total_leads": "+15.3%",
      "new_leads": "+8.2%",
      "conversion_rate": "+2.3%"
    }
  },
  "period": {
    "days": 30,
    "start_date": "2025-11-16",
    "end_date": "2025-12-16"
  }
}
```

**Statistics Calculation:**
- Compares current period (last N days) with previous period (N days before that)
- Percentage changes show growth or decline
- Conversion rate = (converted_leads / total_leads) × 100

**Error Responses:**
- `400`: Invalid query parameters
- `401`: Unauthorized (not authenticated)
- `403`: Access denied (not member of organization)
- `500`: Internal server error

---

## Implementation Details

### File Structure

```
app/api/leads/
├── route.ts              # GET /api/leads (list)
├── [id]/
│   └── route.ts          # GET, PATCH /api/leads/[id] (detail, update)
├── stats/
│   └── route.ts          # GET /api/leads/stats (statistics)
└── README.md             # This file
```

### Dependencies

**Validation Schemas** (`lib/validations/leads.ts`):
- `getLeadsQuerySchema` - Validates GET /api/leads query params
- `updateLeadSchema` - Validates PATCH /api/leads/[id] body
- `getLeadStatsQuerySchema` - Validates GET /api/leads/stats query params
- Helper functions: `formatPagination`, `sanitizeSearchQuery`

**Supabase Helpers** (`lib/supabase/helpers.ts`):
- `userHasRole()` - Check user's role in organization
- Organization permission checks

**Supabase Client** (`lib/supabase/client.ts`):
- `createServerSupabaseClient()` - Create authenticated client
- `getCurrentUser()` - Get current authenticated user

### Security Features

1. **Authentication**: All endpoints verify user is authenticated
2. **Authorization**: Users must be members of the organization
3. **RLS Policies**: Database-level security enforced by Supabase
4. **Role-Based Access**: Admin/owner required for updates
5. **Input Validation**: All inputs validated with Zod schemas
6. **SQL Injection Prevention**: Parameterized queries only
7. **XSS Prevention**: Input sanitization for search queries

### Performance Optimizations

1. **Database Indexes**: Queries use indexes on:
   - `organization_id`
   - `status`
   - `source`
   - `created_at`
   - `lead_score`
   - Full-text search on name/email

2. **Pagination**: Limit max results to 100 per page

3. **Selective Fields**: List endpoint returns summary data only

4. **Query Optimization**: Uses Supabase query builder with proper filtering

### Error Handling

All endpoints follow consistent error response format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "field": "field_name (for validation errors)",
  "message": "Technical error details (in dev mode)"
}
```

HTTP Status Codes:
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### Activity Logging

The PATCH endpoint automatically logs activities to the `lead_activity_log` table:

**Status Changes:**
```json
{
  "activity_type": "status_changed",
  "old_value": "new",
  "new_value": "contacted",
  "description": "Status changed from new to contacted",
  "performed_by": "user-uuid"
}
```

**Note Additions:**
```json
{
  "activity_type": "note_added",
  "description": "Note added",
  "performed_by": "user-uuid"
}
```

## Usage Examples

### Frontend Integration (React/Next.js)

```typescript
// Fetch leads with filters
async function fetchLeads(filters: {
  organizationId: string
  page?: number
  status?: string
  search?: string
}) {
  const params = new URLSearchParams({
    organization_id: filters.organizationId,
    page: String(filters.page || 1),
    ...(filters.status && { status: filters.status }),
    ...(filters.search && { search: filters.search }),
  })

  const response = await fetch(`/api/leads?${params}`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch leads')
  }

  return data
}

// Fetch single lead
async function fetchLead(leadId: string) {
  const response = await fetch(`/api/leads/${leadId}`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch lead')
  }

  return data
}

// Update lead
async function updateLead(leadId: string, updates: {
  status?: string
  lead_score?: number
  notes?: string
}) {
  const response = await fetch(`/api/leads/${leadId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update lead')
  }

  return data
}

// Fetch statistics
async function fetchLeadStats(organizationId: string, daysBack = 30) {
  const params = new URLSearchParams({
    organization_id: organizationId,
    days_back: String(daysBack),
  })

  const response = await fetch(`/api/leads/stats?${params}`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch stats')
  }

  return data
}
```

## Testing

### Manual Testing with cURL

```bash
# List leads
curl -X GET "http://localhost:3000/api/leads?organization_id=uuid&page=1&limit=20" \
  -H "Cookie: sb-access-token=YOUR_TOKEN"

# Get lead details
curl -X GET "http://localhost:3000/api/leads/LEAD_UUID" \
  -H "Cookie: sb-access-token=YOUR_TOKEN"

# Update lead
curl -X PATCH "http://localhost:3000/api/leads/LEAD_UUID" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "contacted", "lead_score": 85}'

# Get statistics
curl -X GET "http://localhost:3000/api/leads/stats?organization_id=uuid&days_back=30" \
  -H "Cookie: sb-access-token=YOUR_TOKEN"
```

## Related Files

- **Validation Schemas**: `lib/validations/leads.ts`
- **Type Definitions**: `lib/supabase/types.ts`
- **Database Helpers**: `lib/supabase/helpers.ts`
- **Supabase Client**: `lib/supabase/client.ts`
- **Database Migration**: `supabase/migrations/20250116000000_create_leads_system.sql`
- **Technical Spec**: `PHASE_2_TECHNICAL_SPECIFICATION.md`

## Future Enhancements (Phase 3+)

- Export leads to CSV (POST /api/leads/export)
- Bulk update leads (PATCH /api/leads/bulk)
- Lead scoring algorithm improvements
- Email notification integration
- CRM integrations
- Advanced analytics and reporting
