import { z } from 'zod'

/**
 * =====================================================
 * Lead Validation Schemas
 * =====================================================
 */

// =====================================================
// Enums
// =====================================================

export const leadStatusEnum = z.enum(['new', 'contacted', 'qualified', 'converted', 'lost'])
export const leadSourceEnum = z.enum(['chatbot', 'manual', 'import', 'web_form', 'referral'])

export type LeadStatus = z.infer<typeof leadStatusEnum>
export type LeadSource = z.infer<typeof leadSourceEnum>

// =====================================================
// Query Parameter Schemas
// =====================================================

/**
 * Schema for GET /api/leads query parameters
 * Handles pagination, filtering, sorting, and search
 */
export const getLeadsQuerySchema = z.object({
  organization_id: z.string().uuid('Invalid organization ID'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: leadStatusEnum.or(z.literal('all')).optional().default('all'),
  source: leadSourceEnum.or(z.literal('all')).optional().default('all'),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  search: z.string().min(1).max(100).optional(),
  sort: z.enum(['created_at', 'lead_score', 'name', 'status']).optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
})

export type GetLeadsQuery = z.infer<typeof getLeadsQuerySchema>

/**
 * Schema for GET /api/leads/stats query parameters
 */
export const getLeadStatsQuerySchema = z.object({
  organization_id: z.string().uuid('Invalid organization ID'),
  days_back: z.coerce.number().int().min(1).max(365).optional().default(30),
})

export type GetLeadStatsQuery = z.infer<typeof getLeadStatsQuerySchema>

// =====================================================
// Request Body Schemas
// =====================================================

/**
 * Schema for PATCH /api/leads/[id] request body
 * Allows updating lead status, score, notes, and metadata
 */
export const updateLeadSchema = z.object({
  status: leadStatusEnum.optional(),
  lead_score: z.number().int().min(0).max(100).optional(),
  notes: z.string().max(5000).optional(),
  internal_notes: z.string().max(5000).optional(),
  metadata: z.record(z.any()).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be provided for update'
)

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>

/**
 * Schema for creating a new lead (PUBLIC API)
 * Used in POST /api/public/leads
 */
export const createLeadSchema = z.object({
  // Required fields
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name must be at most 200 characters'),
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email must be at most 255 characters'),

  // Optional contact info
  phone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),

  // Lead classification
  source: leadSourceEnum.optional().default('chatbot'),
  product_interests: z.array(z.string()).optional().default([]),

  // Conversation context
  conversation_id: z.string().uuid().optional(),
  conversation_summary: z.string().max(5000).optional(),

  // Marketing attribution
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(200).optional(),
  utm_term: z.string().max(200).optional(),
  utm_content: z.string().max(200).optional(),
  referrer_url: z.string().url().max(500).optional().or(z.literal('')),
  landing_page: z.string().url().max(500).optional().or(z.literal('')),

  // Technical metadata (auto-captured if not provided)
  user_agent: z.string().max(500).optional(),
  ip_address: z.string().ip().optional().or(z.string().max(50).optional()),

  // Custom fields
  metadata: z.record(z.any()).optional().default({}),
})

export type CreateLeadInput = z.infer<typeof createLeadSchema>

// =====================================================
// Response Type Schemas
// =====================================================

/**
 * Schema for lead list item (summary view)
 */
export const leadListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  company: z.string().nullable(),
  status: leadStatusEnum,
  source: leadSourceEnum,
  lead_score: z.number().int().min(0).max(100),
  product_interests: z.array(z.string()),
  created_at: z.string(),
  last_contacted_at: z.string().nullable(),
})

export type LeadListItem = z.infer<typeof leadListItemSchema>

/**
 * Schema for lead detail (full view)
 */
export const leadDetailSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  company: z.string().nullable(),
  status: leadStatusEnum,
  source: leadSourceEnum,
  lead_score: z.number().int().min(0).max(100),
  product_interests: z.array(z.string()),
  conversation_id: z.string().uuid().nullable(),
  conversation_summary: z.string().nullable(),
  utm_source: z.string().nullable(),
  utm_medium: z.string().nullable(),
  utm_campaign: z.string().nullable(),
  utm_term: z.string().nullable(),
  utm_content: z.string().nullable(),
  referrer_url: z.string().nullable(),
  landing_page: z.string().nullable(),
  user_agent: z.string().nullable(),
  ip_address: z.string().nullable(),
  location_country: z.string().nullable(),
  location_city: z.string().nullable(),
  metadata: z.record(z.any()),
  notes: z.string().nullable(),
  internal_notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  last_contacted_at: z.string().nullable(),
  converted_at: z.string().nullable(),
  activity: z.array(z.any()).optional(),
})

export type LeadDetail = z.infer<typeof leadDetailSchema>

/**
 * Schema for pagination metadata
 */
export const paginationSchema = z.object({
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  total_pages: z.number().int(),
  has_next: z.boolean(),
  has_prev: z.boolean(),
})

export type Pagination = z.infer<typeof paginationSchema>

/**
 * Schema for lead statistics
 */
export const leadStatsSchema = z.object({
  total_leads: z.number().int(),
  new_leads: z.number().int(),
  qualified_leads: z.number().int(),
  converted_leads: z.number().int(),
  avg_lead_score: z.number(),
  conversion_rate: z.number(),
  change: z.object({
    total_leads: z.string(),
    new_leads: z.string(),
    conversion_rate: z.string(),
  }).optional(),
})

export type LeadStats = z.infer<typeof leadStatsSchema>

// =====================================================
// Helper Functions
// =====================================================

/**
 * Validates if a status transition is allowed
 */
export function isValidStatusTransition(
  currentStatus: LeadStatus,
  newStatus: LeadStatus
): boolean {
  // Define allowed transitions
  const allowedTransitions: Record<LeadStatus, LeadStatus[]> = {
    new: ['contacted', 'qualified', 'lost'],
    contacted: ['qualified', 'lost', 'new'],
    qualified: ['converted', 'lost', 'contacted'],
    converted: [], // Cannot transition from converted
    lost: ['new', 'contacted'], // Can re-engage lost leads
  }

  return allowedTransitions[currentStatus]?.includes(newStatus) ?? false
}

/**
 * Validates lead score range
 */
export function isValidLeadScore(score: number): boolean {
  return score >= 0 && score <= 100
}

/**
 * Sanitizes search query
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/[^\w\s@.-]/g, '') // Remove special chars except @, ., -
    .substring(0, 100) // Limit length
}

/**
 * Validates date range
 */
export function isValidDateRange(dateFrom?: string, dateTo?: string): boolean {
  if (!dateFrom || !dateTo) return true

  const from = new Date(dateFrom)
  const to = new Date(dateTo)

  return from <= to
}

/**
 * Formats pagination response
 */
export function formatPagination(
  total: number,
  page: number,
  limit: number
): Pagination {
  const totalPages = Math.ceil(total / limit)

  return {
    total,
    page,
    limit,
    total_pages: totalPages,
    has_next: page < totalPages,
    has_prev: page > 1,
  }
}
