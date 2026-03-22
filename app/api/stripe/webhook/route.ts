/**
 * =====================================================
 * POST /api/stripe/webhook
 * =====================================================
 * Stripe webhook esemény kezelő.
 *
 * Mit csinál?
 * Fogadja a Stripe-tól érkező eseményeket és szinkronizálja
 * az előfizetés állapotát a Supabase-be.
 *
 * Fontos biztonsági lépés: HMAC Signature ellenőrzés
 * - Stripe minden kérést aláír a STRIPE_WEBHOOK_SECRET-tel
 * - Ha az aláírás nem egyezik → 400-as hiba
 * - Ez megakadályozza, hogy valaki hamis webhook-ot küldjön
 *
 * Kezelt események:
 * - checkout.session.completed → fizetés sikeres, plan aktiválás
 * - customer.subscription.updated → plan változás / megújítás
 * - customer.subscription.deleted → lemondás
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripeClient } from "@/lib/stripe/stripe-client";
import Stripe from "stripe";

// FONTOS: Next.js alapból JSON-ként parse-olja a body-t.
// Stripe-nak a RAW (nyers) body kell az aláírás ellenőrzéshez!
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // Raw body olvasása (nem JSON.parse!)
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || webhookSecret === "whsec_placeholder_run_stripe_listen") {
    console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  // =====================================================
  // Stripe aláírás ellenőrzés
  // =====================================================
  const stripe = getStripeClient();
  let event: Stripe.Event;

  try {
    // Ez dob hibát, ha az aláírás nem egyezik
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("[Stripe Webhook] Invalid signature:", err.message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  // Admin Supabase kliens (RLS bypass)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log("[Stripe Webhook] Event received:", event.type);

  try {
    switch (event.type) {
      // =====================================================
      // Sikeres checkout → plan aktiválás
      // =====================================================
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Csak subscription típusú checkout-ot kezelünk
        if (session.mode !== "subscription") break;

        const organizationId = session.metadata?.organization_id;
        const plan = session.metadata?.plan;
        const subscriptionId = session.subscription as string;

        if (!organizationId || !plan) {
          console.error("[Stripe Webhook] Missing metadata in session:", session.id);
          break;
        }

        // Subscription részletek lekérése (aktuális_period_end-hez)
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Az új Stripe API-ban (clover) a current_period_end az első SubscriptionItem-en van
        const periodEnd = subscription.items?.data?.[0]?.current_period_end;

        await supabase
          .from("organizations")
          .update({
            stripe_subscription_id: subscriptionId,
            plan,
            plan_status: subscription.status,
            current_period_end: periodEnd
              ? new Date(periodEnd * 1000).toISOString()
              : null,
          })
          .eq("id", organizationId);

        console.log("[Stripe Webhook] Plan activated:", { organizationId, plan });
        break;
      }

      // =====================================================
      // Subscription frissítés (megújítás, upgrade, downgrade)
      // =====================================================
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        // Plan neve a subscription metadata-ból vagy az items-ből
        const plan = subscription.metadata?.plan;
        const organizationId = subscription.metadata?.organization_id;

        if (!organizationId) {
          // Fallback: customer ID alapján keresünk
          const customerId = subscription.customer as string;
          const periodEnd = subscription.items?.data?.[0]?.current_period_end;
          await supabase
            .from("organizations")
            .update({
              stripe_subscription_id: subscription.id,
              plan_status: subscription.status,
              current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
              ...(plan ? { plan } : {}),
            })
            .eq("stripe_customer_id", customerId);
        } else {
          const periodEnd = subscription.items?.data?.[0]?.current_period_end;
          await supabase
            .from("organizations")
            .update({
              plan_status: subscription.status,
              current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
              ...(plan ? { plan } : {}),
            })
            .eq("id", organizationId);
        }

        console.log("[Stripe Webhook] Subscription updated:", subscription.id, subscription.status);
        break;
      }

      // =====================================================
      // Subscription törlés (lemondás)
      // =====================================================
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabase
          .from("organizations")
          .update({
            plan: "free",
            plan_status: "canceled",
            stripe_subscription_id: null,
            current_period_end: null,
          })
          .eq("stripe_customer_id", customerId);

        console.log("[Stripe Webhook] Subscription canceled for customer:", customerId);
        break;
      }

      default:
        // Nem kezelt esemény - ez normális, csak logoljuk
        console.log("[Stripe Webhook] Unhandled event type:", event.type);
    }

    // Mindig 200-at adunk vissza, különben Stripe újra próbálkozik
    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error("[Stripe Webhook] Handler error:", error);
    // 500 esetén Stripe újra próbálkozik → ez is jó fallback
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
