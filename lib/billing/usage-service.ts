/**
 * =====================================================
 * Usage Service - Havi metrikák nyomon követése
 * =====================================================
 * Ez a service kezeli az usage_metrics tábla frissítését.
 *
 * Mikor hívódik meg:
 *  - Minden sikeres chat válasz után (chats++, tokens += used)
 *  - Minden rögzített lead után (leads++)
 *
 * Miért UPSERT?
 *  Az UPSERT (INSERT ... ON CONFLICT DO UPDATE) azt jelenti:
 *  - Ha nincs még sor az adott org+hónapra → INSERT
 *  - Ha már van → UPDATE (inkrementálás)
 *  Ez atomi művelet, nincsenek race condition problémák.
 * =====================================================
 */

import { createClient } from "@supabase/supabase-js";

// =====================================================
// Admin Supabase kliens (service role - RLS bypass)
// =====================================================

// A service role kulcs szerver oldali kódban használható.
// Ez megkerüli az RLS policy-kat, tehát bármelyik org rekordjába írhat.
// SOHA ne használd kliens oldalon (böngészőben)!
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase admin credentials");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

// =====================================================
// Aktuális hónap helper
// =====================================================

/**
 * Visszaadja az aktuális hónapot "YYYY-MM" formátumban.
 * Pl.: "2026-03"
 *
 * Miért így?
 * Az ISO string első 7 karaktere mindig YYYY-MM.
 */
function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

// =====================================================
// Chat usage rögzítése
// =====================================================

/**
 * Minden sikeres AI válasz után hívjuk meg.
 * Inkrementálja a chats számlálót és hozzáadja a tokeneket.
 *
 * @param organizationId - melyik szervezet
 * @param tokensUsed - az OpenAI válasz által felhasznált tokenek száma
 */
export async function trackChatUsage(
  organizationId: string,
  tokensUsed: number
): Promise<void> {
  const month = getCurrentMonth();
  const supabase = getAdminClient();

  const { error } = await supabase.rpc("increment_usage_metrics", {
    p_organization_id: organizationId,
    p_month: month,
    p_chats: 1,
    p_tokens: tokensUsed,
    p_leads: 0,
  });

  if (error) {
    // Nem dobunk hibát - a usage tracking nem blokkolhatja a chat választ
    // Ha elromlik, logoljuk és továbblépünk
    console.error("[Usage Service] Failed to track chat usage:", error);
  }
}

// =====================================================
// Lead usage rögzítése
// =====================================================

/**
 * Minden sikeresen rögzített lead után hívjuk meg.
 *
 * @param organizationId - melyik szervezet
 */
export async function trackLeadUsage(organizationId: string): Promise<void> {
  const month = getCurrentMonth();
  const supabase = getAdminClient();

  const { error } = await supabase.rpc("increment_usage_metrics", {
    p_organization_id: organizationId,
    p_month: month,
    p_chats: 0,
    p_tokens: 0,
    p_leads: 1,
  });

  if (error) {
    console.error("[Usage Service] Failed to track lead usage:", error);
  }
}

// =====================================================
// Usage lekérése (dashboard-on megjelenítéshez)
// =====================================================

export interface MonthlyUsage {
  month: string;
  chats: number;
  tokens: number;
  leads: number;
}

/**
 * Visszaadja az adott szervezet utolsó N hónapjának usage adatait.
 * Dashboard analitika szekció használja.
 *
 * @param organizationId - melyik szervezet
 * @param months - hány hónap visszamenőleg (default: 6)
 */
export async function getUsageMetrics(
  organizationId: string,
  months: number = 6
): Promise<MonthlyUsage[]> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("usage_metrics")
    .select("month, chats, tokens, leads")
    .eq("organization_id", organizationId)
    .order("month", { ascending: false })
    .limit(months);

  if (error) {
    console.error("[Usage Service] Failed to get usage metrics:", error);
    return [];
  }

  return data || [];
}

/**
 * Visszaadja az aktuális hónap usage adatait.
 * Chat limit ellenőrzésnél használjuk.
 */
export async function getCurrentMonthUsage(
  organizationId: string
): Promise<MonthlyUsage | null> {
  const month = getCurrentMonth();
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("usage_metrics")
    .select("month, chats, tokens, leads")
    .eq("organization_id", organizationId)
    .eq("month", month)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found - ez normális (első chat a hónapban)
    console.error("[Usage Service] Failed to get current month usage:", error);
  }

  return data || null;
}
