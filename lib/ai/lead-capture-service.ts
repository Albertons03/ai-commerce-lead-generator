/**
 * =====================================================
 * Lead Capture Service - Phase 3E
 * =====================================================
 * Detects when chat conversations should generate leads
 * and creates lead records with AI-based scoring
 * =====================================================
 */

import { analyzeMessageIntent } from "./chat-service";
import { createLead } from "../supabase/leads-helpers";
import { getMessages } from "../supabase/message-helpers";
import { sendLeadNotificationEmail } from "../email/lead-notification";
import { createAdminSupabaseClient } from "../supabase/client";

// =====================================================
// Types & Interfaces
// =====================================================

export interface LeadTrigger {
  type:
    | "contact_info"
    | "purchase_intent"
    | "pricing_request"
    | "business_inquiry"
    | "high_engagement";
  confidence: number;
  signals: string[];
  trigger_message: string;
}

export interface LeadCaptureContext {
  conversation_id: string;
  organization_id: string;
  latest_message: string;
  conversation_history: Array<{
    role: string;
    content: string;
    sequence_number: number;
  }>;
  product_interests: string[];
}

export interface LeadScoreFactors {
  intent_score: number; // 0-25 points
  engagement_score: number; // 0-25 points
  product_interest_score: number; // 0-25 points
  conversation_quality_score: number; // 0-25 points
  contact_readiness_score: number; // Bonus: 0-10 points
}

export interface CapturedLead {
  lead_id: string;
  trigger: LeadTrigger;
  score: number;
  score_factors: LeadScoreFactors;
  extracted_info: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
  };
}

// =====================================================
// Configuration
// =====================================================

const LEAD_TRIGGER_CONFIG = {
  // Intent triggers
  STRONG_PURCHASE_INTENTS: [
    "purchase_intent",
    "ready_to_buy",
    "price_negotiation",
    "bulk_inquiry",
  ],

  // Contact info patterns
  CONTACT_PATTERNS: {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
    phone: /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/,
  },

  // Business inquiry keywords
  BUSINESS_KEYWORDS: [
    "bulk",
    "wholesale",
    "business",
    "company",
    "quote",
    "proposal",
    "enterprise",
    "team",
    "organization",
    "reseller",
    "partner",
  ],

  // High-value phrases
  HIGH_VALUE_PHRASES: [
    "I want to buy",
    "How can I purchase",
    "Can you send me",
    "I need this by",
    "What's the total cost",
    "Do you accept",
    "Can we schedule",
    "I'd like to order",
    "Add to cart",
  ],

  // Minimum thresholds
  MIN_CONFIDENCE: 0.6,
  MIN_ENGAGEMENT_MESSAGES: 3,
  MIN_SCORE_FOR_CAPTURE: 20,
} as const;

// =====================================================
// Lead Trigger Detection
// =====================================================

/**
 * Analyzes conversation context to detect lead capture triggers
 */
export async function detectLeadTriggers(
  context: LeadCaptureContext
): Promise<LeadTrigger[]> {
  const triggers: LeadTrigger[] = [];

  console.log("[Lead Capture] Analyzing triggers for conversation:", {
    conversation_id: context.conversation_id,
    message_count: context.conversation_history.length,
    latest_message_length: context.latest_message.length,
  });

  // 1. Check for contact information in latest message
  const contactTrigger = detectContactInfoTrigger(context.latest_message);
  if (contactTrigger) {
    triggers.push(contactTrigger);
  }

  // 2. Analyze message intent for purchase signals
  try {
    const intentAnalysis = await analyzeMessageIntent(
      context.latest_message,
      context.organization_id
    );

    if (intentAnalysis.lead_signals.length > 0) {
      triggers.push({
        type: "purchase_intent",
        confidence: intentAnalysis.confidence,
        signals: intentAnalysis.lead_signals,
        trigger_message: context.latest_message,
      });
    }

    // Check for strong purchase intent
    if (
      LEAD_TRIGGER_CONFIG.STRONG_PURCHASE_INTENTS.includes(
        intentAnalysis.intent as any
      )
    ) {
      triggers.push({
        type: "purchase_intent",
        confidence: Math.max(intentAnalysis.confidence, 0.8),
        signals: [`Strong ${intentAnalysis.intent} detected`],
        trigger_message: context.latest_message,
      });
    }
  } catch (error) {
    console.error("[Lead Capture] Intent analysis failed:", error);
  }

  // 3. Check for pricing requests
  const pricingTrigger = detectPricingRequest(context.latest_message);
  if (pricingTrigger) {
    triggers.push(pricingTrigger);
  }

  // 4. Check for business inquiries
  const businessTrigger = detectBusinessInquiry(context.latest_message);
  if (businessTrigger) {
    triggers.push(businessTrigger);
  }

  // 5. Check for high engagement pattern
  const engagementTrigger = detectHighEngagement(context);
  if (engagementTrigger) {
    triggers.push(engagementTrigger);
  }

  // Filter triggers by minimum confidence
  const qualifiedTriggers = triggers.filter(
    (trigger) => trigger.confidence >= LEAD_TRIGGER_CONFIG.MIN_CONFIDENCE
  );

  console.log("[Lead Capture] Triggers detected:", {
    total_triggers: triggers.length,
    qualified_triggers: qualifiedTriggers.length,
    trigger_types: qualifiedTriggers.map((t) => t.type),
  });

  return qualifiedTriggers;
}

/**
 * Detects contact information sharing in message
 */
function detectContactInfoTrigger(message: string): LeadTrigger | null {
  const signals: string[] = [];
  let confidence = 0;

  // Check for email
  if (LEAD_TRIGGER_CONFIG.CONTACT_PATTERNS.email.test(message)) {
    signals.push("Email address provided");
    confidence += 0.9;
  }

  // Check for phone
  if (LEAD_TRIGGER_CONFIG.CONTACT_PATTERNS.phone.test(message)) {
    signals.push("Phone number provided");
    confidence += 0.8;
  }

  // Check for contact request phrases
  const contactPhrases = [
    "my email is",
    "email me",
    "call me",
    "contact me",
    "my number is",
    "reach me at",
    "send me",
    "get in touch",
  ];

  for (const phrase of contactPhrases) {
    if (message.toLowerCase().includes(phrase)) {
      signals.push(`Contact request: "${phrase}"`);
      confidence += 0.3;
    }
  }

  if (signals.length === 0) return null;

  return {
    type: "contact_info",
    confidence: Math.min(confidence, 1.0),
    signals,
    trigger_message: message,
  };
}

/**
 * Detects pricing-related inquiries
 */
function detectPricingRequest(message: string): LeadTrigger | null {
  const pricingKeywords = [
    "price",
    "cost",
    "how much",
    "pricing",
    "quote",
    "estimate",
    "budget",
    "payment",
    "discount",
    "deal",
    "offer",
    "total",
  ];

  const signals: string[] = [];
  const lowerMessage = message.toLowerCase();

  for (const keyword of pricingKeywords) {
    if (lowerMessage.includes(keyword)) {
      signals.push(`Pricing keyword: "${keyword}"`);
    }
  }

  if (signals.length === 0) return null;

  // Higher confidence for multiple pricing keywords
  const confidence = Math.min(0.4 + signals.length * 0.2, 1.0);

  return {
    type: "pricing_request",
    confidence,
    signals,
    trigger_message: message,
  };
}

/**
 * Detects business/B2B inquiries
 */
function detectBusinessInquiry(message: string): LeadTrigger | null {
  const signals: string[] = [];
  const lowerMessage = message.toLowerCase();

  for (const keyword of LEAD_TRIGGER_CONFIG.BUSINESS_KEYWORDS) {
    if (lowerMessage.includes(keyword)) {
      signals.push(`Business keyword: "${keyword}"`);
    }
  }

  if (signals.length === 0) return null;

  const confidence = Math.min(0.5 + signals.length * 0.15, 1.0);

  return {
    type: "business_inquiry",
    confidence,
    signals,
    trigger_message: message,
  };
}

/**
 * Detects high engagement patterns
 */
function detectHighEngagement(context: LeadCaptureContext): LeadTrigger | null {
  const messageCount = context.conversation_history.length;
  const productMentions = context.product_interests.length;

  // Check engagement criteria
  const hasMinimumMessages =
    messageCount >= LEAD_TRIGGER_CONFIG.MIN_ENGAGEMENT_MESSAGES;
  const hasProductInterest = productMentions > 0;
  const hasDetailedQuestions = context.conversation_history.some(
    (msg) => msg.content.length > 50 && msg.role === "user"
  );

  if (!hasMinimumMessages && !hasProductInterest) {
    return null;
  }

  const signals: string[] = [];
  let confidence = 0;

  if (hasMinimumMessages) {
    signals.push(`${messageCount} messages in conversation`);
    confidence += 0.3;
  }

  if (hasProductInterest) {
    signals.push(`Interested in ${productMentions} products`);
    confidence += 0.4;
  }

  if (hasDetailedQuestions) {
    signals.push("Asked detailed questions");
    confidence += 0.3;
  }

  return {
    type: "high_engagement",
    confidence,
    signals,
    trigger_message: context.latest_message,
  };
}

// =====================================================
// AI Lead Scoring
// =====================================================

/**
 * Calculates AI-based lead score from 0-100
 */
export async function calculateLeadScore(
  context: LeadCaptureContext,
  triggers: LeadTrigger[]
): Promise<{ score: number; factors: LeadScoreFactors }> {
  console.log("[Lead Scoring] Calculating score for conversation:", {
    conversation_id: context.conversation_id,
    trigger_count: triggers.length,
  });

  const factors: LeadScoreFactors = {
    intent_score: 0,
    engagement_score: 0,
    product_interest_score: 0,
    conversation_quality_score: 0,
    contact_readiness_score: 0,
  };

  // 1. Intent Score (0-25 points)
  factors.intent_score = calculateIntentScore(triggers);

  // 2. Engagement Score (0-25 points)
  factors.engagement_score = calculateEngagementScore(context);

  // 3. Product Interest Score (0-25 points)
  factors.product_interest_score = calculateProductInterestScore(context);

  // 4. Conversation Quality Score (0-25 points)
  factors.conversation_quality_score =
    calculateConversationQualityScore(context);

  // 5. Contact Readiness Bonus (0-10 points)
  factors.contact_readiness_score = calculateContactReadinessScore(triggers);

  const totalScore = Math.min(
    factors.intent_score +
      factors.engagement_score +
      factors.product_interest_score +
      factors.conversation_quality_score +
      factors.contact_readiness_score,
    100
  );

  console.log("[Lead Scoring] Score calculated:", {
    total_score: totalScore,
    factors,
  });

  return { score: totalScore, factors };
}

function calculateIntentScore(triggers: LeadTrigger[]): number {
  let score = 0;

  // High-value intent triggers
  const purchaseIntentTriggers = triggers.filter(
    (t) => t.type === "purchase_intent"
  );
  score += purchaseIntentTriggers.length * 15; // Up to 15 points per trigger

  const pricingTriggers = triggers.filter((t) => t.type === "pricing_request");
  score += pricingTriggers.length * 8; // Up to 8 points per trigger

  const businessTriggers = triggers.filter(
    (t) => t.type === "business_inquiry"
  );
  score += businessTriggers.length * 10; // Up to 10 points per trigger

  return Math.min(score, 25);
}

function calculateEngagementScore(context: LeadCaptureContext): number {
  const messageCount = context.conversation_history.length;

  let score = 0;

  // Message count (0-15 points)
  if (messageCount >= 10) score += 15;
  else if (messageCount >= 5) score += 10;
  else if (messageCount >= 3) score += 5;

  // Message length/depth (0-10 points)
  const avgMessageLength =
    context.conversation_history
      .filter((m) => m.role === "user")
      .reduce((sum, m) => sum + m.content.length, 0) / messageCount;

  if (avgMessageLength > 100) score += 10;
  else if (avgMessageLength > 50) score += 6;
  else if (avgMessageLength > 20) score += 3;

  return Math.min(score, 25);
}

function calculateProductInterestScore(context: LeadCaptureContext): number {
  const productCount = context.product_interests.length;

  let score = 0;

  // Number of products (0-15 points)
  if (productCount >= 5) score += 15;
  else if (productCount >= 3) score += 12;
  else if (productCount >= 2) score += 8;
  else if (productCount >= 1) score += 5;

  // Multiple product categories suggests broader interest (0-10 points)
  const hasVariedInterests = productCount >= 3;
  if (hasVariedInterests) score += 10;

  return Math.min(score, 25);
}

function calculateConversationQualityScore(
  context: LeadCaptureContext
): number {
  let score = 0;

  // Check for specific question patterns (0-25 points)
  const userMessages = context.conversation_history
    .filter((m) => m.role === "user")
    .map((m) => m.content.toLowerCase());

  const qualityIndicators = {
    questions: userMessages.filter((m) => m.includes("?")).length,
    comparisons: userMessages.filter(
      (m) =>
        m.includes("compare") ||
        m.includes("vs") ||
        m.includes("versus") ||
        m.includes("difference") ||
        m.includes("better")
    ).length,
    specifications: userMessages.filter(
      (m) =>
        m.includes("spec") ||
        m.includes("feature") ||
        m.includes("detail") ||
        m.includes("dimension") ||
        m.includes("warranty")
    ).length,
  };

  score += Math.min(qualityIndicators.questions * 3, 12); // 0-12 points
  score += Math.min(qualityIndicators.comparisons * 5, 10); // 0-10 points
  score += Math.min(qualityIndicators.specifications * 2, 8); // 0-8 points

  return Math.min(score, 25);
}

function calculateContactReadinessScore(triggers: LeadTrigger[]): number {
  let score = 0;

  const contactTriggers = triggers.filter((t) => t.type === "contact_info");
  if (contactTriggers.length > 0) {
    score += 10; // Full bonus for sharing contact info
  }

  return score;
}

// =====================================================
// Lead Creation & Management
// =====================================================

/**
 * Creates a lead record when triggers are detected
 */
export async function captureLeadFromConversation(
  context: LeadCaptureContext
): Promise<CapturedLead | null> {
  console.log("[Lead Capture] Processing lead capture:", {
    conversation_id: context.conversation_id,
  });

  // Detect triggers
  const triggers = await detectLeadTriggers(context);

  if (triggers.length === 0) {
    console.log("[Lead Capture] No qualifying triggers found");
    return null;
  }

  // Calculate lead score
  const { score, factors } = await calculateLeadScore(context, triggers);

  // Check if score meets minimum threshold
  if (score < LEAD_TRIGGER_CONFIG.MIN_SCORE_FOR_CAPTURE) {
    console.log("[Lead Capture] Score below threshold:", {
      score,
      threshold: LEAD_TRIGGER_CONFIG.MIN_SCORE_FOR_CAPTURE,
      factors,
      conversation_id: context.conversation_id,
      triggers_found: triggers.length,
    });
    return null;
  }

  // Extract contact information
  const extractedInfo = extractContactInfo(
    context.conversation_history.map((m) => m.content).join(" ")
  );

  // Generate conversation summary
  const conversationSummary = generateConversationSummary(context);

  try {
    // Create lead record
    const leadData = {
      organization_id: context.organization_id,
      name: extractedInfo.name || "Unknown Visitor",
      email: extractedInfo.email || "",
      phone: extractedInfo.phone || "",
      company: extractedInfo.company || "",
      source: "chatbot" as const,
      lead_score: Math.round(score),
      product_interests: context.product_interests,
      conversation_id: context.conversation_id,
      conversation_summary: conversationSummary,
      metadata: {
        capture_triggers: triggers.map((t) => ({
          type: t.type,
          confidence: t.confidence,
          signals: t.signals,
        })),
        score_factors: factors,
        capture_timestamp: new Date().toISOString(),
      },
    };

    const leadResult = await createLead(leadData);

    console.log("[Lead Capture] Lead created successfully:", {
      lead_id: leadResult?.data?.id,
      score,
      trigger_count: triggers.length,
    });

    // Email értesítés küldése az org ownernek.
    // "fire and forget": nem várjuk meg, nem dobja ki a hibát ha sikertelen.
    // await nélkül indul el háttérben, a válasz nem késik miatta.
    const orgName = await getOrgName(context.organization_id);
    sendLeadNotificationEmail({
      lead_id:              leadResult?.data?.id ?? "",
      lead_name:            leadData.name,
      lead_email:           leadData.email,
      lead_phone:           leadData.phone || undefined,
      lead_company:         leadData.company || undefined,
      lead_score:           Math.round(score),
      conversation_summary: leadData.conversation_summary ?? undefined,
      product_interests:    context.product_interests,
      trigger_type:         triggers[0].type,
      organization_id:      context.organization_id,
      organization_name:    orgName,
    }).catch(err => console.error("[Lead Capture] Email notification failed:", err));

    return {
      lead_id: leadResult?.data?.id || "",
      trigger: triggers[0], // Primary trigger
      score,
      score_factors: factors,
      extracted_info: extractedInfo,
    };
  } catch (error) {
    console.error("[Lead Capture] Failed to create lead:", error);
    return null;
  }
}

/**
 * Extracts contact information from conversation text
 */
function extractContactInfo(conversationText: string): {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
} {
  const extracted: any = {};

  // Extract email
  const emailMatch = conversationText.match(
    LEAD_TRIGGER_CONFIG.CONTACT_PATTERNS.email
  );
  if (emailMatch) {
    extracted.email = emailMatch[0];
  }

  // Extract phone
  const phoneMatch = conversationText.match(
    LEAD_TRIGGER_CONFIG.CONTACT_PATTERNS.phone
  );
  if (phoneMatch) {
    extracted.phone = phoneMatch[0];
  }

  // Simple name extraction patterns
  const namePatterns = [
    /my name is ([A-Za-z\s]+)/i,
    /I'm ([A-Za-z\s]+)/i,
    /this is ([A-Za-z\s]+)/i,
  ];

  for (const pattern of namePatterns) {
    const match = conversationText.match(pattern);
    if (match && match[1]) {
      extracted.name = match[1].trim();
      break;
    }
  }

  // Company extraction
  const companyPatterns = [
    /work at ([A-Za-z\s&.]+)/i,
    /from ([A-Za-z\s&.]+)/i,
    /company is ([A-Za-z\s&.]+)/i,
  ];

  for (const pattern of companyPatterns) {
    const match = conversationText.match(pattern);
    if (match && match[1]) {
      extracted.company = match[1].trim();
      break;
    }
  }

  return extracted;
}

/**
 * Generates a summary of the conversation for lead context
 */
function generateConversationSummary(context: LeadCaptureContext): string {
  const messageCount = context.conversation_history.length;
  const productCount = context.product_interests.length;

  const userMessages = context.conversation_history
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .slice(-3); // Last 3 user messages

  const summary = [
    `Conversation with ${messageCount} messages.`,
    productCount > 0
      ? `Interested in ${productCount} products: ${context.product_interests
          .slice(0, 3)
          .join(", ")}.`
      : "",
    userMessages.length > 0
      ? `Recent questions: ${userMessages.join(" | ").substring(0, 200)}...`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return summary;
}

// =====================================================
// Helper: Organization név lekérése
// =====================================================

/**
 * Lekéri az organization nevét az email subject sorához.
 * Ha nem sikerül, "Your Organization" fallback-et ad vissza.
 */
async function getOrgName(organizationId: string): Promise<string> {
  try {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .single() as { data: { name: string } | null };

    return data?.name ?? "Your Organization";
  } catch {
    return "Your Organization";
  }
}
