import { createServerSupabaseClient, getCurrentUser } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateLeadSchema } from '@/lib/validations/leads'
import { userHasRole } from '@/lib/supabase/helpers'

/**
 * GET /api/leads/[id]
 *
 * Fetch complete details for a single lead including activity timeline
 *
 * Authentication: Requires authenticated Supabase session
 * Authorization: User must be member of lead's organization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid lead ID format',
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

    // Fetch lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        {
          success: false,
          error: 'Lead not found or access denied',
        },
        { status: 404 }
      )
    }

    // Check authorization - user must be member of lead's organization
    const { hasRole, error: roleError } = await userHasRole(
      supabase,
      lead.organization_id,
      'member'
    )

    if (roleError || !hasRole) {
      return NextResponse.json(
        {
          success: false,
          error: 'Lead not found or access denied',
        },
        { status: 404 }
      )
    }

    // Fetch activity timeline
    const { data: activityLogs, error: activityError } = await supabase
      .from('lead_activity_log')
      .select(`
        id,
        activity_type,
        description,
        performed_by,
        created_at
      `)
      .eq('lead_id', id)
      .order('created_at', { ascending: false })

    if (activityError) {
      console.error('Error fetching activity logs:', activityError)
    }

    // Enhance activity logs with user names
    const activityWithUsers = activityLogs
      ? await Promise.all(
          activityLogs.map(async (activity) => {
            if (activity.performed_by) {
              const { data: userData } = await supabase
                .from('users')
                .select('full_name')
                .eq('id', activity.performed_by)
                .single()

              return {
                id: activity.id,
                activity_type: activity.activity_type,
                description: activity.description,
                performed_by: activity.performed_by,
                performed_by_name: userData?.full_name || null,
                created_at: activity.created_at,
              }
            }

            return {
              id: activity.id,
              activity_type: activity.activity_type,
              description: activity.description,
              performed_by: null,
              performed_by_name: null,
              created_at: activity.created_at,
            }
          })
        )
      : []

    // Return complete lead data with activity timeline
    return NextResponse.json(
      {
        success: true,
        data: {
          id: lead.id,
          organization_id: lead.organization_id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          status: lead.status,
          source: lead.source,
          lead_score: lead.lead_score,
          product_interests: lead.product_interests,
          conversation_id: lead.conversation_id,
          conversation_summary: lead.conversation_summary,
          utm_source: lead.utm_source,
          utm_medium: lead.utm_medium,
          utm_campaign: lead.utm_campaign,
          utm_term: lead.utm_term,
          utm_content: lead.utm_content,
          referrer_url: lead.referrer_url,
          landing_page: lead.landing_page,
          user_agent: lead.user_agent,
          ip_address: lead.ip_address,
          location_country: lead.location_country,
          location_city: lead.location_city,
          metadata: lead.metadata,
          notes: lead.notes,
          internal_notes: lead.internal_notes,
          created_at: lead.created_at,
          updated_at: lead.updated_at,
          last_contacted_at: lead.last_contacted_at,
          converted_at: lead.converted_at,
          activity: activityWithUsers,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error in GET /api/leads/[id]:', error)
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
 * PATCH /api/leads/[id]
 *
 * Update lead fields (status, score, notes, metadata)
 *
 * Request Body:
 * {
 *   status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
 *   lead_score?: number (0-100)
 *   notes?: string
 *   internal_notes?: string
 *   metadata?: Record<string, any>
 * }
 *
 * Authentication: Requires authenticated Supabase session
 * Authorization: User must be admin or owner of lead's organization
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid lead ID format',
        },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = updateLeadSchema.safeParse(body)

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

    const updates = validation.data

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

    // Fetch current lead to check organization and current values
    const { data: currentLead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single()

    if (leadError || !currentLead) {
      return NextResponse.json(
        {
          success: false,
          error: 'Lead not found or access denied',
        },
        { status: 404 }
      )
    }

    // Check authorization - user must be admin or owner
    const { hasRole, error: roleError } = await userHasRole(
      supabase,
      currentLead.organization_id,
      'admin'
    )

    if (roleError || !hasRole) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied: User must be admin or owner to update leads',
        },
        { status: 403 }
      )
    }

    // Update lead
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating lead:', updateError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update lead',
          message: updateError.message,
        },
        { status: 500 }
      )
    }

    // Log activity for status changes
    if (updates.status && updates.status !== currentLead.status) {
      const activityDescription = `Status changed from ${currentLead.status} to ${updates.status}`

      const { error: activityError } = await supabase
        .from('lead_activity_log')
        .insert({
          lead_id: id,
          organization_id: currentLead.organization_id,
          activity_type: 'status_changed',
          old_value: currentLead.status,
          new_value: updates.status,
          description: activityDescription,
          performed_by: user.id,
          metadata: {},
        })

      if (activityError) {
        console.error('Error logging activity:', activityError)
        // Don't fail the request if activity logging fails
      }
    }

    // Log activity for note additions
    if (updates.notes && updates.notes !== currentLead.notes) {
      const { error: activityError } = await supabase
        .from('lead_activity_log')
        .insert({
          lead_id: id,
          organization_id: currentLead.organization_id,
          activity_type: 'note_added',
          description: 'Note added',
          performed_by: user.id,
          metadata: {},
        })

      if (activityError) {
        console.error('Error logging note activity:', activityError)
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: updatedLead.id,
          status: updatedLead.status,
          lead_score: updatedLead.lead_score,
          notes: updatedLead.notes,
          internal_notes: updatedLead.internal_notes,
          metadata: updatedLead.metadata,
          updated_at: updatedLead.updated_at,
          last_contacted_at: updatedLead.last_contacted_at,
        },
        message: 'Lead updated successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error in PATCH /api/leads/[id]:', error)
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
