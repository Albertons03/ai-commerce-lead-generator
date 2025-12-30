/**
 * =====================================================
 * Chat API Endpoint - RAG-Powered Chat Completion
 * =====================================================
 * This endpoint handles:
 * - POST /api/chat - Process chat messages with RAG
 * - Vector search for relevant products
 * - Context-aware response generation
 * - Message storage and conversation tracking
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { performVectorSearch, ProductMatch } from "@/lib/ai/rag-service";
import {
  buildRAGPrompt,
  ConversationContext,
  ChatMessage,
} from "@/lib/ai/prompt-builder";
import {
  generateChatResponse,
  generateChatResponseStream,
  analyzeMessageIntent,
} from "@/lib/ai/chat-service";
import { getConversation } from "@/lib/supabase/conversation-helpers";
import { getMessages, createMessage } from "@/lib/supabase/message-helpers";
import {
  captureLeadFromConversation,
  LeadCaptureContext,
} from "@/lib/ai/lead-capture-service";

// =====================================================
// Request Validation
// =====================================================

const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000, "Message too long"),
  conversation_id: z.string().uuid("Invalid conversation_id"),
  organization_id: z.string().uuid("Invalid organization_id"),

  // Optional parameters
  stream: z.boolean().default(false),
  include_products: z.boolean().default(true),
  max_products: z.number().min(1).max(20).default(5),
  similarity_threshold: z.number().min(0.5).max(1.0).default(0.75),

  // Optional filters
  category_filter: z.string().optional(),
  price_range: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),

  // Chat parameters
  temperature: z.number().min(0).max(2).default(0.7),
  max_tokens: z.number().min(50).max(2000).default(1000),
});

type ChatRequest = z.infer<typeof chatRequestSchema>;

// =====================================================
// Main Chat Handler
// =====================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log("[Chat API] Processing chat request...");

    // Parse and validate request
    const body = await request.json();
    const validation = chatRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "validation_error",
            message: "Invalid request data",
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const chatRequest: ChatRequest = validation.data;

    console.log("[Chat API] Request validated:", {
      message_length: chatRequest.message.length,
      conversation_id: chatRequest.conversation_id,
      organization_id: chatRequest.organization_id,
      stream: chatRequest.stream,
      include_products: chatRequest.include_products,
    });

    // For now, we'll skip the organization access check since this is a public chat API
    // In production, you might want to verify API keys or other authentication
    console.log(
      "[Chat API] Processing for organization:",
      chatRequest.organization_id
    );

    // Get conversation context
    const conversation = await getConversation(chatRequest.conversation_id);
    if (!conversation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "conversation_not_found",
            message: "Conversation not found",
          },
        },
        { status: 404 }
      );
    }

    // Verify conversation belongs to organization
    if (conversation.organization_id !== chatRequest.organization_id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "unauthorized",
            message: "Conversation does not belong to organization",
          },
        },
        { status: 403 }
      );
    }

    // Process the chat request
    const response = await processChatMessage(chatRequest, conversation);

    const totalTime = Date.now() - startTime;
    console.log("[Chat API] Request completed:", {
      total_time_ms: totalTime,
      response_length: response.assistant_message?.length || 0,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...response,
        processing_time_ms: totalTime,
      },
    });
  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    console.error("[Chat API] Request failed:", {
      error: error.message,
      stack: error.stack,
      processing_time_ms: totalTime,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "internal_server_error",
          message: "Failed to process chat request",
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}

// =====================================================
// Chat Processing Logic
// =====================================================

interface ChatProcessingResult {
  conversation_id: string;
  user_message_id: string;
  assistant_message_id: string;
  assistant_message: string;
  products_found: ProductMatch[];
  intent_analysis: {
    intent: string;
    sentiment: string;
    confidence: number;
    lead_signals: string[];
  };
  lead_capture?: {
    lead_id: string;
    score: number;
    triggers: string[];
  };
  metadata: {
    vector_search_ms: number;
    prompt_building_ms: number;
    ai_generation_ms: number;
    lead_capture_ms?: number;
    total_tokens: number;
    cost_estimate: number;
  };
}

/**
 * Processes a chat message with full RAG pipeline
 */
async function processChatMessage(
  request: ChatRequest,
  conversation: any
): Promise<ChatProcessingResult> {
  const {
    message,
    conversation_id,
    organization_id,
    include_products,
    max_products,
    similarity_threshold,
    category_filter,
    price_range,
    temperature,
    max_tokens,
  } = request;

  console.log("[Chat Processing] Starting RAG pipeline...");

  // Step 1: Analyze user intent
  const intentStartTime = Date.now();
  const intentAnalysis = await analyzeMessageIntent(message, organization_id);
  const intentTime = Date.now() - intentStartTime;

  console.log("[Chat Processing] Intent analyzed:", {
    intent: intentAnalysis.intent,
    sentiment: intentAnalysis.sentiment,
    confidence: intentAnalysis.confidence,
    analysis_time_ms: intentTime,
  });

  // Step 2: Vector search for relevant products (if enabled)
  let productMatches: ProductMatch[] = [];
  let vectorSearchTime = 0;

  if (include_products) {
    const searchStartTime = Date.now();

    try {
      const searchResult = await performVectorSearch({
        organization_id,
        query: message,
        top_k: max_products,
        similarity_threshold,
        category_filter,
        price_range,
      });

      productMatches = searchResult.matches;
      vectorSearchTime = Date.now() - searchStartTime;

      console.log("[Chat Processing] Vector search completed:", {
        products_found: productMatches.length,
        search_time_ms: vectorSearchTime,
        avg_similarity:
          productMatches.length > 0
            ? (
                productMatches.reduce((sum, p) => sum + p.similarity_score, 0) /
                productMatches.length
              ).toFixed(3)
            : 0,
      });
    } catch (error) {
      console.error(
        "[Chat Processing] Vector search failed, continuing without products:",
        error
      );
      vectorSearchTime = Date.now() - searchStartTime;
    }
  }

  // Step 3: Get conversation history
  const conversationContext: ConversationContext = {
    conversation_id,
    organization_id,
    visitor_metadata: conversation.visitor_metadata,
    previous_messages: await getConversationMessages(conversation_id),
  };

  // Step 4: Build prompt with context
  const promptStartTime = Date.now();
  const promptComponents = await buildRAGPrompt({
    query: message,
    conversation_context: conversationContext,
    product_matches: productMatches,
    organization_name: undefined, // TODO: Get from organization table
    custom_instructions: undefined, // TODO: Get from organization settings
  });
  const promptTime = Date.now() - promptStartTime;

  console.log("[Chat Processing] Prompt built:", {
    prompt_building_time_ms: promptTime,
    estimated_tokens: promptComponents.token_count_estimate,
    truncation_applied: promptComponents.truncation_applied,
  });

  // Step 5: Generate AI response
  const aiStartTime = Date.now();
  const aiResponse = await generateChatResponse({
    prompt_components: promptComponents,
    temperature,
    max_tokens,
    organization_id,
  });
  const aiTime = Date.now() - aiStartTime;

  console.log("[Chat Processing] AI response generated:", {
    ai_generation_time_ms: aiTime,
    response_length: aiResponse.message.length,
    tokens_used: aiResponse.tokens_used.total,
    cost_estimate: aiResponse.cost_estimate,
  });

  // Step 6: Store messages in database
  const userMessage = await createMessage(
    conversation_id,
    organization_id,
    "user",
    message,
    {
      metadata: {
        intent: intentAnalysis.intent,
        sentiment: intentAnalysis.sentiment,
        confidence: intentAnalysis.confidence,
        lead_signals: intentAnalysis.lead_signals,
      },
    }
  );

  const assistantMessage = await createMessage(
    conversation_id,
    organization_id,
    "assistant",
    aiResponse.message,
    {
      metadata: {
        model_used: aiResponse.model_used,
        tokens_used: aiResponse.tokens_used,
        cost_estimate: aiResponse.cost_estimate,
        products_referenced: productMatches.map((p) => p.product_id),
        response_time_ms: aiTime,
      },
    }
  );

  // Step 7: Check for lead capture (async, non-blocking)
  let leadCaptureResult = null;
  let leadCaptureTime = 0;

  try {
    const leadCaptureStartTime = Date.now();

    // Build lead capture context
    const leadContext: LeadCaptureContext = {
      conversation_id,
      organization_id,
      latest_message: message,
      conversation_history: [
        ...conversationContext.previous_messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          sequence_number: 0, // We'll use timestamps for ordering
        })),
        {
          role: "user",
          content: message,
          sequence_number: conversationContext.previous_messages.length + 1,
        },
      ],
      product_interests: productMatches.map((p) => p.product_name),
    };

    // Attempt to capture lead (this runs async and won't block the response)
    const capturedLead = await captureLeadFromConversation(leadContext);

    leadCaptureTime = Date.now() - leadCaptureStartTime;

    if (capturedLead) {
      leadCaptureResult = {
        lead_id: capturedLead.lead_id,
        score: capturedLead.score,
        triggers: [capturedLead.trigger.type],
      };

      console.log("[Chat Processing] Lead captured:", {
        lead_id: capturedLead.lead_id,
        score: capturedLead.score,
        capture_time_ms: leadCaptureTime,
      });
    }
  } catch (error) {
    console.error("[Chat Processing] Lead capture failed:", error);
    leadCaptureTime = Date.now() - (leadCaptureTime || Date.now());
  }

  return {
    conversation_id,
    user_message_id: userMessage.id,
    assistant_message_id: assistantMessage.id,
    assistant_message: aiResponse.message,
    products_found: productMatches,
    intent_analysis: intentAnalysis,
    lead_capture: leadCaptureResult,
    metadata: {
      vector_search_ms: vectorSearchTime,
      prompt_building_ms: promptTime,
      ai_generation_ms: aiTime,
      lead_capture_ms: leadCaptureTime,
      total_tokens: aiResponse.tokens_used.total,
      cost_estimate: aiResponse.cost_estimate,
    },
  };
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Gets conversation messages for context
 */
async function getConversationMessages(
  conversationId: string
): Promise<ChatMessage[]> {
  try {
    // Get recent messages from the conversation using the message helper
    const messages = await getMessages(conversationId, {
      limit: 10,
      offset: 0,
    });

    return messages.map((msg: any) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
      timestamp: new Date(msg.created_at),
    }));
  } catch (error) {
    console.error("[Chat API] Failed to get conversation messages:", error);
    return [];
  }
}

// =====================================================
// Supported HTTP Methods
// =====================================================

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "method_not_allowed",
        message: "Only POST requests are supported",
      },
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "method_not_allowed",
        message: "Only POST requests are supported",
      },
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "method_not_allowed",
        message: "Only POST requests are supported",
      },
    },
    { status: 405 }
  );
}
