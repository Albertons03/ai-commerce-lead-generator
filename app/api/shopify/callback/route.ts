/**
 * =====================================================
 * Shopify OAuth - Callback Endpoint
 * =====================================================
 * GET /api/shopify/callback?code=...&shop=...&state=...&hmac=...
 *
 * Shopify ide irányítja a kereskedőt az engedélyezés után.
 *
 * Lépések:
 * 1. HMAC aláírás ellenőrzése (Shopify biztonsági követelmény)
 * 2. State dekódolása → orgId kinyerése
 * 3. Code → access token csere (POST Shopify-nak)
 * 4. Token mentése shopify_connections táblába
 * 5. Redirect a dashboardba
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const SHOPIFY_CLIENT_ID     = process.env.SHOPIFY_CLIENT_ID!;
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET!;

// Supabase admin kliens: service role-lal ír, nem kell user session
// Azért kell admin kliens, mert ez egy szerver-oldali callback (nincs cookie)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code  = searchParams.get("code");
  const shop  = searchParams.get("shop");
  const state = searchParams.get("state");
  const hmac  = searchParams.get("hmac");

  // ── 1. HMAC aláírás ellenőrzése ────────────────────
  // Shopify az összes callback paraméterből HMAC-et számol (kivéve az hmac-et magát).
  // Ha a mi számolt HMAC-ünk nem egyezik, a kérés nem Shopifytól jött (támadás!).
  if (!verifyShopifyHmac(searchParams, hmac || "")) {
    console.error("[Shopify Callback] HMAC verification failed");
    return NextResponse.json({ error: "HMAC verification failed" }, { status: 401 });
  }

  if (!code || !shop || !state) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  // ── 2. State dekódolása ────────────────────────────
  // Az install endpoint base64url-be kódolta: "orgId:nonce"
  let orgId: string;
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    orgId = decoded.split(":")[0];
    if (!orgId) throw new Error("No orgId in state");
  } catch {
    return NextResponse.json({ error: "Invalid state parameter" }, { status: 400 });
  }

  // ── 3. Code → Access Token csere ──────────────────
  // POST kérés Shopifynek: code + client credentials → permanent access token
  let accessToken: string;
  let grantedScope: string;

  try {
    const tokenRes = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id:     SHOPIFY_CLIENT_ID,
          client_secret: SHOPIFY_CLIENT_SECRET,
          code,
        }),
      }
    );

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      throw new Error(`Token exchange failed: ${tokenRes.status} ${err}`);
    }

    const tokenData = await tokenRes.json();
    accessToken  = tokenData.access_token;
    grantedScope = tokenData.scope;

    if (!accessToken) {
      throw new Error("No access_token in response");
    }
  } catch (error: any) {
    console.error("[Shopify Callback] Token exchange failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ── 4. Kapcsolat mentése DB-be ─────────────────────
  // Upsert: ha már volt kapcsolat ehhez a shop-hoz, frissíti a tokent
  // "as any": az új táblák még nem szerepelnek a generált Database típusban (migráció pushig)
  const { error: dbError } = await (supabaseAdmin as any)
    .from("shopify_connections")
    .upsert(
      {
        organization_id: orgId,
        shop_domain:     shop,
        access_token:    accessToken,
        scope:           grantedScope,
        installed_at:    new Date().toISOString(),
      },
      { onConflict: "organization_id,shop_domain" }
    );

  if (dbError) {
    console.error("[Shopify Callback] DB save failed:", dbError);
    return NextResponse.json({ error: "Failed to save connection" }, { status: 500 });
  }

  console.log(`[Shopify Callback] Successfully connected shop: ${shop} to org: ${orgId}`);

  // ── 5. Redirect a training oldalra ────────────────
  // Az orgSlug-ot az orgId alapján kell lekérni, de egyszerűbb a dashboard rootra küldeni
  // és ott a felhasználó látja a "Shopify connected!" visszajelzést
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || "";

  // Lekérjük az org slug-ot a DB-ből a redirect URL-hez
  const { data: org } = await (supabaseAdmin as any)
    .from("organizations")
    .select("slug")
    .eq("id", orgId)
    .single();

  const redirectPath = org?.slug
    ? `/${org.slug}/settings/training?shopify=connected`
    : "/dashboard?shopify=connected";

  return NextResponse.redirect(`${appUrl}${redirectPath}`);
}

// ── HMAC Ellenőrzés ──────────────────────────────────

/**
 * Shopify HMAC aláírás ellenőrzése.
 *
 * Algoritmus:
 * 1. Az összes query paraméter (kivéve hmac) name=value formátumban
 * 2. ABC sorrendbe rendezve és & jellel összefűzve
 * 3. HMAC-SHA256 hash számítása SHOPIFY_CLIENT_SECRET kulccsal
 * 4. Összehasonlítás a kapott hmac értékkel
 *
 * crypto.timingSafeEqual: időzítés-álló összehasonlítás (timing attack védelem)
 */
function verifyShopifyHmac(
  params: URLSearchParams,
  receivedHmac: string
): boolean {
  if (!SHOPIFY_CLIENT_SECRET || !receivedHmac) return false;

  // Összes paraméter összegyűjtése, hmac kihagyása
  const pairs: string[] = [];
  params.forEach((value, key) => {
    if (key !== "hmac") {
      pairs.push(`${key}=${value}`);
    }
  });

  // ABC sorrend + összefűzés
  const message = pairs.sort().join("&");

  // HMAC-SHA256 számítás
  const calculatedHmac = crypto
    .createHmac("sha256", SHOPIFY_CLIENT_SECRET)
    .update(message)
    .digest("hex");

  // Időzítés-álló összehasonlítás (megakadályozza a timing attack-ot)
  try {
    return crypto.timingSafeEqual(
      Buffer.from(calculatedHmac, "hex"),
      Buffer.from(receivedHmac, "hex")
    );
  } catch {
    return false; // Különböző hossz esetén timingSafeEqual dob
  }
}
