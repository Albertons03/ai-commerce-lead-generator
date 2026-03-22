/**
 * =====================================================
 * Shopify OAuth - Install Endpoint
 * =====================================================
 * GET /api/shopify/install?shop=my-store.myshopify.com&org_id=uuid
 *
 * Átirányítja a kereskedőt a Shopify OAuth engedélyezési oldalára.
 *
 * OAuth flow (3 lépés):
 * 1. Ez az endpoint → redirect a Shopify-ra (shop owner jóváhagyja)
 * 2. Shopify visszairányít a /api/shopify/callback-re (code-dal)
 * 3. Callback token csere → mentés DB-be
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Ezek a Shopify Partner Dashboard-ból kellenek (app beállítások)
const SHOPIFY_CLIENT_ID     = process.env.SHOPIFY_CLIENT_ID!;
const SHOPIFY_REDIRECT_URI  = process.env.SHOPIFY_REDIRECT_URI!; // pl. https://app.com/api/shopify/callback

// Shopify scope: csak olvasási jog kell a termékekhez
const SCOPES = "read_products";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shop   = searchParams.get("shop");
  const orgId  = searchParams.get("org_id");

  // Bemeneti validáció
  if (!shop || !orgId) {
    return NextResponse.json(
      { error: "Missing required parameters: shop, org_id" },
      { status: 400 }
    );
  }

  // Shop domain validáció - csak .myshopify.com domaint fogadunk el
  // (biztonsági szűrés: megakadályozza hogy tetszőleges URL-re irányítsunk)
  if (!/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shop)) {
    return NextResponse.json(
      { error: "Invalid shop domain. Must be a valid myshopify.com domain." },
      { status: 400 }
    );
  }

  if (!SHOPIFY_CLIENT_ID || !SHOPIFY_REDIRECT_URI) {
    return NextResponse.json(
      { error: "Shopify integration not configured. Set SHOPIFY_CLIENT_ID and SHOPIFY_REDIRECT_URI." },
      { status: 500 }
    );
  }

  // State paraméter: CSRF védelem + orgId átadás a callback-nek
  // crypto.randomBytes(16): 16 byte véletlenszerű adat → hex string (32 karakter)
  // A state-ben kódoljuk az orgId-t, hogy a callback tudja melyik org-hoz menteni
  const nonce = crypto.randomBytes(16).toString("hex");
  const state = Buffer.from(`${orgId}:${nonce}`).toString("base64url");

  // Shopify OAuth URL összerakása
  // Dokumentáció: https://shopify.dev/docs/apps/build/authentication-authorization/access-token-types/online-access
  const authUrl = new URL(`https://${shop}/admin/oauth/authorize`);
  authUrl.searchParams.set("client_id",     SHOPIFY_CLIENT_ID);
  authUrl.searchParams.set("scope",         SCOPES);
  authUrl.searchParams.set("redirect_uri",  SHOPIFY_REDIRECT_URI);
  authUrl.searchParams.set("state",         state);

  console.log(`[Shopify Install] Redirecting to OAuth for shop: ${shop}, org: ${orgId}`);

  // 302 redirect a Shopify engedélyezési oldalra
  return NextResponse.redirect(authUrl.toString());
}
