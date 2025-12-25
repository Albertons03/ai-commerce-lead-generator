/**
 * Message Helpers
 *
 * Database operations for messages:
 * - Create messages with auto-sequencing
 * - Retrieve message history
 * - Search messages
 */

import { createClient } from '@supabase/supabase-js';

// =====================================================
// Types
// =====================================================

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  conversation_id: string;
  organization_id: string;
  role: MessageRole;
  content: string;
  sequence_number: number;
  retrieved_context: Record<string, unknown>[] | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CreateMessageOptions {
  retrievedContext?: Record<string, unknown>[];
  metadata?: Record<string, unknown>;
}

export interface GetMessagesOptions {
  limit?: number;
  offset?: number;
  afterSequence?: number;
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
    throw new Error('Missing Supabase environment variables');
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
 * Create a new message
 *
 * Automatically calculates sequence_number based on existing messages
 * Triggers will update conversation's message_count and last_message_at
 */
export async function createMessage(
  conversationId: string,
  organizationId: string,
  role: MessageRole,
  content: string,
  options: CreateMessageOptions = {}
): Promise<Message> {
  const supabase = getServiceRoleClient();

  // Get next sequence number
  const sequenceNumber = await getNextSequenceNumber(conversationId);

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      organization_id: organizationId,
      role,
      content,
      sequence_number: sequenceNumber,
      retrieved_context: options.retrievedContext || null,
      metadata: options.metadata || {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create message: ${error.message}`);
  }

  return data as Message;
}

/**
 * Get next sequence number for a conversation
 */
async function getNextSequenceNumber(conversationId: string): Promise<number> {
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from('messages')
    .select('sequence_number')
    .eq('conversation_id', conversationId)
    .order('sequence_number', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // No messages yet, start at 1
    if (error.code === 'PGRST116') {
      return 1;
    }
    throw new Error(`Failed to get next sequence number: ${error.message}`);
  }

  return (data?.sequence_number || 0) + 1;
}

// =====================================================
// Read Operations
// =====================================================

/**
 * Get messages for a conversation
 *
 * Returns messages ordered by sequence_number
 */
export async function getMessages(
  conversationId: string,
  options: GetMessagesOptions = {}
): Promise<Message[]> {
  const { limit, offset, afterSequence } = options;

  const supabase = getServiceRoleClient();

  let query = supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('sequence_number', { ascending: true });

  // Filter by sequence number
  if (afterSequence !== undefined) {
    query = query.gt('sequence_number', afterSequence);
  }

  // Pagination
  if (limit !== undefined) {
    const rangeStart = offset || 0;
    const rangeEnd = rangeStart + limit - 1;
    query = query.range(rangeStart, rangeEnd);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get messages: ${error.message}`);
  }

  return data as Message[];
}

/**
 * Get recent messages for context
 *
 * Returns last N messages in chronological order
 */
export async function getRecentMessages(
  conversationId: string,
  count: number = 10
): Promise<Message[]> {
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('sequence_number', { ascending: false })
    .limit(count);

  if (error) {
    throw new Error(`Failed to get recent messages: ${error.message}`);
  }

  // Reverse to get chronological order
  return (data as Message[]).reverse();
}

/**
 * Get a single message by ID
 */
export async function getMessage(messageId: string): Promise<Message | null> {
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('id', messageId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get message: ${error.message}`);
  }

  return data as Message;
}

// =====================================================
// Statistics
// =====================================================

/**
 * Count messages in a conversation
 */
export async function countMessages(conversationId: string): Promise<number> {
  const supabase = getServiceRoleClient();

  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', conversationId);

  if (error) {
    throw new Error(`Failed to count messages: ${error.message}`);
  }

  return count || 0;
}

/**
 * Get message count by role
 */
export async function getMessageCountsByRole(
  conversationId: string
): Promise<{
  user: number;
  assistant: number;
  system: number;
}> {
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from('messages')
    .select('role')
    .eq('conversation_id', conversationId);

  if (error) {
    throw new Error(`Failed to get message counts: ${error.message}`);
  }

  const messages = data || [];

  return {
    user: messages.filter((m) => m.role === 'user').length,
    assistant: messages.filter((m) => m.role === 'assistant').length,
    system: messages.filter((m) => m.role === 'system').length,
  };
}

// =====================================================
// Search Operations
// =====================================================

/**
 * Search messages by content (full-text search)
 */
export async function searchMessages(
  organizationId: string,
  query: string,
  limit: number = 20
): Promise<Message[]> {
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('organization_id', organizationId)
    .textSearch('content', query)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to search messages: ${error.message}`);
  }

  return data as Message[];
}

/**
 * Search messages in a specific conversation
 */
export async function searchMessagesInConversation(
  conversationId: string,
  query: string
): Promise<Message[]> {
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .textSearch('content', query)
    .order('sequence_number', { ascending: true });

  if (error) {
    throw new Error(`Failed to search messages in conversation: ${error.message}`);
  }

  return data as Message[];
}

// =====================================================
// Delete Operations
// =====================================================

/**
 * Delete messages in a conversation (cascade will handle this)
 */
export async function deleteConversationMessages(
  conversationId: string
): Promise<number> {
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from('messages')
    .delete()
    .eq('conversation_id', conversationId)
    .select('id');

  if (error) {
    throw new Error(`Failed to delete messages: ${error.message}`);
  }

  return (data || []).length;
}

// =====================================================
// Context Building
// =====================================================

/**
 * Build conversation context for AI
 *
 * Returns formatted message history suitable for OpenAI chat completion
 */
export async function buildConversationContext(
  conversationId: string,
  maxMessages: number = 20
): Promise<
  Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>
> {
  const messages = await getRecentMessages(conversationId, maxMessages);

  return messages.map((msg) => ({
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
  }));
}

/**
 * Get conversation summary statistics
 */
export async function getConversationMessageStats(
  conversationId: string
): Promise<{
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  systemMessages: number;
  avgMessageLength: number;
  firstMessageAt: string | null;
  lastMessageAt: string | null;
}> {
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from('messages')
    .select('role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('sequence_number', { ascending: true });

  if (error) {
    throw new Error(`Failed to get conversation stats: ${error.message}`);
  }

  const messages = data || [];

  if (messages.length === 0) {
    return {
      totalMessages: 0,
      userMessages: 0,
      assistantMessages: 0,
      systemMessages: 0,
      avgMessageLength: 0,
      firstMessageAt: null,
      lastMessageAt: null,
    };
  }

  const totalLength = messages.reduce((sum, msg) => sum + msg.content.length, 0);

  return {
    totalMessages: messages.length,
    userMessages: messages.filter((m) => m.role === 'user').length,
    assistantMessages: messages.filter((m) => m.role === 'assistant').length,
    systemMessages: messages.filter((m) => m.role === 'system').length,
    avgMessageLength: totalLength / messages.length,
    firstMessageAt: messages[0].created_at,
    lastMessageAt: messages[messages.length - 1].created_at,
  };
}
