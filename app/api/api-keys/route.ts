import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import { getApiKeysSchema, createApiKeySchema } from '@/lib/validations/api-keys'
import { generateAndHashApiKey, maskKey } from '@/lib/utils/api-keys'
import { ZodError } from 'zod'

/**
 * =====================================================
 * GET /api/api-keys
 * =====================================================
 * List all API keys for an organization
 *
 * Query Parameters:
 *   - organization_id: UUID (required)
 *
 * Returns:
 *   - 200: List of API keys (masked)
 *   - 400: Validation error
 *   - 401: Unauthorized
 *   - 403: Forbidden (not a member of the organization)
 *   - 500: Internal server error
 */
export async function GET(request: NextRequest) {
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

    // Get and validate query parameters
    const { searchParams } = new URL(request.url)
    const organization_id = searchParams.get('organization_id')

    const validation = getApiKeysSchema.safeParse({ organization_id })

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const { organization_id: orgId } = validation.data

    // Verify user has access to this organization
    const { data: membership, error: membershipError } = (await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .single()) as { data: { role: string } | null; error: any }

    if (membershipError || !membership) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden. You do not have access to this organization.',
        },
        { status: 403 }
      )
    }

    // Fetch API keys for the organization
    // RLS policies will ensure user can only see keys for their organizations
    const { data: apiKeys, error: keysError } = (await supabase
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
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })) as {
        data: Array<{
          id: string;
          name: string;
          key_prefix: string;
          is_active: boolean;
          last_used_at: string | null;
          usage_count: number;
          created_at: string;
          allowed_domains: string[];
          rate_limit_per_minute: number;
          revoked_at: string | null;
        }> | null;
        error: any;
      }

    if (keysError) {
      console.error('Error fetching API keys:', keysError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch API keys',
          message: keysError.message,
        },
        { status: 500 }
      )
    }

    // Mask the keys for display
    const maskedKeys = (apiKeys || []).map((key) => ({
      id: key.id,
      name: key.name,
      key_display: maskKey(key.key_prefix),
      is_active: key.is_active,
      last_used_at: key.last_used_at,
      usage_count: key.usage_count,
      created_at: key.created_at,
      allowed_domains: key.allowed_domains,
      rate_limit_per_minute: key.rate_limit_per_minute,
      revoked_at: key.revoked_at,
    }))

    return NextResponse.json(
      {
        success: true,
        data: maskedKeys,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error in GET /api/api-keys:', error)
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
 * POST /api/api-keys
 * =====================================================
 * Generate a new API key for an organization
 *
 * Request Body:
 *   - organization_id: UUID (required)
 *   - name: string (required, 3-100 chars)
 *   - allowed_domains: string[] (optional)
 *   - rate_limit_per_minute: number (optional, default: 10)
 *
 * Returns:
 *   - 201: API key created (includes full key - shown only once!)
 *   - 400: Validation error
 *   - 401: Unauthorized
 *   - 403: Forbidden (not admin/owner)
 *   - 409: Conflict (max 5 keys reached)
 *   - 500: Internal server error
 */
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json()
    const validation = createApiKeySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const { organization_id, name, allowed_domains, rate_limit_per_minute } = validation.data

    // Verify user is admin or owner of the organization
    const { data: membership, error: membershipError } = (await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organization_id)
      .eq('user_id', user.id)
      .single()) as { data: { role: string } | null; error: any }

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
          error: 'Forbidden. Only owners and admins can create API keys.',
        },
        { status: 403 }
      )
    }

    // Check if organization already has 5 active keys (maximum limit)
    const { count, error: countError } = await supabase
      .from('api_keys')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organization_id)
      .eq('is_active', true)

    if (countError) {
      console.error('Error checking API key count:', countError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to check API key limit',
        },
        { status: 500 }
      )
    }

    if (count !== null && count >= 5) {
      return NextResponse.json(
        {
          success: false,
          error: 'Maximum API key limit reached',
          message: 'You can have a maximum of 5 active API keys per organization. Please revoke an existing key before creating a new one.',
        },
        { status: 409 }
      )
    }

    // Generate and hash the API key
    const { key, hash, prefix, lastFour } = await generateAndHashApiKey()

    // Insert the API key into the database
    const insertData: any = {
      organization_id,
      name,
      key_prefix: prefix,
      key_hash: hash,
      allowed_domains: allowed_domains || [],
      rate_limit_per_minute: rate_limit_per_minute || 10,
      is_active: true,
      created_by: user.id,
    }

    const insertResult = (await supabase
      .from('api_keys')
      .insert(insertData)
      .select(
        `
        id,
        name,
        key_prefix,
        created_at,
        allowed_domains,
        rate_limit_per_minute
      `
      )
      .single()) as {
        data: {
          id: string;
          name: string;
          key_prefix: string;
          created_at: string;
          allowed_domains: string[];
          rate_limit_per_minute: number
        } | null;
        error: any
      }

    const { data: apiKey, error: insertError } = insertResult

    if (insertError || !apiKey) {
      console.error('Error creating API key:', insertError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create API key',
          message: insertError?.message || 'Unknown error',
        },
        { status: 500 }
      )
    }

    // Return the full API key (ONLY TIME IT'S SHOWN!)
    return NextResponse.json(
      {
        success: true,
        data: {
          id: apiKey.id,
          name: apiKey.name,
          api_key: key, // Full key shown only once
          key_prefix: apiKey.key_prefix,
          created_at: apiKey.created_at,
          allowed_domains: apiKey.allowed_domains,
          rate_limit_per_minute: apiKey.rate_limit_per_minute,
        },
        message:
          'API key created successfully. Save this key securely - it will not be shown again.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Unexpected error in POST /api/api-keys:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      )
    }

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
