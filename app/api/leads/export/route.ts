/**
 * =====================================================
 * Lead Export API Route
 * =====================================================
 * POST /api/leads/export
 *
 * Exports leads to CSV format with filtering support.
 * Implements Story 4.4 from Phase 2 Technical Specification.
 * =====================================================
 */

import { createServerSupabaseClient, getCurrentUser } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';
import type { LeadStatus, LeadSource, Lead, OrganizationMember } from '@/lib/supabase/types';

// =====================================================
// Types
// =====================================================

interface ExportFilters {
  status?: LeadStatus | LeadStatus[];
  source?: LeadSource | LeadSource[];
  date_range?: {
    start_date?: string;
    end_date?: string;
  };
  search?: string;
}

interface ExportRequestBody {
  filters?: ExportFilters;
}

// =====================================================
// Constants
// =====================================================

const EXPORT_LIMIT = 1000;

// CSV field headers and their corresponding database fields
const CSV_FIELDS = [
  { header: 'Name', field: 'name' },
  { header: 'Email', field: 'email' },
  { header: 'Phone', field: 'phone' },
  { header: 'Company', field: 'company' },
  { header: 'Status', field: 'status' },
  { header: 'Lead Score', field: 'lead_score' },
  { header: 'Source', field: 'source' },
  { header: 'Created At', field: 'created_at' },
  { header: 'UTM Source', field: 'utm_source' },
  { header: 'UTM Medium', field: 'utm_medium' },
  { header: 'UTM Campaign', field: 'utm_campaign' },
  { header: 'UTM Term', field: 'utm_term' },
  { header: 'UTM Content', field: 'utm_content' },
] as const;

// =====================================================
// Helper Functions
// =====================================================

/**
 * Escapes a CSV field value to handle special characters
 */
function escapeCsvField(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If the value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Converts an array of lead objects to CSV format
 */
function convertToCSV(leads: any[]): string {
  // Create CSV header row
  const headers = CSV_FIELDS.map(field => field.header).join(',');

  // Create CSV data rows
  const rows = leads.map(lead => {
    return CSV_FIELDS.map(({ field }) => {
      const value = lead[field];
      return escapeCsvField(value);
    }).join(',');
  });

  // Combine headers and rows
  return [headers, ...rows].join('\n');
}

/**
 * Generates a filename for the CSV export
 */
function generateFilename(): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  return `leads_export_${date}.csv`;
}

/**
 * Logs the export action for audit purposes
 */
async function logExportAction(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  organizationId: string,
  userId: string,
  leadCount: number,
  filters: ExportFilters
): Promise<void> {
  try {
    const logEntry = {
      lead_id: null as any, // This is an organization-level action
      organization_id: organizationId,
      activity_type: 'export',
      old_value: null,
      new_value: null,
      description: `Exported ${leadCount} leads to CSV`,
      performed_by: userId,
      metadata: {
        lead_count: leadCount,
        filters: filters,
        timestamp: new Date().toISOString(),
      },
    }
    await (supabase.from('lead_activity_log').insert as any)(logEntry);
  } catch (error) {
    // Log error but don't fail the export
    console.error('Failed to log export action:', error);
  }
}

// =====================================================
// Route Handler
// =====================================================

/**
 * POST /api/leads/export
 * Exports filtered leads to CSV format
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication Check
    const supabase = await createServerSupabaseClient();
    const user = await getCurrentUser(supabase);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // 2. Parse Request Body
    let filters: ExportFilters = {};
    try {
      const body: ExportRequestBody = await request.json();
      filters = body.filters || {};
    } catch (error) {
      // If body is empty or invalid, use empty filters
      filters = {};
    }

    // 3. Get User's Organizations
    const { data: userOrgs, error: orgError } = (await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)) as { data: Pick<OrganizationMember, 'organization_id'>[] | null; error: any };

    if (orgError) {
      console.error('Error fetching user organizations:', orgError);
      return NextResponse.json(
        { error: 'Failed to fetch user organizations' },
        { status: 500 }
      );
    }

    if (!userOrgs || userOrgs.length === 0) {
      return NextResponse.json(
        { error: 'No organization found for user' },
        { status: 403 }
      );
    }

    // Use the first organization (in a multi-org setup, you'd get this from context)
    const organizationId = userOrgs[0].organization_id;

    // 4. Build Query with Filters
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId);

    // Apply status filter
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    // Apply source filter
    if (filters.source) {
      if (Array.isArray(filters.source)) {
        query = query.in('source', filters.source);
      } else {
        query = query.eq('source', filters.source);
      }
    }

    // Apply date range filter
    if (filters.date_range) {
      if (filters.date_range.start_date) {
        query = query.gte('created_at', filters.date_range.start_date);
      }
      if (filters.date_range.end_date) {
        query = query.lte('created_at', filters.date_range.end_date);
      }
    }

    // Apply search filter (searches across name, email, company)
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.trim();
      query = query.or(
        `name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%`
      );
    }

    // Order by created_at descending for consistent exports
    query = query.order('created_at', { ascending: false });

    // Apply limit + 1 to check if there are more records
    query = query.limit(EXPORT_LIMIT + 1);

    // 5. Execute Query
    const { data: leads, error: leadsError, count } = (await query) as { data: Lead[] | null; error: any; count: number | null };

    if (leadsError) {
      console.error('Error fetching leads for export:', leadsError);
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    // 6. Check for Empty Results
    if (!leads || leads.length === 0) {
      return NextResponse.json(
        {
          error: 'No leads found matching the specified filters',
          warning: null,
          count: 0
        },
        { status: 404 }
      );
    }

    // 7. Check if Result Exceeds Limit
    let warning: string | null = null;
    let leadsToExport = leads;

    if (leads.length > EXPORT_LIMIT) {
      warning = `Results limited to ${EXPORT_LIMIT} leads. Total matching leads: ${count || leads.length}. Please use filters to narrow your export.`;
      leadsToExport = leads.slice(0, EXPORT_LIMIT);
    }

    // 8. Convert to CSV
    const csvContent = convertToCSV(leadsToExport);

    // 9. Log Export Action for Audit
    await logExportAction(
      supabase,
      organizationId,
      user.id,
      leadsToExport.length,
      filters
    );

    // 10. Return CSV Response
    const filename = generateFilename();

    // If there's a warning, include it in a custom header
    const headers: HeadersInit = {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Export-Count': String(leadsToExport.length),
    };

    if (warning) {
      headers['X-Export-Warning'] = warning;
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Unexpected error in lead export:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred during export',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
