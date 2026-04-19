/**
 * DEBUG ENDPOINT - Temporary, remove before shipping
 * GET /api/debug-search?org=<uuid>&q=<query>
 *
 * Megmutatja a vector search eredményeit threshold 0.0-nál,
 * hogy lássuk a tényleges similarity score-okat.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateEmbedding } from "@/lib/ai/embedding-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("org");
  const query = searchParams.get("q") || "gaming laptop";
  const threshold = parseFloat(searchParams.get("threshold") || "0.0");

  if (!orgId) {
    return NextResponse.json({ error: "?org=<uuid> required" }, { status: 400 });
  }

  try {
    // 1. Generate embedding for the query
    const embeddingStart = Date.now();
    const embedding = await generateEmbedding(query, orgId);
    const embeddingMs = Date.now() - embeddingStart;

    // 2. Search with threshold 0.0 (no filter)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: allResults, error } = await supabase.rpc(
      "search_products_by_embedding",
      {
        p_organization_id: orgId,
        p_query_embedding: `[${embedding.join(",")}]`,
        p_limit: 10,
        p_similarity_threshold: threshold,
      }
    );

    if (error) {
      return NextResponse.json({
        error: "RPC failed",
        rpc_error: { message: error.message, code: error.code, hint: error.hint },
        embedding_length: embedding.length,
        embedding_ms: embeddingMs,
      }, { status: 500 });
    }

    // 3. Count all products in the table for this org (regardless of threshold)
    const { count } = await supabase
      .from("product_embeddings")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("is_active", true);

    return NextResponse.json({
      query,
      org_id: orgId,
      threshold_used: threshold,
      embedding_length: embedding.length,
      embedding_ms: embeddingMs,
      total_products_in_db: count,
      results: (allResults || []).map((r: any) => ({
        name: r.product_name,
        similarity: r.similarity_score?.toFixed(4),
        category: r.product_category,
        description_preview: r.product_description?.slice(0, 60),
      })),
      widget_threshold: 0.1,
      dashboard_threshold: 0.2,
    });
  } catch (err: any) {
    return NextResponse.json({
      error: err.message,
      stack: err.stack?.slice(0, 500),
    }, { status: 500 });
  }
}
