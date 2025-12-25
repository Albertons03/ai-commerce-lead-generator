/**
 * Conversations API
 *
 * POST /api/conversations - Create or resume conversation
 * GET /api/conversations - List conversations (admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import {
  initializeConversation,
  listConversations,
  type Conversation,
} from '@/lib/supabase/conversation-helpers';
import {
  extractVisitorMetadata,
  generateSessionId,
  isValidSessionId,
} from '@/lib/session/session-manager';
import { verifyOrganizationAccess } from '@/lib/supabase/embedding-helpers';

// =====================================================
// Validation Schemas
// =====================================================

const createConversationSchema = z.object({
  organization_id: z.string().uuid('Invalid organization_id'),
  session_id: z.string().optional(),
  visitor_metadata: z.record(z.unknown()).optional(),
});

const listConversationsSchema = z.object({
  organization_id: z.string().uuid('Invalid organization_id'),
  status: z.enum(['active', 'completed', 'abandoned']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// =====================================================
// POST - Create or Resume Conversation
// =====================================================

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const validation = createConversationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'validation_error',
            message: 'Invalid request body',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { organization_id, session_id, visitor_metadata } = validation.data;

    // Generate or validate session ID
    let sessionId = session_id;
    if (!sessionId) {
      sessionId = generateSessionId();
    } else if (!isValidSessionId(sessionId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'invalid_session_id',
            message: 'Session ID must be a valid UUID',
          },
        },
        { status: 400 }
      );
    }

    // Extract visitor metadata from request
    const autoMetadata = extractVisitorMetadata(request);
    const combinedMetadata = {
      ...autoMetadata,
      ...visitor_metadata,
    };

    // Initialize conversation (creates new or returns existing)
    const { conversation, isNew } = await initializeConversation(
      organization_id,
      sessionId,
      combinedMetadata
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          conversation_id: conversation.id,
          session_id: conversation.session_id,
          status: conversation.status,
          message_count: conversation.message_count,
          is_new: isNew,
          created_at: conversation.created_at,
        },
        message: isNew ? 'Conversation created' : 'Conversation resumed',
      },
      { status: isNew ? 201 : 200 }
    );
  } catch (error) {
    console.error('[Conversations API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'internal_server_error',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to initialize conversation',
        },
      },
      { status: 500 }
    );
  }
}

// =====================================================
// GET - List Conversations (Admin)
// =====================================================

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'unauthorized',
            message: 'You must be logged in to list conversations',
          },
        },
        { status: 401 }
      );
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      organization_id: searchParams.get('organization_id'),
      status: searchParams.get('status'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    };

    const validation = listConversationsSchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'validation_error',
            message: 'Invalid query parameters',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { organization_id, status, limit, offset } = validation.data;

    // Verify organization access
    const hasAccess = await verifyOrganizationAccess(user.id, organization_id);

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'forbidden',
            message: 'You do not have access to this organization',
          },
        },
        { status: 403 }
      );
    }

    // List conversations
    const result = await listConversations(organization_id, {
      status: status as 'active' | 'completed' | 'abandoned' | undefined,
      limit,
      offset,
      includeLeads: true,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Conversations API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'internal_server_error',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to list conversations',
        },
      },
      { status: 500 }
    );
  }
}
