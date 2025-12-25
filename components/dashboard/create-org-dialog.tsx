'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createOrganizationAction } from '@/lib/actions/organizations'
import { generateSlug, validateSlug } from '@/lib/supabase/helpers'
import { toast } from 'sonner'

interface CreateOrgDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (orgSlug: string) => void
}

export function CreateOrgDialog({ open, onOpenChange, onSuccess }: CreateOrgDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: '',
    slug: '',
    description: '',
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [slugEdited, setSlugEdited] = React.useState(false)

  // Auto-generate slug from name
  React.useEffect(() => {
    if (!slugEdited && formData.name) {
      const generatedSlug = generateSlug(formData.name)
      setFormData((prev) => ({ ...prev, slug: generatedSlug }))
    }
  }, [formData.name, slugEdited])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required'
    } else if (formData.name.length < 3) {
      newErrors.name = 'Organization name must be at least 3 characters'
    }

    const slugValidation = validateSlug(formData.slug)
    if (!slugValidation.valid) {
      newErrors.slug = slugValidation.error || 'Invalid slug'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const result = await createOrganizationAction({
        name: formData.name,
        slug: formData.slug,
        description: formData.description || undefined,
      })

      if (result.success && result.data) {
        toast.success('Organization created successfully!')
        onOpenChange(false)
        // Reset form
        setFormData({ name: '', slug: '', description: '' })
        setSlugEdited(false)
        // Call success callback with the new org slug
        if (onSuccess) {
          onSuccess(result.data.slug)
        }
      } else {
        if (result.field) {
          setErrors({ [result.field]: result.error || 'An error occurred' })
        } else {
          toast.error(result.error || 'Failed to create organization')
        }
      }
    } catch (error) {
      console.error('Create organization error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, name: e.target.value }))
    setErrors((prev) => ({ ...prev, name: '' }))
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugEdited(true)
    setFormData((prev) => ({ ...prev, slug: e.target.value }))
    setErrors((prev) => ({ ...prev, slug: '' }))
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, description: e.target.value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Create a new organization to manage leads and access AI-powered features.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Organization Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Organization Name <span className="text-error-400">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Acme Inc."
                value={formData.name}
                onChange={handleNameChange}
                disabled={isLoading}
                className={errors.name ? 'border-error-400' : ''}
              />
              {errors.name && (
                <p className="text-sm text-error-400">{errors.name}</p>
              )}
            </div>

            {/* Organization Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">
                Organization Slug <span className="text-error-400">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 whitespace-nowrap">
                  yourapp.com/
                </span>
                <Input
                  id="slug"
                  placeholder="acme-inc"
                  value={formData.slug}
                  onChange={handleSlugChange}
                  disabled={isLoading}
                  className={errors.slug ? 'border-error-400' : ''}
                />
              </div>
              {errors.slug ? (
                <p className="text-sm text-error-400">{errors.slug}</p>
              ) : (
                <p className="text-xs text-gray-400">
                  Lowercase letters, numbers, and hyphens only
                </p>
              )}
            </div>

            {/* Organization Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <textarea
                id="description"
                placeholder="Brief description of your organization..."
                value={formData.description}
                onChange={handleDescriptionChange}
                disabled={isLoading}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-border-primary bg-bg-tertiary text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Organization'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
