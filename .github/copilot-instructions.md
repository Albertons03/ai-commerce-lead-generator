# Copilot Instructions for AI Commerce Lead Generator

## Project Architecture

- **Framework:** Next.js 14+ (App Router, Server Components by default)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui (no CSS modules or inline styles)
- **Database:** Supabase (PostgreSQL + Auth, RLS enforced)
- **AI:** OpenAI API (see `lib/ai/` for integration)
- **Validation:** react-hook-form + Zod

## Key Directories & Patterns

- `app/` — Route handlers, layouts, and pages (App Router conventions)
  - `app/api/` — API endpoints (one file = one endpoint, RESTful, input validation required)
  - `app/(auth)/`, `app/(dashboard)/` — Auth and dashboard flows
- `components/` — UI components
  - `components/ui/` — shadcn/ui primitives (do not modify)
  - `components/auth/`, `components/dashboard/` — Feature components (use React hooks, server components by default)
- `lib/` — Utilities, server actions, Supabase helpers, AI logic
  - `lib/ai/` — OpenAI, embeddings, RAG, lead scoring
  - `lib/validations/` — Zod schemas
- `middleware.ts` — Route protection (auth)
- `tailwind.config.ts` — Design tokens, breakpoints

## Conventions & Rules

- **Server Components by default**; use `'use client'` only for interactivity/state
- **All forms:** Use react-hook-form + Zod
- **API routes:**
  - Always validate input before DB ops
  - Use Supabase server client (`lib/supabase/server`)
  - Enforce RLS, never expose service role key to client
  - Wrap handlers in try/catch, return proper status codes
- **Database:**
  - All schema changes require migrations (see `supabase/migrations/`)
  - RLS policies are mandatory
  - Type queries with `lib/types/`
- **Styling:**
  - Tailwind only, mobile-first, use design tokens
  - No other UI libraries
- **Testing:**
  - See `test-phase2.js`, `test-migration.js`, and `/supabase/tests/`
- **Documentation:**
  - For design, see `README_DESIGN.md`, `COMPONENT_SPECS.md`, `USER_FLOWS.md`, `WIREFRAMES.md`, `IMPLEMENTATION_GUIDE.md`

## Developer Workflows

- **Setup:** See `SETUP_GUIDE.md` and `QUICK_START.md`
- **Run dev server:** `npm run dev`
- **Apply migrations:** Use scripts in root or `/supabase/migrations/`
- **Testing:** Run test scripts or SQL in `/supabase/tests/`
- **Debugging:** Use `toast-debugger.tsx` and test pages in `app/`

## Integration Points

- **AI:** All AI logic in `lib/ai/` (OpenAI, embeddings, RAG)
- **Supabase:** Auth, DB, and storage via `lib/supabase/`
- **Public API:** See `app/api/public/` and `PUBLIC_API_IMPLEMENTATION_SUMMARY.md`

## Additional Guidance

- **Do not:**
  - Add CSS modules or inline styles
  - Use other UI libraries
  - Make breaking DB changes without migration
  - Expose secrets or service keys
  - Over-engineer or add features beyond current scope
- **When in doubt:**
  - Reference the implementation guides and specs
  - Ask for confirmation before major changes

---

For more, see the docs in `/docs/` and the design system files listed above.
