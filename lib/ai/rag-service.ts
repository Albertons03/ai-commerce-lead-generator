/**
 * =====================================================
 * RAG Service - Vector Search & Retrieval
 * =====================================================
 * This service handles:
 * - Query embedding generation
 * - Semantic search in product embeddings
 * - Top-K retrieval with similarity filtering
 * - Product context formatting
 * =====================================================
 */

import { createClient } from "@supabase/supabase-js";
import { generateEmbedding } from "./embedding-service";

// =====================================================
// Types & Interfaces
// =====================================================

export interface ProductMatch {
  product_id: string;
  product_name: string;
  product_description?: string;
  product_price?: number;
  product_category?: string;
  product_url?: string;
  similarity_score: number;
  metadata?: Record<string, any>;
}

export interface RAGSearchOptions {
  organization_id: string;
  query: string;
  top_k?: number;
  similarity_threshold?: number;
  category_filter?: string;
  price_range?: { min?: number; max?: number };
}

export interface RAGSearchResult {
  matches: ProductMatch[];
  query_embedding_time_ms: number;
  search_time_ms: number;
  total_time_ms: number;
  query_analyzed: string;
  filters_applied: string[];
}

// =====================================================
// Configuration
// =====================================================

const RAG_CONFIG = {
  DEFAULT_TOP_K: 5,
  DEFAULT_SIMILARITY_THRESHOLD: 0.3,
  MAX_TOP_K: 20,
  MIN_SIMILARITY_THRESHOLD: 0.0,  // 0.0 = a route.ts schema határozza meg a minimumot
} as const;

// =====================================================
// Vector Search Implementation
// =====================================================

/**
 * Performs semantic search using vector similarity
 *
 * @param options - Search options and filters
 * @returns Promise<RAGSearchResult> - Search results with metadata
 */
export async function performVectorSearch(
  options: RAGSearchOptions
): Promise<RAGSearchResult> {
  const startTime = Date.now();

  // Validate and set defaults
  const {
    organization_id,
    query,
    top_k = RAG_CONFIG.DEFAULT_TOP_K,
    similarity_threshold = RAG_CONFIG.DEFAULT_SIMILARITY_THRESHOLD,
    category_filter,
    price_range,
  } = options;

  // Validate inputs
  if (!organization_id || !query?.trim()) {
    throw new Error("Organization ID and query are required");
  }

  if (top_k > RAG_CONFIG.MAX_TOP_K) {
    throw new Error(`top_k cannot exceed ${RAG_CONFIG.MAX_TOP_K}`);
  }

  if (similarity_threshold < RAG_CONFIG.MIN_SIMILARITY_THRESHOLD) {
    throw new Error(
      `similarity_threshold cannot be below ${RAG_CONFIG.MIN_SIMILARITY_THRESHOLD}`
    );
  }

  console.log("[RAG Service] Starting vector search:", {
    organization_id,
    query: query.substring(0, 50) + "...",
    top_k,
    similarity_threshold,
    category_filter,
    price_range,
  });

  try {
    // Step 1: Generate query embedding
    const embeddingStartTime = Date.now();
    const queryEmbedding = await generateEmbedding(query, organization_id);
    const embeddingTime = Date.now() - embeddingStartTime;

    console.log("[RAG Service] Query embedding generated:", {
      embedding_length: queryEmbedding.length,
      time_ms: embeddingTime,
    });

    // Step 2: Perform vector search in Supabase
    const searchStartTime = Date.now();
    const matches = await searchSimilarProducts({
      organization_id,
      query_embedding: queryEmbedding,
      top_k,
      similarity_threshold,
      category_filter,
      price_range,
    });
    const searchTime = Date.now() - searchStartTime;

    const totalTime = Date.now() - startTime;

    const result: RAGSearchResult = {
      matches,
      query_embedding_time_ms: embeddingTime,
      search_time_ms: searchTime,
      total_time_ms: totalTime,
      query_analyzed: query.trim(),
      filters_applied: buildFiltersDescription(category_filter, price_range),
    };

    console.log("[RAG Service] Vector search completed:", {
      matches_found: matches.length,
      total_time_ms: totalTime,
      avg_similarity:
        matches.length > 0
          ? matches.reduce((sum, m) => sum + m.similarity_score, 0) /
            matches.length
          : 0,
    });

    return result;
  } catch (error) {
    console.error("[RAG Service] Vector search failed:", error);
    throw new Error(
      `Vector search failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// =====================================================
// Database Search Implementation
// =====================================================

interface SearchSimilarProductsOptions {
  organization_id: string;
  query_embedding: number[];
  top_k: number;
  similarity_threshold: number;
  category_filter?: string;
  price_range?: { min?: number; max?: number };
}

/**
 * Searches for similar products in the database using pgvector
 */
async function searchSimilarProducts(
  options: SearchSimilarProductsOptions
): Promise<ProductMatch[]> {
  const {
    organization_id,
    query_embedding,
    top_k,
    similarity_threshold,
    category_filter,
    price_range,
  } = options;

  // Admin (service role) kliens - RLS bypass, nem kell cookie
  // A widget anon kéréseit is ki tudja szolgálni ezzel
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // RPC hívás - a vektor a request BODY-ban megy, nem URL-ben
  // Ezért nem ütközik URL hossz limitbe (1536 float ~= 10KB URL lett volna)
  const { data: results, error } = await supabase.rpc(
    "search_products_by_embedding",
    {
      p_organization_id: organization_id,
      p_query_embedding: `[${query_embedding.join(",")}]`,
      p_limit: top_k,
      p_similarity_threshold: similarity_threshold,
    }
  );

  console.log("[RAG Service] RPC result:", {
    error: error ? { message: error.message, code: error.code } : null,
    results_count: results?.length ?? 0,
    threshold_used: similarity_threshold,
    org_id: organization_id,
  });

  if (error) {
    console.error("[RAG Service] Database search error:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    console.log("[RAG Service] Continuing without vector search results");
    return [];
  }

  if (!results || results.length === 0) {
    // Debug: run the same query with threshold 0 to see actual similarity scores
    const { data: debugResults } = await supabase.rpc(
      "search_products_by_embedding",
      {
        p_organization_id: organization_id,
        p_query_embedding: `[${query_embedding.join(",")}]`,
        p_limit: 5,
        p_similarity_threshold: 0.0,  // no filter → shows real scores
      }
    );
    console.log("[RAG Service] DEBUG - Top similarities at threshold 0.0:", {
      threshold_used: similarity_threshold,
      top_results: (debugResults || []).slice(0, 5).map((r: any) => ({
        name: r.product_name,
        similarity: r.similarity_score,
      })),
    });
    return [];
  }

  // Transform results to ProductMatch interface
  // Az RPC már (1 - distance) értéket ad vissza → valódi similarity score (0-1)
  const matches: ProductMatch[] = results.map((row: any) => ({
    product_id: row.product_id,
    product_name: row.product_name,
    product_description: row.product_description,
    product_price: row.product_price,
    product_category: row.product_category,
    product_url: row.product_url,
    similarity_score: row.similarity_score,
    metadata: row.metadata,
  }));

  console.log("[RAG Service] Products found:", {
    count: matches.length,
    top_similarity: matches[0]?.similarity_score,
    products: matches.slice(0, 3).map((m) => ({
      name: m.product_name,
      similarity: m.similarity_score.toFixed(3),
    })),
  });

  return matches;
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Builds description of applied filters for logging
 */
function buildFiltersDescription(
  category_filter?: string,
  price_range?: { min?: number; max?: number }
): string[] {
  const filters: string[] = [];

  if (category_filter) {
    filters.push(`category: ${category_filter}`);
  }

  if (price_range?.min !== undefined || price_range?.max !== undefined) {
    const min = price_range?.min ?? "any";
    const max = price_range?.max ?? "any";
    filters.push(`price: ${min}-${max}`);
  }

  return filters;
}

/**
 * Format product matches for context injection
 */
export function formatProductsForContext(matches: ProductMatch[]): string {
  if (matches.length === 0) {
    return "No relevant products found for this query.";
  }

  const formattedProducts = matches.map((product, index) => {
    const parts = [
      `${index + 1}. **${product.product_name}**`,
      product.product_description
        ? `   Description: ${product.product_description}`
        : "",
      product.product_price ? `   Price: $${product.product_price}` : "",
      product.product_category
        ? `   Category: ${product.product_category}`
        : "",
      product.product_url ? `   Link: ${product.product_url}` : "",
      `   Relevance: ${(product.similarity_score * 100).toFixed(1)}%`,
    ];

    return parts.filter(Boolean).join("\n");
  });

  return [
    `Found ${matches.length} relevant product${
      matches.length === 1 ? "" : "s"
    }:`,
    "",
    ...formattedProducts,
  ].join("\n");
}

/**
 * Extract product IDs from matches for reference
 */
export function extractProductIds(matches: ProductMatch[]): string[] {
  return matches.map((match) => match.product_id);
}
