/**
 * =====================================================
 * API Key Management Types
 * =====================================================
 * TypeScript types for API key-related operations
 */

import { ApiKey } from '../supabase/types'

// =====================================================
// API Key Display Types
// =====================================================

export interface ApiKeyDisplay extends Omit<ApiKey, 'key_hash'> {
  masked_key: string // e.g., "sk_live_****1234"
}

export interface ApiKeyListResponse {
  success: boolean
  data?: ApiKeyDisplay[]
  error?: string
  warning?: string // Warning when approaching max keys limit
}

// =====================================================
// API Key Generation Types
// =====================================================

export interface GenerateApiKeyInput {
  name: string
  allowed_domains?: string[] // CORS domains
  rate_limit_per_minute?: number
}

export interface GenerateApiKeyResponse {
  success: boolean
  data?: {
    id: string
    name: string
    api_key: string // Full key shown only once
    key_prefix: string
    created_at: string
    allowed_domains: string[]
    rate_limit_per_minute: number
  }
  error?: string
  field?: string
}

// =====================================================
// API Key Update Types
// =====================================================

export interface UpdateApiKeyInput {
  name?: string
  allowed_domains?: string[]
  rate_limit_per_minute?: number
  is_active?: boolean
}

export interface UpdateApiKeyResponse {
  success: boolean
  data?: ApiKeyDisplay
  error?: string
  field?: string
}

// =====================================================
// API Key Revocation Types
// =====================================================

export interface RevokeApiKeyResponse {
  success: boolean
  data?: {
    id: string
    revoked_at: string
    revoked_by: string
  }
  error?: string
}

// =====================================================
// API Key Validation Types
// =====================================================

export interface ValidateApiKeyResponse {
  success: boolean
  data?: {
    organization_id: string
    key_id: string
    rate_limit_per_minute: number
    allowed_domains: string[]
  }
  error?: string
}

// =====================================================
// API Key Stats Types
// =====================================================

export interface ApiKeyStats {
  total_keys: number
  active_keys: number
  inactive_keys: number
  total_requests_today: number
  total_requests_this_month: number
}

export interface ApiKeyStatsResponse {
  success: boolean
  data?: ApiKeyStats
  error?: string
}

// =====================================================
// Constants
// =====================================================

export const MAX_API_KEYS_PER_ORG = 5
export const API_KEY_PREFIX = 'sk_live_'
export const API_KEY_LENGTH = 32
export const DEFAULT_RATE_LIMIT = 60 // requests per minute

// =====================================================
// Helper Functions
// =====================================================

export function maskApiKey(key: string): string {
  if (key.length < 8) return '****'
  const prefix = key.substring(0, 8)
  const suffix = key.substring(key.length - 4)
  return `${prefix}****${suffix}`
}

export function formatLastUsed(lastUsedAt: string | null): string {
  if (!lastUsedAt) return 'Never used'

  const date = new Date(lastUsedAt)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}

export function formatCreatedDate(createdAt: string): string {
  const date = new Date(createdAt)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function validateKeyName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Key name is required' }
  }
  if (name.length < 3) {
    return { valid: false, error: 'Key name must be at least 3 characters' }
  }
  if (name.length > 50) {
    return { valid: false, error: 'Key name must be less than 50 characters' }
  }
  return { valid: true }
}

export function validateDomain(domain: string): { valid: boolean; error?: string } {
  if (!domain || domain.trim().length === 0) {
    return { valid: true } // Empty domain is valid (means no restriction)
  }

  // Basic domain validation
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i
  const localhostRegex = /^localhost(:\d+)?$/

  if (!domainRegex.test(domain) && !localhostRegex.test(domain)) {
    return { valid: false, error: 'Invalid domain format' }
  }

  return { valid: true }
}

export function validateDomains(domains: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const domain of domains) {
    const result = validateDomain(domain)
    if (!result.valid && result.error) {
      errors.push(`${domain}: ${result.error}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function getKeyStatusColor(isActive: boolean): string {
  return isActive ? 'text-green-400' : 'text-gray-400'
}

export function getKeyStatusBadgeColor(isActive: boolean): string {
  return isActive
    ? 'bg-green-500/10 text-green-400 border-green-500/20'
    : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
}

export function getKeyStatusLabel(isActive: boolean): string {
  return isActive ? 'Active' : 'Inactive'
}

export function formatUsageCount(count: number): string {
  if (count === 0) return 'No requests'
  if (count === 1) return '1 request'
  if (count < 1000) return `${count} requests`
  if (count < 1000000) return `${(count / 1000).toFixed(1)}k requests`
  return `${(count / 1000000).toFixed(1)}M requests`
}
