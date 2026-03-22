/**
 * =====================================================
 * Shopify Client - Admin API Integration
 * =====================================================
 * Felelős:
 * - Shopify Admin REST API hívások
 * - Termék adatok fetchelése + field mapping
 * - HTML tag eltávolítás (body_html → tiszta szöveg)
 * =====================================================
 */

// ── Shopify API típusok ──────────────────────────────

/**
 * Shopify termék variant (ár itt van)
 */
interface ShopifyVariant {
  id: number;
  price: string; // Shopify string-ként adja az árat: "149.99"
  title: string;
  inventory_quantity: number;
}

/**
 * Shopify termék (Admin API JSON)
 */
interface ShopifyProduct {
  id: number;
  title: string;        // → product_name
  body_html: string;    // → product_description (HTML tagek nélkül)
  product_type: string; // → category
  handle: string;       // → metadata.url slug
  variants: ShopifyVariant[];
  status: "active" | "draft" | "archived";
  updated_at: string;
}

/**
 * Shopify API válasz terméklistára
 */
interface ShopifyProductsResponse {
  products: ShopifyProduct[];
}

/**
 * A mi train-bot API-nknak megfelelő termék formátum
 */
export interface MappedProduct {
  product_id:          string;
  product_name:        string;
  product_description: string;
  category?:           string;
  price?:              number;
  metadata?:           Record<string, unknown>;
}

// ── Segédfüggvények ──────────────────────────────────

/**
 * HTML tagek eltávolítása a body_html mezőből.
 *
 * Miért kell? A Shopify body_html-ben HTML formázás van (<p>, <br>, <strong>, stb.).
 * Az AI embedding szövegalapú - a HTML tagek zajt okoznának a vektortérben.
 *
 * Megközelítés: regex alapú tag eltávolítás (Server-side, nincs DOM parser)
 */
function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, " ")      // <br> → szóköz
    .replace(/<\/p>/gi, " ")           // </p> → szóköz (bekezdések között)
    .replace(/<[^>]+>/g, "")           // összes többi tag eltávolítása
    .replace(/&amp;/g, "&")            // HTML entitások dekódolása
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")              // többszörös szóközök → egy szóköz
    .trim();
}

/**
 * Shopify product handle → slugified product_id
 * A handle már URL-barát (kisbetű, kötőjeles) - ezt használjuk ID-ként.
 * Így az újraszinkronizálás upsert-ként működik, nem duplikál.
 */
function handleToId(handle: string): string {
  return `shopify_${handle}`.substring(0, 60);
}

// ── Fő API hívás ─────────────────────────────────────

/**
 * Lekéri az összes aktív terméket egy Shopify store-ból.
 *
 * Shopify Admin API v2024-01:
 * GET https://{shop}/admin/api/2024-01/products.json
 *
 * Pagination: Shopify max 250 terméket ad egy kérésre.
 * Link header-t használ a következő oldal jelzésére.
 *
 * @param shopDomain - pl. "my-store.myshopify.com"
 * @param accessToken - OAuth után kapott permanent token
 * @returns Mappolt termékek tömbje
 */
export async function fetchShopifyProducts(
  shopDomain: string,
  accessToken: string
): Promise<MappedProduct[]> {
  const allProducts: ShopifyProduct[] = [];

  // Pagination: addig kérünk, amíg van következő oldal
  let nextUrl: string | null =
    `https://${shopDomain}/admin/api/2024-01/products.json?limit=250&status=active`;

  while (nextUrl) {
    const res: Response = await fetch(nextUrl, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `Shopify API error: ${res.status} ${res.statusText} - ${errorText}`
      );
    }

    const data: ShopifyProductsResponse = await res.json();
    allProducts.push(...data.products);

    // Link header: <url>; rel="next" formátumú
    // Ha van rel="next", folytatjuk a lapozást
    const linkHeader: string = res.headers.get("Link") || "";
    const nextMatch: RegExpMatchArray | null = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
    nextUrl = nextMatch ? nextMatch[1] : null;
  }

  console.log(
    `[Shopify Client] Fetched ${allProducts.length} products from ${shopDomain}`
  );

  // Field mapping: Shopify → train-bot formátum
  return allProducts.map(mapShopifyProduct);
}

/**
 * Egy Shopify termék mappelése a train-bot API formátumára.
 *
 * Mappelési táblázat (shopify.md szerint):
 *   title         → product_name
 *   body_html     → product_description (HTML strip-pelve)
 *   variants[0].price → price
 *   product_type  → category
 *   handle        → metadata.url (slug)
 */
function mapShopifyProduct(product: ShopifyProduct): MappedProduct {
  // Ár: az első variant árát vesszük (legtöbb egyszerű terméknél ez az alap ár)
  const priceStr = product.variants[0]?.price;
  const price = priceStr ? parseFloat(priceStr) : undefined;

  return {
    product_id:          handleToId(product.handle),
    product_name:        product.title,
    product_description: stripHtml(product.body_html) || product.title,
    category:            product.product_type || undefined,
    price:               !isNaN(price!) ? price : undefined,
    metadata: {
      url:            product.handle, // shop URL slug
      shopify_id:     product.id,
      updated_at:     product.updated_at,
    },
  };
}
