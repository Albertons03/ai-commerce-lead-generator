# Internal Leads API - Quick Start Guide

This guide helps you quickly integrate the Internal Leads API into your frontend application.

## Prerequisites

- User must be authenticated with Supabase
- User must be a member of the organization
- Organization ID available in your app context

## Installation

No installation needed - the API is already implemented and ready to use.

## Quick Examples

### 1. Fetch Leads List (with TypeScript)

```typescript
import { useState, useEffect } from 'react'

interface Lead {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
  source: 'chatbot' | 'manual' | 'import' | 'web_form' | 'referral'
  lead_score: number
  product_interests: string[]
  created_at: string
  last_contacted_at: string | null
}

interface LeadsResponse {
  success: boolean
  data: Lead[]
  pagination: {
    total: number
    page: number
    limit: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
  filters: {
    status: string
    source: string
    date_from: string | null
    date_to: string | null
    search: string | null
  }
}

function LeadsList({ organizationId }: { organizationId: string }) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLeads() {
      try {
        const params = new URLSearchParams({
          organization_id: organizationId,
          page: '1',
          limit: '20',
          status: 'all',
          sort: 'created_at',
          order: 'desc',
        })

        const response = await fetch(`/api/leads?${params}`)
        const data: LeadsResponse = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch leads')
        }

        setLeads(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchLeads()
  }, [organizationId])

  if (loading) return <div>Loading leads...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h2>Leads</h2>
      <ul>
        {leads.map((lead) => (
          <li key={lead.id}>
            <strong>{lead.name}</strong> - {lead.email} (Score: {lead.lead_score})
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### 2. Fetch Single Lead Details

```typescript
async function fetchLeadDetails(leadId: string) {
  const response = await fetch(`/api/leads/${leadId}`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch lead')
  }

  return data.data // Returns full lead object with activity timeline
}

// Usage
const lead = await fetchLeadDetails('550e8400-e29b-41d4-a716-446655440000')
console.log(lead.name, lead.email, lead.activity)
```

### 3. Update Lead Status

```typescript
async function updateLeadStatus(leadId: string, newStatus: string) {
  const response = await fetch(`/api/leads/${leadId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: newStatus,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update lead')
  }

  return data.data
}

// Usage
try {
  await updateLeadStatus(leadId, 'contacted')
  alert('Lead updated successfully!')
} catch (error) {
  alert('Failed to update lead: ' + error.message)
}
```

### 4. Update Lead Score and Notes

```typescript
async function updateLead(
  leadId: string,
  updates: {
    status?: string
    lead_score?: number
    notes?: string
    internal_notes?: string
  }
) {
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

  return data.data
}

// Usage
await updateLead(leadId, {
  status: 'qualified',
  lead_score: 85,
  notes: 'Customer is interested in premium plan',
  internal_notes: 'High priority - follow up ASAP',
})
```

### 5. Fetch Dashboard Statistics

```typescript
interface LeadStats {
  total_leads: number
  new_leads: number
  qualified_leads: number
  converted_leads: number
  avg_lead_score: number
  conversion_rate: number
  change: {
    total_leads: string
    new_leads: string
    conversion_rate: string
  }
}

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

  return data.data as LeadStats
}

// Usage
const stats = await fetchLeadStats(organizationId)
console.log(`Total Leads: ${stats.total_leads}`)
console.log(`Conversion Rate: ${stats.conversion_rate}%`)
console.log(`Change: ${stats.change.total_leads}`)
```

### 6. Search Leads

```typescript
async function searchLeads(organizationId: string, query: string) {
  const params = new URLSearchParams({
    organization_id: organizationId,
    search: query,
    page: '1',
    limit: '20',
  })

  const response = await fetch(`/api/leads?${params}`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to search leads')
  }

  return data.data
}

// Usage
const results = await searchLeads(organizationId, 'john@example.com')
```

### 7. Filter Leads by Status and Date

```typescript
async function fetchFilteredLeads(
  organizationId: string,
  filters: {
    status?: string
    source?: string
    dateFrom?: string
    dateTo?: string
  }
) {
  const params = new URLSearchParams({
    organization_id: organizationId,
    page: '1',
    limit: '20',
  })

  if (filters.status) params.append('status', filters.status)
  if (filters.source) params.append('source', filters.source)
  if (filters.dateFrom) params.append('date_from', filters.dateFrom)
  if (filters.dateTo) params.append('date_to', filters.dateTo)

  const response = await fetch(`/api/leads?${params}`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch leads')
  }

  return data.data
}

// Usage
const newLeads = await fetchFilteredLeads(organizationId, {
  status: 'new',
  dateFrom: '2025-12-01',
  dateTo: '2025-12-31',
})
```

## React Hook Example

Create a custom hook for managing leads:

```typescript
import { useState, useCallback } from 'react'

export function useLeads(organizationId: string) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLeads = useCallback(
    async (filters: {
      page?: number
      status?: string
      search?: string
    } = {}) => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          organization_id: organizationId,
          page: String(filters.page || 1),
          limit: '20',
          ...(filters.status && { status: filters.status }),
          ...(filters.search && { search: filters.search }),
        })

        const response = await fetch(`/api/leads?${params}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch leads')
        }

        setLeads(data.data)
        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [organizationId]
  )

  const updateLead = useCallback(async (leadId: string, updates: any) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update lead')
      }

      // Update local state
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, ...data.data } : lead
        )
      )

      return data.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    leads,
    loading,
    error,
    fetchLeads,
    updateLead,
  }
}

// Usage in component
function LeadsPage({ organizationId }: { organizationId: string }) {
  const { leads, loading, error, fetchLeads, updateLead } = useLeads(organizationId)

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      await updateLead(leadId, { status: newStatus })
      alert('Lead updated!')
    } catch (err) {
      alert('Update failed!')
    }
  }

  // ... render leads
}
```

## Error Handling

Always handle errors properly:

```typescript
async function safeApiCall<T>(apiCall: () => Promise<T>): Promise<T | null> {
  try {
    return await apiCall()
  } catch (error) {
    if (error instanceof Response) {
      const data = await error.json()
      console.error('API Error:', data.error)
      // Show error to user
      return null
    }
    console.error('Unexpected error:', error)
    return null
  }
}

// Usage
const leads = await safeApiCall(() => fetchLeads(organizationId))
```

## Common Filters

### Status Filter
- `new` - Just created, not yet reviewed
- `contacted` - Sales team has reached out
- `qualified` - Confirmed as legitimate prospect
- `converted` - Successfully became a customer
- `lost` - Not interested or unresponsive
- `all` - No filter (default)

### Source Filter
- `chatbot` - Created from AI chatbot
- `manual` - Manually added
- `import` - Bulk imported
- `web_form` - Website contact form
- `referral` - Referred by existing customer
- `all` - No filter (default)

### Sort Options
- `created_at` - By creation date (default)
- `lead_score` - By quality score
- `name` - Alphabetically by name
- `status` - By status

## Permission Requirements

| Action | Required Role | Endpoint |
|--------|---------------|----------|
| View leads | Member | GET /api/leads |
| View lead details | Member | GET /api/leads/[id] |
| Update lead | Admin/Owner | PATCH /api/leads/[id] |
| View statistics | Member | GET /api/leads/stats |

## Testing

Test endpoints with browser console:

```javascript
// Test in browser console (must be authenticated)
async function testLeadsApi() {
  const orgId = 'YOUR_ORG_ID'

  // Test list
  const response = await fetch(`/api/leads?organization_id=${orgId}`)
  console.log(await response.json())

  // Test stats
  const statsResponse = await fetch(`/api/leads/stats?organization_id=${orgId}`)
  console.log(await statsResponse.json())
}

testLeadsApi()
```

## Troubleshooting

### 401 Unauthorized
- User not authenticated
- Session expired
- Clear cookies and log in again

### 403 Forbidden
- User not member of organization
- Insufficient permissions (need admin for updates)
- Check user's role in organization

### 404 Not Found
- Invalid lead ID
- Lead doesn't belong to user's organization
- Lead may have been deleted

### 400 Bad Request
- Invalid query parameters
- Invalid request body
- Check validation errors in response

## Need Help?

- Full API Documentation: `app/api/leads/README.md`
- Helper Functions: `lib/supabase/leads-helpers.ts`
- Validation Schemas: `lib/validations/leads.ts`
- Type Definitions: `lib/supabase/types.ts`

## Next Steps

1. Integrate leads list into your dashboard
2. Create lead detail page with activity timeline
3. Add filters and search UI
4. Display statistics cards
5. Implement lead status workflow
6. Add notifications for new leads
