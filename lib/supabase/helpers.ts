/**
 * =====================================================
 * Supabase Database Helper Functions
 * =====================================================
 * High-level helper functions for common database operations.
 * These functions provide type-safe wrappers around Supabase queries
 * and implement common patterns.
 * =====================================================
 */

import type {
  SupabaseClient,
  SupabaseServerClient,
} from './client';
import type {
  Organization,
  OrganizationMember,
  User,
  OrganizationRole,
  CreateOrganizationParams,
  GetUserOrganizationsResult,
  OrganizationWithRole,
  OrganizationMemberWithUser,
} from './types';

// =====================================================
// User Operations
// =====================================================

/**
 * Gets a user profile by ID.
 */
export async function getUserById(
  supabase: SupabaseClient | SupabaseServerClient,
  userId: string
) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return { data: null, error };
  }

  return { data: data as User, error: null };
}

/**
 * Gets a user profile by email.
 */
export async function getUserByEmail(
  supabase: SupabaseClient | SupabaseServerClient,
  email: string
) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    console.error('Error fetching user by email:', error);
    return { data: null, error };
  }

  return { data: data as User, error: null };
}

/**
 * Updates a user profile.
 */
export async function updateUser(
  supabase: SupabaseClient | SupabaseServerClient,
  userId: string,
  updates: Partial<Pick<User, 'full_name' | 'avatar_url'>>
) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    return { data: null, error };
  }

  return { data: data as User, error: null };
}

// =====================================================
// Organization Operations
// =====================================================

/**
 * Creates a new organization with the current user as owner.
 * Uses the database function to ensure proper setup.
 */
export async function createOrganization(
  supabase: SupabaseClient | SupabaseServerClient,
  params: CreateOrganizationParams
) {
  const { data, error } = await supabase.rpc('create_organization_with_owner', {
    p_name: params.name,
    p_slug: params.slug,
    p_description: params.description || null,
    p_logo_url: params.logo_url || null,
    p_website_url: params.website_url || null,
  });

  if (error) {
    console.error('Error creating organization:', error);
    return { data: null, error };
  }

  // Fetch the created organization
  const { data: org, error: fetchError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', data)
    .single();

  if (fetchError) {
    console.error('Error fetching created organization:', fetchError);
    return { data: null, error: fetchError };
  }

  return { data: org as Organization, error: null };
}

/**
 * Gets an organization by ID.
 */
export async function getOrganizationById(
  supabase: SupabaseClient | SupabaseServerClient,
  organizationId: string
) {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single();

  if (error) {
    console.error('Error fetching organization:', error);
    return { data: null, error };
  }

  return { data: data as Organization, error: null };
}

/**
 * Gets an organization by slug.
 */
export async function getOrganizationBySlug(
  supabase: SupabaseClient | SupabaseServerClient,
  slug: string
) {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching organization by slug:', error);
    return { data: null, error };
  }

  return { data: data as Organization, error: null };
}

/**
 * Gets all organizations for the current user.
 * Uses the database function for optimized query.
 */
export async function getUserOrganizations(
  supabase: SupabaseClient | SupabaseServerClient
) {
  const { data, error } = await supabase.rpc('get_user_organizations');

  if (error) {
    console.error('Error fetching user organizations:', error);
    return { data: null, error };
  }

  return { data: data as GetUserOrganizationsResult[], error: null };
}

/**
 * Updates an organization.
 * Only owners and admins can update organizations (enforced by RLS).
 */
export async function updateOrganization(
  supabase: SupabaseClient | SupabaseServerClient,
  organizationId: string,
  updates: Partial<Pick<Organization, 'name' | 'description' | 'logo_url' | 'website_url' | 'settings'>>
) {
  const { data, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', organizationId)
    .select()
    .single();

  if (error) {
    console.error('Error updating organization:', error);
    return { data: null, error };
  }

  return { data: data as Organization, error: null };
}

/**
 * Deletes an organization.
 * Only owners can delete organizations (enforced by RLS).
 */
export async function deleteOrganization(
  supabase: SupabaseClient | SupabaseServerClient,
  organizationId: string
) {
  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', organizationId);

  if (error) {
    console.error('Error deleting organization:', error);
    return { success: false, error };
  }

  return { success: true, error: null };
}

// =====================================================
// Organization Member Operations
// =====================================================

/**
 * Gets all members of an organization with their user details.
 */
export async function getOrganizationMembers(
  supabase: SupabaseClient | SupabaseServerClient,
  organizationId: string
) {
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      *,
      user:users(*)
    `)
    .eq('organization_id', organizationId)
    .order('joined_at', { ascending: false });

  if (error) {
    console.error('Error fetching organization members:', error);
    return { data: null, error };
  }

  return { data: data as unknown as OrganizationMemberWithUser[], error: null };
}

/**
 * Gets a specific member of an organization.
 */
export async function getOrganizationMember(
  supabase: SupabaseClient | SupabaseServerClient,
  organizationId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      *,
      user:users(*)
    `)
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching organization member:', error);
    return { data: null, error };
  }

  return { data: data as unknown as OrganizationMemberWithUser, error: null };
}

/**
 * Adds a member to an organization.
 * Only owners and admins can add members (enforced by RLS).
 */
export async function addOrganizationMember(
  supabase: SupabaseClient | SupabaseServerClient,
  organizationId: string,
  userId: string,
  role: OrganizationRole = 'member'
) {
  const { data, error } = await supabase
    .from('organization_members')
    .insert({
      organization_id: organizationId,
      user_id: userId,
      role: role,
    })
    .select(`
      *,
      user:users(*)
    `)
    .single();

  if (error) {
    console.error('Error adding organization member:', error);
    return { data: null, error };
  }

  return { data: data as unknown as OrganizationMemberWithUser, error: null };
}

/**
 * Updates a member's role in an organization.
 * Only owners and admins can update roles (enforced by RLS).
 */
export async function updateMemberRole(
  supabase: SupabaseClient | SupabaseServerClient,
  organizationId: string,
  userId: string,
  newRole: OrganizationRole
) {
  const { data, error } = await supabase
    .from('organization_members')
    .update({ role: newRole })
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .select(`
      *,
      user:users(*)
    `)
    .single();

  if (error) {
    console.error('Error updating member role:', error);
    return { data: null, error };
  }

  return { data: data as unknown as OrganizationMemberWithUser, error: null };
}

/**
 * Removes a member from an organization.
 * Owners and admins can remove others; any user can remove themselves.
 */
export async function removeOrganizationMember(
  supabase: SupabaseClient | SupabaseServerClient,
  organizationId: string,
  userId: string
) {
  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('organization_id', organizationId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing organization member:', error);
    return { success: false, error };
  }

  return { success: true, error: null };
}

/**
 * Gets the member count for an organization.
 * Uses the database function.
 */
export async function getOrganizationMemberCount(
  supabase: SupabaseClient | SupabaseServerClient,
  organizationId: string
) {
  const { data, error } = await supabase.rpc('get_organization_member_count', {
    p_organization_id: organizationId,
  });

  if (error) {
    console.error('Error fetching organization member count:', error);
    return { data: null, error };
  }

  return { data: data as number, error: null };
}

// =====================================================
// Permission Checks
// =====================================================

/**
 * Checks if the current user has a specific role in an organization.
 * Uses the database function which respects role hierarchy.
 */
export async function userHasRole(
  supabase: SupabaseClient | SupabaseServerClient,
  organizationId: string,
  requiredRole: OrganizationRole
) {
  const { data, error } = await supabase.rpc('user_has_role_in_org', {
    p_organization_id: organizationId,
    p_required_role: requiredRole,
  });

  if (error) {
    console.error('Error checking user role:', error);
    return { hasRole: false, error };
  }

  return { hasRole: data as boolean, error: null };
}

/**
 * Checks if the current user is an owner of an organization.
 */
export async function isOrganizationOwner(
  supabase: SupabaseClient | SupabaseServerClient,
  organizationId: string
) {
  return userHasRole(supabase, organizationId, 'owner');
}

/**
 * Checks if the current user is an admin or owner of an organization.
 */
export async function isOrganizationAdmin(
  supabase: SupabaseClient | SupabaseServerClient,
  organizationId: string
) {
  return userHasRole(supabase, organizationId, 'admin');
}

/**
 * Checks if the current user is a member of an organization.
 */
export async function isOrganizationMember(
  supabase: SupabaseClient | SupabaseServerClient,
  organizationId: string
) {
  return userHasRole(supabase, organizationId, 'member');
}

// =====================================================
// Validation Helpers
// =====================================================

/**
 * Checks if an organization slug is available.
 */
export async function isSlugAvailable(
  supabase: SupabaseClient | SupabaseServerClient,
  slug: string
) {
  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('Error checking slug availability:', error);
    return { available: false, error };
  }

  return { available: data === null, error: null };
}

/**
 * Validates organization slug format.
 */
export function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug || slug.length < 3) {
    return { valid: false, error: 'Slug must be at least 3 characters long' };
  }

  if (slug.length > 50) {
    return { valid: false, error: 'Slug must be at most 50 characters long' };
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { valid: false, error: 'Slug can only contain lowercase letters, numbers, and hyphens' };
  }

  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { valid: false, error: 'Slug cannot start or end with a hyphen' };
  }

  if (slug.includes('--')) {
    return { valid: false, error: 'Slug cannot contain consecutive hyphens' };
  }

  return { valid: true };
}

/**
 * Generates a slug from a name.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-')
    .substring(0, 50);
}

/**
 * Validates email format.
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

  if (!email) {
    return { valid: false, error: 'Email is required' };
  }

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
}

// =====================================================
// Query Builders
// =====================================================

/**
 * Builds a query to fetch organizations with pagination and filtering.
 */
export function buildOrganizationsQuery(
  supabase: SupabaseClient | SupabaseServerClient,
  options: {
    search?: string;
    page?: number;
    pageSize?: number;
    sortBy?: keyof Organization;
    sortOrder?: 'asc' | 'desc';
  } = {}
) {
  const {
    search,
    page = 1,
    pageSize = 10,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = options;

  let query = supabase
    .from('organizations')
    .select('*', { count: 'exact' });

  if (search) {
    query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
  }

  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  return query;
}

/**
 * Builds a query to fetch organization members with pagination and filtering.
 */
export function buildMembersQuery(
  supabase: SupabaseClient | SupabaseServerClient,
  organizationId: string,
  options: {
    role?: OrganizationRole;
    search?: string;
    page?: number;
    pageSize?: number;
  } = {}
) {
  const { role, search, page = 1, pageSize = 10 } = options;

  let query = supabase
    .from('organization_members')
    .select(`
      *,
      user:users(*)
    `, { count: 'exact' })
    .eq('organization_id', organizationId);

  if (role) {
    query = query.eq('role', role);
  }

  if (search) {
    query = query.or(`users.full_name.ilike.%${search}%,users.email.ilike.%${search}%`);
  }

  query = query.order('joined_at', { ascending: false });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  return query;
}
