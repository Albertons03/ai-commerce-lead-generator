import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'

/**
 * =====================================================
 * DELETE /api/api-keys/[id]
 * =====================================================
 * Revoke an API key (soft delete - marks as inactive)
 *
 * Path Parameters:
 *   - id: UUID (API key ID)
 *
 * Query Parameters:
 *   - organization_id: UUID (required)
 *
 * Returns:
 *   - 200: API key revoked successfully
 *   - 400: Validation error
 *   - 401: Unauthorized
 *   - 403: Forbidden (not admin/owner)
 *   - 404: API key not found
 *   - 500: Internal server error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Create Supabase client
    const supabase = await createServerSupabaseClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Please log in.',
        },
        { status: 401 }
      )
    }

    // Get and validate parameters
    const apiKeyId = params.id
    const { searchParams } = new URL(request.url)
    const organization_id = searchParams.get('organization_id')

    if (!apiKeyId || !organization_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters',
          message: 'Both API key ID and organization ID are required',
        },
        { status: 400 }
      )
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(apiKeyId) || !uuidRegex.test(organization_id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid ID format',
          message: 'API key ID and organization ID must be valid UUIDs',
        },
        { status: 400 }
      )
    }

    // Verify user is admin or owner of the organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organization_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden. You do not have access to this organization.',
        },
        { status: 403 }
      )
    }

    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden. Only owners and admins can revoke API keys.',
        },
        { status: 403 }
      )
    }

    // Check if the API key exists and belongs to the organization
    const { data: existingKey, error: fetchError } = await supabase
      .from('api_keys')
      .select('id, organization_id, name, is_active')
      .eq('id', apiKeyId)
      .eq('organization_id', organization_id)
      .single()

    if (fetchError || !existingKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'API key not found',
          message: 'The specified API key does not exist or does not belong to your organization.',
        },
        { status: 404 }
      )
    }

    // Check if already revoked
    if (!existingKey.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: 'API key already revoked',
          message: 'This API key has already been revoked.',
        },
        { status: 400 }
      )
    }

    // Revoke the API key (soft delete)
    const { error: updateError } = await supabase
      .from('api_keys')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_by: user.id,
      })
      .eq('id', apiKeyId)
      .eq('organization_id', organization_id)

    if (updateError) {
      console.error('Error revoking API key:', updateError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to revoke API key',
          message: updateError.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'API key revoked successfully',
        data: {
          id: apiKeyId,
          name: existingKey.name,
          revoked_at: new Date().toISOString(),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error in DELETE /api/api-keys/[id]:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * =====================================================
 * GET /api/api-keys/[id]
 * =====================================================
 * Get details of a specific API key
 *
 * Path Parameters:
 *   - id: UUID (API key ID)
 *
 * Query Parameters:
 *   - organization_id: UUID (required)
 *
 * Returns:
 *   - 200: API key details (masked)
 *   - 400: Validation error
 *   - 401: Unauthorized
 *   - 403: Forbidden
 *   - 404: API key not found
 *   - 500: Internal server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Create Supabase client
    const supabase = await createServerSupabaseClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Please log in.',
        },
        { status: 401 }
      )
    }

    // Get and validate parameters
    const apiKeyId = params.id
    const { searchParams } = new URL(request.url)
    const organization_id = searchParams.get('organization_id')

    if (!apiKeyId || !organization_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters',
          message: 'Both API key ID and organization ID are required',
        },
        { status: 400 }
      )
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(apiKeyId) || !uuidRegex.test(organization_id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid ID format',
          message: 'API key ID and organization ID must be valid UUIDs',
        },
        { status: 400 }
      )
    }

    // Verify user has access to this organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organization_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden. You do not have access to this organization.',
        },
        { status: 403 }
      )
    }

    // Fetch the API key
    const { data: apiKey, error: fetchError } = await supabase
      .from('api_keys')
      .select(
        `
        id,
        name,
        key_prefix,
        is_active,
        last_used_at,
        usage_count,
        created_at,
        allowed_domains,
        rate_limit_per_minute,
        revoked_at
      `
      )
      .eq('id', apiKeyId)
      .eq('organization_id', organization_id)
      .single()

    if (fetchError || !apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'API key not found',
          message: 'The specified API key does not exist or does not belong to your organization.',
        },
        { status: 404 }
      )
    }

    // Import maskKey function
    const { maskKey } = await import('@/lib/utils/api-keys')

    // Return masked key details
    return NextResponse.json(
      {
        success: true,
        data: {
          id: apiKey.id,
          name: apiKey.name,
          key_display: maskKey(apiKey.key_prefix),
          is_active: apiKey.is_active,
          last_used_at: apiKey.last_used_at,
          usage_count: apiKey.usage_count,
          created_at: apiKey.created_at,
          allowed_domains: apiKey.allowed_domains,
          rate_limit_per_minute: apiKey.rate_limit_per_minute,
          revoked_at: apiKey.revoked_at,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error in GET /api/api-keys/[id]:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
