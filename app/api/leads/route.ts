import { createServerSupabaseClient, getCurrentUser } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getLeadsQuerySchema, formatPagination, sanitizeSearchQuery } from '@/lib/validations/leads'
import { userHasRole } from '@/lib/supabase/helpers'

/**
 * GET /api/leads
 *
 * Fetch paginated, filtered, searchable lead list for dashboard
 *
 * Query Parameters:
 * - organization_id: string (required) - UUID of organization
 * - page: number (default: 1) - Page number
 * - limit: number (default: 20, max: 100) - Items per page
 * - status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost' | 'all' (default: 'all')
 * - source: 'chatbot' | 'manual' | 'import' | 'web_form' | 'referral' | 'all' (default: 'all')
 * - date_from: string (optional) - ISO date (YYYY-MM-DD)
 * - date_to: string (optional) - ISO date (YYYY-MM-DD)
 * - search: string (optional) - Search name or email
 * - sort: 'created_at' | 'lead_score' | 'name' | 'status' (default: 'created_at')
 * - order: 'asc' | 'desc' (default: 'desc')
 *
 * Authentication: Requires authenticated Supabase session
 * Authorization: User must be member of organization
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters from URL
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validate query parameters
    const validation = getLeadsQuerySchema.safeParse(queryParams)

    if (!validation.success) {
      const firstError = validation.error.errors[0]
      return NextResponse.json(
        {
          success: false,
          error: firstError.message,
          field: firstError.path[0],
        },
        { status: 400 }
      )
    }

    const {
      organization_id,
      page,
      limit,
      status,
      source,
      date_from,
      date_to,
      search,
      sort,
      order,
    } = validation.data

    // Validate date range
    if (date_from && date_to && new Date(date_from) > new Date(date_to)) {
      return NextResponse.json(
        {
          success: false,
          error: 'date_from must be before date_to',
          field: 'date_from',
        },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabase = await createServerSupabaseClient()

    // Check authentication
    const user = await getCurrentUser(supabase)
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Please sign in',
        },
        { status: 401 }
      )
    }

    // Check authorization - user must be member of organization
    const { hasRole, error: roleError } = await userHasRole(
      supabase,
      organization_id,
      'member'
    )

    if (roleError || !hasRole) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied: User is not a member of this organization',
        },
        { status: 403 }
      )
    }

    // Build query
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('organization_id', organization_id)

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply source filter
    if (source !== 'all') {
      query = query.eq('source', source)
    }

    // Apply date range filter
    if (date_from) {
      query = query.gte('created_at', `${date_from}T00:00:00Z`)
    }
    if (date_to) {
      query = query.lte('created_at', `${date_to}T23:59:59Z`)
    }

    // Apply search filter (name or email)
    if (search) {
      const sanitizedSearch = sanitizeSearchQuery(search)
      query = query.or(`name.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%`)
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === 'asc' })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    // Execute query
    const { data: leads, error, count } = await query

    if (error) {
      console.error('Error fetching leads:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch leads',
          message: error.message,
        },
        { status: 500 }
      )
    }

    // Format response with pagination metadata
    const pagination = formatPagination(count || 0, page, limit)

    return NextResponse.json(
      {
        success: true,
        data: leads.map((lead) => ({
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          status: lead.status,
          source: lead.source,
          lead_score: lead.lead_score,
          product_interests: lead.product_interests,
          created_at: lead.created_at,
          last_contacted_at: lead.last_contacted_at,
        })),
        pagination,
        filters: {
          status,
          source,
          date_from: date_from || null,
          date_to: date_to || null,
          search: search || null,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error in GET /api/leads:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
