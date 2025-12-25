# Lead Export API

## Endpoint
**POST** `/api/leads/export`

## Description
Exports leads from your organization to a CSV file. Supports filtering by status, source, date range, and search terms.

## Authentication
Requires valid Supabase authentication session (cookie-based).

## Request

### Headers
```
Content-Type: application/json
```

### Body (Optional)
```json
{
  "filters": {
    "status": "new" | "contacted" | "qualified" | "converted" | "lost" | ["new", "contacted"],
    "source": "chatbot" | "manual" | "import" | "web_form" | "referral",
    "date_range": {
      "start_date": "2024-01-01T00:00:00Z",
      "end_date": "2024-12-31T23:59:59Z"
    },
    "search": "search term"
  }
}
```

All filter fields are optional. Empty body `{}` exports all leads.

## Response

### Success (200)
Returns CSV file with the following fields:
- Name
- Email
- Phone
- Company
- Status
- Lead Score
- Source
- Created At
- UTM Source
- UTM Medium
- UTM Campaign
- UTM Term
- UTM Content

### Response Headers
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="leads_export_2024-12-16.csv"
X-Export-Count: 150
X-Export-Warning: Results limited to 1000 leads... (if applicable)
```

### Error Responses

#### 401 Unauthorized
```json
{
  "error": "Unauthorized. Please log in."
}
```

#### 403 Forbidden
```json
{
  "error": "No organization found for user"
}
```

#### 404 Not Found
```json
{
  "error": "No leads found matching the specified filters",
  "warning": null,
  "count": 0
}
```

#### 500 Internal Server Error
```json
{
  "error": "An unexpected error occurred during export",
  "details": "Error message"
}
```

## Examples

### Export All Leads
```bash
curl -X POST https://your-domain.com/api/leads/export \
  -H "Content-Type: application/json" \
  -d '{}' \
  --output leads.csv
```

### Export New Leads Only
```bash
curl -X POST https://your-domain.com/api/leads/export \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "status": "new"
    }
  }' \
  --output new_leads.csv
```

### Export with Multiple Filters
```bash
curl -X POST https://your-domain.com/api/leads/export \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "status": ["new", "contacted"],
      "source": "chatbot",
      "date_range": {
        "start_date": "2024-01-01T00:00:00Z",
        "end_date": "2024-12-31T23:59:59Z"
      },
      "search": "tech"
    }
  }' \
  --output filtered_leads.csv
```

### Frontend (React/Next.js) Example
```typescript
const exportLeads = async (filters?: ExportFilters) => {
  try {
    const response = await fetch('/api/leads/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filters: filters || {} }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    // Check for warning
    const warning = response.headers.get('X-Export-Warning');
    if (warning) {
      alert(warning);
    }

    // Download file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : 'leads_export.csv';

    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
};

// Usage
<button onClick={() => exportLeads({ status: 'new' })}>
  Export New Leads
</button>
```

## Limits
- Maximum 1000 leads per export
- If more than 1000 leads match your filters, a warning will be included in the `X-Export-Warning` header
- Consider using more specific filters to narrow results

## Audit Logging
All exports are logged to the `lead_activity_log` table with:
- Activity type: `export`
- Lead count
- Applied filters
- Timestamp
- User who performed the export

## Security
- Only authenticated users can export leads
- Users can only export leads from their organization(s)
- Row Level Security (RLS) policies enforced
- All exports are audited

## Performance
- Optimized for exports up to 1000 leads
- Single database query with indexed fields
- Efficient CSV generation
- Non-blocking audit log writes

## CSV Format
- RFC 4180 compliant
- UTF-8 encoded
- Special characters properly escaped
- Null values represented as empty strings
