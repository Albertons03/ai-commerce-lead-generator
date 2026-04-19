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
import { trackChatUsage, trackLeadUsage } from "@/lib/billing/usage-service";
import { checkRateLimit } from "@/lib/utils/rate-limiter";
import { validateApiKey } from "@/lib/utils/validate-api-key";
import { sanitizeUserMessage, detectSuspiciousContent } from "@/lib/utils/sanitize";

// =====================================================
// Request Validation
// =====================================================

const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000, "Message too long"),
  conversation_id: z.string().uuid("Invalid conversation_id"),
  organization_id: z.string().uuid("Invalid organization_id"),

  // API key - widget küldi, szerver validálja
  api_key: z.string().optional(),

  // Optional parameters
  stream: z.boolean().default(false),
  include_products: z.boolean().default(true),
  max_products: z.number().min(1).max(20).default(5),
  similarity_threshold: z.number().min(0.1).max(1.0).default(0.5),

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
    // =====================================================
    // 1. Rate Limiting - IP alapú, 20 kérés/perc
    // =====================================================
    // x-forwarded-for: Vercel/proxy mögött az eredeti IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";

    const rateLimit = await checkRateLimit({
      identifier: `chat:${ip}`,
      maxRequests: 20,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "rate_limit_exceeded",
            message: "Too many requests. Please wait a moment and try again.",
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter),
            "X-RateLimit-Limit": String(rateLimit.limit),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

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

    // =====================================================
    // 2. API Key Validáció
    // =====================================================
    // Ha az api_key meg van adva (widget küldi), validáljuk.
    // Ha nincs (dashboard teszt UI), engedélyezzük - dashboard auth védi.
    if (chatRequest.api_key) {
      const keyResult = await validateApiKey(chatRequest.api_key);
      if (!keyResult.valid) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "invalid_api_key", message: "Invalid or revoked API key" },
          },
          { status: 401 }
        );
      }
      // Az API key-ből kinyert org ID-nek egyeznie kell a kérésben lévővel
      if (keyResult.organization_id !== chatRequest.organization_id) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "unauthorized", message: "API key does not match organization" },
          },
          { status: 403 }
        );
      }
    }

    // =====================================================
    // 3. Input Sanitizálás
    // =====================================================
    // HTML/script tag-ek szűrése, prompt injection detektálás
    const sanitizedMessage = sanitizeUserMessage(chatRequest.message);

    if (detectSuspiciousContent(chatRequest.message)) {
      console.warn("[Chat API] Suspicious content detected:", {
        organization_id: chatRequest.organization_id,
        ip,
        message_preview: chatRequest.message.slice(0, 100),
      });
      // Nem blokkoljuk, csak logoljuk - a szűrt verzióval folytatunk
    }

    // Lecseréljük az eredeti üzenetet a sanitizált verzióra
    chatRequest.message = sanitizedMessage;

    console.log("[Chat API] Request validated:", {
      message_length: chatRequest.message.length,
      conversation_id: chatRequest.conversation_id,
      organization_id: chatRequest.organization_id,
      stream: chatRequest.stream,
    });

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

    // Streaming ág: ha a kliens stream:true-t küld, SSE választ adunk vissza
    if (chatRequest.stream) {
      console.log("[Chat API] Streaming mode activated");
      return handleStreamingRequest(chatRequest, conversation);
    }

    // Non-streaming ág: teljes JSON választ várunk meg
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

    // =====================================================
    // Graceful Fallback - OpenAI specifikus hibák
    // =====================================================
    // Felhasználóbarát üzenetek az OpenAI hibatípusokhoz

    // Quota (számlázási) hiba
    if (error.code === "insufficient_quota" || error.status === 429) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "service_unavailable",
            message: "Our chat service is temporarily unavailable. Please try again in a few minutes.",
          },
        },
        { status: 503 }
      );
    }

    // OpenAI szerver hiba
    if (error.status >= 500 || error.type === "server_error") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ai_unavailable",
            message: "The AI assistant is temporarily unavailable. Please try again shortly.",
          },
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "internal_server_error",
          message: "Something went wrong. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}

// =====================================================
// Streaming Chat Handler
// =====================================================

/**
 * SSE (Server-Sent Events) formátumú streaming választ ad vissza.
 * A kliens olvashatja ReadableStream reader segítségével.
 *
 * Eseménytípusok:
 *   { type: "chunk", content: "..." }        - szöveges töredék érkezik
 *   { type: "done", assistant_message, ... } - teljes válasz kész + metadata
 *   { type: "error", message: "..." }        - hiba
 */
async function handleStreamingRequest(
  request: ChatRequest,
  conversation: any
): Promise<Response> {
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

  // RAG pipeline előkészítés (stream előtt, hogy gyors legyen az első chunk)
  const { intentAnalysis, productMatches, conversationContext, promptComponents } =
    await buildRAGContext(request, conversation);

  // User üzenetet azonnal mentjük DB-be (stream előtt)
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

  // ReadableStream: ez az amit a böngésző/widget olvas chunk-okban
  const stream = new ReadableStream({
    async start(controller) {
      // TextEncoder: string → Uint8Array (amit a stream küld)
      const encoder = new TextEncoder();

      // SSE formátum: "data: <JSON>\n\n" - szabvány Server-Sent Events protokoll
      function sendEvent(data: object) {
        const line = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(line));
      }

      let fullContent = "";

      try {
        // generateChatResponseStream AsyncGenerator - minden chunk-ra yield-el
        for await (const chunk of generateChatResponseStream({
          prompt_components: promptComponents,
          temperature,
          max_tokens,
          organization_id,
        })) {
          if (chunk.content) {
            fullContent += chunk.content;
            sendEvent({ type: "chunk", content: chunk.content });
          }

          // Az utolsó chunk (finish_reason van rajta): DB mentés + lead capture
          if (chunk.is_complete) {
            // Asszisztens üzenet mentése
            const assistantMsg = await createMessage(
              conversation_id,
              organization_id,
              "assistant",
              fullContent,
              {
                metadata: {
                  model_used: "gpt-4o-mini",
                  products_referenced: productMatches.map((p) => p.product_id),
                },
              }
            );

            // Usage tracking: streaming-nél nem tudjuk a pontos token számot,
            // ezért a prompt token becslést használjuk (promptComponents.token_count_estimate)
            trackChatUsage(organization_id, promptComponents.token_count_estimate).catch(() => {});

            // Lead capture kísérlet (captureLeadFromConversation már importálva van)
            let leadCaptureResult: { lead_id: string; score: number; triggers: string[] } | null = null;
            try {
              const leadContext: LeadCaptureContext = {
                conversation_id,
                organization_id,
                latest_message: message,
                conversation_history: [
                  ...conversationContext.previous_messages.map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                    sequence_number: 0,
                  })),
                  { role: "user", content: message, sequence_number: conversationContext.previous_messages.length + 1 },
                ],
                product_interests: productMatches.map((p) => p.product_name),
              };
              const capturedLead = await captureLeadFromConversation(leadContext);
              if (capturedLead) {
                leadCaptureResult = {
                  lead_id: capturedLead.lead_id,
                  score: capturedLead.score,
                  triggers: [capturedLead.trigger.type],
                };

                // Lead usage tracking (fire-and-forget)
                trackLeadUsage(organization_id).catch(() => {});
              }
            } catch (e) {
              console.error("[Chat API] Lead capture failed in stream:", e);
            }

            // Befejező esemény: teljes szöveg + metadata a kliensnek
            sendEvent({
              type: "done",
              conversation_id,
              user_message_id: userMessage.id,
              assistant_message_id: assistantMsg.id,
              assistant_message: fullContent,
              products_found: productMatches,
              intent_analysis: intentAnalysis,
              lead_capture: leadCaptureResult,
            });

            break;
          }
        }
      } catch (error: any) {
        console.error("[Chat API] Stream error:", error);
        sendEvent({ type: "error", message: "Stream generation failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      // CORS: widget külső domainről is hívhatja
      "Access-Control-Allow-Origin": "*",
      "X-Accel-Buffering": "no", // Nginx proxy buffering kikapcsolása (streaming!)
    },
  });
}

// =====================================================
// RAG Pipeline Setup (streaming + non-streaming közös)
// =====================================================

/**
 * Futtatja a RAG pipeline 1-4. lépését (intent, vector search, history, prompt).
 * Mindkét útvonal (streaming / non-streaming) ezt hívja.
 */
async function buildRAGContext(request: ChatRequest, conversation: any) {
  const {
    message,
    conversation_id,
    organization_id,
    include_products,
    max_products,
    similarity_threshold,
    category_filter,
    price_range,
  } = request;

  // Step 1: Intent analízis
  const intentAnalysis = await analyzeMessageIntent(message, organization_id);

  // Step 2: Termék vektor keresés
  let productMatches: ProductMatch[] = [];
  if (include_products) {
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
    } catch (error) {
      console.error("[Chat API] Vector search failed, continuing:", error);
    }
  }

  // Step 3: Korábbi üzenetek lekérése
  const previousMessages = await getConversationMessages(conversation_id);
  const conversationContext: ConversationContext = {
    conversation_id,
    organization_id,
    visitor_metadata: conversation.visitor_metadata,
    previous_messages: previousMessages,
  };

  // Step 4: Prompt összerakása
  const promptComponents = await buildRAGPrompt({
    query: message,
    conversation_context: conversationContext,
    product_matches: productMatches,
    organization_name: undefined,
    custom_instructions: undefined,
  });

  return { intentAnalysis, productMatches, conversationContext, promptComponents };
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
 * Processes a chat message with full RAG pipeline (non-streaming)
 */
async function processChatMessage(
  request: ChatRequest,
  conversation: any
): Promise<ChatProcessingResult> {
  const { message, conversation_id, organization_id, temperature, max_tokens } = request;

  console.log("[Chat Processing] Starting RAG pipeline...");

  // Steps 1-4: közös RAG kontextus felépítés
  const ragStart = Date.now();
  const { intentAnalysis, productMatches, conversationContext, promptComponents } =
    await buildRAGContext(request, conversation);
  const vectorSearchTime = Date.now() - ragStart; // közelítő érték
  const promptTime = 0; // buildRAGContext-be van beépítve

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

  // Usage tracking: chat + tokenek rögzítése (fire-and-forget, nem blokkoló)
  trackChatUsage(organization_id, aiResponse.tokens_used.total).catch(() => {});

  // Step 7: Check for lead capture (async, non-blocking)
  let leadCaptureResult: { lead_id: string; score: number; triggers: string[] } | undefined = undefined;
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

      // Lead usage tracking (fire-and-forget)
      trackLeadUsage(organization_id).catch(() => {});
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
