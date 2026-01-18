/**
 * Conversation Detail API
 *
 * GET /api/conversations/:id - Get conversation with messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConversation } from '@/lib/supabase/conversation-helpers';
import { getMessages } from '@/lib/supabase/message-helpers';

// =====================================================
// GET - Get Conversation with Messages
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;

    // Validate conversation ID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(conversationId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'invalid_conversation_id',
            message: 'Conversation ID must be a valid UUID',
          },
        },
        { status: 400 }
      );
    }

    // Get conversation
    const conversation = await getConversation(conversationId);

    if (!conversation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'not_found',
            message: 'Conversation not found',
          },
        },
        { status: 404 }
      );
    }

    // Get messages
    const messages = await getMessages(conversationId);

    return NextResponse.json(
      {
        success: true,
        data: {
          conversation,
          messages: messages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            sequence_number: msg.sequence_number,
            retrieved_context: (msg as any).retrieved_context,
            metadata: msg.metadata,
            created_at: msg.created_at,
          })),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Conversation Detail API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'internal_server_error',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to get conversation',
        },
      },
      { status: 500 }
    );
  }
}
