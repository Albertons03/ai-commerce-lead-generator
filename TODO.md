# AI Commerce Lead Generator - TODO Lista

## 0. Infrastruktúra Setup

### Supabase CLI telepítés
- [x] Supabase CLI telepítése (v2.75.0 - winget binary)
- [x] Bejelentkezés access tokennel
- [x] `supabase link` - projekt linkelve (ref: `igmqatakacybybpvesrx`)

### Vercel CLI telepítés
- [x] Vercel CLI telepítése (v50.28.0 - npm global)
- [x] Bejelentkezés access tokennel
- [x] `vercel link` - projekt linkelve (`ai-comerc-lead-generator`)

### Adatbázis migráció az új Supabase fiókba
- [x] Új Supabase projekt létrehozva (Central EU - Frankfurt)
- [x] Összes migráció szinkronban (9/9 Local = Remote)
- [x] **pgvector extension engedélyezése** (extensions schema)
- [x] leads, api_keys, product_embeddings, conversations, messages táblák létrehozva
- [x] `.env.local` frissítve az új credentials-szel
- [x] Vercel environment variables feltöltve (9 db)

---

## 1. Chatbot Embed Widget  ✅ KÉSZ

- [x] Standalone JS widget létrehozása (`/public/widget.js`)
- [x] Lebegő chat bubble UI megvalósítása
- [x] Chat ablak megnyitás/bezárás logika
- [x] Kommunikáció a `/api/chat` endpointtal
- [x] Conversation session kezelés (localStorage)
- [x] Org API key konfiguráció (`data-api-key` attribútum)
- [x] Alap téma szín testreszabás (`data-theme`)
- [x] Shadow DOM - CSS konfliktus elkerülve
- [x] Mobil reszponzív kialakítás

---

## 2. Embed Code Generator (Dashboard)  ✅ KÉSZ

- [x] Oldal már létezett: `/[orgSlug]/chatbot`
- [x] UI az embed script megjelenítéséhez (`EmbedCodeCard` komponens)
- [x] Másolás gomb a scripttag-hez
- [x] Org API key automatikus beillesztése a kódba

---

## 3. Lead Értesítés (Email)  ✅ KÉSZ

- [x] Email provider integráció (Resend - `npm install resend`)
- [x] Trigger: új lead létrehozásakor email küldés (lead-capture-service.ts)
- [x] Email tartalom: lead neve, email, phone, company, score, termékek, conversation summary
- [x] Küldés az organization owner emailjére
- [x] `lib/email/resend-client.ts` - singleton kliens
- [x] `lib/email/lead-notification.ts` - HTML sablon + küldő függvény

---

## 4. Termék Import UI  ✅ KÉSZ

- [x] CSV feltöltési oldal (`/[orgSlug]/settings/training`)
- [x] CSV mezők kezelése: `name`, `description`, `price`, `category`, `url`
- [x] Drag & drop + fájlválasztó
- [x] Böngészőoldali CSV parser (quoted mezők, hibakezelés)
- [x] Előnézeti táblázat (első 5 sor)
- [x] `/api/train-bot` hívás → embedding generálás
- [x] Eredmény megjelenítése (inserted/updated/failed statisztikák)

---

## 5. Onboarding Wizard (3 lépéses)  ✅ KÉSZ

- [x] Step 1: Organizáció létrehozása (inline form, auto slug generálás)
- [x] Step 2: Termékek feltöltése CSV-ből (opcionális, skipelhető)
- [x] Step 3: API key auto-generálás + embed kód másolás
- [x] StepIndicator komponens (progress bar)
- [x] Cél: 5 percen belül élő chatbot

---

## 6. Chat Analitika (Minimális)  ✅ KÉSZ

- [x] Statisztika blokkok a dashboardon
  - [x] Összes chat száma (Total Chats kártya - conversations tábla)
  - [x] Captured leads száma (Total Leads kártya)
  - [x] Konverziós ráta (Conversion Rate kártya)
  - [x] Átlag lead score (Avg Lead Score kártya)
- [x] Recent Leads szekció valódi adattal (initials avatar, score szín, timeAgo)
- [x] Meglévő adattáblák felhasználása (conversations + leads)

---

## 7. Chat Streaming  ✅ KÉSZ

- [x] `/api/chat` - SSE streaming ág (`stream: true` → `ReadableStream` + `text/event-stream`)
- [x] `buildRAGContext()` helper kiszervezve (streaming + non-streaming közös)
- [x] `public/widget.js` - `sendStreamingMessage()` SSE reader, progresszív bubble frissítés
- [x] Dashboard chatbot oldal - streaming state update (`setMessages` chunk-onként)
- [x] Üzenetek DB-be mentése a stream végén (assembled full response)

---

## 8. Shopify Product Import  ✅ KÉSZ

- [x] `supabase/migrations/20250311000000_create_shopify_tables.sql` - `shopify_connections` + `shopify_sync_logs` + RLS
- [x] `lib/shopify/shopify-client.ts` - Shopify Admin API, pagination, HTML strip, field mapping
- [x] `/api/shopify/install` - OAuth redirect (HMAC state, shop domain validáció)
- [x] `/api/shopify/callback` - HMAC ellenőrzés, token csere, DB mentés, redirect
- [x] `/api/shopify/sync` - termék fetch → embedding generálás → pgvector mentés → sync log
- [x] `/api/shopify/status` - kapcsolat + utolsó sync státusz lekérése
- [x] Training oldal UI - "Connect Shopify" + shop domain input + "Sync Products" gomb + last sync info

> **Szükséges env változók** (Shopify Partners Dashboard-ból):
> - `SHOPIFY_CLIENT_ID`
> - `SHOPIFY_CLIENT_SECRET`
> - `SHOPIFY_REDIRECT_URI` = `https://your-app.com/api/shopify/callback`
> - `NEXT_PUBLIC_APP_URL` = `https://your-app.com`

---

## 9. Stripe Billing  ✅ KÉSZ

> SaaS előfizetési rendszer három tervvel.

### Tervek
| Plan | Ár | Limit |
|------|-----|-------|
| Starter | $39/hó | 1 store, 500 chat/hó |
| Growth | $99/hó | 3 store, 3000 chat/hó |
| Pro | $249/hó | Unlimited |

### Adatbázis
- [x] `organizations` tábla kiegészítése: `stripe_customer_id`, `stripe_subscription_id`, `plan`, `plan_status`, `current_period_end`

### Stripe integráció
- [x] `lib/stripe/stripe-client.ts` - singleton kliens
- [x] `/api/stripe/checkout` - Checkout Session létrehozása (orgSlug alapján)
- [x] `/api/stripe/webhook` - esemény kezelés: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- [x] Subscription státusz szinkronizáció Supabase-be

### Feature gating
- [x] `lib/billing/plan-limits.ts` - plan limitek konstansai + `isChatLimitReached()`
- [ ] `/api/chat` - havi chat limit ellenőrzés (usage_metrics alapján) - Stripe Price ID-k kellenek előbb
- [ ] Shopify: store limit ellenőrzés plan szerint

### UI
- [x] `/[orgSlug]/settings/billing` oldal - jelenlegi plan, usage bar, pricing kártyák, renew dátum
- [ ] Pricing kártyák a landing oldalon (12. lépéssel együtt)

> **Stripe Price ID-k beállítása még szükséges:**
> 1. Stripe Dashboard → Products → Add product (Starter $39, Growth $99, Pro $249)
> 2. Minden termékhez Monthly price létrehozva
> 3. Price ID-k beillesztése `.env.local`-ba és Vercel env-be

---

## 10. Usage Tracking  ✅ KÉSZ

> Havi szintű metrikák szervezetenként - billing limitek és analitika alapja.

### Adatbázis
- [x] `usage_metrics` tábla migrációja: `organization_id`, `month` (YYYY-MM), `chats`, `tokens`, `leads`
- [x] `increment_usage_metrics` SQL függvény (atomi UPSERT)

### Tracking logika
- [x] `/api/chat` - minden sikeres válasz után `usage_metrics` upsert (`chats++`, `tokens += used`)
- [x] Lead capture - `leads++` incrementálás (streaming + non-streaming ágban)
- [x] `lib/billing/usage-service.ts` - upsert helper, `getCurrentMonthUsage()`, `getUsageMetrics()`

### Limit enforcement
- [ ] `/api/chat` elején: havi chat count lekérés, limit ellenőrzés (Stripe után érdemes bekötni)
- [ ] `429 Too Many Requests` visszaadása ha limit túllépve (plan upgrade üzenettel)

---

## 11. Production Hardening  ✅ KÉSZ

> Megbízhatóság és biztonság élesítés előtt.

- [x] **Rate limiting** - `/api/chat`: IP alapú, 20 req/perc, `Retry-After` header (`lib/utils/rate-limiter.ts` - már meglévő)
- [x] **API key validáció** - widget küldi az `api_key`-t, szerver validálja prefix + bcrypt.compare-rel (`lib/utils/validate-api-key.ts`)
- [x] **Graceful fallback** - OpenAI quota/500 hibákra barátságos 503 üzenet a chat route-ban
- [x] **Input sanitizálás** - HTML/script/event handler szűrés + prompt injection detektálás (`lib/utils/sanitize.ts`)
- [x] **OpenAI retry logika** - már megvolt exponential backoff-fal (`callOpenAIWithRetry` a chat-service-ben)
- [ ] **Error logging** - Sentry vagy Supabase log tábla (opcionális, console.error jelenleg elegendő)

---

## 12. Landing Page fejlesztés  ✅ KÉSZ

> Konverzió-optimalizált landing page a SaaS-hoz.

- [x] **Navbar** - sticky, blur backdrop, logo + nav links + CTA gomb
- [x] **Hero szekció** - dot grid háttér, animált gradient főcím, chat mockup preview, social proof
- [x] **Stats bar** - 2,400+ leads / 38% lift / 5 min setup / 24/7
- [x] **How it works** - 3 lépéses folyamat glassmorphism kártyákkal
- [x] **Features szekció** - 8 feature kártya, hover animációk
- [x] **Pricing szekció** - 3 terv kártya, /signup?plan=... linkekkel
- [x] **Final CTA szekció** - gradient háttér, glow gomb
- [x] **Footer** - egyszerű, konzekvens
- [x] CSS animációk: gradient-text, float, fade-up, hero-grid-bg, glassmorphism

---

## Fontos megszorítások

- Meglévő architektúra megtartása
- Moduláris kód
- Meglévő projekt struktúra követése
- Felesleges dependency kerülése
- Fókusz: production ready kód
- Minden új fájlhoz .md magyarázat készül (tanulás céljából)

---

## Referenciák

| Adat | Érték |
|------|-------|
| Supabase Project Ref | `igmqatakacybybpvesrx` |
| Supabase Dashboard | https://supabase.com/dashboard/project/igmqatakacybybpvesrx |
| Vercel Project | `ai-comerc-lead-generator` |
| GitHub repo | https://github.com/Albertons03/ai-commerce-lead-generator |
