# Quick Start Guide - AI Commerce Lead Generator

## Prerequisites

- Node.js 18+ installed
- Supabase account and project created
- Git (optional)

---

## Step 1: Environment Setup

1. **Copy environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Add your Supabase credentials to `.env.local`:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

   **Where to find these values:**
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy the values:
     - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
     - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2: Database Setup

Your Supabase database should already have migrations applied. If not:

1. **Using Supabase CLI (recommended):**
   ```bash
   cd supabase
   supabase db push
   ```

2. **Or manually via Supabase Dashboard:**
   - Go to SQL Editor
   - Run the migrations in `supabase/migrations/` in order

**Required Tables:**
- `users`
- `organizations`
- `organization_members`

---

## Step 3: Install Dependencies

If not already installed:
```bash
npm install
```

This installs:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Supabase client libraries
- Zod for validation
- Sonner for toasts
- Lucide React for icons
- and more...

---

## Step 4: Run Development Server

```bash
npm run dev
```

The application will be available at **http://localhost:3000**

---

## Step 5: Test the Application

### Create Your First Account

1. Navigate to http://localhost:3000
2. Click "Get Started Free" or go to `/signup`
3. Fill in the signup form:
   - Full Name: Your Name
   - Email: your@email.com
   - Password: At least 8 characters with uppercase, lowercase, and number
   - Confirm Password: Must match
   - Accept Terms: Check the box
4. Click "Create account"
5. You should be redirected to `/dashboard`

### Sign In

1. Go to `/login`
2. Enter your email and password
3. Click "Sign in"
4. You'll be redirected to `/dashboard`

### Create Your First Organization

1. After signing in, you'll see "Create Your First Organization"
2. Click "Create Organization" (note: full UI not yet implemented)
3. For now, you'll need to use the database directly or wait for the UI

---

## What Works Now

### ✅ Fully Functional:
- **Landing Page** (`/`)
- **User Signup** (`/signup`) - Complete with password strength indicator
- **User Login** (`/login`) - With remember me option
- **Authentication** - Protected routes via middleware
- **Session Management** - Automatic refresh
- **Dashboard Home** (`/dashboard`) - Organization selector
- **Organization Dashboard** (`/[orgSlug]`) - Basic stats view
- **Toast Notifications** - Success/error messages
- **Toast Debugger** - Development tool (bottom-left corner)
- **Dark Theme** - Professional dark UI

### 🚧 Partially Implemented:
- **Organization Selector** - Shows all your organizations, but creation UI pending
- **Dashboard Stats** - Placeholder data (0s)
- **Quick Actions** - Visible but not functional yet

### ⏳ Not Yet Implemented:
- **Sidebar Navigation** - Needs to be built
- **Top Navigation Bar** - With user menu and org switcher
- **Organization Creation Form** - UI pending
- **Settings Pages** - General and members
- **Member Management** - Invite, remove, change roles

---

## Development Tips

### Hot Reload
The dev server supports hot reload. Changes to:
- React components → instant refresh
- Server Actions → instant refresh
- CSS → instant refresh
- Middleware → requires server restart

### Toast Debugger
In development mode, you'll see a "Toast Debugger" panel in the bottom-left corner:
- Shows all toast notifications
- Displays timestamp and type
- Can be minimized or cleared
- Only visible in `NODE_ENV=development`

### Database Queries
All database operations go through:
- `lib/supabase/client.ts` - Client setup
- `lib/supabase/helpers.ts` - Reusable query functions
- `lib/actions/` - Server Actions for mutations

### Error Handling
- Form errors display inline (red border + error text)
- Toast notifications for async operations
- Console logs for debugging

---

## Common Issues & Solutions

### Issue: "Missing Supabase environment variables"
**Solution:** Make sure `.env.local` exists and has all required variables.

### Issue: Authentication not working
**Solutions:**
1. Check Supabase project is active
2. Verify environment variables are correct
3. Check browser console for errors
4. Ensure database has required tables

### Issue: "Organization not found" after login
**Solution:** Create an organization in Supabase dashboard manually or wait for UI implementation.

### Issue: Styles not loading correctly
**Solutions:**
1. Restart dev server: `Ctrl+C` then `npm run dev`
2. Clear `.next` folder: `rm -rf .next` (or delete manually)
3. Reinstall dependencies: `rm -rf node_modules && npm install`

### Issue: TypeScript errors
**Solution:** Run type check: `npm run type-check`

---

## Project Structure Overview

```
D:\ai-comerc-lead-generator\
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/                # Login page
│   │   └── signup/               # Signup page
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── [orgSlug]/            # Organization-specific pages
│   │   └── page.tsx              # Dashboard home (org selector)
│   ├── (public)/                 # Public routes
│   │   └── page.tsx              # Landing page
│   ├── api/                      # API routes
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── error.tsx                 # Error boundary
├── components/
│   ├── ui/                       # Reusable UI components
│   ├── auth/                     # Auth-specific components
│   ├── dashboard/                # Dashboard components (pending)
│   ├── providers/                # Context providers
│   └── toast-debugger.tsx        # Dev tool
├── lib/
│   ├── actions/                  # Server Actions
│   ├── supabase/                 # Supabase config & helpers
│   ├── validations/              # Zod schemas
│   └── utils.ts                  # Utility functions
├── middleware.ts                 # Route protection
└── tailwind.config.ts            # Tailwind configuration
```

---

## Available Scripts

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript types without building
```

---

## Next Development Steps

If you want to continue building:

1. **Create Sidebar Component** (`components/dashboard/sidebar.tsx`)
2. **Create TopNav Component** (`components/dashboard/top-nav.tsx`)
3. **Create Dashboard Layout** (`app/(dashboard)/[orgSlug]/layout.tsx`)
4. **Build Dropdown Menu UI** (`components/ui/dropdown-menu.tsx`)
5. **Implement Organization Creation Form**
6. **Build Settings Pages**

See `PHASE_1_IMPLEMENTATION_STATUS.md` for detailed remaining tasks.

---

## Resources

- **Design System:** `DESIGN_SYSTEM.md`
- **Component Specs:** `COMPONENT_SPECS.md`
- **User Flows:** `USER_FLOWS.md`
- **Implementation Status:** `PHASE_1_IMPLEMENTATION_STATUS.md`

### External Documentation:
- [Next.js 14 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zod Validation](https://zod.dev)

---

## Support

If you encounter issues:
1. Check console logs (browser and terminal)
2. Verify environment variables
3. Check Supabase dashboard for database errors
4. Review `PHASE_1_IMPLEMENTATION_STATUS.md`

---

## What's Next (Phase 2+)

Future phases will include:
- Lead management system
- AI chatbot integration
- Analytics dashboard
- Team collaboration features
- API integrations
- Advanced filtering and search
- Email notifications
- Billing integration

---

**Happy coding!** 🚀

For questions or issues, refer to the implementation documentation or check the console for detailed error messages.
