/**
 * =====================================================
 * Plan Limits - SaaS előfizetési csomagok
 * =====================================================
 * Egy helyen definiáljuk az összes plan korlátozást.
 * Ha változik az ár/limit, csak itt kell módosítani.
 * =====================================================
 */

export type PlanName = "free" | "starter" | "growth" | "pro";

export interface PlanLimits {
  name: PlanName;
  displayName: string;
  price: number;           // havi ár USD-ben
  chatsPerMonth: number;   // -1 = korlátlan
  storeLimit: number;      // max Shopify kapcsolat
  leadExport: boolean;     // lead export engedélyezett?
  emailNotifications: boolean;
  stripeEnvKey: string;    // melyik env var tartalmazza a Price ID-t
}

export const PLANS: Record<PlanName, PlanLimits> = {
  free: {
    name: "free",
    displayName: "Free",
    price: 0,
    chatsPerMonth: 100,
    storeLimit: 1,
    leadExport: false,
    emailNotifications: false,
    stripeEnvKey: "",
  },
  starter: {
    name: "starter",
    displayName: "Starter",
    price: 39,
    chatsPerMonth: 500,
    storeLimit: 1,
    leadExport: true,
    emailNotifications: true,
    stripeEnvKey: "STRIPE_PRICE_STARTER",
  },
  growth: {
    name: "growth",
    displayName: "Growth",
    price: 99,
    chatsPerMonth: 3000,
    storeLimit: 3,
    leadExport: true,
    emailNotifications: true,
    stripeEnvKey: "STRIPE_PRICE_GROWTH",
  },
  pro: {
    name: "pro",
    displayName: "Pro",
    price: 249,
    chatsPerMonth: -1,   // korlátlan
    storeLimit: -1,      // korlátlan
    leadExport: true,
    emailNotifications: true,
    stripeEnvKey: "STRIPE_PRICE_PRO",
  },
};

/**
 * Visszaadja a plan Price ID-ját az env-ből.
 * Ha nincs beállítva, null-t ad vissza.
 */
export function getStripePriceId(plan: PlanName): string | null {
  const envKey = PLANS[plan].stripeEnvKey;
  if (!envKey) return null;
  return process.env[envKey] || null;
}

/**
 * Ellenőrzi, hogy egy szervezet elérte-e a havi chat limitjét.
 *
 * @param plan - jelenlegi plan
 * @param currentChats - eddig felhasznált chatok száma ebben a hónapban
 * @returns true ha már nem küldhet több üzenetet
 */
export function isChatLimitReached(
  plan: PlanName,
  currentChats: number
): boolean {
  const limit = PLANS[plan].chatsPerMonth;
  if (limit === -1) return false; // pro: korlátlan
  return currentChats >= limit;
}
