/**
 * Training API Endpoint
 *
 * POST /api/train-bot
 *
 * Generates and stores embeddings for product catalog
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  validateTrainBotRequest,
  formatValidationErrors,
  type TrainBotResponse,
  type ErrorResponse,
} from '@/lib/validations/training';
import {
  generateEmbeddings,
  type ProductInput,
} from '@/lib/ai/embedding-service';
import {
  batchUpsertEmbeddings,
  verifyOrganizationAccess,
} from '@/lib/supabase/embedding-helpers';
import { OpenAIError } from '@/lib/ai/openai-client';

// =====================================================
// Configuration
// =====================================================

const DEFAULT_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

// =====================================================
// POST Handler
// =====================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Parse and validate request body
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            code: 'invalid_json',
            message: 'Request body must be valid JSON',
          },
        },
        { status: 400 }
      );
    }

    const validation = validateTrainBotRequest(body);

    if (!validation.success) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: formatValidationErrors(validation.errors),
        },
        { status: 400 }
      );
    }

    const { organization_id, products, batch_size, overwrite_existing } =
      validation.data;

    // 2. Authenticate user
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
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: {
            code: 'unauthorized',
            message: 'You must be logged in to train the bot',
          },
        },
        { status: 401 }
      );
    }

    // 3. Verify organization access
    const hasAccess = await verifyOrganizationAccess(user.id, organization_id);

    if (!hasAccess) {
      return NextResponse.json<ErrorResponse>(
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

    // 4. Generate embeddings
    let embeddingResult;
    try {
      embeddingResult = await generateEmbeddings(products, {
        model: DEFAULT_EMBEDDING_MODEL,
        batchSize: batch_size,
        onProgress: (completed, total) => {
          console.log(`[Training] Progress: ${completed}/${total} products`);
        },
      });
    } catch (error) {
      // Handle OpenAI-specific errors
      if (error instanceof OpenAIError) {
        return NextResponse.json<ErrorResponse>(
          {
            success: false,
            error: {
              code: error.code,
              message: error.message,
              details: {
                retryable: error.retryable,
                statusCode: error.statusCode,
              },
            },
          },
          { status: error.statusCode || 500 }
        );
      }

      throw error; // Re-throw for general error handler
    }

    // 5. Store embeddings in database
    const productDataMap = new Map(
      products.map((p) => [
        p.product_id,
        {
          name: p.product_name,
          description: p.product_description,
          price: p.price,
          metadata: p.metadata,
        },
      ])
    );

    const dbResult = await batchUpsertEmbeddings(
      organization_id,
      embeddingResult.results,
      productDataMap,
      DEFAULT_EMBEDDING_MODEL,
      overwrite_existing
    );

    // 6. Calculate final metrics
    const duration = Date.now() - startTime;
    const processed = products.length;
    const { inserted, updated, failed } = dbResult;

    // 7. Return success response
    const response: TrainBotResponse = {
      success: true,
      data: {
        processed,
        inserted,
        updated,
        failed,
        totalTokens: embeddingResult.totalTokens,
        estimatedCost: embeddingResult.estimatedCost,
        duration,
      },
      message:
        failed > 0
          ? `Processed ${processed} products with ${failed} failures`
          : `Successfully processed ${processed} products`,
    };

    console.log('[Training] Success:', response.data);

    return NextResponse.json<TrainBotResponse>(response, { status: 200 });
  } catch (error) {
    // General error handler
    console.error('[Training] Error:', error);

    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: {
          code: 'internal_server_error',
          message:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred',
          details:
            process.env.NODE_ENV === 'development'
              ? { error: String(error) }
              : undefined,
        },
      },
      { status: 500 }
    );
  }
}

// =====================================================
// OPTIONS Handler (CORS)
// =====================================================

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
