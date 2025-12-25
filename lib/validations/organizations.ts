import { z } from 'zod'
import { OrganizationRole } from '@/lib/supabase/types'

/**
 * =====================================================
 * Organization Validation Schemas
 * =====================================================
 */

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, 'Organization name is required')
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must be at most 100 characters'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug can only contain lowercase letters, numbers, and hyphens'
    )
    .refine((slug) => !slug.startsWith('-') && !slug.endsWith('-'), {
      message: 'Slug cannot start or end with a hyphen',
    })
    .refine((slug) => !slug.includes('--'), {
      message: 'Slug cannot contain consecutive hyphens',
    }),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  website_url: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
})

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>

export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must be at most 100 characters')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional()
    .nullable(),
  website_url: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .nullable()
    .or(z.literal('')),
  logo_url: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .nullable(),
  settings: z
    .record(z.any())
    .optional(),
})

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>

export const inviteMemberSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  role: z.enum(['owner', 'admin', 'member'] as const, {
    errorMap: () => ({ message: 'Invalid role' }),
  }).default('member'),
})

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>

export const updateMemberRoleSchema = z.object({
  userId: z
    .string()
    .min(1, 'User ID is required'),
  role: z.enum(['owner', 'admin', 'member'] as const, {
    errorMap: () => ({ message: 'Invalid role' }),
  }),
})

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>

export const removeMemberSchema = z.object({
  userId: z
    .string()
    .min(1, 'User ID is required'),
})

export type RemoveMemberInput = z.infer<typeof removeMemberSchema>

/**
 * Helper function to validate and sanitize organization slug
 */
export function sanitizeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-')
    .substring(0, 50)
}

/**
 * Helper function to check if a value is a valid organization role
 */
export function isValidOrganizationRole(role: string): role is OrganizationRole {
  return ['owner', 'admin', 'member'].includes(role)
}
