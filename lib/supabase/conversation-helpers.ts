/**
 * Conversation Helpers
 *
 * Database operations for conversations:
 * - Create and retrieve conversations
 * - Update conversation state
 * - List conversations (admin)
 * - Abandon stale conversations
 */

import { createClient } from "@supabase/supabase-js";

// =====================================================
// Types
// =====================================================

export type ConversationStatus = "active" | "completed" | "abandoned";
export type ConversationIntent =
  | "browse"
  | "compare"
  | "purchase"
  | "support"
  | "other";
export type ConversationSentiment = "positive" | "neutral" | "negative";

export interface Conversation {
  id: string;
  organization_id: string;
  session_id: string;
  lead_id: string | null;
  status: ConversationStatus;
  intent: ConversationIntent | null;
  sentiment: ConversationSentiment | null;
  message_count: number;
  last_message_at: string | null;
  visitor_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithLead extends Conversation {
  lead: {
    id: string;
    email: string;
    name: string | null;
    status: string;
  } | null;
}

export interface ListConversationsOptions {
  status?: ConversationStatus;
  limit?: number;
  offset?: number;
  includeLeads?: boolean;
}

export interface ListConversationsResult {
  conversations: Conversation[] | ConversationWithLead[];
  total: number;
  limit: number;
  offset: number;
}

// =====================================================
// Client Creation
// =====================================================

/**
 * Create a Supabase client with service role key
 */
function getServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// =====================================================
// Create Operations
// =====================================================

/**
 * Create a new conversation
 */
export async function createConversation(
  organizationId: string,
  sessionId: string,
  visitorMetadata: Record<string, unknown> = {}
): Promise<Conversation> {
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      organization_id: organizationId,
      session_id: sessionId,
      status: "active",
      visitor_metadata: visitorMetadata,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create conversation: ${error.message}`);
  }

  return data as Conversation;
}

/**
 * Initialize conversation - creates new or returns existing based on session
 */
export async function initializeConversation(
  organizationId: string,
  sessionId: string,
  visitorMetadata: Record<string, unknown> = {}
): Promise<{ conversation: Conversation; isNew: boolean }> {
  // First, try to find existing conversation by session
  const existing = await getConversationBySession(sessionId, organizationId);

  if (existing) {
    // Update visitor metadata if provided
    if (Object.keys(visitorMetadata).length > 0) {
      await updateConversationMetadata(existing.id, {
        ...existing.visitor_metadata,
        ...visitorMetadata,
        last_seen: new Date().toISOString(),
      });

      // Return updated conversation
      const updated = await getConversation(existing.id);
      return { conversation: updated!, isNew: false };
    }

    return { conversation: existing, isNew: false };
  }

  // Create new conversation
  const newConversation = await createConversation(organizationId, sessionId, {
    ...visitorMetadata,
    first_seen: new Date().toISOString(),
  });

  return { conversation: newConversation, isNew: true };
}

// =====================================================
// Read Operations
// =====================================================

/**
 * Get conversation by session ID
 */
export async function getConversationBySession(
  organizationId: string,
  sessionId: string
): Promise<Conversation | null> {
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("session_id", sessionId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to get conversation by session: ${error.message}`);
  }

  return data as Conversation;
}

/**
 * Get conversation by ID
 */
export async function getConversation(
  conversationId: string
): Promise<Conversation | null> {
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to get conversation: ${error.message}`);
  }

  return data as Conversation;
}

/**
 * List conversations for an organization
 */
export async function listConversations(
  organizationId: string,
  options: ListConversationsOptions = {}
): Promise<ListConversationsResult> {
  const { status, limit = 20, offset = 0, includeLeads = false } = options;

  const supabase = getServiceRoleClient();

  // Build query
  let query = supabase
    .from("conversations")
    .select(
      includeLeads
        ? `
          *,
          lead:leads!conversations_lead_id_fkey (
            id,
            email,
            name,
            status
          )
        `
        : "*",
      { count: "exact" }
    )
    .eq("organization_id", organizationId)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  // Filter by status
  if (status) {
    query = query.eq("status", status);
  }

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list conversations: ${error.message}`);
  }

  return {
    conversations: data as Conversation[] | ConversationWithLead[],
    total: count || 0,
    limit,
    offset,
  };
}

// =====================================================
// Update Operations
// =====================================================

/**
 * Update conversation status
 */
export async function updateConversationStatus(
  conversationId: string,
  status: ConversationStatus
): Promise<void> {
  const supabase = getServiceRoleClient();

  const { error } = await supabase
    .from("conversations")
    .update({ status })
    .eq("id", conversationId);

  if (error) {
    throw new Error(`Failed to update conversation status: ${error.message}`);
  }
}

/**
 * Update conversation metadata (intent, sentiment, lead_id)
 */
export async function updateConversationMetadata(
  conversationId: string,
  updates: {
    intent?: ConversationIntent;
    sentiment?: ConversationSentiment;
    lead_id?: string | null;
  }
): Promise<void> {
  const supabase = getServiceRoleClient();

  const { error } = await supabase
    .from("conversations")
    .update(updates)
    .eq("id", conversationId);

  if (error) {
    throw new Error(`Failed to update conversation metadata: ${error.message}`);
  }
}

/**
 * Associate conversation with a lead
 */
export async function linkConversationToLead(
  conversationId: string,
  leadId: string
): Promise<void> {
  await updateConversationMetadata(conversationId, { lead_id: leadId });
}

// =====================================================
// Background Jobs
// =====================================================

/**
 * Abandon stale conversations (no activity for N minutes)
 */
export async function abandonStaleConversations(
  organizationId: string,
  inactiveMinutes: number = 30
): Promise<number> {
  const supabase = getServiceRoleClient();

  const cutoffTime = new Date();
  cutoffTime.setMinutes(cutoffTime.getMinutes() - inactiveMinutes);

  const { data, error } = await supabase
    .from("conversations")
    .update({ status: "abandoned" })
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .lt("last_message_at", cutoffTime.toISOString())
    .select("id");

  if (error) {
    throw new Error(`Failed to abandon stale conversations: ${error.message}`);
  }

  return (data || []).length;
}

// =====================================================
// Statistics
// =====================================================

/**
 * Get conversation statistics for organization
 */
export async function getConversationStats(
  organizationId: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<{
  total: number;
  active: number;
  completed: number;
  abandoned: number;
  avgMessagesPerConversation: number;
  conversationsWithLeads: number;
}> {
  const supabase = getServiceRoleClient();

  let query = supabase
    .from("conversations")
    .select("status, message_count, lead_id")
    .eq("organization_id", organizationId);

  if (dateFrom) {
    query = query.gte("created_at", dateFrom.toISOString());
  }

  if (dateTo) {
    query = query.lte("created_at", dateTo.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get conversation stats: ${error.message}`);
  }

  const conversations = data || [];

  const stats = {
    total: conversations.length,
    active: conversations.filter((c) => c.status === "active").length,
    completed: conversations.filter((c) => c.status === "completed").length,
    abandoned: conversations.filter((c) => c.status === "abandoned").length,
    avgMessagesPerConversation:
      conversations.length > 0
        ? conversations.reduce((sum, c) => sum + c.message_count, 0) /
          conversations.length
        : 0,
    conversationsWithLeads: conversations.filter((c) => c.lead_id !== null)
      .length,
  };

  return stats;
}

// =====================================================
// Verification
// =====================================================

/**
 * Check if conversation belongs to organization
 */
export async function verifyConversationAccess(
  conversationId: string,
  organizationId: string
): Promise<boolean> {
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("organization_id", organizationId)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}
