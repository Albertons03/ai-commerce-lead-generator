/**
 * =====================================================
 * POST /api/stripe/checkout
 * =====================================================
 * Létrehoz egy Stripe Checkout Session-t.
 *
 * Mit csinál?
 * 1. Ellenőrzi, hogy a felhasználó be van-e jelentkezve
 * 2. Lekéri az organizációt (és a már meglévő Stripe customer ID-t)
 * 3. Ha nincs még Stripe customer, létrehoz egyet
 * 4. Létrehoz egy Checkout Session-t a kért planre
 * 5. Visszaadja a Checkout URL-t
 *
 * A kliens a kapott URL-re navigál → Stripe fizetési oldal
 * Sikeres fizetés után: /[orgSlug]/settings/billing?success=true
 * Mégse: /[orgSlug]/settings/billing?canceled=true
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripeClient } from "@/lib/stripe/stripe-client";
import { getStripePriceId, PLANS, PlanName } from "@/lib/billing/plan-limits";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { orgSlug, plan } = await request.json();

    if (!orgSlug || !plan) {
      return NextResponse.json(
        { error: "orgSlug and plan are required" },
        { status: 400 }
      );
    }

    // Plan validáció
    if (!["starter", "growth", "pro"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Must be: starter, growth, or pro" },
        { status: 400 }
      );
    }

    // Price ID lekérése env-ből
    const priceId = getStripePriceId(plan as PlanName);
    if (!priceId || priceId.startsWith("price_placeholder")) {
      return NextResponse.json(
        { error: "Stripe Price ID not configured for this plan" },
        { status: 500 }
      );
    }

    // =====================================================
    // Bejelentkezett felhasználó lekérése Supabase-ből
    // =====================================================
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // =====================================================
    // Organizáció lekérése admin kliensssel
    // =====================================================
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: org, error: orgError } = await adminSupabase
      .from("organizations")
      .select("id, name, stripe_customer_id")
      .eq("slug", orgSlug)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const stripe = getStripeClient();
    let customerId = org.stripe_customer_id;

    // =====================================================
    // Stripe Customer létrehozása (ha még nincs)
    // =====================================================
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: org.name,
        metadata: {
          organization_id: org.id,
          org_slug: orgSlug,
        },
      });

      customerId = customer.id;

      // Mentés DB-be, hogy legközelebb ne hozzunk létre másikat
      await adminSupabase
        .from("organizations")
        .update({ stripe_customer_id: customerId })
        .eq("id", org.id);
    }

    // =====================================================
    // Checkout Session létrehozása
    // =====================================================
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",  // ismétlődő fizetés, nem egyszeri

      // Sikeres fizetés után ide irányít
      success_url: `${appUrl}/${orgSlug}/settings/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,

      // Ha a felhasználó visszalép
      cancel_url: `${appUrl}/${orgSlug}/settings/billing?canceled=true`,

      // Metadata: webhook-ban azonosítja a szervezetet
      metadata: {
        organization_id: org.id,
        org_slug: orgSlug,
        plan,
      },

      // Subscription metadata is kerüljön be
      subscription_data: {
        metadata: {
          organization_id: org.id,
          org_slug: orgSlug,
          plan,
        },
      },
    });

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error("[Stripe Checkout] Error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session", details: error.message },
      { status: 500 }
    );
  }
}
