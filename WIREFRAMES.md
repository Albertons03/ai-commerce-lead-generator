# Wireframes & Screen Layouts

## Table of Contents
1. [Authentication Screens](#authentication-screens)
2. [Dashboard Screens](#dashboard-screens)
3. [Lead Management Screens](#lead-management-screens)
4. [Organization Management Screens](#organization-management-screens)
5. [Chatbot Screens](#chatbot-screens)

---

## Authentication Screens

### 1. Login Page

```
┌─────────────────────────────────────────────────────────────────────┐
│                     [Background: Dark gradient]                      │
│                    [Cyan to Purple overlay]                          │
│                                                                       │
│                                                                       │
│          ┌───────────────────────────────────────┐                   │
│          │  ┌──┐                                 │                   │
│          │  │AI│ AI Commerce                     │                   │
│          │  └──┘                                 │                   │
│          │                                       │                   │
│          │         Welcome Back                  │   [Card]          │
│          │    Sign in to your account            │   bg-secondary    │
│          │                                       │   rounded-2xl     │
│          │  ─────────────────────────────────    │   shadow-2xl      │
│          │                                       │   max-w-md        │
│          │  Email address                        │   p-8             │
│          │  ┌─────────────────────────────────┐  │                   │
│          │  │ you@example.com                 │  │                   │
│          │  └─────────────────────────────────┘  │                   │
│          │                                       │                   │
│          │  Password                             │                   │
│          │  ┌─────────────────────────────────┐  │                   │
│          │  │ ••••••••••              [👁]    │  │                   │
│          │  └─────────────────────────────────┘  │                   │
│          │                                       │                   │
│          │  [✓] Remember me  [Forgot password?] │                   │
│          │                                       │                   │
│          │  ┌─────────────────────────────────┐  │                   │
│          │  │        Sign in                  │  │ [Primary Button]  │
│          │  └─────────────────────────────────┘  │                   │
│          │                                       │                   │
│          │  ───────────── OR ──────────────      │                   │
│          │                                       │                   │
│          │  ┌─────────────────────────────────┐  │                   │
│          │  │  [G] Continue with Google       │  │                   │
│          │  └─────────────────────────────────┘  │                   │
│          │  ┌─────────────────────────────────┐  │                   │
│          │  │  [M] Continue with Microsoft    │  │                   │
│          │  └─────────────────────────────────┘  │                   │
│          │                                       │                   │
│          │  Don't have an account? [Sign up]    │                   │
│          └───────────────────────────────────────┘                   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

**Layout Specifications:**
- Container: Centered vertically and horizontally
- Card width: `max-w-md` (448px)
- Card background: `bg-bg-secondary/95` with backdrop blur
- Card padding: `p-8` (32px)
- Spacing between elements: `space-y-6` (24px)
- Input height: `py-3` (48px including padding)
- Button height: `py-3` (48px including padding)

**Responsive Behavior:**
- Mobile (< 640px): Card becomes full width with `mx-4`, padding reduces to `p-6`
- Tablet/Desktop: Maintains max-w-md centered

---

### 2. Sign Up Page

```
┌─────────────────────────────────────────────────────────────────────┐
│                     [Background: Dark gradient]                      │
│                                                                       │
│          ┌───────────────────────────────────────┐                   │
│          │  ┌──┐                                 │                   │
│          │  │AI│ AI Commerce                     │                   │
│          │  └──┘                                 │                   │
│          │                                       │                   │
│          │      Create your account              │   [Card]          │
│          │   Start generating leads today        │   Scrollable      │
│          │                                       │   if content      │
│          │  ─────────────────────────────────    │   exceeds height  │
│          │                                       │                   │
│          │  Full name                            │                   │
│          │  ┌─────────────────────────────────┐  │                   │
│          │  │ John Doe                        │  │                   │
│          │  └─────────────────────────────────┘  │                   │
│          │                                       │                   │
│          │  Email address                        │                   │
│          │  ┌─────────────────────────────────┐  │                   │
│          │  │ you@example.com                 │  │                   │
│          │  └─────────────────────────────────┘  │                   │
│          │                                       │                   │
│          │  Organization name                    │                   │
│          │  ┌─────────────────────────────────┐  │                   │
│          │  │ Acme Inc.                       │  │                   │
│          │  └─────────────────────────────────┘  │                   │
│          │                                       │                   │
│          │  Password                             │                   │
│          │  ┌─────────────────────────────────┐  │                   │
│          │  │ ••••••••••              [👁]    │  │                   │
│          │  └─────────────────────────────────┘  │                   │
│          │  [████░░░░] Strong password           │  [Strength Bar]   │
│          │                                       │                   │
│          │  Confirm password                     │                   │
│          │  ┌─────────────────────────────────┐  │                   │
│          │  │ ••••••••••              [👁]    │  │                   │
│          │  └─────────────────────────────────┘  │                   │
│          │                                       │                   │
│          │  [✓] I agree to Terms & Privacy      │                   │
│          │                                       │                   │
│          │  ┌─────────────────────────────────┐  │                   │
│          │  │     Create Account              │  │ [Accent Button]   │
│          │  └─────────────────────────────────┘  │ (Yellow)          │
│          │                                       │                   │
│          │  ───────────── OR ──────────────      │                   │
│          │                                       │                   │
│          │  [Social auth buttons...]             │                   │
│          │                                       │                   │
│          │  Already have an account? [Sign in]  │                   │
│          └───────────────────────────────────────┘                   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

**Additional Features:**
- Password strength indicator: 4-segment bar showing weak/fair/strong/very strong
- Real-time validation indicators (check/error icons)
- Inline error messages below fields

---

## Dashboard Screens

### 1. Dashboard Overview (Sidebar Expanded)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ ┌──────────────┐┌────────────────────────────────────────────────────────────┐ │
│ │              ││ Top Navigation Bar                               [🔍] [🔔] │ │
│ │  ┌──┐        ││                                                             │ │
│ │  │AI│ AI Comm││                                                    [Avatar]│ │
│ │  └──┘        ││                                                             │ │
│ │              │├─────────────────────────────────────────────────────────────┤ │
│ │ ┌──────────┐ ││ Dashboard > Overview                                       │ │
│ │ │[AC]Acme  │ │├─────────────────────────────────────────────────────────────┤ │
│ │ │3 members │ ││                                                             │ │
│ │ │    [v]   │ ││  ┌────────────────────────────────────────────────┐         │ │
│ │ └──────────┘ ││  │              Welcome back, John!               │         │ │
│ │              ││  │        Here's what's happening today           │         │ │
│ │ ──────────── ││  └────────────────────────────────────────────────┘         │ │
│ │              ││                                                             │ │
│ │ [≡] Dashboard││  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │ │
│ │ [●] Leads    ││  │  [👥]   │ │  [💬]   │ │  [✓]    │ │  [📈]   │          │ │
│ │ [○] Chatbot  ││  │         │ │         │ │         │ │         │          │ │
│ │ [○] Settings ││  │ Total   │ │ Active  │ │ Conv.   │ │ Growth  │          │ │
│ │              ││  │ Leads   │ │ Chats   │ │ Rate    │ │ Rate    │          │ │
│ │ ──────────── ││  │  1,234  │ │    12   │ │   32%   │ │  +12%   │          │ │
│ │ Organization ││  │ +12%    │ │  +2 now │ │  ↑ 5%  │ │  ↑ 3%  │          │ │
│ │              ││  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │ │
│ │ [👥] Team    ││                                                             │ │
│ │ [💳] Billing ││  ─────────────────────────────────────────────              │ │
│ │              ││                                                             │ │
│ │              ││  Recent Leads                        [View All →]          │ │
│ │              ││                                                             │ │
│ │              ││  ┌──────────────────────────────────────────────┐           │ │
│ │              ││  │ [Avatar] John Smith                    2m ago│           │ │
│ │ ──────────── ││  │ john@example.com                             │           │ │
│ │              ││  │ Interested in Product X        [New] [High]  │           │ │
│ │ [Avatar]     ││  └──────────────────────────────────────────────┘           │ │
│ │ John Doe     ││  ┌──────────────────────────────────────────────┐           │ │
│ │ john@acme.com││  │ [Avatar] Jane Doe                     15m ago│           │ │
│ │    [⋮]       ││  │ jane@company.com                             │           │ │
│ │              ││  │ Asked about pricing          [Active] [Med]  │           │ │
│ └──────────────┘│  └──────────────────────────────────────────────┘           │ │
│  280px width    │                                                             │ │
│                 │  ┌──────────────────────────────────────────────┐           │ │
│                 │  │ [Avatar] Sarah Johnson                 1h ago│           │ │
│                 │  │ sarah@startup.io                             │           │ │
│                 │  │ Chatbot conversation           [New] [Low]   │           │ │
│                 │  └──────────────────────────────────────────────┘           │ │
│                 │                                                             │ │
│                 │  ─────────────────────────────────────────────              │ │
│                 │                                                             │ │
│                 │  Activity Feed                           [Filter ▾]         │ │
│                 │                                                             │ │
│                 │  ○ New lead created: John Smith           2 minutes ago     │ │
│                 │  ○ Chatbot conversation ended            15 minutes ago     │ │
│                 │  ○ Lead status changed: Jane → Qualified  1 hour ago       │ │
│                 │  ○ Team member invited: alex@acme.com     2 hours ago      │ │
│                 │                                                             │ │
│                 └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────┘
```

**Layout Specifications:**
- Sidebar width: `280px` (expanded)
- Top nav height: `64px`
- Breadcrumb height: `48px`
- Main content: `ml-[280px] mt-16 px-6 py-8`
- Stat cards: Grid with `grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`
- Card dimensions: Flexible height, `p-6` padding

**Key Elements:**
- Stat cards with icon, label, value, and trend
- Recent leads list (3-5 items visible)
- Activity feed (chronological)
- Quick actions/shortcuts

---

### 2. Dashboard Overview (Sidebar Collapsed)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ ┌─┐┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ ││ Top Navigation Bar                                        [🔍] [🔔] [Av] │ │
│ │≡││                                                                           │ │
│ │ │├───────────────────────────────────────────────────────────────────────────┤ │
│ │A│Dashboard > Overview                                                       │ │
│ │C│├───────────────────────────────────────────────────────────────────────────┤ │
│ │ ││                                                                           │ │
│ ├─┤│  Welcome back, John!                                                     │ │
│ │ ││                                                                           │ │
│ │≡││  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                    │ │
│ │●││  │   [👥]   │ │   [💬]   │ │   [✓]    │ │   [📈]   │                    │ │
│ │○││  │  Total   │ │  Active  │ │   Conv.  │ │  Growth  │                    │ │
│ │○││  │  Leads   │ │  Chats   │ │   Rate   │ │   Rate   │                    │ │
│ │ ││  │   1,234  │ │    12    │ │    32%   │ │   +12%   │                    │ │
│ ├─┤│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                    │ │
│ │ ││                                                                           │ │
│ │👥││  Recent Leads                                         [View All →]      │ │
│ │💳││                                                                           │ │
│ │ ││  [Lead cards as shown above...]                                          │ │
│ │ ││                                                                           │ │
│ ├─┤│  Activity Feed                                                           │ │
│ │ ││                                                                           │ │
│ │A││  [Activity items...]                                                     │ │
│ │J││                                                                           │ │
│ │ ││                                                                           │ │
│ └─┘└───────────────────────────────────────────────────────────────────────────┘ │
│ 72px                                                                             │
└────────────────────────────────────────────────────────────────────────────────┘
```

**Layout Specifications:**
- Collapsed sidebar width: `72px`
- Icons only, centered
- Tooltips on hover
- Main content: `ml-[72px]` (208px more horizontal space)

---

### 3. Leads List Page

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar] │ Top Nav                                                            │
│           ├────────────────────────────────────────────────────────────────────┤
│           │ Dashboard > Leads                                                  │
│           ├────────────────────────────────────────────────────────────────────┤
│           │                                                                    │
│           │ ┌────────────────────────────────────────────────────────────────┐ │
│           │ │ Leads                                    [+ Create Lead]        │ │
│           │ └────────────────────────────────────────────────────────────────┘ │
│           │                                                                    │
│           │ ┌──────────────┐  ┌──────────────────────────────────────────┐    │
│           │ │ [Filters]    │  │ [🔍] Search leads...                     │    │
│           │ │              │  └──────────────────────────────────────────┘    │
│           │ │ Status       │                                                  │
│           │ │ [✓] New (12) │  ┌─────────────────────────────────────────────┐ │
│           │ │ [✓] Active   │  │ ☐ Name         Email        Status   Date   │ │
│           │ │ [ ] Closed   │  ├─────────────────────────────────────────────┤ │
│           │ │              │  │ ☐ [A] John Smith                           │ │
│           │ │ Priority     │  │    john@example.com   [New] [High]  2m ago │ │
│           │ │ [✓] High     │  ├─────────────────────────────────────────────┤ │
│           │ │ [✓] Medium   │  │ ☐ [J] Jane Doe                             │ │
│           │ │ [✓] Low      │  │    jane@company.com [Active] [Med] 15m ago │ │
│           │ │              │  ├─────────────────────────────────────────────┤ │
│           │ │ Source       │  │ ☐ [S] Sarah Johnson                        │ │
│           │ │ [ ] Chatbot  │  │    sarah@startup.io   [New] [Low]  1h ago  │ │
│           │ │ [ ] Manual   │  ├─────────────────────────────────────────────┤ │
│           │ │ [ ] Import   │  │ ☐ [M] Mike Chen                            │ │
│           │ │              │  │    mike@tech.io    [Active] [High]  2h ago │ │
│           │ │ Date Range   │  ├─────────────────────────────────────────────┤ │
│           │ │ [Date picker]│  │ ☐ [E] Emma Wilson                          │ │
│           │ │              │  │    emma@corp.com   [Qualified] [Med] 3h ago│ │
│           │ │ [Clear All]  │  └─────────────────────────────────────────────┘ │
│           │ └──────────────┘                                                  │
│           │                   ┌─────────────────────────────────────────────┐ │
│           │                   │ Showing 1-25 of 247 leads     [< 1 2 3 >]  │ │
│           │                   └─────────────────────────────────────────────┘ │
│           │                                                                    │
│           │  [When items selected: Bulk actions bar appears]                  │
│           │  ┌────────────────────────────────────────────────────────────┐   │
│           │  │ 3 selected  [Change Status ▾] [Add Tags ▾] [Export] [×]   │   │
│           │  └────────────────────────────────────────────────────────────┘   │
│           │                                                                    │
│           └────────────────────────────────────────────────────────────────────┘
└────────────────────────────────────────────────────────────────────────────────┘
```

**Layout Specifications:**
- Filter sidebar: `280px` width, sticky
- Main content area: Flexible width
- Table: Full width with horizontal scroll on mobile
- Row height: `min-h-16` for adequate touch targets
- Bulk actions bar: Fixed to top of table when items selected

**Responsive Behavior:**
- Mobile: Hide filter sidebar, show filter button/modal
- Mobile: Convert table to card-based layout
- Tablet: Collapsed filter panel or hidden by default

---

### 4. Lead Detail Page

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar] │ Top Nav                                                            │
│           ├────────────────────────────────────────────────────────────────────┤
│           │ Dashboard > Leads > John Smith                     [< Prev | Next >]│
│           ├────────────────────────────────────────────────────────────────────┤
│           │                                                                    │
│           │ ┌─────────────────────────────────┐ ┌──────────────────────────┐  │
│           │ │ [Back to Leads]                 │ │ [Edit] [Delete] [⋮]      │  │
│           │ └─────────────────────────────────┘ └──────────────────────────┘  │
│           │                                                                    │
│           │ ┌─────────────────────────┐  ┌───────────────────────────────────┐│
│           │ │ Contact Information     │  │ Activity Timeline                 ││
│           │ │                         │  │                                   ││
│           │ │ ┌────┐                  │  │ ┌───────────────────────────────┐ ││
│           │ │ │ JS │ John Smith       │  │ │ ○ Email sent           2m ago │ ││
│           │ │ └────┘                  │  │ │   Sent pricing information    │ ││
│           │ │                         │  │ └───────────────────────────────┘ ││
│           │ │ 📧 john@example.com     │  │                                   ││
│           │ │    [Copy]               │  │ ┌───────────────────────────────┐ ││
│           │ │                         │  │ │ ○ Status changed       15m ago│ ││
│           │ │ 📱 +1 (555) 123-4567    │  │ │   New → Active                │ ││
│           │ │    [Call]               │  │ └───────────────────────────────┘ ││
│           │ │                         │  │                                   ││
│           │ │ 🏢 Acme Corporation     │  │ ┌───────────────────────────────┐ ││
│           │ │                         │  │ │ ○ Chatbot conversation  1h ago│ ││
│           │ │ ─────────────────────   │  │ │   Asked about Product X       │ ││
│           │ │                         │  │ │   [View Full Conversation]    │ ││
│           │ │ Status:                 │  │ └───────────────────────────────┘ ││
│           │ │ [Active        ▾]       │  │                                   ││
│           │ │                         │  │ ┌───────────────────────────────┐ ││
│           │ │ Priority:               │  │ │ ○ Lead created          2h ago│ ││
│           │ │ [High          ▾]       │  │ │   Source: Chatbot             │ ││
│           │ │                         │  │ └───────────────────────────────┘ ││
│           │ │ Source:                 │  │                                   ││
│           │ │ Chatbot                 │  │ [Load More]                       ││
│           │ │                         │  └───────────────────────────────────┘│
│           │ │ Tags:                   │                                       │
│           │ │ [Enterprise] [Hot Lead] │  ┌───────────────────────────────────┐│
│           │ │ [+ Add Tag]             │  │ Notes                             ││
│           │ │                         │  │                                   ││
│           │ │ ─────────────────────   │  │ ┌───────────────────────────────┐ ││
│           │ │                         │  │ │ [Avatar] John Doe      2m ago │ ││
│           │ │ Created: Jan 15, 2024   │  │ │ Sent pricing information.     │ ││
│           │ │ Last activity: 2m ago   │  │ │ Follow up in 2 days.          │ ││
│           │ └─────────────────────────┘  │ └───────────────────────────────┘ ││
│           │                              │                                   ││
│           │                              │ ┌───────────────────────────────┐ ││
│           │                              │ │ Add a note...                 │ ││
│           │                              │ │                               │ ││
│           │                              │ │                               │ ││
│           │                              │ │ [Bold] [Italic] [Link]        │ ││
│           │                              │ │                  [Save Note]  │ ││
│           │                              │ └───────────────────────────────┘ ││
│           │                              └───────────────────────────────────┘│
│           └────────────────────────────────────────────────────────────────────┘
└────────────────────────────────────────────────────────────────────────────────┘
```

**Layout Specifications:**
- Two-column layout: Contact info (360px) + Activity/Notes (flexible)
- Gap between columns: `gap-6`
- Cards with `bg-bg-secondary`, `rounded-xl`, `p-6`
- Timeline items with connecting line (left border)
- Notes section with rich text editor

---

## Organization Management Screens

### 1. Team Management Page

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar] │ Top Nav                                                            │
│           ├────────────────────────────────────────────────────────────────────┤
│           │ Dashboard > Settings > Team                                        │
│           ├────────────────────────────────────────────────────────────────────┤
│           │                                                                    │
│           │ ┌────────────────────────────────────────────────────────────────┐ │
│           │ │ Team Members                              [+ Invite Member]     │ │
│           │ └────────────────────────────────────────────────────────────────┘ │
│           │                                                                    │
│           │ ┌────────────────────────────────────────────────────────────────┐ │
│           │ │ Member          Role      Status    Joined         Actions     │ │
│           │ ├────────────────────────────────────────────────────────────────┤ │
│           │ │ [Av] John Doe                                                  │ │
│           │ │      john@acme.com                                             │ │
│           │ │                 [Admin]   [Active]  Jan 15, 2024   [⋮]         │ │
│           │ ├────────────────────────────────────────────────────────────────┤ │
│           │ │ [Av] Jane Smith                                                │ │
│           │ │      jane@acme.com                                             │ │
│           │ │                 [Member]  [Active]  Jan 20, 2024   [⋮]         │ │
│           │ ├────────────────────────────────────────────────────────────────┤ │
│           │ │ [📧] alex@acme.com                                             │ │
│           │ │      Invitation pending                                        │ │
│           │ │                 [Member]  [Pending] Invited 2d ago             │ │
│           │ │                                         [Resend] [Cancel]      │ │
│           │ ├────────────────────────────────────────────────────────────────┤ │
│           │ │ [Av] Mike Chen                                                 │ │
│           │ │      mike@acme.com                                             │ │
│           │ │                 [Admin]   [Active]  Feb 1, 2024    [⋮]         │ │
│           │ └────────────────────────────────────────────────────────────────┘ │
│           │                                                                    │
│           │ ┌────────────────────────────────────────────────────────────────┐ │
│           │ │ Organization Settings                                          │ │
│           │ │                                                                │ │
│           │ │ Organization Name                                              │ │
│           │ │ ┌──────────────────────────────────────────────────────────┐   │ │
│           │ │ │ Acme Corporation                                         │   │ │
│           │ │ └──────────────────────────────────────────────────────────┘   │ │
│           │ │                                                                │ │
│           │ │ URL Slug                                                       │ │
│           │ │ ┌──────────────────────────────────────────────────────────┐   │ │
│           │ │ │ app.aicommerce.com/acme-corp                             │   │ │
│           │ │ └──────────────────────────────────────────────────────────┘   │ │
│           │ │                                                                │ │
│           │ │ Description                                                    │ │
│           │ │ ┌──────────────────────────────────────────────────────────┐   │ │
│           │ │ │ Leading e-commerce company...                            │   │ │
│           │ │ │                                                          │   │ │
│           │ │ └──────────────────────────────────────────────────────────┘   │ │
│           │ │                                                                │ │
│           │ │                                    [Cancel] [Save Changes]     │ │
│           │ └────────────────────────────────────────────────────────────────┘ │
│           │                                                                    │
│           └────────────────────────────────────────────────────────────────────┘
└────────────────────────────────────────────────────────────────────────────────┘
```

**Layout Specifications:**
- Full-width table for team members
- Each row shows avatar, name, email, role badge, status badge, date, and actions
- Pending invitations displayed differently (dimmed, mail icon)
- Organization settings below team list
- Form inputs full width within card

---

### 2. Invite Member Modal

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                                                                                │
│     ┌──────────────────────────────────────────────────────────┐              │
│     │ Invite Team Member                                    [×]│              │
│     ├──────────────────────────────────────────────────────────┤              │
│     │                                                          │              │
│     │ Email Address                                            │              │
│     │ ┌────────────────────────────────────────────────────┐   │              │
│     │ │ colleague@example.com                              │   │              │
│     │ └────────────────────────────────────────────────────┘   │              │
│     │                                                          │              │
│     │ Role                                                     │              │
│     │ ┌────────────────────────────────────────────────────┐   │              │
│     │ │ Member                                          ▾  │   │              │
│     │ └────────────────────────────────────────────────────┘   │              │
│     │                                                          │              │
│     │ Personal Message (optional)                              │              │
│     │ ┌────────────────────────────────────────────────────┐   │              │
│     │ │ Hi! Join our team on AI Commerce...                │   │              │
│     │ │                                                    │   │              │
│     │ └────────────────────────────────────────────────────┘   │              │
│     │                                                          │              │
│     ├──────────────────────────────────────────────────────────┤              │
│     │                             [Cancel] [Send Invitation]   │              │
│     └──────────────────────────────────────────────────────────┘              │
│                   [Dark backdrop with blur]                                   │
└────────────────────────────────────────────────────────────────────────────────┘
```

**Modal Specifications:**
- Width: `max-w-md` (448px)
- Backdrop: `bg-black/80 backdrop-blur-sm`
- Modal: `bg-bg-secondary border border-gray-800 rounded-2xl shadow-2xl`
- Centered: Flexbox centering
- Padding: `p-6`
- Header with close button
- Form fields with labels
- Footer with action buttons

---

## Chatbot Screens

### 1. Chatbot Configuration Page

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar] │ Top Nav                                                            │
│           ├────────────────────────────────────────────────────────────────────┤
│           │ Dashboard > Chatbot                                                │
│           ├────────────────────────────────────────────────────────────────────┤
│           │                                                                    │
│           │ ┌────────────────────────────────────────────────────────────────┐ │
│           │ │ [Configuration] [Conversations] [Training] [Embed]             │ │
│           │ └────────────────────────────────────────────────────────────────┘ │
│           │                                                                    │
│           │ ┌────────────────────────────┐  ┌──────────────────────────────┐  │
│           │ │ Basic Settings             │  │ Live Preview                 │  │
│           │ │                            │  │                              │  │
│           │ │ Chatbot Name               │  │ ┌──────────────────────────┐ │  │
│           │ │ ┌────────────────────────┐ │  │ │                          │ │  │
│           │ │ │ AI Commerce Assistant  │ │  │ │ [Sample website UI]      │ │  │
│           │ │ └────────────────────────┘ │  │ │                          │ │  │
│           │ │                            │  │ │                          │ │  │
│           │ │ Greeting Message           │  │ │                          │ │  │
│           │ │ ┌────────────────────────┐ │  │ │                          │ │  │
│           │ │ │ Hi! How can I help you │ │  │ │                          │ │  │
│           │ │ │ today?                 │ │  │ │               ┌────────┐ │ │  │
│           │ │ └────────────────────────┘ │  │ │               │ [Chat] │ │ │  │
│           │ │                            │  │ │               │ Widget │ │ │  │
│           │ │ Brand Color                │  │ │               │  💬    │ │ │  │
│           │ │ ┌───┐                      │  │ │               └────────┘ │ │  │
│           │ │ │[#]│ #0891B2              │  │ └──────────────────────────┘ │  │
│           │ │ └───┘ [Color Picker]       │  │                              │  │
│           │ │                            │  │ [When clicked, chat opens:]  │  │
│           │ │ Position                   │  │                              │  │
│           │ │ ○ Bottom Right             │  │ ┌──────────────────────────┐ │  │
│           │ │ ○ Bottom Left              │  │ │ AI Commerce Assistant    │ │  │
│           │ │                            │  │ ├──────────────────────────┤ │  │
│           │ │ Language                   │  │ │ Bot: Hi! How can I help? │ │  │
│           │ │ ┌────────────────────────┐ │  │ │                          │ │  │
│           │ │ │ English            ▾   │ │  │ │                          │ │  │
│           │ │ └────────────────────────┘ │  │ ├──────────────────────────┤ │  │
│           │ │                            │  │ │ Type a message...   [→]  │ │  │
│           │ │ [Save Changes]             │  │ └──────────────────────────┘ │  │
│           │ └────────────────────────────┘  └──────────────────────────────┘  │
│           │                                                                    │
│           │ ┌────────────────────────────────────────────────────────────────┐ │
│           │ │ Lead Capture Settings                                          │ │
│           │ │                                                                │ │
│           │ │ When to ask for email:                                         │ │
│           │ │ ○ After 3 messages                                             │ │
│           │ │ ● Before answering questions                                   │ │
│           │ │ ○ Only on request                                              │ │
│           │ │                                                                │ │
│           │ │ Required Fields:                                               │ │
│           │ │ [✓] Name     [✓] Email     [ ] Phone     [ ] Company           │ │
│           │ │                                                                │ │
│           │ │ Custom Fields:                                                 │ │
│           │ │ ┌──────────────────────────────────────────────────────────┐   │ │
│           │ │ │ Budget Range (dropdown)                                  │   │ │
│           │ │ │ Timeline (text)                                          │   │ │
│           │ │ │ [+ Add Custom Field]                                     │   │ │
│           │ │ └──────────────────────────────────────────────────────────┘   │ │
│           │ │                                                                │ │
│           │ │ [Save Settings]                                                │ │
│           │ └────────────────────────────────────────────────────────────────┘ │
│           │                                                                    │
│           └────────────────────────────────────────────────────────────────────┘
└────────────────────────────────────────────────────────────────────────────────┘
```

**Layout Specifications:**
- Tab navigation at top
- Two-column layout: Settings (400px) + Preview (flexible)
- Live preview updates in real-time as settings change
- Preview shows miniature website with chatbot widget
- Form fields grouped by category in cards

---

### 2. Chatbot Conversations Page

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar] │ Top Nav                                                            │
│           ├────────────────────────────────────────────────────────────────────┤
│           │ Dashboard > Chatbot > Conversations                                │
│           ├────────────────────────────────────────────────────────────────────┤
│           │                                                                    │
│           │ ┌────────────────────────────────────────────────────────────────┐ │
│           │ │ [Configuration] [Conversations] [Training] [Embed]             │ │
│           │ └────────────────────────────────────────────────────────────────┘ │
│           │                                                                    │
│           │ ┌──────────────┐  ┌──────────────────────────────────────────────┐ │
│           │ │ Conversations│  │ Conversation with john@example.com           │ │
│           │ │              │  ├──────────────────────────────────────────────┤ │
│           │ │ [🔍] Search  │  │                                              │ │
│           │ │              │  │ Bot: Hi! How can I help you today?           │ │
│           │ │ ┌──────────┐ │  │                                      10:23 AM│ │
│           │ │ │●John Smith│ │  │                                              │ │
│           │ │ │  2m ago   │ │  │ User: Do you have Product X in stock?        │ │
│           │ │ │  [New]    │ │  │                                      10:24 AM│ │
│           │ │ └──────────┘ │  │                                              │ │
│           │ │              │  │ Bot: Yes! Product X is currently in stock.   │ │
│           │ │ ┌──────────┐ │  │      Here are the details...                 │ │
│           │ │ │ Jane Doe  │ │  │                                      10:24 AM│ │
│           │ │ │  15m ago  │ │  │                                              │ │
│           │ │ │  [Active] │ │  │ User: What's the price?                      │ │
│           │ │ └──────────┘ │  │                                      10:25 AM│ │
│           │ │              │  │                                              │ │
│           │ │ ┌──────────┐ │  │ Bot: Product X is priced at $299...          │ │
│           │ │ │Sarah Joh..│ │  │                                      10:25 AM│ │
│           │ │ │  1h ago   │ │  │                                              │ │
│           │ │ │  [Lead]   │ │  │ [Email Capture Form Displayed]               │ │
│           │ │ └──────────┘ │  │                                              │ │
│           │ │              │  │ User: john@example.com                       │ │
│           │ │ ┌──────────┐ │  │                                      10:26 AM│ │
│           │ │ │Mike Chen  │ │  │                                              │ │
│           │ │ │  2h ago   │ │  │ Bot: Thanks! I'll have someone reach out.    │ │
│           │ │ │  [Lead]   │ │  │                                      10:26 AM│ │
│           │ │ └──────────┘ │  │                                              │ │
│           │ │              │  │ ┌──────────────────────────────────────────┐ │ │
│           │ │ [Load More]  │  │ │ 📝 Lead captured                         │ │ │
│           │ └──────────────┘  │ │    john@example.com added to leads       │ │ │
│           │  280px width      │ │    [View Lead →]                         │ │ │
│           │                   │ └──────────────────────────────────────────┘ │ │
│           │                   │                                              │ │
│           │                   │ ┌──────────────────────────────────────────┐ │ │
│           │                   │ │ Lead Information                         │ │ │
│           │                   │ │                                          │ │ │
│           │                   │ │ Name: John Smith                         │ │ │
│           │                   │ │ Email: john@example.com                  │ │ │
│           │                   │ │ Status: New                              │ │ │
│           │                   │ │ Priority: High                           │ │ │
│           │                   │ │                                          │ │ │
│           │                   │ │ [Add Note] [Change Status] [View Lead]   │ │ │
│           │                   │ └──────────────────────────────────────────┘ │ │
│           │                   └──────────────────────────────────────────────┘ │
│           └────────────────────────────────────────────────────────────────────┘
└────────────────────────────────────────────────────────────────────────────────┘
```

**Layout Specifications:**
- Three-column layout: List (280px) + Conversation (flexible) + Info panel (360px)
- Conversation list: Scrollable, sorted by most recent
- Message timeline: Chat-style interface with timestamps
- Info panel shows lead details if captured
- Visual indicators for conversation status (active, lead captured, etc.)

---

### 3. Embed Code Page

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ [Sidebar] │ Top Nav                                                            │
│           ├────────────────────────────────────────────────────────────────────┤
│           │ Dashboard > Chatbot > Embed                                        │
│           ├────────────────────────────────────────────────────────────────────┤
│           │                                                                    │
│           │ ┌────────────────────────────────────────────────────────────────┐ │
│           │ │ [Configuration] [Conversations] [Training] [Embed]             │ │
│           │ └────────────────────────────────────────────────────────────────┘ │
│           │                                                                    │
│           │ ┌────────────────────────────────────────────────────────────────┐ │
│           │ │ Install Your Chatbot                                           │ │
│           │ │                                                                │ │
│           │ │ Add this code snippet to your website before the closing       │ │
│           │ │ </body> tag:                                                   │ │
│           │ │                                                                │ │
│           │ │ ┌──────────────────────────────────────────────────────────┐   │ │
│           │ │ │ <script>                                                 │   │ │
│           │ │ │   (function() {                                          │   │ │
│           │ │ │     var script = document.createElement('script');       │   │ │
│           │ │ │     script.src = 'https://cdn.aicommerce.com/widget.js';│   │ │
│           │ │ │     script.async = true;                                 │   │ │
│           │ │ │     script.setAttribute('data-bot-id', 'abc123...');     │   │ │
│           │ │ │     document.body.appendChild(script);                   │   │ │
│           │ │ │   })();                                                  │   │ │
│           │ │ │ </script>                                                │   │ │
│           │ │ └──────────────────────────────────────────────────────────┘   │ │
│           │ │                                                                │ │
│           │ │ [Copy Code]                                                    │ │
│           │ │                                                                │ │
│           │ └────────────────────────────────────────────────────────────────┘ │
│           │                                                                    │
│           │ ┌────────────────────────────────────────────────────────────────┐ │
│           │ │ Platform-Specific Instructions                                 │ │
│           │ │                                                                │ │
│           │ │ [WordPress] [Shopify] [Wix] [Custom HTML] [React] [Next.js]   │ │
│           │ │                                                                │ │
│           │ │ [WordPress selected:]                                          │ │
│           │ │                                                                │ │
│           │ │ 1. Install "Insert Headers and Footers" plugin                 │ │
│           │ │ 2. Go to Settings > Insert Headers and Footers                 │ │
│           │ │ 3. Paste the code above in the "Scripts in Footer" section     │ │
│           │ │ 4. Click "Save" and your chatbot will appear!                  │ │
│           │ │                                                                │ │
│           │ │ [View Detailed Guide →]                                        │ │
│           │ │                                                                │ │
│           │ └────────────────────────────────────────────────────────────────┘ │
│           │                                                                    │
│           │ ┌────────────────────────────────────────────────────────────────┐ │
│           │ │ Test Your Installation                                         │ │
│           │ │                                                                │ │
│           │ │ Enter your website URL to verify the chatbot is installed:     │ │
│           │ │                                                                │ │
│           │ │ ┌──────────────────────────────────────────────────────────┐   │ │
│           │ │ │ https://yourwebsite.com                                  │   │ │
│           │ │ └──────────────────────────────────────────────────────────┘   │ │
│           │ │                                                                │ │
│           │ │ [Test Installation]                                            │ │
│           │ │                                                                │ │
│           │ └────────────────────────────────────────────────────────────────┘ │
│           │                                                                    │
│           └────────────────────────────────────────────────────────────────────┘
└────────────────────────────────────────────────────────────────────────────────┘
```

**Layout Specifications:**
- Code block with syntax highlighting
- Copy button with success feedback
- Platform tabs for specific instructions
- Step-by-step guides for each platform
- Testing tool to verify installation

---

## Mobile Responsive Layouts

### Mobile Dashboard (< 640px)

```
┌─────────────────────────────┐
│ ≡  AI Commerce      [🔔] [A]│ Top Nav (fixed)
├─────────────────────────────┤
│                             │
│ Welcome back, John!         │
│                             │
│ ┌─────────────────────────┐ │
│ │  [👥] Total Leads       │ │
│ │      1,234              │ │
│ │      +12% ↑            │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │  [💬] Active Chats      │ │
│ │      12                 │ │
│ │      +2 now             │ │
│ └─────────────────────────┘ │
│                             │
│ Recent Leads                │
│                             │
│ ┌─────────────────────────┐ │
│ │ [A] John Smith          │ │
│ │ john@example.com        │ │
│ │ [New] 2m ago           │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ [J] Jane Doe            │ │
│ │ jane@company.com        │ │
│ │ [Active] 15m ago       │ │
│ └─────────────────────────┘ │
│                             │
│ [View All Leads →]          │
│                             │
├─────────────────────────────┤
│ [≡] [●] [○] [○] [⚙]        │ Bottom Tab Bar (fixed)
└─────────────────────────────┘
```

**Mobile Specifications:**
- No sidebar: Hamburger menu or bottom tabs
- Full-width cards
- Single column layout
- Reduced padding: `p-4` instead of `p-8`
- Bottom navigation bar (sticky)
- Touch-friendly targets (min 48px)

### Mobile Leads List (< 640px)

```
┌─────────────────────────────┐
│ ← Leads      [🔍] [Filter]  │
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │
│ │ [A] John Smith          │ │
│ │     john@example.com    │ │
│ │     [New] [High]        │ │
│ │     2 minutes ago       │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ [J] Jane Doe            │ │
│ │     jane@company.com    │ │
│ │     [Active] [Medium]   │ │
│ │     15 minutes ago      │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ [S] Sarah Johnson       │ │
│ │     sarah@startup.io    │ │
│ │     [New] [Low]         │ │
│ │     1 hour ago          │ │
│ └─────────────────────────┘ │
│                             │
│            [+ New Lead]      │
│                             │ Floating Action Button
│                             │
└─────────────────────────────┘
```

**Mobile Leads Specifications:**
- Card-based layout (no table)
- Swipe actions (swipe left for delete, etc.)
- Floating action button for quick add
- Filter modal (full screen)
- Pull to refresh

---

## Empty States

### No Leads Yet

```
┌────────────────────────────────────────┐
│                                        │
│          ┌────┐                        │
│          │ 📥 │                        │
│          └────┘                        │
│                                        │
│       No leads yet                     │
│                                        │
│   Get started by creating your         │
│   first lead or connecting your        │
│   chatbot.                             │
│                                        │
│   ┌──────────────────────┐             │
│   │   Create Lead        │             │
│   └──────────────────────┘             │
│                                        │
│   [Set Up Chatbot →]                   │
│                                        │
└────────────────────────────────────────┘
```

### No Conversations Yet

```
┌────────────────────────────────────────┐
│                                        │
│          ┌────┐                        │
│          │ 💬 │                        │
│          └────┘                        │
│                                        │
│    No conversations yet                │
│                                        │
│   Your chatbot is ready! Install       │
│   it on your website to start          │
│   capturing leads.                     │
│                                        │
│   ┌──────────────────────────┐         │
│   │   Get Embed Code         │         │
│   └──────────────────────────┘         │
│                                        │
│   [View Setup Guide →]                 │
│                                        │
└────────────────────────────────────────┘
```

---

## Design Notes

### Consistent Patterns

1. **Page Headers**: Always include breadcrumbs and primary action button
2. **Cards**: Use consistent padding (p-6), border radius (rounded-xl), and shadows
3. **Forms**: Labels above inputs, helper text below, validation inline
4. **Lists**: Avatar/icon on left, content in middle, actions on right
5. **Modals**: Dark backdrop with blur, centered modal, header/body/footer structure
6. **Empty States**: Icon, heading, description, primary action, secondary link

### Spacing Rhythm

- Small gaps: `gap-2` or `gap-3` (8-12px)
- Medium gaps: `gap-4` or `gap-6` (16-24px)
- Large gaps: `gap-8` or `gap-12` (32-48px)
- Section spacing: `mb-8` or `mb-12` (32-48px)

### Visual Hierarchy

1. **Primary elements**: Large, bold, high contrast (white text, primary buttons)
2. **Secondary elements**: Medium, semibold, medium contrast (gray-300 text)
3. **Tertiary elements**: Small, regular, low contrast (gray-500 text)
4. **Disabled elements**: Reduced opacity (opacity-50), muted colors

### Interaction Feedback

- **Hover**: Slight background color change, increased elevation
- **Active**: Slight scale down, reduced elevation
- **Focus**: 2px ring in primary color with offset
- **Loading**: Spinner with reduced opacity, disabled state
- **Success**: Green toast, check icon
- **Error**: Red toast/inline message, error icon
