/**
 * =====================================================
 * Stripe Client - Singleton pattern
 * =====================================================
 * Csak szerver oldali kódban használható!
 * A secret key nem kerülhet a böngészőbe.
 *
 * Miért singleton?
 * Minden API híváshoz ne hozzunk létre új Stripe példányt.
 * A module-szintű változó Node.js-ben egyszer inicializálódik.
 * =====================================================
 */

import Stripe from "stripe";

// Lazy singleton - csak akkor jön létre, amikor először kell
let stripeInstance: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }

    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      // Mindig explicit API verziót adjunk meg, hogy ne törjön el frissítéskor
      apiVersion: "2026-02-25.clover",
      // TypeScript típusok pontosabb kezeléséhez
      typescript: true,
    });
  }

  return stripeInstance;
}

// Default export is available
export default getStripeClient;
