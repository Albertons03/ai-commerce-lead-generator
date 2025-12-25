import { z } from 'zod'

/**
 * =====================================================
 * API Key Validation Schemas
 * =====================================================
 */

export const createApiKeySchema = z.object({
  organization_id: z
    .string()
    .min(1, 'Organization ID is required')
    .uuid('Invalid organization ID format'),
  name: z
    .string()
    .min(1, 'API key name is required')
    .min(3, 'API key name must be at least 3 characters')
    .max(100, 'API key name must be at most 100 characters')
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      'API key name can only contain letters, numbers, spaces, hyphens, and underscores'
    ),
  allowed_domains: z
    .array(z.string().min(1, 'Domain cannot be empty'))
    .optional()
    .default([]),
  rate_limit_per_minute: z
    .number()
    .int('Rate limit must be an integer')
    .min(1, 'Rate limit must be at least 1')
    .max(1000, 'Rate limit must be at most 1000')
    .optional()
    .default(10),
})

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>

export const getApiKeysSchema = z.object({
  organization_id: z
    .string()
    .min(1, 'Organization ID is required')
    .uuid('Invalid organization ID format'),
})

export type GetApiKeysInput = z.infer<typeof getApiKeysSchema>

export const deleteApiKeySchema = z.object({
  id: z
    .string()
    .min(1, 'API key ID is required')
    .uuid('Invalid API key ID format'),
  organization_id: z
    .string()
    .min(1, 'Organization ID is required')
    .uuid('Invalid organization ID format'),
})

export type DeleteApiKeyInput = z.infer<typeof deleteApiKeySchema>

/**
 * Schema for validating API key in requests
 */
export const apiKeyHeaderSchema = z.object({
  'x-api-key': z
    .string()
    .min(1, 'API key is required')
    .regex(
      /^sk_live_[a-zA-Z0-9_-]{32,}$/,
      'Invalid API key format. Expected format: sk_live_[32+ characters]'
    ),
})

export type ApiKeyHeader = z.infer<typeof apiKeyHeaderSchema>

/**
 * Helper function to validate API key format
 */
export function validateApiKeyFormat(key: string): { valid: boolean; error?: string } {
  if (!key) {
    return { valid: false, error: 'API key is required' }
  }

  if (!key.startsWith('sk_live_')) {
    return { valid: false, error: 'API key must start with sk_live_' }
  }

  const keyPart = key.substring(8) // Remove 'sk_live_' prefix
  if (keyPart.length < 32) {
    return { valid: false, error: 'API key is too short' }
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(keyPart)) {
    return { valid: false, error: 'API key contains invalid characters' }
  }

  return { valid: true }
}

/**
 * Helper function to mask API key for display
 * Shows only the prefix and last 4 characters
 * Example: sk_live_abc123...xyz789 -> sk_live_****xyz789
 */
export function maskApiKey(key: string): string {
  if (!key || key.length < 16) {
    return '****'
  }

  const prefix = key.substring(0, 8) // 'sk_live_'
  const suffix = key.slice(-4) // Last 4 characters

  return `${prefix}****${suffix}`
}

/**
 * Helper function to get API key prefix for storage
 * Returns first 20 characters of the key
 */
export function getApiKeyPrefix(key: string): string {
  return key.substring(0, Math.min(20, key.length))
}
