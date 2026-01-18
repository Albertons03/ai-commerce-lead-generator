import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createAdminSupabaseClient } from "@/lib/supabase/client";
import { createLeadSchema } from "@/lib/validations/leads";
import { checkRateLimit } from "@/lib/utils/rate-limiter";
import type { ApiKey, LeadInsert } from "@/lib/supabase/types";

/**
 * =====================================================
 * Public Lead Capture API
 * =====================================================
 * POST /api/public/leads
 *
 * This endpoint allows embedded chatbots and external applications
 * to submit leads without user authentication. Authentication is
 * performed using API keys passed in the X-API-Key header.
 *
 * Features:
 * - API key authentication (bcrypt hash verification)
 * - Rate limiting (10 requests per minute per organization)
 * - CORS support for embedded chatbots
 * - Duplicate detection (same email + org within 24 hours)
 * - Request logging for audit trail
 * - IP address and user agent extraction
 *
 * Security:
 * - API keys are hashed with bcrypt
 * - Rate limiting prevents abuse
 * - CORS domains are whitelisted per API key
 * - All requests are logged for audit
 * =====================================================
 */

// CORS configuration
const ALLOWED_METHODS = ["POST", "OPTIONS"];
const ALLOWED_HEADERS = [
  "Content-Type",
  "X-API-Key",
  "User-Agent",
  "X-Forwarded-For",
];

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin") || "*";

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": ALLOWED_METHODS.join(", "),
      "Access-Control-Allow-Headers": ALLOWED_HEADERS.join(", "),
      "Access-Control-Max-Age": "86400", // 24 hours
    },
  });
}

/**
 * Extract IP address from request headers
 */
function extractIpAddress(request: NextRequest): string | null {
  // Try multiple headers (common proxy headers)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // X-Forwarded-For may contain multiple IPs, take the first one
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback to connection remote address (may not be available in serverless)
  return null;
}

/**
 * Extract user agent from request headers
 */
function extractUserAgent(request: NextRequest): string | null {
  return request.headers.get("user-agent") || null;
}

/**
 * Validate API key and retrieve organization
 */
async function validateApiKey(apiKey: string): Promise<{
  valid: boolean;
  apiKeyRecord?: ApiKey;
  error?: string;
}> {
  if (!apiKey || apiKey.length < 20) {
    console.log(
      "[API Key Validation] Invalid format - key length:",
      apiKey?.length
    );
    return { valid: false, error: "Invalid API key format" };
  }

  try {
    const supabase = createAdminSupabaseClient();

    // Query active API keys
    const { data: apiKeys, error } = (await supabase
      .from("api_keys")
      .select("*")
      .eq("is_active", true)
      .is("revoked_at", null)) as { data: any[] | null; error: any };

    if (error) {
      console.error("[API Key Validation] Error fetching API keys:", error);
      return { valid: false, error: "Database error" };
    }

    console.log(
      "[API Key Validation] Found",
      apiKeys?.length || 0,
      "active API keys in database"
    );
    console.log(
      "[API Key Validation] Testing key:",
      apiKey.substring(0, 20) + "..."
    );

    if (!apiKeys || apiKeys.length === 0) {
      console.log("[API Key Validation] No active API keys found");
      return { valid: false, error: "Invalid API key" };
    }

    // Verify API key against stored hashes
    for (const record of apiKeys) {
      console.log(
        "[API Key Validation] Comparing with key_prefix:",
        (record as any).key_prefix
      );
      const isValid = await bcrypt.compare(apiKey, (record as any).key_hash);
      console.log("[API Key Validation] Match result:", isValid);
      if (isValid) {
        console.log(
          "[API Key Validation] ✓ Valid API key found for org:",
          (record as any).organization_id
        );
        return { valid: true, apiKeyRecord: record as ApiKey };
      }
    }

    console.log("[API Key Validation] ✗ No matching API key found");
    return { valid: false, error: "Invalid API key" };
  } catch (error) {
    console.error("[API Key Validation] Exception:", error);
    return { valid: false, error: "Validation error" };
  }
}

/**
 * Check CORS origin against allowed domains
 */
function validateCorsOrigin(
  origin: string | null,
  allowedDomains: string[]
): boolean {
  if (!origin) return true; // Allow requests without origin (non-browser)
  if (allowedDomains.length === 0) return true; // No restrictions

  try {
    const originUrl = new URL(origin);
    const originHost = originUrl.hostname;

    // Check if origin matches any allowed domain
    return allowedDomains.some((domain) => {
      // Support wildcards (e.g., *.example.com)
      if (domain.startsWith("*.")) {
        const baseDomain = domain.substring(2);
        return originHost.endsWith(baseDomain);
      }
      return originHost === domain || origin === domain;
    });
  } catch {
    return false;
  }
}

/**
 * Check for duplicate leads (same email + org within 24 hours)
 */
async function checkDuplicateLead(
  email: string,
  organizationId: string
): Promise<{ isDuplicate: boolean; existingLeadId?: string }> {
  try {
    const supabase = createAdminSupabaseClient();

    // Check for leads with same email in the last 24 hours
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    const { data, error } = (await supabase
      .from("leads")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("email", email.toLowerCase())
      .gte("created_at", twentyFourHoursAgo)
      .limit(1)) as { data: Array<{ id: string }> | null; error: any };

    if (error) {
      console.error("Error checking for duplicates:", error);
      return { isDuplicate: false }; // Don't block on error
    }

    if (data?.length) {
      return { isDuplicate: true, existingLeadId: data[0].id };
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error("Duplicate check error:", error);
    return { isDuplicate: false }; // Don't block on error
  }
}

/**
 * Log API request for audit trail
 */
async function logApiRequest(
  organizationId: string,
  leadId: string | null,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  try {
    const supabase = createAdminSupabaseClient();

    // Log to lead_activity_log if we have a lead_id
    if (leadId) {
      await supabase.from("lead_activity_log").insert({
        lead_id: leadId,
        organization_id: organizationId,
        activity_type: "created",
        description: success
          ? "Lead created via public API"
          : `API error: ${errorMessage}`,
        performed_by: null, // System-generated
        metadata: {
          source: "public_api",
          success,
          error: errorMessage || null,
        },
      } as any);
    }
  } catch (error) {
    // Log error but don't fail the request
    console.error("Failed to log API request:", error);
  }
}

/**
 * POST /api/public/leads
 * Create a new lead from external source (chatbot, web form, etc.)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let organizationId: string = "";
  let apiKeyRecord: ApiKey | undefined;

  try {
    // 1. Extract API key from header
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or missing API key",
        },
        {
          status: 401,
          headers: {
            "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
          },
        }
      );
    }

    // 2. Validate API key
    const apiKeyValidation = await validateApiKey(apiKey);
    if (!apiKeyValidation.valid || !apiKeyValidation.apiKeyRecord) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or missing API key",
        },
        {
          status: 401,
          headers: {
            "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
          },
        }
      );
    }

    apiKeyRecord = apiKeyValidation.apiKeyRecord;
    organizationId = (apiKeyRecord as any).organization_id;

    // 3. Check CORS origin
    const origin = request.headers.get("origin");
    const corsValid = validateCorsOrigin(origin, (apiKeyRecord as any).allowed_domains);
    if (!corsValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Origin not allowed",
        },
        {
          status: 403,
          headers: {
            "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
          },
        }
      );
    }

    // 4. Check rate limit
    const rateLimitResult = await checkRateLimit({
      identifier: (apiKeyRecord as any).id,
      maxRequests: (apiKeyRecord as any).rate_limit_per_minute,
      windowMs: 60000, // 1 minute
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded",
          retry_after: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            "Access-Control-Allow-Origin": origin || "*",
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(
              rateLimitResult.resetAt
            ).toISOString(),
            "Retry-After": rateLimitResult.retryAfter.toString(),
          },
        }
      );
    }

    // 5. Parse and validate request body
    const body = await request.json();

    let validatedData;
    try {
      validatedData = createLeadSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        return NextResponse.json(
          {
            success: false,
            error: firstError.message,
            field: firstError.path.join("."),
          },
          {
            status: 400,
            headers: {
              "Access-Control-Allow-Origin": origin || "*",
            },
          }
        );
      }
      throw error;
    }

    // 6. Extract IP and user agent (auto-capture if not provided)
    const ipAddress = validatedData.ip_address || extractIpAddress(request);
    const userAgent = validatedData.user_agent || extractUserAgent(request);

    // 7. Check for duplicate leads
    const duplicateCheck = await checkDuplicateLead(
      validatedData.email,
      organizationId
    );

    if (duplicateCheck.isDuplicate) {
      return NextResponse.json(
        {
          success: false,
          error: "Duplicate lead detected",
          existing_lead_id: duplicateCheck.existingLeadId,
        },
        {
          status: 409,
          headers: {
            "Access-Control-Allow-Origin": origin || "*",
          },
        }
      );
    }

    // 8. Create lead in database
    const supabase = createAdminSupabaseClient();

    const leadData: LeadInsert = {
      organization_id: organizationId,
      name: validatedData.name,
      email: validatedData.email.toLowerCase(),
      phone: validatedData.phone || null,
      company: validatedData.company || null,
      source: validatedData.source || "chatbot",
      product_interests: validatedData.product_interests || [],
      conversation_id: validatedData.conversation_id || null,
      conversation_summary: validatedData.conversation_summary || null,
      utm_source: validatedData.utm_source || null,
      utm_medium: validatedData.utm_medium || null,
      utm_campaign: validatedData.utm_campaign || null,
      utm_term: validatedData.utm_term || null,
      utm_content: validatedData.utm_content || null,
      referrer_url: validatedData.referrer_url || null,
      landing_page: validatedData.landing_page || null,
      user_agent: userAgent,
      ip_address: ipAddress,
      metadata: validatedData.metadata || {},
      status: "new",
      lead_score: 0,
      notes: null,
      internal_notes: null,
      location_country: null,
      location_city: null,
      last_contacted_at: null,
      converted_at: null,
    };

    const { data: lead, error: insertError } = (await supabase
      .from("leads")
      .insert(leadData as any)
      .select("id")
      .single()) as { data: { id: string } | null; error: any };

    if (insertError) {
      console.error("Error creating lead:", insertError);
      await logApiRequest(organizationId, null, false, insertError.message);
      return NextResponse.json(
        {
          success: false,
          error: "Internal server error",
          message: "Failed to create lead",
        },
        {
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": origin || "*",
          },
        }
      );
    }

    // 9. Update API key usage statistics
    await (supabase
      .from("api_keys")
      .update as any)({
        last_used_at: new Date().toISOString(),
        usage_count: (apiKeyRecord as any).usage_count + 1,
      })
      .eq("id", (apiKeyRecord as any).id);

    // 10. Log successful request
    await logApiRequest(organizationId, lead?.id || null, true);

    // 11. Return success response
    const responseTime = Date.now() - startTime;
    return NextResponse.json(
      {
        success: true,
        lead_id: lead?.id,
        message: "Lead created successfully",
      },
      {
        status: 201,
        headers: {
          "Access-Control-Allow-Origin": origin || "*",
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": new Date(rateLimitResult.resetAt).toISOString(),
          "X-Response-Time": `${responseTime}ms`,
        },
      }
    );
  } catch (error) {
    console.error("Unhandled error in POST /api/public/leads:", error);

    // Log error if we have organization context
    if (organizationId) {
      await logApiRequest(
        organizationId,
        null,
        false,
        error instanceof Error ? error.message : "Unknown error"
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "An unexpected error occurred",
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
        },
      }
    );
  }
}
