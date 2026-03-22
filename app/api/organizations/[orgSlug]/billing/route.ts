/**
 * =====================================================
 * GET /api/organizations/[orgSlug]/billing
 * =====================================================
 * Visszaadja az organizáció billing adatait és
 * az aktuális havi usage metrikákat.
 *
 * A billing oldal ezt hívja betöltéskor.
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getCurrentMonthUsage } from "@/lib/billing/usage-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params;

    // Bejelentkezett user ellenőrzés
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Organizáció billing mezők lekérése
    const { data: org, error } = await adminSupabase
      .from("organizations")
      .select("id, plan, plan_status, current_period_end, stripe_subscription_id")
      .eq("slug", orgSlug)
      .single();

    if (error || !org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Aktuális havi usage
    const usage = await getCurrentMonthUsage(org.id);

    return NextResponse.json({
      billing: {
        plan: org.plan || "free",
        plan_status: org.plan_status || "active",
        current_period_end: org.current_period_end,
        stripe_subscription_id: org.stripe_subscription_id,
      },
      usage: {
        chats: usage?.chats ?? 0,
        tokens: usage?.tokens ?? 0,
        leads: usage?.leads ?? 0,
      },
    });

  } catch (error: any) {
    console.error("[Billing API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
