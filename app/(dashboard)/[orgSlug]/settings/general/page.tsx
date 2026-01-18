'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { getOrganizationBySlug, updateOrganization } from '@/lib/supabase/helpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Organization } from '@/lib/supabase/types'

export default function GeneralSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string

  const [organization, setOrganization] = React.useState<Organization | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: '',
    slug: '',
    description: '',
  })

  // Load organization data
  React.useEffect(() => {
    async function loadOrganization() {
      try {
        const supabase = createBrowserSupabaseClient()
        const { data, error } = await getOrganizationBySlug(supabase, orgSlug)

        if (error) {
          toast.error('Failed to load organization')
          console.error(error)
          return
        }

        if (data) {
          setOrganization(data)
          setFormData({
            name: data.name,
            slug: data.slug,
            description: data.description || '',
          })
        }
      } catch (error) {
        console.error('Error loading organization:', error)
        toast.error('Failed to load organization')
      } finally {
        setIsLoading(false)
      }
    }

    loadOrganization()
  }, [orgSlug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organization) return

    setIsSaving(true)

    try {
      const supabase = createBrowserSupabaseClient()

      const { error } = await updateOrganization(supabase, organization.id, {
        name: formData.name,
        description: formData.description,
      })

      if (error) {
        toast.error('Failed to update organization')
        console.error(error)
        return
      }

      toast.success('Organization updated successfully')

      // If slug changed, redirect to new URL
      if (formData.slug !== orgSlug) {
        router.push(`/${formData.slug}/settings/general`)
      }
    } catch (error) {
      console.error('Error updating organization:', error)
      toast.error('Failed to update organization')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-400 border-t-transparent" />
      </div>
    )
  }

  if (!organization) {
    return (
      <Card className="border-error-500/20 bg-error-500/5">
        <CardHeader>
          <CardTitle className="text-error-400">Organization not found</CardTitle>
          <CardDescription>
            The organization could not be loaded. Please try again.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Update your organization's basic information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Acme Corporation"
                required
                disabled={isSaving}
              />
              <p className="text-sm text-gray-400">
                The name of your organization as it appears throughout the dashboard.
              </p>
            </div>

            {/* Organization Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Organization Slug</Label>
              <Input
                id="slug"
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                  }))
                }
                placeholder="acme-corp"
                required
                disabled={isSaving}
                pattern="[a-z0-9-]+"
              />
              <p className="text-sm text-gray-400">
                Used in URLs: /{formData.slug}. Only lowercase letters, numbers, and
                hyphens allowed.
              </p>
            </div>

            {/* Organization Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="A brief description of your organization"
                disabled={isSaving}
              />
            </div>

            {/* Logo Upload (Placeholder) */}
            <div className="space-y-2">
              <Label>Organization Logo</Label>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg bg-gradient-hero flex items-center justify-center text-white font-bold text-xl">
                  {organization.name.charAt(0).toUpperCase()}
                </div>
                <Button type="button" variant="outline" disabled>
                  Upload Logo (Coming Soon)
                </Button>
              </div>
              <p className="text-sm text-gray-400">
                Upload a logo to personalize your organization's dashboard.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-4 pt-4">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
