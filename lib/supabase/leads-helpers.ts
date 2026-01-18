/**
 * =====================================================
 * Lead Management Helper Functions
 * =====================================================
 * High-level helper functions for lead-related database operations.
 * These functions provide type-safe wrappers around Supabase queries
 * and implement common patterns for lead management.
 * =====================================================
 */

import type { SupabaseClient, SupabaseServerClient } from "./client";
import type { Lead, LeadStatus, LeadSource } from "./types";

// =====================================================
// Lead Operations
// =====================================================

/**
 * Gets a lead by ID.
 * Verifies the user has access to the lead's organization via RLS.
 */
export async function getLeadById(
  supabase: SupabaseClient | SupabaseServerClient,
  leadId: string
) {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (error) {
    console.error("Error fetching lead:", error);
    return { data: null, error };
  }

  return { data: data as Lead, error: null };
}

/**
 * Gets leads for an organization with optional filtering.
 */
export async function getOrganizationLeads(
  supabase: SupabaseClient | SupabaseServerClient,
  organizationId: string,
  options: {
    status?: LeadStatus | "all";
    source?: LeadSource | "all";
    limit?: number;
    offset?: number;
  } = {}
) {
  const { status, source, limit = 20, offset = 0 } = options;

  let query = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (source && source !== "all") {
    query = query.eq("source", source);
  }

  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching leads:", error);
    return { data: null, count: 0, error };
  }

  return { data: data as Lead[], count: count || 0, error: null };
}

/**
 * Creates a new lead.
 */
export async function createLead(leadData: {
  organization_id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: LeadSource;
  lead_score?: number;
  product_interests?: string[];
  conversation_id?: string;
  conversation_summary?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer_url?: string;
  landing_page?: string;
  user_agent?: string;
  ip_address?: string;
  location_country?: string;
  location_city?: string;
  metadata?: Record<string, any>;
  notes?: string;
  internal_notes?: string;
}): Promise<{ data: Lead | null; error: any }> {
  // Use admin client for lead creation
  const { createAdminSupabaseClient } = await import("./client");
  const supabase = createAdminSupabaseClient();

  const { data, error } = await (supabase
    .from("leads")
    .insert as any)({
      organization_id: leadData.organization_id,
      name: leadData.name,
      email: leadData.email || "",
      phone: leadData.phone || null,
      company: leadData.company || null,
      status: "new" as LeadStatus,
      source: leadData.source || ("chatbot" as LeadSource),
      lead_score: leadData.lead_score || 0,
      product_interests: leadData.product_interests || [],
      conversation_id: leadData.conversation_id || null,
      conversation_summary: leadData.conversation_summary || null,
      utm_source: leadData.utm_source || null,
      utm_medium: leadData.utm_medium || null,
      utm_campaign: leadData.utm_campaign || null,
      utm_term: leadData.utm_term || null,
      utm_content: leadData.utm_content || null,
      referrer_url: leadData.referrer_url || null,
      landing_page: leadData.landing_page || null,
      user_agent: leadData.user_agent || null,
      ip_address: leadData.ip_address || null,
      location_country: leadData.location_country || null,
      location_city: leadData.location_city || null,
      metadata: leadData.metadata || {},
      notes: leadData.notes || null,
      internal_notes: leadData.internal_notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating lead:", error);
    return { data: null, error };
  }

  return { data: data as Lead, error: null };
}

/**
 * Updates a lead.
 * Only certain fields can be updated via this helper.
 */
export async function updateLead(
  supabase: SupabaseClient | SupabaseServerClient,
  leadId: string,
  updates: Partial<
    Pick<
      Lead,
      "status" | "lead_score" | "notes" | "internal_notes" | "metadata"
    >
  >
) {
  const { data, error } = await (supabase
    .from("leads")
    .update as any)(updates)
    .eq("id", leadId)
    .select()
    .single();

  if (error) {
    console.error("Error updating lead:", error);
    return { data: null, error };
  }

  return { data: data as Lead, error: null };
}

/**
 * Deletes a lead.
 * Should be used with caution - consider soft delete instead.
 */
export async function deleteLead(
  supabase: SupabaseClient | SupabaseServerClient,
  leadId: string
) {
  const { error } = await supabase.from("leads").delete().eq("id", leadId);

  if (error) {
    console.error("Error deleting lead:", error);
    return { success: false, error };
  }

  return { success: true, error: null };
}

/**
 * Searches leads by name or email.
 */
export async function searchLeads(
  supabase: SupabaseClient | SupabaseServerClient,
  organizationId: string,
  searchQuery: string,
  limit: number = 20
) {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("organization_id", organizationId)
    .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error searching leads:", error);
    return { data: null, error };
  }

  return { data: data as Lead[], error: null };
}

// =====================================================
// Lead Statistics
// =====================================================

/**
 * Gets lead count by status for an organization.
 */
export async function getLeadCountByStatus(
  supabase: SupabaseClient | SupabaseServerClient,
  organizationId: string
) {
  const { data, error } = (await supabase
    .from("leads")
    .select("status")
    .eq("organization_id", organizationId)) as { data: Array<{ status: LeadStatus }> | null; error: any };

  if (error) {
    console.error("Error fetching lead counts:", error);
    return { data: null, error };
  }

  // Count by status
  const counts = {
    new: 0,
    contacted: 0,
    qualified: 0,
    converted: 0,
    lost: 0,
    total: data?.length || 0,
  };

  (data || []).forEach((lead) => {
    if (lead.status in counts) {
      counts[lead.status as keyof typeof counts]++;
    }
  });

  return { data: counts, error: null };
}

/**
 * Gets average lead score for an organization.
 */
export async function getAverageLeadScore(
  supabase: SupabaseClient | SupabaseServerClient,
  organizationId: string
) {
  const { data, error } = (await supabase
    .from("leads")
    .select("lead_score")
    .eq("organization_id", organizationId)) as { data: Array<{ lead_score: number }> | null; error: any };

  if (error) {
    console.error("Error fetching lead scores:", error);
    return { data: null, error };
  }

  if (!data?.length) {
    return { data: 0, error: null };
  }

  const average =
    data.reduce((sum, lead) => sum + lead.lead_score, 0) / data.length;

  return { data: parseFloat(average.toFixed(1)), error: null };
}

/**
 * Gets recent leads (last N days).
 */
export async function getRecentLeads(
  supabase: SupabaseClient | SupabaseServerClient,
  organizationId: string,
  days: number = 7
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("organization_id", organizationId)
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching recent leads:", error);
    return { data: null, error };
  }

  return { data: data as Lead[], error: null };
}

// =====================================================
// Lead Activity Log Operations
// =====================================================

/**
 * Gets activity log for a lead.
 */
export async function getLeadActivity(
  supabase: SupabaseClient | SupabaseServerClient,
  leadId: string
) {
  const { data, error } = await supabase
    .from("lead_activity_log")
    .select(
      `
      id,
      activity_type,
      old_value,
      new_value,
      description,
      performed_by,
      metadata,
      created_at
    `
    )
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching lead activity:", error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Logs an activity for a lead.
 */
export async function logLeadActivity(
  supabase: SupabaseClient | SupabaseServerClient,
  leadId: string,
  organizationId: string,
  activityType: string,
  description: string,
  performedBy: string | null = null,
  metadata: Record<string, any> = {}
) {
  const { data, error } = await (supabase
    .from("lead_activity_log")
    .insert as any)({
      lead_id: leadId,
      organization_id: organizationId,
      activity_type: activityType,
      description,
      performed_by: performedBy,
      metadata,
    })
    .select()
    .single();

  if (error) {
    console.error("Error logging lead activity:", error);
    return { data: null, error };
  }

  return { data, error: null };
}

// =====================================================
// Validation Helpers
// =====================================================

/**
 * Checks if a lead exists and user has access.
 */
export async function leadExists(
  supabase: SupabaseClient | SupabaseServerClient,
  leadId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("leads")
    .select("id")
    .eq("id", leadId)
    .maybeSingle();

  if (error) {
    console.error("Error checking lead existence:", error);
    return false;
  }

  return data !== null;
}

/**
 * Checks if a lead belongs to an organization.
 */
export async function leadBelongsToOrganization(
  supabase: SupabaseClient | SupabaseServerClient,
  leadId: string,
  organizationId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("leads")
    .select("id")
    .eq("id", leadId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    console.error("Error checking lead organization:", error);
    return false;
  }

  return data !== null;
}

// =====================================================
// Bulk Operations
// =====================================================

/**
 * Updates multiple leads at once.
 * Useful for bulk status changes.
 */
export async function updateMultipleLeads(
  supabase: SupabaseClient | SupabaseServerClient,
  leadIds: string[],
  updates: Partial<Pick<Lead, "status" | "lead_score" | "metadata">>
) {
  const { data, error } = await (supabase
    .from("leads")
    .update as any)(updates)
    .in("id", leadIds)
    .select();

  if (error) {
    console.error("Error updating multiple leads:", error);
    return { data: null, error };
  }

  return { data: data as Lead[], error: null };
}

/**
 * Gets leads by IDs.
 */
export async function getLeadsByIds(
  supabase: SupabaseClient | SupabaseServerClient,
  leadIds: string[]
) {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .in("id", leadIds);

  if (error) {
    console.error("Error fetching leads by IDs:", error);
    return { data: null, error };
  }

  return { data: data as Lead[], error: null };
}

// =====================================================
// Query Builders
// =====================================================

/**
 * Builds a query for leads with common filters.
 * Returns the query builder for further customization.
 */
export function buildLeadsQuery(
  supabase: SupabaseClient | SupabaseServerClient,
  organizationId: string,
  options: {
    status?: LeadStatus | "all";
    source?: LeadSource | "all";
    dateFrom?: string;
    dateTo?: string;
    minScore?: number;
    maxScore?: number;
  } = {}
) {
  let query = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId);

  if (options.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  if (options.source && options.source !== "all") {
    query = query.eq("source", options.source);
  }

  if (options.dateFrom) {
    query = query.gte("created_at", options.dateFrom);
  }

  if (options.dateTo) {
    query = query.lte("created_at", options.dateTo);
  }

  if (options.minScore !== undefined) {
    query = query.gte("lead_score", options.minScore);
  }

  if (options.maxScore !== undefined) {
    query = query.lte("lead_score", options.maxScore);
  }

  return query;
}

// =====================================================
// Utility Functions
// =====================================================

/**
 * Calculates conversion rate for leads.
 */
export function calculateConversionRate(
  totalLeads: number,
  convertedLeads: number
): number {
  if (totalLeads === 0) return 0;
  return parseFloat(((convertedLeads / totalLeads) * 100).toFixed(1));
}

/**
 * Formats lead score into a grade (A-F).
 */
export function getLeadScoreGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

/**
 * Determines if a lead is "hot" based on score and recency.
 */
export function isHotLead(lead: Lead): boolean {
  const daysSinceCreation =
    (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24);
  return lead.lead_score >= 75 && daysSinceCreation <= 7;
}

/**
 * Formats lead for export (CSV, etc.).
 */
export function formatLeadForExport(
  lead: Lead
): Record<string, string | number> {
  return {
    Name: lead.name,
    Email: lead.email,
    Phone: lead.phone || "",
    Company: lead.company || "",
    Status: lead.status,
    Source: lead.source,
    "Lead Score": lead.lead_score,
    "Product Interests": lead.product_interests.join(", "),
    "Created At": lead.created_at,
    "UTM Source": lead.utm_source || "",
    "UTM Campaign": lead.utm_campaign || "",
  };
}
