'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { getUserOrganizations } from '@/lib/supabase/helpers'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreateOrgDialog } from '@/components/dashboard/create-org-dialog'

/**
 * Onboarding Page
 *
 * Guides new users through creating their first organization.
 * If user already has organizations, redirect to dashboard router.
 */
export default function OnboardingPage() {
  const router = useRouter()
  const [userName, setUserName] = React.useState<string>('there')
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function checkUser() {
      try {
        const supabase = createBrowserSupabaseClient()

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          router.push('/login')
          return
        }

        // Check if user already has organizations
        const { data: organizations } = await getUserOrganizations(supabase)

        if (organizations && organizations.length > 0) {
          // User already has organizations, redirect back to dashboard router
          router.push('/dashboard')
          return
        }

        // Get user profile for personalized greeting
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, email')
          .eq('id', user.id)
          .single()

        setUserName(profile?.full_name || user.email?.split('@')[0] || 'there')
      } catch (error) {
        console.error('Error loading onboarding:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()
  }, [router])

  const handleOrgCreated = (orgSlug: string) => {
    router.push(`/${orgSlug}`)
  }

  if (isLoading) {
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
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Welcome Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">
            Welcome to AI Commerce Lead Generator, {userName}!
          </h1>
          <p className="text-xl text-gray-400">
            Let's get started by creating your first organization
          </p>
        </div>

        {/* Organization Creation Card */}
        <Card>
          <CardHeader>
            <CardTitle>Create Your Organization</CardTitle>
            <CardDescription>
              An organization is your workspace where you'll manage leads,
              configure chatbots, and collaborate with your team.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setIsDialogOpen(true)}
              size="lg"
              className="w-full"
            >
              Create Your First Organization
            </Button>
          </CardContent>
        </Card>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-3 gap-4 text-center">
          <div className="p-4">
            <div className="text-primary-400 text-2xl mb-2">🤖</div>
            <h3 className="font-semibold text-white mb-1">AI-Powered</h3>
            <p className="text-sm text-gray-400">
              Intelligent chatbots that qualify leads automatically
            </p>
          </div>
          <div className="p-4">
            <div className="text-secondary-400 text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-white mb-1">Analytics</h3>
            <p className="text-sm text-gray-400">
              Real-time insights into your lead generation performance
            </p>
          </div>
          <div className="p-4">
            <div className="text-accent-400 text-2xl mb-2">👥</div>
            <h3 className="font-semibold text-white mb-1">Team Collaboration</h3>
            <p className="text-sm text-gray-400">
              Invite team members and manage permissions
            </p>
          </div>
        </div>
      </div>

      {/* Create Organization Dialog */}
      <CreateOrgDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={handleOrgCreated}
      />
    </div>
  )
}
