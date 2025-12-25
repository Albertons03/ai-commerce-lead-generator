/**
 * =====================================================
 * Lead Management Types
 * =====================================================
 * TypeScript types for lead-related API responses and data structures
 */

import { Lead, LeadStatus, LeadSource } from '../supabase/types'

// =====================================================
// Lead Statistics Types
// =====================================================

export interface LeadStats {
  total_leads: number
  total_leads_change: number // Percentage change vs previous period
  new_leads_7d: number // New leads in last 7 days
  new_leads_7d_change: number // Percentage change vs previous 7 days
  avg_lead_score: number
  avg_lead_score_change: number // Percentage change vs previous period
  conversion_rate: number // Percentage of leads converted
  conversion_rate_change: number // Percentage change vs previous period
}

export interface LeadStatsResponse {
  success: boolean
  data?: LeadStats
  error?: string
}

// =====================================================
// Lead List Types
// =====================================================

export interface LeadListParams {
  organization_id: string
  page?: number
  limit?: number
  status?: LeadStatus
  source?: LeadSource
  search?: string
  date_range?: {
    start: string
    end: string
  }
  sort_by?: 'created_at' | 'lead_score' | 'status'
  sort_order?: 'asc' | 'desc'
}

export interface LeadListResponse {
  success: boolean
  data?: {
    leads: Lead[]
    count: number
    page: number
    page_size: number
    total_pages: number
  }
  error?: string
}

// =====================================================
// Lead Detail Types
// =====================================================

export interface LeadWithActivity extends Lead {
  activity_count: number
  last_activity_at: string | null
}

export interface LeadDetailResponse {
  success: boolean
  data?: LeadWithActivity
  error?: string
}

// =====================================================
// Lead Creation Types
// =====================================================

export interface CreateLeadInput {
  name: string
  email: string
  phone?: string | null
  company?: string | null
  status?: LeadStatus
  source?: LeadSource
  product_interests?: string[]
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_term?: string | null
  utm_content?: string | null
  referrer_url?: string | null
  landing_page?: string | null
  metadata?: Record<string, any>
  notes?: string | null
}

export interface CreateLeadResponse {
  success: boolean
  data?: Lead
  error?: string
  field?: string
}

// =====================================================
// Lead Update Types
// =====================================================

export interface UpdateLeadInput {
  name?: string
  email?: string
  phone?: string | null
  company?: string | null
  status?: LeadStatus
  lead_score?: number
  product_interests?: string[]
  notes?: string | null
  internal_notes?: string | null
}

export interface UpdateLeadResponse {
  success: boolean
  data?: Lead
  error?: string
  field?: string
}

// =====================================================
// Lead Export Types
// =====================================================

export interface LeadExportParams {
  organization_id: string
  status?: LeadStatus
  source?: LeadSource
  date_range?: {
    start: string
    end: string
  }
  format: 'csv' | 'json'
}

export interface LeadExportResponse {
  success: boolean
  data?: {
    url: string
    count: number
    expires_at: string
  }
  error?: string
}

// =====================================================
// Helper Functions
// =====================================================

export function getLeadStatusColor(status: LeadStatus): string {
  const colors: Record<LeadStatus, string> = {
    new: 'text-blue-400',
    contacted: 'text-yellow-400',
    qualified: 'text-purple-400',
    converted: 'text-green-400',
    lost: 'text-gray-400',
  }
  return colors[status] || 'text-gray-400'
}

export function getLeadStatusBadgeColor(status: LeadStatus): string {
  const colors: Record<LeadStatus, string> = {
    new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    contacted: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    qualified: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    converted: 'bg-green-500/10 text-green-400 border-green-500/20',
    lost: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  }
  return colors[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
}

export function getLeadStatusLabel(status: LeadStatus): string {
  const labels: Record<LeadStatus, string> = {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    converted: 'Converted',
    lost: 'Lost',
  }
  return labels[status] || status
}

export function getLeadSourceLabel(source: LeadSource): string {
  const labels: Record<LeadSource, string> = {
    chatbot: 'Chatbot',
    manual: 'Manual Entry',
    import: 'Bulk Import',
    web_form: 'Web Form',
    referral: 'Referral',
  }
  return labels[source] || source
}

export function formatLeadScore(score: number): string {
  if (score >= 80) return 'Hot'
  if (score >= 60) return 'Warm'
  if (score >= 40) return 'Cool'
  return 'Cold'
}

export function getLeadScoreColor(score: number): string {
  if (score >= 80) return 'text-red-400'
  if (score >= 60) return 'text-orange-400'
  if (score >= 40) return 'text-yellow-400'
  return 'text-blue-400'
}

export function formatPercentageChange(change: number): string {
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}

export function getChangeColor(change: number): string {
  if (change > 0) return 'text-green-400'
  if (change < 0) return 'text-red-400'
  return 'text-gray-400'
}
