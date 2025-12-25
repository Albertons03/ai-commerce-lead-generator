/**
 * =====================================================
 * Lead Types - Phase 2
 * =====================================================
 * TypeScript types for leads and related entities
 * =====================================================
 */

// Lead status enumeration
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

// Lead source enumeration
export type LeadSource = 'chatbot' | 'manual' | 'import' | 'web_form' | 'referral';

/**
 * Main Lead interface matching the database schema
 */
export interface Lead {
  // Primary identification
  id: string;
  organization_id: string;

  // Contact information
  name: string;
  email: string;
  phone: string | null;
  company: string | null;

  // Lead classification
  status: LeadStatus;
  source: LeadSource;
  lead_score: number;

  // Product interests
  product_interests: string[];

  // Conversation context
  conversation_id: string | null;
  conversation_summary: string | null;

  // Marketing attribution
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  referrer_url: string | null;
  landing_page: string | null;

  // Technical metadata
  user_agent: string | null;
  ip_address: string | null;
  location_country: string | null;
  location_city: string | null;

  // Flexible metadata
  metadata: Record<string, any>;

  // Notes and activity
  notes: string | null;
  internal_notes: string | null;

  // Lifecycle timestamps
  created_at: string;
  updated_at: string;
  last_contacted_at: string | null;
  converted_at: string | null;
}

/**
 * Params for creating a new lead
 */
export interface CreateLeadParams {
  organization_id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  status?: LeadStatus;
  source?: LeadSource;
  lead_score?: number;
  product_interests?: string[];
  conversation_summary?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  referrer_url?: string | null;
  landing_page?: string | null;
  user_agent?: string | null;
  ip_address?: string | null;
  metadata?: Record<string, any>;
  notes?: string | null;
}

/**
 * Params for updating a lead
 */
export interface UpdateLeadParams {
  name?: string;
  email?: string;
  phone?: string | null;
  company?: string | null;
  status?: LeadStatus;
  source?: LeadSource;
  lead_score?: number;
  product_interests?: string[];
  conversation_summary?: string | null;
  notes?: string | null;
  internal_notes?: string | null;
  last_contacted_at?: string | null;
}

/**
 * Activity timeline event
 */
export interface LeadActivityEvent {
  id: string;
  type: 'created' | 'status_change' | 'note_added' | 'contacted' | 'converted';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Lead filters for list queries
 */
export interface LeadFilters {
  status?: LeadStatus | LeadStatus[];
  source?: LeadSource | LeadSource[];
  min_score?: number;
  max_score?: number;
  search?: string;
  created_after?: string;
  created_before?: string;
}

/**
 * Lead list query options
 */
export interface LeadQueryOptions {
  filters?: LeadFilters;
  page?: number;
  pageSize?: number;
  sortBy?: keyof Lead;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Lead statistics
 */
export interface LeadStats {
  total_leads: number;
  new_leads_7d: number;
  new_leads_30d: number;
  avg_lead_score: number;
  conversion_rate: number;
  by_status: Record<LeadStatus, number>;
  by_source: Record<LeadSource, number>;
}

/**
 * Status badge configuration
 */
export interface StatusBadgeConfig {
  label: string;
  color: 'default' | 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  variant: 'default' | 'secondary' | 'outline';
}

/**
 * Status configuration map
 */
export const LEAD_STATUS_CONFIG: Record<LeadStatus, StatusBadgeConfig> = {
  new: {
    label: 'New',
    color: 'blue',
    variant: 'default',
  },
  contacted: {
    label: 'Contacted',
    color: 'purple',
    variant: 'default',
  },
  qualified: {
    label: 'Qualified',
    color: 'yellow',
    variant: 'default',
  },
  converted: {
    label: 'Converted',
    color: 'green',
    variant: 'default',
  },
  lost: {
    label: 'Lost',
    color: 'red',
    variant: 'outline',
  },
};

/**
 * Source display configuration
 */
export const LEAD_SOURCE_CONFIG: Record<LeadSource, { label: string; icon?: string }> = {
  chatbot: {
    label: 'AI Chatbot',
    icon: 'MessageSquare',
  },
  manual: {
    label: 'Manual Entry',
    icon: 'UserPlus',
  },
  import: {
    label: 'Import',
    icon: 'Upload',
  },
  web_form: {
    label: 'Web Form',
    icon: 'Globe',
  },
  referral: {
    label: 'Referral',
    icon: 'Users',
  },
};

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

/**
 * Leads API response
 */
export interface LeadsResponse {
  data: Lead[];
  meta: PaginationMeta;
}

/**
 * Sort field and order types
 */
export type SortField = 'name' | 'email' | 'status' | 'lead_score' | 'created_at';
export type SortOrder = 'asc' | 'desc';
