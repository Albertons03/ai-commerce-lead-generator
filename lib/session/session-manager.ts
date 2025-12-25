/**
 * Session Manager
 *
 * Handles conversation session management:
 * - Generate and store session IDs (client-side)
 * - Initialize conversations (server-side)
 * - Resume conversations (server-side)
 */

import { v4 as uuidv4 } from 'uuid';
import {
  createConversation,
  getConversationBySession,
  updateConversationStatus,
  type Conversation,
} from '../supabase/conversation-helpers';

// =====================================================
// Client-Side Session Management
// =====================================================

const SESSION_KEY = 'chatbot_session_id';

/**
 * Get or create session ID (client-side only)
 *
 * Stores session ID in localStorage to persist across page reloads
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    throw new Error('getSessionId can only be called on the client side');
  }

  let sessionId = localStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
}

/**
 * Clear session ID (useful for testing or logout)
 */
export function clearSessionId(): void {
  if (typeof window === 'undefined') {
    throw new Error('clearSessionId can only be called on the client side');
  }

  localStorage.removeItem(SESSION_KEY);
}

/**
 * Check if session exists (client-side)
 */
export function hasSession(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return localStorage.getItem(SESSION_KEY) !== null;
}

// =====================================================
// Server-Side Conversation Management
// =====================================================

export interface InitializeConversationOptions {
  userAgent?: string;
  referrer?: string;
  ip?: string;
  [key: string]: unknown;
}

/**
 * Initialize a new conversation for a session
 *
 * Creates a new conversation or returns existing active conversation
 */
export async function initializeConversation(
  organizationId: string,
  sessionId: string,
  visitorMetadata: InitializeConversationOptions = {}
): Promise<{
  conversation: Conversation;
  isNew: boolean;
}> {
  // Check if conversation already exists for this session
  const existing = await getConversationBySession(organizationId, sessionId);

  if (existing && existing.status === 'active') {
    return {
      conversation: existing,
      isNew: false,
    };
  }

  // Create new conversation
  const conversation = await createConversation(
    organizationId,
    sessionId,
    visitorMetadata
  );

  return {
    conversation,
    isNew: true,
  };
}

/**
 * Resume an existing conversation
 *
 * Returns conversation if exists and is active, null otherwise
 */
export async function resumeConversation(
  organizationId: string,
  sessionId: string
): Promise<Conversation | null> {
  const conversation = await getConversationBySession(organizationId, sessionId);

  if (!conversation || conversation.status !== 'active') {
    return null;
  }

  return conversation;
}

/**
 * End a conversation
 *
 * Updates conversation status to completed or abandoned
 */
export async function endConversation(
  conversationId: string,
  status: 'completed' | 'abandoned' = 'completed'
): Promise<void> {
  await updateConversationStatus(conversationId, status);
}

// =====================================================
// Visitor Metadata Helpers
// =====================================================

/**
 * Extract visitor metadata from request (server-side)
 */
export function extractVisitorMetadata(request: Request): InitializeConversationOptions {
  const headers = request.headers;

  return {
    userAgent: headers.get('user-agent') || 'unknown',
    referrer: headers.get('referer') || headers.get('referrer') || undefined,
    // IP is usually set by reverse proxy (Vercel, Cloudflare, etc.)
    ip:
      headers.get('x-forwarded-for')?.split(',')[0] ||
      headers.get('x-real-ip') ||
      undefined,
  };
}

// =====================================================
// Session Validation
// =====================================================

/**
 * Validate session ID format
 */
export function isValidSessionId(sessionId: string): boolean {
  // UUIDs are 36 characters with hyphens
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(sessionId);
}

/**
 * Generate a new session ID (can be used server-side)
 */
export function generateSessionId(): string {
  return uuidv4();
}

// =====================================================
// Conversation State Helpers
// =====================================================

/**
 * Check if conversation is active
 */
export function isConversationActive(conversation: Conversation): boolean {
  return conversation.status === 'active';
}

/**
 * Check if conversation should be abandoned due to inactivity
 */
export function shouldAbandonConversation(
  conversation: Conversation,
  inactiveMinutes: number = 30
): boolean {
  if (conversation.status !== 'active') {
    return false;
  }

  if (!conversation.last_message_at) {
    // Use created_at if no messages yet
    const createdAt = new Date(conversation.created_at);
    const now = new Date();
    const minutesInactive = (now.getTime() - createdAt.getTime()) / 1000 / 60;
    return minutesInactive > inactiveMinutes;
  }

  const lastMessageAt = new Date(conversation.last_message_at);
  const now = new Date();
  const minutesInactive = (now.getTime() - lastMessageAt.getTime()) / 1000 / 60;

  return minutesInactive > inactiveMinutes;
}

// =====================================================
// Client-Side API Helpers
// =====================================================

/**
 * Initialize conversation via API (client-side)
 */
export async function initializeConversationAPI(
  organizationId: string,
  sessionId?: string
): Promise<{
  conversationId: string;
  sessionId: string;
  isNew: boolean;
}> {
  const response = await fetch('/api/conversations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      organization_id: organizationId,
      session_id: sessionId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to initialize conversation');
  }

  const data = await response.json();
  return {
    conversationId: data.data.conversation_id,
    sessionId: data.data.session_id,
    isNew: data.data.is_new || false,
  };
}

/**
 * Get conversation with messages via API (client-side)
 */
export async function getConversationAPI(
  conversationId: string
): Promise<{
  conversation: Conversation;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    sequence_number: number;
    created_at: string;
  }>;
}> {
  const response = await fetch(`/api/conversations/${conversationId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to get conversation');
  }

  const data = await response.json();
  return data.data;
}
