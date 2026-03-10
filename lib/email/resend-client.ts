/**
 * Resend Email Client
 * ===================
 * Resend = modern email API szolgáltató (mint a Sendgrid, de fejlesztőbarátabb).
 * Dokumentáció: https://resend.com/docs
 *
 * Miért singleton pattern?
 * A Resend kliens példányt elég egyszer létrehozni az app élettartama alatt.
 * Singleton: csak egy példány létezik, minden importáló ugyanazt használja.
 */

import { Resend } from "resend";

// Lazy singleton: csak az első híváskor hozza létre a klienst
let _resend: Resend | null = null;

export function getResendClient(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error(
        "[Email] RESEND_API_KEY environment variable is not set. " +
        "Get your API key from https://resend.com/api-keys"
      );
    }

    _resend = new Resend(apiKey);
  }

  return _resend;
}

// Az email feladó cím - .env.local-ból jön, fallback ha nincs megadva.
// Resend sandbox módban csak "onboarding@resend.dev" engedélyezett.
// Production-ban saját domain kell (pl. noreply@yourdomain.com).
export const EMAIL_FROM =
  process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
