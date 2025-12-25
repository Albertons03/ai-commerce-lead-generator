# Claude Code Rules - AI Social Media Scheduler

## Project Overview
This is a **Next.js + Supabase + OpenAI** application for scheduling posts across TikTok, LinkedIn, and Twitter with AI-powered content generation.

**Current Status**: MVP v1.0 - Core scheduling and AI generation working. Platform integrations (TikTok/LinkedIn/Twitter API) and auto-publishing not yet implemented.

---

## Architecture Guidelines for Agents

### Tech Stack (Non-Negotiable)
- **Framework**: Next.js 16 with App Router (Server Components first)
- **Language**: TypeScript strict mode required
- **Database**: Supabase PostgreSQL + Auth
- **Styling**: Tailwind CSS + shadcn/ui components only
- **Form Validation**: react-hook-form + Zod
- **AI**: OpenAI GPT-4 API

### Code Organization Rules

1. **Authentication & Authorization**
   - All API routes MUST verify user with `supabase.auth.getUser()`
   - Return 401 status if unauthorized
   - Database uses Row Level Security (RLS) as secondary enforcement
   - OAuth flow callbacks in `app/api/auth/callback/[provider]/`

2. **Database Operations**
   - Use typed functions from `lib/db/*.ts` (posts, social-accounts, ai-generations)
   - Always use server-side Supabase client: `createClient()` from `lib/supabase/server`
   - Never expose service role key to client-side
   - RLS policies are MANDATORY on all tables
   - Type all queries with TypeScript types from `lib/types/database.types.ts`

3. **API Routes**
   - Location: `app/api/**/*.ts`
   - Pattern: One file = one endpoint
   - Always wrap in try-catch, return proper error status codes
   - Validate input before DB operations
   - Return meaningful error messages (not stack traces)

4. **Components**
   - Use Server Components by default
   - `'use client'` only for: forms, hooks, interactivity, state management
   - UI components from `components/ui/` are shadcn/ui - do not modify
   - Feature components in `components/` use React hooks
   - All forms use react-hook-form + Zod validation

5. **Styling**
   - Tailwind CSS only (no inline styles, no CSS modules)
   - Use existing design system tokens (colors, spacing from tailwind.config.ts)
   - Mobile-first responsive design (use md:, lg: prefixes)
   - shadcn/ui for all UI patterns (buttons, forms, dialogs, etc)

---

## When Adding Features

### Before You Start
- [ ] Read CLAUDE.md for architecture overview
- [ ] Check existing patterns in similar files
- [ ] Verify feature doesn't break RLS or auth

### Platform-Specific Features
**For TikTok**:
- Fields: privacy_level (PUBLIC/FRIENDS/PRIVATE), allow_comments, allow_duet, allow_stitch
- API endpoint: TikTok Content Posting API
- Video format validation required

**For LinkedIn**:
- OAuth scope management important
- Post format: professional, longer content acceptable
- API endpoint: LinkedIn Share on Behalf of User

**For Twitter/X**:
- 280 character limit for text posts
- Media handling (images/videos)
- API v2 only (not v1.1)

### Database Schema Changes
- NEVER modify tables without Row Level Security policies
- Add indexes for frequently queried columns
- Use UUID for IDs, TIMESTAMP for created_at/updated_at
- Include user_id foreign key for all user-related tables

### API Integration Guidelines
- OpenAI: Already configured in `app/api/ai/generate/route.ts`
- Store API keys in .env.local only (never hardcode)
- Rate limit handling required for all external APIs
- Error responses should not expose API keys or sensitive data

---

## Code Quality Standards

### TypeScript
- Strict mode enabled - NO `any` types
- All function parameters and returns must be typed
- Use `as const` for literal types where appropriate
- Import types with `import type { ... }`

### Error Handling
- Try-catch all async operations
- Log errors with context (not just the error)
- Return appropriate HTTP status codes
- Never expose server details to client

### Performance
- Query optimization: use `.select('specific_columns')` not `select('*')`
- Index database queries on user_id, status, scheduled_for
- Lazy load components when possible
- Use date-fns for all date operations (no moment.js)

### Security
- Validate all user input (forms, API params, file uploads)
- Use Supabase RLS to enforce data isolation
- Never store secrets in code or git
- Sanitize error messages before returning to client
- HTTPS only in production

---

## What NOT To Do

❌ **Don't**:
- Add CSS modules or inline styles (use Tailwind)
- Use other UI component libraries (only shadcn/ui)
- Make breaking changes to database schema without migration
- Commit .env.local or secrets
- Use client-side database operations (use API routes)
- Hardcode environment variables
- Ignore TypeScript errors
- Add features beyond the current task
- Over-engineer solutions (KISS principle)

---

## When Modifying Existing Code

1. **Read the file first** - understand context and patterns
2. **Minimal changes** - only what's necessary for the task
3. **Preserve structure** - don't refactor unless asked
4. **Test locally** - verify no regressions
5. **Update types** - keep TypeScript happy
6. **Check RLS** - if touching database, verify RLS policies

---

## Working with Agents

### Which Agent to Use?
- **code-reviewer**: After implementing significant features
- **db-schema**: For database migrations or new tables
- **api-integrations**: For platform API work (TikTok, LinkedIn, Twitter)
- **bug-fixer**: When debugging issues
- Others: Use your best judgment based on task

### Agent Handoff Format
When delegating to an agent:
1. Provide full context (what needs to be done, why)
2. Link relevant files (CLAUDE.md, rules.md)
3. Include error messages or reproduction steps
4. Be specific about constraints (no breaking changes, etc)

---

## Documentation

- **CLAUDE.md**: Architecture & quick reference
- **README.md**: Project overview & setup
- **Inline comments**: Only for non-obvious logic
- **Commit messages**: Descriptive, reference what changed and why

---

## Current Limitations & Future Work

**Not Yet Implemented**:
- [ ] TikTok OAuth & video upload
- [ ] LinkedIn API publishing
- [ ] Twitter/X API posting
- [ ] Automatic scheduled post publishing (cron jobs)
- [ ] Real-time analytics sync from platforms
- [ ] Bulk post scheduling

**These are placeholders** - routes exist but lack API integration. When implementing:
1. Follow the existing pattern in other auth routes
2. Store tokens securely in social_accounts table
3. Use Supabase Edge Functions for scheduled publishing
4. Add error handling for API rate limits

---

## Questions?

Refer to CLAUDE.md for technical details, README.md for user-facing info, or check existing code patterns for conventions.
