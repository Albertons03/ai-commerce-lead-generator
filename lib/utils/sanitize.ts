/**
 * =====================================================
 * Input Sanitizálás
 * =====================================================
 * Szűri a felhasználói üzenetekből a potenciálisan
 * veszélyes tartalmakat (XSS, script injection).
 *
 * Miért kell ez?
 * - A widget publikusan elérhető (bárki küldhet üzenetet)
 * - Ha a szöveget HTML-ként jelenítjük meg, script tag-ek
 *   futhatnának a böngészőben (XSS = Cross-Site Scripting)
 * - A prompt injection ellen is véd (pl. "Ignore all previous instructions...")
 *   → ezt nem szűrjük, de logolandó
 *
 * Fontos: ez szerver oldali szűrés. A React kliens oldal
 * automatikusan escape-li a JSX-ben megjelenített stringeket,
 * de a tárolt/visszaküldött adatokat is tisztítani kell.
 * =====================================================
 */

/**
 * HTML special karakterek escape-lése.
 * Ez megakadályozza, hogy a szöveg HTML-ként értelmezze a böngésző.
 *
 * Pl.: <script>alert(1)</script>
 *   → &lt;script&gt;alert(1)&lt;/script&gt;
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Script és event handler attributumok eltávolítása.
 * Regex alapú szűrés - az egyszerű eseteket lefedi.
 */
function removeScriptContent(text: string): string {
  return text
    // <script ...>...</script> blokk eltávolítása (case insensitive)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // javascript: protokoll (href="javascript:...")
    .replace(/javascript\s*:/gi, "")
    // on* event handler attribútumok (onclick, onload, onerror stb.)
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "")
    // data: URI (base64 kódolt tartalom XSS vektorként)
    .replace(/data\s*:\s*[a-z]+\/[a-z]+\s*;/gi, "");
}

/**
 * Fő sanitizáló függvény - felhasználói chat üzenetekre alkalmazandó.
 *
 * Mit csinál:
 * 1. Trim (vezető/záró whitespace eltávolítása)
 * 2. Script tartalom eltávolítása
 * 3. HTML escape (biztonsági háló)
 * 4. Hossz vágás (ha a schema validáció valahogy átment volna)
 *
 * @param input - Nyers felhasználói üzenet
 * @param maxLength - Maximum megengedett hossz (default: 2000)
 * @returns Tisztított szöveg
 */
export function sanitizeUserMessage(
  input: string,
  maxLength: number = 2000
): string {
  if (!input || typeof input !== "string") return "";

  let sanitized = input.trim();

  // Script tartalmak eltávolítása
  sanitized = removeScriptContent(sanitized);

  // HTML escape (a maradék tag-ek és speciális karakterek)
  sanitized = escapeHtml(sanitized);

  // Hossz korlátozás
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

/**
 * Ellenőrzi, hogy az üzenet tartalmaz-e gyanús mintákat.
 * Prompt injection kísérleteket logolja (de nem blokkolja).
 *
 * @returns true ha gyanús tartalom van
 */
export function detectSuspiciousContent(message: string): boolean {
  const suspiciousPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /forget\s+(everything|all)/i,
    /you\s+are\s+now\s+(a|an)/i,
    /act\s+as\s+(a|an)/i,
    /new\s+persona/i,
    /system\s+prompt/i,
    /\[\[.*\]\]/,  // [[injection attempt]]
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(message));
}
