# 🚀 Setup Guide - AI Commerce Lead Generator

## Phase 1 Implementation Complete! ✅

All core files have been created. Follow these steps to get the application running.

---

## 📋 Prerequisites

- [x] Node.js 18+ installed
- [x] Supabase cloud project created
- [x] npm or yarn package manager

---

## 🔧 Step 1: Environment Configuration

### 1.1 Get Supabase Credentials

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - **Project URL** (e.g., `https://abcdefghijklmnop.supabase.co`)
   - **Anon/Public Key** (the long JWT token under "Project API keys")
   - **(Optional) Service Role Key** - for admin operations

### 1.2 Create .env.local File

Create a `.env.local` file in the project root:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

---

## 🗄️ Step 2: Database Setup

### 2.1 Run Database Migration

Since you're using **Supabase Cloud**, run the migration via the Supabase Dashboard:

1. Go to your Supabase project
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the migration file: `supabase/migrations/20250101000000_initial_schema.sql`
5. **Copy the ENTIRE contents** of the file
6. **Paste into the SQL Editor**
7. Click **Run** (or press Ctrl+Enter)

### 2.2 Verify Tables Created

In the Supabase Dashboard:
1. Go to **Table Editor**
2. You should see these tables:
   - ✅ `users`
   - ✅ `organizations`
   - ✅ `organization_members`
3. Check that RLS (Row Level Security) is **enabled** on all tables

### 2.3 (Optional) Load Test Data

If you want test data for development:
1. Open `supabase/seed.sql`
2. Copy the contents
3. Run it in the **SQL Editor**
4. This creates 4 test users and 3 test organizations

**Test User Credentials** (after running seed):
- Owner: `owner@example.com` / `password123`
- Admin: `admin@example.com` / `password123`
- Member: `member@example.com` / `password123`

---

## 📦 Step 3: Install Dependencies

```bash
npm install
```

This will install all required packages:
- Next.js 14
- Supabase client
- Tailwind CSS
- shadcn/ui components
- Zod validation
- and more...

---

## 🎨 Step 4: Verify Design System

Check that the design files exist:
- ✅ `tailwind.config.ts` - Custom colors (cyan/teal theme)
- ✅ `DESIGN_SYSTEM.md` - Complete design specifications
- ✅ `COMPONENT_SPECS.md` - UI component library

---

## 🏃 Step 5: Run Development Server

```bash
npm run dev
```

The app will start at: **http://localhost:3000**

---

## 🧪 Step 6: Test the Application

### 6.1 Authentication Flow

1. Go to http://localhost:3000
2. Click **Sign Up**
3. Create a test account:
   - Name: Your Name
   - Email: test@example.com
   - Password: password123
4. After signup, you'll be redirected to create an organization

### 6.2 Create Organization

1. Enter organization name (e.g., "My Company")
2. Slug will auto-generate (e.g., "my-company")
3. Click **Create Organization**
4. You'll be redirected to `/my-company` dashboard

### 6.3 Test Dashboard Navigation

- ✅ Sidebar shows: Dashboard, Leads (Phase 2), Chatbot (Phase 3), Settings
- ✅ Click **Settings** → General tab
- ✅ Edit organization name/slug
- ✅ Click **Settings** → Members tab
- ✅ View members list (should show you as Owner)
- ✅ Top nav shows breadcrumbs
- ✅ Organization switcher (top right)
- ✅ User menu (top right) - can sign out

### 6.4 Test Mobile Responsive

- ✅ Resize browser to mobile width
- ✅ Hamburger menu appears (top left)
- ✅ Sidebar becomes slide-out drawer
- ✅ All components are responsive

### 6.5 Test Toast Debugger

- ✅ Bottom-left corner shows "Toast Debugger" in development mode
- ✅ Perform actions (save settings, etc.) and see toasts appear
- ✅ Debugger logs all toast events

---

## 🔒 Step 7: Verify Security (RLS Policies)

### Test Row-Level Security:

1. **Create 2 organizations** with the same user
2. **Sign up a second user** in incognito mode
3. Have second user create their own organization
4. Verify:
   - ✅ User 1 can only see their own organizations
   - ✅ User 2 can only see their own organizations
   - ✅ Users cannot access each other's data

### Test SQL Query (in Supabase SQL Editor):

```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Should show rowsecurity = true for users, organizations, organization_members
```

---

## 📁 Project Structure Overview

```
ai-comerc-lead-generator/
├── app/
│   ├── (auth)/              # Login, Signup pages
│   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── [orgSlug]/       # Organization-scoped routes
│   │   │   ├── settings/    # Settings pages (general, members, training)
│   │   │   └── page.tsx     # Org dashboard home
│   │   └── page.tsx         # Org selector
│   ├── (public)/            # Landing page
│   └── layout.tsx           # Root layout
│
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── auth/                # Auth forms
│   ├── dashboard/           # Sidebar, TopNav, etc.
│   └── providers/           # Context providers
│
├── lib/
│   ├── supabase/            # Supabase clients, helpers, types
│   ├── actions/             # Server Actions
│   └── validations/         # Zod schemas
│
├── supabase/
│   ├── migrations/          # Database migrations
│   └── seed.sql             # Test data
│
├── DESIGN_SYSTEM.md         # UI/UX specifications
├── COMPONENT_SPECS.md       # Component library
└── tailwind.config.ts       # Tailwind theme
```

---

## 🎯 What's Implemented (Phase 1 - 100%)

### ✅ Core Infrastructure
- [x] Next.js 14 with App Router
- [x] TypeScript configuration
- [x] Tailwind CSS with custom theme (cyan/teal)
- [x] Middleware for auth & route protection

### ✅ Authentication System
- [x] Login page with email/password
- [x] Signup page with password strength indicator
- [x] Session management (Supabase Auth)
- [x] Protected routes
- [x] Sign out functionality

### ✅ Multi-Tenant Architecture
- [x] Organization entity
- [x] User-Organization relationships
- [x] Role-based access (Owner, Admin, Member)
- [x] Organization switcher
- [x] Create organization flow

### ✅ Dashboard
- [x] Sidebar navigation (collapsible)
- [x] Top navigation with breadcrumbs
- [x] Organization selector page
- [x] Mobile responsive design

### ✅ Settings Pages
- [x] General settings (edit org name/slug)
- [x] Members management (view members)
- [x] Training placeholder (Phase 4)

### ✅ UI Components (shadcn/ui)
- [x] Button (6 variants)
- [x] Input with validation states
- [x] Card components
- [x] Dialog/Modal
- [x] Dropdown menu
- [x] Avatar
- [x] Toast notifications
- [x] Toast debugger (development only)

### ✅ Security
- [x] Row-Level Security (RLS) policies
- [x] Organization-scoped data access
- [x] Role-based permissions
- [x] SQL injection protection (parameterized queries)

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to Supabase"
**Solution:**
1. Check `.env.local` has correct credentials
2. Verify Supabase project is active
3. Check network connection

### Issue: "Migration failed"
**Solution:**
1. Check SQL syntax in migration file
2. Ensure you copied the ENTIRE file
3. Check Supabase logs for specific error

### Issue: "RLS policy error"
**Solution:**
1. Verify RLS is enabled on all tables
2. Re-run the migration
3. Check user has proper session

### Issue: "Toast debugger not showing"
**Solution:**
1. Check `NODE_ENV=development` in `.env.local`
2. Clear browser cache
3. Hard refresh (Ctrl+Shift+R)

### Issue: "Cannot create organization"
**Solution:**
1. Check database function `create_organization_with_owner` exists
2. Verify user is authenticated
3. Check browser console for errors

---

## 🚀 Next Steps

After Phase 1 is working:

### Phase 2: Lead System (Coming Soon)
- Lead entity and CRUD operations
- Lead dashboard with filters
- Lead detail view
- CSV export

### Phase 3: AI Chatbot (Coming Soon)
- Public chat endpoint
- OpenAI integration
- Conversation storage
- Lead capture from chat

### Phase 4: Training & Context (Coming Soon)
- Document upload
- Embeddings generation (pgvector)
- RAG system
- Similarity search

---

## 📞 Need Help?

- Check the documentation in `supabase/README.md`
- Review `RLS_TESTING_CHECKLIST.md` for security testing
- See `COMPONENT_SPECS.md` for UI component usage
- Read `DESIGN_SYSTEM.md` for styling guidelines

---

## 🎉 Success Criteria

Your Phase 1 implementation is complete when:

- ✅ You can sign up and log in
- ✅ You can create an organization
- ✅ Dashboard loads with sidebar and navigation
- ✅ You can switch between organizations
- ✅ Settings pages work (general and members)
- ✅ Mobile responsive works
- ✅ Toast debugger shows notifications
- ✅ RLS policies prevent unauthorized access

**Congratulations! You're ready for Phase 2!** 🎊
