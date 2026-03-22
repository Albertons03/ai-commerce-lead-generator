/**
 * =====================================================
 * Shopify Sync Endpoint
 * =====================================================
 * POST /api/shopify/sync
 * Body: { organization_id: string }
 *
 * Lépések:
 * 1. shopify_connections rekord lekérése (shop_domain + access_token)
 * 2. Összes aktív termék fetchelése Shopify Admin API-tól
 * 3. Field mapping (Shopify → train-bot formátum)
 * 4. Embedding generálás + Supabase pgvector mentés
 * 5. shopify_sync_logs bejegyzés
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient, getCurrentUser } from "@/lib/supabase/client";
import { fetchShopifyProducts } from "@/lib/shopify/shopify-client";
import { generateEmbeddings } from "@/lib/ai/embedding-service";
import { batchUpsertEmbeddings } from "@/lib/supabase/embedding-helpers";

const DEFAULT_EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { organization_id } = body;

    if (!organization_id) {
      return NextResponse.json(
        { success: false, error: { code: "missing_param", message: "organization_id required" } },
        { status: 400 }
      );
    }

    // ── Auth: bejelentkezett user ellenőrzése ─────────
    const supabase = await createServerSupabaseClient();
    const user = await getCurrentUser(supabase);

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "unauthorized", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Admin kliens a DB műveletekhez (RLS bypass)
    const adminSupabase = createAdminSupabaseClient();

    // ── 1. Shopify kapcsolat lekérése ─────────────────
    // "as any": az új táblák még nem szerepelnek a generált Database típusban (migráció pushig)
    const { data: connection, error: connError } = await (adminSupabase as any)
      .from("shopify_connections")
      .select("id, shop_domain, access_token")
      .eq("organization_id", organization_id)
      .single();

    if (connError || !connection) {
      return NextResponse.json(
        { success: false, error: { code: "no_connection", message: "No Shopify connection found for this organization" } },
        { status: 404 }
      );
    }

    const { id: connectionId, shop_domain: shopDomain, access_token: accessToken } = connection;

    console.log(`[Shopify Sync] Starting sync for ${shopDomain}`);

    // ── 2. Termékek fetchelése a Shopify-tól ──────────
    let products;
    try {
      products = await fetchShopifyProducts(shopDomain, accessToken);
    } catch (error: any) {
      await logSync(adminSupabase, connectionId, 0, "failed", error.message);
      return NextResponse.json(
        { success: false, error: { code: "shopify_fetch_failed", message: error.message } },
        { status: 502 }
      );
    }

    if (products.length === 0) {
      await logSync(adminSupabase, connectionId, 0, "success");
      return NextResponse.json({
        success: true,
        data: { products_count: 0, inserted: 0, updated: 0, failed: 0, duration_ms: Date.now() - startTime },
        message: "No active products found in Shopify store.",
      });
    }

    console.log(`[Shopify Sync] Fetched ${products.length} products, generating embeddings...`);

    // ── 3. Embedding generálás ────────────────────────
    // Közvetlenül hívjuk a service-t (nem HTTP-n, nincs auth probléma)
    let embeddingResult;
    try {
      embeddingResult = await generateEmbeddings(products, {
        model: DEFAULT_EMBEDDING_MODEL,
        batchSize: 10,
        onProgress: (done, total) =>
          console.log(`[Shopify Sync] Embeddings: ${done}/${total}`),
      });
    } catch (error: any) {
      await logSync(adminSupabase, connectionId, products.length, "failed", `Embedding generation failed: ${error.message}`);
      return NextResponse.json(
        { success: false, error: { code: "embedding_failed", message: error.message } },
        { status: 500 }
      );
    }

    // ── 4. Supabase pgvector táblába mentés ───────────
    const productDataMap = new Map(
      products.map((p) => [
        p.product_id,
        {
          name:        p.product_name,
          description: p.product_description,
          metadata:    p.metadata,
        },
      ])
    );

    const dbResult = await batchUpsertEmbeddings(
      organization_id,
      embeddingResult.results,
      productDataMap,
      DEFAULT_EMBEDDING_MODEL,
      true // overwrite_existing: Shopify sync mindig frissíti a meglévőket
    );

    const { inserted, updated, failed } = dbResult;
    const duration = Date.now() - startTime;
    const status: "success" | "failed" | "partial" =
      failed > 0 && inserted + updated === 0 ? "failed" : failed > 0 ? "partial" : "success";

    // ── 5. Sync log mentése ───────────────────────────
    await logSync(
      adminSupabase,
      connectionId,
      products.length,
      status,
      failed > 0 ? `${failed} products failed to index` : undefined
    );

    console.log(
      `[Shopify Sync] Done: ${inserted} inserted, ${updated} updated, ${failed} failed. Duration: ${duration}ms`
    );

    return NextResponse.json({
      success: true,
      data: { products_count: products.length, inserted, updated, failed, duration_ms: duration },
      message: `Synced ${products.length} products from ${shopDomain}`,
    });

  } catch (error: any) {
    console.error("[Shopify Sync] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: { code: "internal_error", message: error.message } },
      { status: 500 }
    );
  }
}

// ── Segédfüggvény: sync log bejegyzés ────────────────

async function logSync(
  adminSupabase: ReturnType<typeof createAdminSupabaseClient>,
  connectionId: string,
  productsCount: number,
  status: "success" | "failed" | "partial",
  error?: string
) {
  await (adminSupabase as any).from("shopify_sync_logs").insert({
    connection_id:  connectionId,
    products_count: productsCount,
    status,
    error:          error || null,
  });
}
