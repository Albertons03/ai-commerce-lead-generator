/**
 * =====================================================
 * Shopify Status Endpoint
 * =====================================================
 * GET /api/shopify/status?organization_id=uuid
 *
 * Visszaadja az organizáció Shopify kapcsolatának állapotát:
 * - Csatlakoztatva van-e?
 * - Melyik shop domain?
 * - Mikor volt az utolsó szinkronizálás?
 * - Hány terméket szinkronizált?
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient, getCurrentUser } from "@/lib/supabase/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organization_id");

  if (!organizationId) {
    return NextResponse.json(
      { success: false, error: "organization_id required" },
      { status: 400 }
    );
  }

  // Auth ellenőrzés a projekt saját helperével
  const supabase = await createServerSupabaseClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  // Admin kliens: service role-lal, RLS bypass (kapcsolat lekéréséhez)
  const adminSupabase = createAdminSupabaseClient();

  // Shopify kapcsolat lekérése (access_token nélkül - biztonsági okokból nem adjuk ki)
  // "as any": az új táblák még nem szerepelnek a generált Database típusban (migráció pushig)
  const { data: connection } = await (adminSupabase as any)
    .from("shopify_connections")
    .select("id, shop_domain, scope, installed_at")
    .eq("organization_id", organizationId)
    .single();

  if (!connection) {
    return NextResponse.json({
      success: true,
      data: { connected: false },
    });
  }

  // Utolsó sync log lekérése
  const { data: lastSync } = await (adminSupabase as any)
    .from("shopify_sync_logs")
    .select("synced_at, products_count, status, error")
    .eq("connection_id", connection.id)
    .order("synced_at", { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({
    success: true,
    data: {
      connected:    true,
      shop_domain:  connection.shop_domain,
      scope:        connection.scope,
      installed_at: connection.installed_at,
      last_sync:    lastSync || null,
    },
  });
}
