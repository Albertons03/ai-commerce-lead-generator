'use client'

import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { getUserOrganizations } from '@/lib/supabase/helpers'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopNav } from '@/components/dashboard/top-nav'
import { CreateOrgDialog } from '@/components/dashboard/create-org-dialog'
import type { GetUserOrganizationsResult } from '@/lib/supabase/types'

interface User {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
}

export default function OrgLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const params = useParams()
  const orgSlug = params.orgSlug as string

  const [user, setUser] = React.useState<User | null>(null)
  const [organizations, setOrganizations] = React.useState<GetUserOrganizationsResult[]>([])
  const [currentOrg, setCurrentOrg] = React.useState<GetUserOrganizationsResult | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isCreateOrgDialogOpen, setIsCreateOrgDialogOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  // Fetch user and organizations
  React.useEffect(() => {
    async function loadData() {
      try {
        const supabase = createBrowserSupabaseClient()

        // Get current user
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
        if (userError || !authUser) {
          router.push('/login')
          return
        }

        // Get user profile
        const { data: profile } = await supabase
          .from('users')
          .select('id, email, full_name, avatar_url')
          .eq('id', authUser.id)
          .single()

        if (profile) {
          setUser(profile)
        }

        // Get user's organizations
        const { data: orgs, error: orgsError } = await getUserOrganizations(supabase)
        if (orgsError) {
          console.error('Error fetching organizations:', orgsError)
          return
        }

        setOrganizations(orgs || [])

        // Find current organization
        const current = orgs?.find((org) => org.organization_slug === orgSlug)
        if (!current) {
          // User is not a member of this organization
          router.push('/dashboard')
          return
        }

        setCurrentOrg(current)
      } catch (error) {
        console.error('Error loading data:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [orgSlug])

  const handleCreateOrg = () => {
    setIsCreateOrgDialogOpen(true)
  }

  const handleOrgCreated = (newOrgSlug: string) => {
    setIsCreateOrgDialogOpen(false)
    router.push(`/${newOrgSlug}`)
  }

  if (isLoading || !currentOrg || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-400 border-t-transparent" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg-primary">
      {/* Sidebar */}
      <Sidebar
        orgSlug={orgSlug}
        orgName={currentOrg.organization_name}
        isOpen={isMobileMenuOpen}
        onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden lg:ml-64">
        {/* Top Navigation */}
        <TopNav
          orgSlug={orgSlug}
          organizations={organizations}
          user={user}
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onCreateOrg={handleCreateOrg}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Create Organization Dialog */}
      <CreateOrgDialog
        open={isCreateOrgDialogOpen}
        onOpenChange={setIsCreateOrgDialogOpen}
        onSuccess={handleOrgCreated}
      />
    </div>
  )
}
