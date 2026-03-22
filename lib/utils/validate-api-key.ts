/**
 * =====================================================
 * API Key Validátor
 * =====================================================
 * A widget-ből jövő kérések API key-jét ellenőrzi.
 *
 * Folyamat:
 * 1. Request body-ból kinyerjük az api_key-t
 * 2. SHA-256 hash-eljük (ugyanúgy mint létrehozáskor)
 * 3. Megnézzük, hogy az api_keys táblában van-e aktív kulcs ezzel a hash-sel
 * 4. Ha van: visszaadjuk az organization_id-t
 * 5. Ha nincs: 401-es hibát adunk vissza
 *
 * Miért hash-t tárolunk, nem a kulcsot?
 * Ha adatbázis szivárgás történne, a nyers kulcsok ne legyenek
 * kiolvashatók. A hash egyirányú: hash-ből nem kapható vissza a kulcs.
 * =====================================================
 */

import { createClient } from "@supabase/supabase-js";
import { verifyApiKey, getKeyPrefix } from "@/lib/utils/api-keys";

export interface ApiKeyValidationResult {
  valid: boolean;
  organization_id?: string;
  error?: string;
}

/**
 * Validálja az API key-t a Supabase api_keys táblában.
 *
 * Folyamat:
 * 1. A kulcs prefix-ével (első 20 karakter) megkeressük a DB-ben a jelöltet
 * 2. bcrypt.compare-rel ellenőrizzük a teljes kulcsot a tárolt hash ellen
 *    → Ez a lassabb lépés (~100ms), de biztonságos
 * 3. Ha egyezik: visszaadjuk az organization_id-t
 *
 * @param apiKey - A nyers API key (pl. "sk_live_xxx...")
 */
export async function validateApiKey(
  apiKey: string
): Promise<ApiKeyValidationResult> {
  if (!apiKey || typeof apiKey !== "string") {
    return { valid: false, error: "API key is required" };
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // A prefix alapján szűkítjük a keresést (index-elt mező → gyors)
    const prefix = getKeyPrefix(apiKey);

    const { data, error } = await supabase
      .from("api_keys")
      .select("id, key_hash, organization_id, is_active, revoked_at")
      .eq("key_prefix", prefix)
      .eq("is_active", true)
      .is("revoked_at", null)
      .single();

    if (error || !data) {
      return { valid: false, error: "Invalid API key" };
    }

    // bcrypt.compare: a nyers kulcsot a tárolt hash ellen ellenőrzi
    const isValid = await verifyApiKey(apiKey, data.key_hash);
    if (!isValid) {
      return { valid: false, error: "Invalid API key" };
    }

    // last_used_at frissítés (fire-and-forget, nem kritikus)
    void supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", data.id);

    return { valid: true, organization_id: data.organization_id };

  } catch (err) {
    console.error("[API Key Validator] Error:", err);
    return { valid: false, error: "Validation failed" };
  }
}
