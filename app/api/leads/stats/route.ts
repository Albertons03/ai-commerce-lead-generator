import { createServerSupabaseClient, getCurrentUser } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getLeadStatsQuerySchema } from '@/lib/validations/leads'
import { userHasRole } from '@/lib/supabase/helpers'

/**
 * GET /api/leads/stats
 *
 * Get lead statistics for dashboard cards
 *
 * Query Parameters:
 * - organization_id: string (required) - UUID of organization
 * - days_back: number (default: 30) - Number of days to look back for statistics
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
    const validation = getLeadStatsQuerySchema.safeParse(queryParams)

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

    const { organization_id, days_back } = validation.data

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

    // Calculate date ranges
    const now = new Date()
    const currentPeriodStart = new Date(now.getTime() - days_back * 24 * 60 * 60 * 1000)
    const previousPeriodStart = new Date(currentPeriodStart.getTime() - days_back * 24 * 60 * 60 * 1000)

    // Format dates for PostgreSQL
    const formatDate = (date: Date) => date.toISOString()

    // Fetch current period statistics
    const { data: currentStats, error: currentError } = await supabase.rpc(
      'get_lead_stats',
      {
        p_organization_id: organization_id,
        p_start_date: formatDate(currentPeriodStart),
        p_end_date: formatDate(now),
      }
    )

    if (currentError) {
      console.error('Error fetching current stats:', currentError)
      // If the RPC function doesn't exist, fall back to manual queries
      return await fetchStatsManually(
        supabase,
        organization_id,
        currentPeriodStart,
        now,
        previousPeriodStart,
        currentPeriodStart,
        days_back
      )
    }

    // Fetch previous period statistics for comparison
    const { data: previousStats, error: previousError } = await supabase.rpc(
      'get_lead_stats',
      {
        p_organization_id: organization_id,
        p_start_date: formatDate(previousPeriodStart),
        p_end_date: formatDate(currentPeriodStart),
      }
    )

    if (previousError) {
      console.error('Error fetching previous stats:', previousError)
    }

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number): string => {
      if (previous === 0) return current > 0 ? '+100%' : '0%'
      const change = ((current - previous) / previous) * 100
      const sign = change >= 0 ? '+' : ''
      return `${sign}${change.toFixed(1)}%`
    }

    const current = currentStats || {
      total_leads: 0,
      new_leads: 0,
      qualified_leads: 0,
      converted_leads: 0,
      avg_lead_score: 0,
    }

    const previous = previousStats || {
      total_leads: 0,
      new_leads: 0,
      qualified_leads: 0,
      converted_leads: 0,
      avg_lead_score: 0,
    }

    const conversionRate = current.total_leads > 0
      ? (current.converted_leads / current.total_leads) * 100
      : 0

    const previousConversionRate = previous.total_leads > 0
      ? (previous.converted_leads / previous.total_leads) * 100
      : 0

    return NextResponse.json(
      {
        success: true,
        data: {
          total_leads: current.total_leads,
          new_leads: current.new_leads,
          qualified_leads: current.qualified_leads,
          converted_leads: current.converted_leads,
          avg_lead_score: parseFloat(current.avg_lead_score.toFixed(1)),
          conversion_rate: parseFloat(conversionRate.toFixed(1)),
          change: {
            total_leads: calculateChange(current.total_leads, previous.total_leads),
            new_leads: calculateChange(current.new_leads, previous.new_leads),
            conversion_rate: calculateChange(conversionRate, previousConversionRate),
          },
        },
        period: {
          days: days_back,
          start_date: currentPeriodStart.toISOString().split('T')[0],
          end_date: now.toISOString().split('T')[0],
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error in GET /api/leads/stats:', error)
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

/**
 * Fallback function to fetch stats manually if RPC function doesn't exist
 */
async function fetchStatsManually(
  supabase: any,
  organizationId: string,
  currentStart: Date,
  currentEnd: Date,
  previousStart: Date,
  previousEnd: Date,
  daysBack: number
) {
  try {
    // Fetch current period leads
    const { data: currentLeads, error: currentError } = await supabase
      .from('leads')
      .select('status, lead_score')
      .eq('organization_id', organizationId)
      .gte('created_at', currentStart.toISOString())
      .lte('created_at', currentEnd.toISOString())

    if (currentError) {
      throw currentError
    }

    // Fetch previous period leads
    const { data: previousLeads, error: previousError } = await supabase
      .from('leads')
      .select('status, lead_score')
      .eq('organization_id', organizationId)
      .gte('created_at', previousStart.toISOString())
      .lte('created_at', previousEnd.toISOString())

    if (previousError) {
      throw previousError
    }

    // Calculate current period stats
    const currentStats = {
      total_leads: currentLeads.length,
      new_leads: currentLeads.filter((l) => l.status === 'new').length,
      qualified_leads: currentLeads.filter((l) => l.status === 'qualified').length,
      converted_leads: currentLeads.filter((l) => l.status === 'converted').length,
      avg_lead_score:
        currentLeads.length > 0
          ? currentLeads.reduce((sum, l) => sum + l.lead_score, 0) / currentLeads.length
          : 0,
    }

    // Calculate previous period stats
    const previousStats = {
      total_leads: previousLeads.length,
      new_leads: previousLeads.filter((l) => l.status === 'new').length,
      qualified_leads: previousLeads.filter((l) => l.status === 'qualified').length,
      converted_leads: previousLeads.filter((l) => l.status === 'converted').length,
      avg_lead_score:
        previousLeads.length > 0
          ? previousLeads.reduce((sum, l) => sum + l.lead_score, 0) / previousLeads.length
          : 0,
    }

    // Calculate changes
    const calculateChange = (current: number, previous: number): string => {
      if (previous === 0) return current > 0 ? '+100%' : '0%'
      const change = ((current - previous) / previous) * 100
      const sign = change >= 0 ? '+' : ''
      return `${sign}${change.toFixed(1)}%`
    }

    const conversionRate =
      currentStats.total_leads > 0
        ? (currentStats.converted_leads / currentStats.total_leads) * 100
        : 0

    const previousConversionRate =
      previousStats.total_leads > 0
        ? (previousStats.converted_leads / previousStats.total_leads) * 100
        : 0

    return NextResponse.json(
      {
        success: true,
        data: {
          total_leads: currentStats.total_leads,
          new_leads: currentStats.new_leads,
          qualified_leads: currentStats.qualified_leads,
          converted_leads: currentStats.converted_leads,
          avg_lead_score: parseFloat(currentStats.avg_lead_score.toFixed(1)),
          conversion_rate: parseFloat(conversionRate.toFixed(1)),
          change: {
            total_leads: calculateChange(currentStats.total_leads, previousStats.total_leads),
            new_leads: calculateChange(currentStats.new_leads, previousStats.new_leads),
            conversion_rate: calculateChange(conversionRate, previousConversionRate),
          },
        },
        period: {
          days: daysBack,
          start_date: currentStart.toISOString().split('T')[0],
          end_date: currentEnd.toISOString().split('T')[0],
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in manual stats fetch:', error)
    throw error
  }
}
