'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import {
  createOrganization,
  getUserOrganizations,
  getOrganizationBySlug,
  updateOrganization,
  getOrganizationMembers,
  updateMemberRole,
  removeOrganizationMember,
} from '@/lib/supabase/helpers'
import { createAdminSupabaseClient } from '@/lib/supabase/client'
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  updateMemberRoleSchema,
  removeMemberSchema,
  type CreateOrganizationInput,
  type UpdateOrganizationInput,
  type UpdateMemberRoleInput,
  type RemoveMemberInput,
} from '@/lib/validations/organizations'
import type { OrganizationRole } from '@/lib/supabase/types'

/**
 * =====================================================
 * Organization Server Actions
 * =====================================================
 */

interface ActionResponse {
  success: boolean
  error?: string
  field?: string
  data?: any
}

/**
 * Create a new organization
 */
export async function createOrganizationAction(
  data: CreateOrganizationInput
): Promise<ActionResponse> {
  try {
    const validatedData = createOrganizationSchema.parse(data)
    const supabase = await createServerSupabaseClient()

    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'You must be logged in to create an organization' }
    }

    // Ensure user profile exists in public.users before calling the RPC.
    // The handle_new_user trigger should do this automatically on signup,
    // but it can fail silently. We upsert here as a failsafe.
    const adminClient = createAdminSupabaseClient()
    await adminClient.from('users').upsert({
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
    }, { onConflict: 'id' })

    // Check if slug is already taken - use admin client because RLS prevents
    // seeing orgs the user is not a member of, which would cause a silent
    // false-negative and later a 23505 duplicate key error from the DB.
    const { data: existingOrg } = await adminClient
      .from('organizations')
      .select('id')
      .eq('slug', validatedData.slug)
      .single()

    if (existingOrg) {
      return {
        success: false,
        error: 'This organization slug is already taken',
        field: 'slug',
      }
    }

    // Create organization
    const { data: org, error: createError } = await createOrganization(supabase, {
      name: validatedData.name,
      slug: validatedData.slug,
      description: validatedData.description || null,
      website_url: validatedData.website_url || null,
    })

    if (createError || !org) {
      console.error('Create organization error:', JSON.stringify(createError))
      // 23505 = unique constraint violation (slug already taken)
      if (createError?.code === '23505') {
        return { success: false, error: 'This organization slug is already taken', field: 'slug' }
      }
      return {
        success: false,
        error: createError?.message || 'Failed to create organization',
      }
    }

    revalidatePath('/dashboard')
    revalidatePath('/onboarding')
    revalidatePath(`/${org.slug}`)

    return {
      success: true,
      data: {
        id: org.id,
        name: org.name,
        slug: org.slug,
      },
    }
  } catch (error: any) {
    console.error('Create organization action error:', error)

    if (error.name === 'ZodError') {
      return {
        success: false,
        error: error.errors[0].message,
        field: error.errors[0].path[0],
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get all organizations for the current user
 */
export async function getUserOrganizationsAction(): Promise<ActionResponse> {
  try {
    const supabase = await createServerSupabaseClient()

    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'You must be logged in' }
    }

    const { data: orgs, error } = await getUserOrganizations(supabase)

    if (error) {
      console.error('Get user organizations error:', error)
      return {
        success: false,
        error: 'Failed to fetch organizations',
      }
    }

    return {
      success: true,
      data: orgs,
    }
  } catch (error) {
    console.error('Get user organizations action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get organization by slug
 */
export async function getOrganizationBySlugAction(slug: string): Promise<ActionResponse> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: org, error } = await getOrganizationBySlug(supabase, slug)

    if (error || !org) {
      return {
        success: false,
        error: 'Organization not found',
      }
    }

    return {
      success: true,
      data: org,
    }
  } catch (error) {
    console.error('Get organization by slug action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Update an organization
 */
export async function updateOrganizationAction(
  organizationId: string,
  data: UpdateOrganizationInput
): Promise<ActionResponse> {
  try {
    const validatedData = updateOrganizationSchema.parse(data)
    const supabase = await createServerSupabaseClient()

    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'You must be logged in' }
    }

    const { data: org, error } = await updateOrganization(
      supabase,
      organizationId,
      validatedData
    )

    if (error || !org) {
      console.error('Update organization error:', error)
      return {
        success: false,
        error: 'Failed to update organization',
      }
    }

    revalidatePath(`/${org.slug}`)

    return {
      success: true,
      data: org,
    }
  } catch (error: any) {
    console.error('Update organization action error:', error)

    if (error.name === 'ZodError') {
      return {
        success: false,
        error: error.errors[0].message,
        field: error.errors[0].path[0],
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get organization members
 */
export async function getOrganizationMembersAction(
  organizationId: string
): Promise<ActionResponse> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: members, error } = await getOrganizationMembers(supabase, organizationId)

    if (error) {
      console.error('Get organization members error:', error)
      return {
        success: false,
        error: 'Failed to fetch members',
      }
    }

    return {
      success: true,
      data: members,
    }
  } catch (error) {
    console.error('Get organization members action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Update member role
 */
export async function updateMemberRoleAction(
  organizationId: string,
  data: UpdateMemberRoleInput
): Promise<ActionResponse> {
  try {
    const validatedData = updateMemberRoleSchema.parse(data)
    const supabase = await createServerSupabaseClient()

    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'You must be logged in' }
    }

    const { data: member, error } = await updateMemberRole(
      supabase,
      organizationId,
      validatedData.userId,
      validatedData.role as OrganizationRole
    )

    if (error || !member) {
      console.error('Update member role error:', error)
      return {
        success: false,
        error: 'Failed to update member role',
      }
    }

    revalidatePath(`/`)

    return {
      success: true,
      data: member,
    }
  } catch (error: any) {
    console.error('Update member role action error:', error)

    if (error.name === 'ZodError') {
      return {
        success: false,
        error: error.errors[0].message,
        field: error.errors[0].path[0],
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Remove member from organization
 */
export async function removeMemberAction(
  organizationId: string,
  data: RemoveMemberInput
): Promise<ActionResponse> {
  try {
    const validatedData = removeMemberSchema.parse(data)
    const supabase = await createServerSupabaseClient()

    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'You must be logged in' }
    }

    const { success, error } = await removeOrganizationMember(
      supabase,
      organizationId,
      validatedData.userId
    )

    if (!success || error) {
      console.error('Remove member error:', error)
      return {
        success: false,
        error: 'Failed to remove member',
      }
    }

    revalidatePath(`/`)

    return {
      success: true,
    }
  } catch (error: any) {
    console.error('Remove member action error:', error)

    if (error.name === 'ZodError') {
      return {
        success: false,
        error: error.errors[0].message,
        field: error.errors[0].path[0],
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
