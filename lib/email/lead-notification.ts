/**
 * Lead Értesítő Email
 * ====================
 * Amikor az AI chatbot új lead-et kap, ez a modul emailt küld
 * az organization owner-ének.
 *
 * Tartalom:
 * - Lead neve, emailje, telefonszáma, cége
 * - Lead score és a kiváltó triggerek
 * - Termék érdeklődések
 * - Conversation összefoglaló
 * - Link a dashboardra
 */

import { createAdminSupabaseClient } from "@/lib/supabase/client";
import { getResendClient, EMAIL_FROM } from "./resend-client";

// =====================================================
// TÍPUSOK
// =====================================================

export interface LeadNotificationData {
  // Lead adatok
  lead_id: string;
  lead_name: string;
  lead_email: string;
  lead_phone?: string;
  lead_company?: string;
  lead_score: number;

  // Conversation kontextus
  conversation_summary?: string;
  product_interests: string[];
  trigger_type: string;  // pl. "contact_info", "purchase_intent"

  // Org adatok
  organization_id: string;
  organization_name: string;

  // App URL a dashboard linkhez
  app_url?: string;
}

// =====================================================
// ORG OWNER EMAIL LEKÉRÉSE
// =====================================================

/**
 * Lekéri az organization owner email címét.
 *
 * Miért admin kliens? Mert a users táblában az email cím
 * auth.users-ből jön, amit csak service role kulccsal lehet lekérni.
 * RLS nem engedné a normal kliensnek.
 */
async function getOrgOwnerEmail(
  organizationId: string
): Promise<string | null> {
  const supabase = createAdminSupabaseClient();

  // 1. lépés: owner user_id lekérése (embedded select helyett, mert több FK van)
  const { data: memberData, error: memberError } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("role", "owner")
    .limit(1)
    .single() as { data: { user_id: string } | null; error: any };

  if (memberError || !memberData) {
    console.error("[Email] Could not find org owner:", memberError?.message);
    return null;
  }

  // 2. lépés: email lekérése az auth.users-ből service role-lal
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
    memberData.user_id
  );

  if (userError || !userData?.user?.email) {
    console.error("[Email] Could not get user email:", userError?.message);
    return null;
  }

  return userData.user.email;
}

// =====================================================
// EMAIL HTML SABLON
// =====================================================

/**
 * Generálja az email HTML tartalmát.
 *
 * Vanilla HTML string - nem React Email (az egy külön csomag lenne).
 * Inline CSS-t használunk, mert az email kliensek (Gmail, Outlook)
 * nem mindig töltik be a <style> blokkokat.
 */
function buildEmailHtml(data: LeadNotificationData): string {
  const dashboardUrl = `${data.app_url ?? process.env.NEXT_PUBLIC_APP_URL ?? ""}/dashboard`;
  const leadUrl = `${data.app_url ?? process.env.NEXT_PUBLIC_APP_URL ?? ""}`;

  // Szín a lead score alapján: piros < 40, sárga < 70, zöld >= 70
  const scoreColor =
    data.lead_score >= 70 ? "#16a34a" :
    data.lead_score >= 40 ? "#d97706" :
    "#dc2626";

  // Trigger típus olvasható formában
  const triggerLabels: Record<string, string> = {
    contact_info:    "Contact info shared",
    purchase_intent: "Purchase intent",
    pricing_request: "Pricing request",
    business_inquiry: "Business inquiry",
    high_engagement: "High engagement",
  };
  const triggerLabel = triggerLabels[data.trigger_type] ?? data.trigger_type;

  // Termék érdeklődések felsorolása (max 5)
  const productList = data.product_interests.slice(0, 5)
    .map(p => `<li style="margin:4px 0;color:#374151;">${escapeHtml(p)}</li>`)
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Lead Captured</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,-apple-system,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <!-- FEJLÉC -->
          <tr>
            <td style="background:#6366f1;padding:24px 32px;">
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.75);text-transform:uppercase;letter-spacing:0.05em;">
                ${escapeHtml(data.organization_name)}
              </p>
              <h1 style="margin:6px 0 0;font-size:22px;color:#ffffff;font-weight:700;">
                New Lead Captured 🎯
              </h1>
            </td>
          </tr>

          <!-- TARTALOM -->
          <tr>
            <td style="padding:28px 32px;">

              <!-- Lead score badge -->
              <div style="margin-bottom:20px;">
                <span style="
                  display:inline-block;
                  background:${scoreColor}1a;
                  color:${scoreColor};
                  border:1px solid ${scoreColor}40;
                  border-radius:20px;
                  padding:4px 12px;
                  font-size:13px;
                  font-weight:600;
                ">
                  Lead Score: ${data.lead_score}/100 &nbsp;·&nbsp; ${escapeHtml(triggerLabel)}
                </span>
              </div>

              <!-- Lead adatok táblázat -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#f9fafb;border-radius:8px;overflow:hidden;margin-bottom:20px;">
                ${buildRow("Name",    data.lead_name)}
                ${buildRow("Email",   data.lead_email, `mailto:${data.lead_email}`)}
                ${data.lead_phone   ? buildRow("Phone",   data.lead_phone) : ""}
                ${data.lead_company ? buildRow("Company", data.lead_company) : ""}
              </table>

              <!-- Termék érdeklődések -->
              ${data.product_interests.length > 0 ? `
              <h3 style="margin:0 0 8px;font-size:14px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">
                Product Interests
              </h3>
              <ul style="margin:0 0 20px;padding-left:18px;">
                ${productList}
              </ul>
              ` : ""}

              <!-- Conversation összefoglaló -->
              ${data.conversation_summary ? `
              <h3 style="margin:0 0 8px;font-size:14px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">
                Conversation Summary
              </h3>
              <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.6;
                         background:#f9fafb;border-left:3px solid #6366f1;padding:10px 14px;border-radius:0 6px 6px 0;">
                ${escapeHtml(data.conversation_summary)}
              </p>
              ` : ""}

              <!-- CTA gomb -->
              <div style="text-align:center;margin-top:24px;">
                <a href="${escapeHtml(dashboardUrl)}"
                   style="
                     display:inline-block;
                     background:#6366f1;
                     color:#ffffff;
                     text-decoration:none;
                     padding:12px 28px;
                     border-radius:8px;
                     font-weight:600;
                     font-size:15px;
                   ">
                  View in Dashboard →
                </a>
              </div>

            </td>
          </tr>

          <!-- LÁBLÉC -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                This notification was sent by AI Commerce Lead Generator.
                <br>You're receiving this because you're the owner of
                <strong>${escapeHtml(data.organization_name)}</strong>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}

/** Egy sor az adattáblázatban */
function buildRow(label: string, value: string, href?: string): string {
  const content = href
    ? `<a href="${escapeHtml(href)}" style="color:#6366f1;">${escapeHtml(value)}</a>`
    : `<span style="color:#111827;">${escapeHtml(value)}</span>`;

  return `
    <tr>
      <td style="padding:10px 14px;font-size:13px;color:#6b7280;font-weight:500;width:100px;vertical-align:top;">
        ${escapeHtml(label)}
      </td>
      <td style="padding:10px 14px;font-size:14px;vertical-align:top;">
        ${content}
      </td>
    </tr>
  `;
}

/** XSS védelem az email HTML-ben is szükséges */
function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// =====================================================
// FŐ EXPORT: EMAIL KÜLDÉS
// =====================================================

/**
 * Lead értesítő emailt küld az organization owner-ének.
 *
 * @returns true ha sikeres, false ha hiba volt (nem dobja ki a hibát,
 *          hogy ne blokkolja a lead mentést)
 */
export async function sendLeadNotificationEmail(
  data: LeadNotificationData
): Promise<boolean> {
  try {
    // 1. Org owner email lekérése
    const ownerEmail = await getOrgOwnerEmail(data.organization_id);

    if (!ownerEmail) {
      console.warn("[Email] No owner email found for org:", data.organization_id);
      return false;
    }

    console.log("[Email] Sending lead notification to:", ownerEmail);

    // 2. Email küldése Resend-en keresztül
    const resend = getResendClient();
    const { data: result, error } = await resend.emails.send({
      from:    EMAIL_FROM,
      to:      ownerEmail,
      subject: `New Lead: ${data.lead_name} (Score: ${data.lead_score}/100) — ${data.organization_name}`,
      html:    buildEmailHtml(data),
    });

    if (error) {
      console.error("[Email] Resend API error:", error);
      return false;
    }

    console.log("[Email] Lead notification sent successfully. ID:", result?.id);
    return true;

  } catch (err) {
    // Catch-all: az email küldés soha nem akadályozhatja meg a lead mentést
    console.error("[Email] Unexpected error sending notification:", err);
    return false;
  }
}
