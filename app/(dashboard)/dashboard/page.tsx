import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import { getUserOrganizations } from '@/lib/supabase/helpers'

/**
 * Intelligent Dashboard Router
 *
 * This page serves as a routing hub that determines where authenticated
 * users should land based on their organization memberships.
 *
 * Routing Logic:
 * 1. If user has organizations → redirect to first/most recent org
 * 2. If user has no organizations → redirect to onboarding
 * 3. If not authenticated → middleware redirects to login
 */
export default async function DashboardRouter() {
  // Initialize Supabase server client with proper cookie handling
  const supabase = await createServerSupabaseClient()

  // Verify authentication - middleware should have caught this, but double-check
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    // Not authenticated - redirect to login
    redirect('/login')
  }

  // Fetch user's organizations using optimized RPC function
  // This returns organizations ordered by joined_at DESC (most recent first)
  const { data: organizations, error: orgError } = await getUserOrganizations(supabase)

  // Handle database errors gracefully
  if (orgError) {
    console.error('Error fetching user organizations:', orgError)
    // On error, redirect to onboarding as safe fallback
    redirect('/onboarding')
  }

  // CASE 1: User has one or more organizations
  if (organizations && organizations.length > 0) {
    // Use the most recent organization (first in array due to DESC ordering)
    const defaultOrg = organizations[0]

    // Redirect to organization dashboard
    redirect(`/${defaultOrg.organization_slug}`)
  }

  // CASE 2: User has no organizations
  // Redirect to onboarding flow to create first organization
  redirect('/onboarding')
}

// Export metadata for SEO and page title
export const metadata = {
  title: 'Dashboard',
  description: 'Redirecting to your workspace...',
}

// Disable static generation - this page must be dynamic
export const dynamic = 'force-dynamic'
