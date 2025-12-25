# User Journey Maps & Interaction Flows

## Table of Contents
1. [Authentication Flows](#authentication-flows)
2. [Organization Management Flows](#organization-management-flows)
3. [Dashboard Navigation Flow](#dashboard-navigation-flow)
4. [Lead Management Flows](#lead-management-flows)
5. [Chatbot Setup Flow](#chatbot-setup-flow)

---

## Authentication Flows

### 1. User Registration Flow

```
START: Landing Page / Marketing Site
│
├─> Click "Sign Up" / "Get Started"
│
└─> Sign Up Page
    │
    ├─> Fill Registration Form
    │   ├─ Full Name
    │   ├─ Email Address
    │   ├─ Password (with strength indicator)
    │   ├─ Confirm Password
    │   ├─ Organization Name
    │   └─ Accept Terms & Privacy Policy
    │
    ├─> [VALIDATION]
    │   ├─ Email format valid?
    │   ├─ Password meets requirements?
    │   ├─ Passwords match?
    │   ├─ Organization name unique?
    │   └─ Terms accepted?
    │
    ├─> [SUCCESS] Submit Form
    │   ├─> Show loading state
    │   ├─> Create user account in Supabase
    │   ├─> Create organization
    │   ├─> Associate user with organization
    │   ├─> Send verification email
    │   └─> Redirect to verification page
    │
    └─> [ERROR] Show error message
        ├─ Email already exists
        ├─ Organization name taken
        └─ Server error

Verification Page
│
├─> Display "Check your email" message
├─> Show email address where link was sent
├─> Provide "Resend email" button
│
└─> User clicks verification link in email
    │
    ├─> [VALIDATION]
    │   ├─ Token valid?
    │   └─ Not expired?
    │
    ├─> [SUCCESS]
    │   ├─> Mark email as verified
    │   ├─> Show success toast
    │   └─> Redirect to dashboard
    │
    └─> [ERROR]
        ├─> Show error message
        └─> Provide support link

Alternative Paths:
├─> Click "Sign in with Google"
│   ├─> OAuth flow with Google
│   ├─> Return to app
│   ├─> Create/link account
│   └─> Redirect to dashboard
│
└─> Click "Sign in with Microsoft"
    ├─> OAuth flow with Microsoft
    ├─> Return to app
    ├─> Create/link account
    └─> Redirect to dashboard
```

### 2. User Login Flow

```
START: Login Page
│
├─> Fill Login Form
│   ├─ Email Address
│   └─ Password
│
├─> Optional: Check "Remember me"
│
├─> [VALIDATION]
│   ├─ Email format valid?
│   └─ Password provided?
│
├─> [SUCCESS] Submit Form
│   ├─> Show loading state
│   ├─> Authenticate with Supabase
│   ├─> Check email verification status
│   │
│   ├─> [EMAIL VERIFIED]
│   │   ├─> Create session
│   │   ├─> Load user data
│   │   ├─> Load organization data
│   │   └─> Redirect to dashboard
│   │
│   └─> [EMAIL NOT VERIFIED]
│       ├─> Show verification reminder
│       └─> Provide "Resend email" option
│
└─> [ERROR] Show error message
    ├─ Invalid credentials
    ├─ Account disabled
    └─ Too many attempts (rate limited)

Alternative Paths:
├─> Click "Forgot password?"
│   └─> Navigate to password reset flow
│
├─> Click "Sign in with Google"
│   └─> OAuth flow (same as registration)
│
├─> Click "Sign in with Microsoft"
│   └─> OAuth flow (same as registration)
│
└─> Click "Sign up" link
    └─> Navigate to registration flow
```

### 3. Password Reset Flow

```
START: Login Page
│
├─> Click "Forgot password?"
│
└─> Password Reset Request Page
    │
    ├─> Enter Email Address
    │
    ├─> [VALIDATION]
    │   └─ Email format valid?
    │
    ├─> [SUCCESS] Submit Request
    │   ├─> Show loading state
    │   ├─> Send reset email
    │   └─> Show confirmation page
    │       ├─ "Check your email" message
    │       ├─ Email address confirmation
    │       └─ "Didn't receive? Resend" option
    │
    └─> [ERROR] Show error message

User clicks reset link in email
│
└─> Set New Password Page
    │
    ├─> [VALIDATION]
    │   ├─ Token valid?
    │   └─ Not expired?
    │
    ├─> [VALID TOKEN]
    │   ├─> Display password form
    │   │   ├─ New Password (with strength indicator)
    │   │   └─ Confirm New Password
    │   │
    │   ├─> [VALIDATION]
    │   │   ├─ Password meets requirements?
    │   │   └─ Passwords match?
    │   │
    │   ├─> [SUCCESS] Submit New Password
    │   │   ├─> Update password in database
    │   │   ├─> Show success message
    │   │   └─> Redirect to login
    │   │
    │   └─> [ERROR] Show error message
    │
    └─> [INVALID TOKEN]
        ├─> Show "Link expired" message
        └─> Provide "Request new link" button
```

---

## Organization Management Flows

### 1. Organization Creation Flow

```
START: User logged in (first time, no organization)
│
└─> Onboarding: Create Organization Page
    │
    ├─> Display Welcome Message
    ├─> Explain organization benefits
    │
    └─> Organization Creation Form
        │
        ├─> Fill Form
        │   ├─ Organization Name (required)
        │   ├─ URL Slug (required, auto-generated)
        │   └─ Description (optional)
        │
        ├─> [VALIDATION]
        │   ├─ Name not empty?
        │   ├─ Slug format valid?
        │   ├─ Slug available?
        │   └─ Description length < 500 chars?
        │
        ├─> [SUCCESS] Create Organization
        │   ├─> Show loading state
        │   ├─> Create organization in database
        │   ├─> Set user as admin
        │   ├─> Show success toast
        │   └─> Redirect to dashboard
        │
        └─> [ERROR] Show error message
            ├─ Organization name taken
            ├─ Slug already in use
            └─ Server error
```

### 2. Organization Switching Flow

```
START: Dashboard (any page)
│
├─> Click Organization Switcher (sidebar/topbar)
│
└─> Organization Dropdown Opens
    │
    ├─> Display Current Organization (highlighted)
    ├─> List Other Organizations (if any)
    ├─> Show "Create New Organization" option
    │
    ├─> [OPTION 1] Select Different Organization
    │   ├─> Show loading state
    │   ├─> Switch context to selected org
    │   ├─> Reload dashboard data
    │   └─> Show success toast
    │
    ├─> [OPTION 2] Create New Organization
    │   └─> Open Organization Creation Modal
    │       └─> Follow creation flow (from above)
    │
    └─> [OPTION 3] Click outside / ESC
        └─> Close dropdown
```

### 3. Team Member Invitation Flow

```
START: Organization Settings / Team Page
│
├─> Click "Invite Member" Button
│
└─> Invitation Modal Opens
    │
    ├─> Fill Invitation Form
    │   ├─ Email Address (required)
    │   ├─ Role (dropdown: Member/Admin)
    │   └─ Personal Message (optional)
    │
    ├─> [VALIDATION]
    │   ├─ Email format valid?
    │   ├─ Email not already a member?
    │   └─ Email not already invited (pending)?
    │
    ├─> [SUCCESS] Send Invitation
    │   ├─> Show loading state
    │   ├─> Create invitation in database
    │   ├─> Send invitation email
    │   ├─> Update team list (show pending)
    │   ├─> Show success toast
    │   └─> Close modal
    │
    └─> [ERROR] Show error message
        ├─ Email already a member
        ├─ Invitation already sent
        ├─ Email service error
        └─ Permission denied

Invitee receives email
│
└─> Clicks invitation link
    │
    ├─> [USER HAS ACCOUNT]
    │   ├─> Log in (if not already)
    │   ├─> Show "Accept Invitation" page
    │   ├─> Display organization details
    │   ├─> Show role being offered
    │   │
    │   ├─> [ACCEPT]
    │   │   ├─> Add user to organization
    │   │   ├─> Remove invitation
    │   │   ├─> Send notification to inviter
    │   │   ├─> Switch to new organization
    │   │   └─> Redirect to dashboard
    │   │
    │   └─> [DECLINE]
    │       ├─> Remove invitation
    │       ├─> Send notification to inviter
    │       └─> Redirect to previous organization
    │
    └─> [USER NO ACCOUNT]
        ├─> Show "Create Account" page
        ├─> Pre-fill email
        ├─> Complete registration
        ├─> Automatically accept invitation
        └─> Redirect to dashboard
```

### 4. Member Management Flow

```
START: Team Page (Organization Settings)
│
├─> View Team Members List
│   ├─ Active members
│   ├─ Pending invitations
│   └─ Each row shows actions
│
├─> [ACTION 1] Change Member Role
│   ├─> Click role dropdown
│   ├─> Select new role
│   ├─> Show confirmation dialog
│   ├─> [CONFIRM]
│   │   ├─> Update role in database
│   │   ├─> Send notification to member
│   │   └─> Show success toast
│   └─> [CANCEL]
│       └─> Close dialog
│
├─> [ACTION 2] Remove Member
│   ├─> Click "Remove" button
│   ├─> Show confirmation dialog
│   │   ├─ Warning about access loss
│   │   └─ "Are you sure?" message
│   ├─> [CONFIRM]
│   │   ├─> Remove from organization
│   │   ├─> Revoke access
│   │   ├─> Send notification to member
│   │   ├─> Update team list
│   │   └─> Show success toast
│   └─> [CANCEL]
│       └─> Close dialog
│
├─> [ACTION 3] Resend Invitation (Pending)
│   ├─> Click "Resend"
│   ├─> Show loading state
│   ├─> Send new invitation email
│   ├─> Update "sent" timestamp
│   └─> Show success toast
│
└─> [ACTION 4] Cancel Invitation (Pending)
    ├─> Click "Cancel"
    ├─> Show confirmation dialog
    ├─> [CONFIRM]
    │   ├─> Delete invitation
    │   ├─> Update team list
    │   └─> Show success toast
    └─> [CANCEL]
        └─> Close dialog
```

---

## Dashboard Navigation Flow

### 1. First-Time User Dashboard Experience

```
START: User completes registration & verification
│
└─> Dashboard Landing (First Visit)
    │
    ├─> Display Welcome Screen
    │   ├─ Welcome message with user's name
    │   ├─ Brief explanation of features
    │   └─ "Get Started" checklist
    │
    ├─> Onboarding Checklist
    │   ├─ □ Complete profile
    │   ├─ □ Set up chatbot
    │   ├─ □ Invite team members
    │   └─ □ Create first lead
    │
    ├─> Quick Actions Cards
    │   ├─ "Set Up Chatbot" CTA
    │   ├─ "Invite Team" CTA
    │   └─ "View Tutorial" CTA
    │
    └─> Navigation Sidebar
        ├─ Dashboard (active)
        ├─ Leads (empty state)
        ├─ Chatbot (setup required)
        └─ Settings
```

### 2. Standard Dashboard Navigation Flow

```
START: User logged in, on Dashboard
│
├─> Sidebar Navigation Options:
│   │
│   ├─> Dashboard (Home)
│   │   ├─> Overview stats
│   │   ├─> Recent leads
│   │   ├─> Activity feed
│   │   └─> Quick actions
│   │
│   ├─> Leads
│   │   ├─> List all leads
│   │   ├─> Filter/search
│   │   ├─> Lead details
│   │   └─> Lead actions
│   │
│   ├─> Chatbot
│   │   ├─> Chatbot configuration
│   │   ├─> Conversation history
│   │   ├─> Training data
│   │   └─> Embed code
│   │
│   ├─> Settings
│   │   ├─> Profile settings
│   │   ├─> Organization settings
│   │   ├─> Team management
│   │   └─> Billing (future)
│   │
│   └─> Organization Switcher
│       └─> (See Organization Switching Flow)
│
├─> Top Navigation Options:
│   ├─> Search (⌘K)
│   ├─> Notifications
│   └─> User Menu
│       ├─ Profile
│       ├─ Settings
│       ├─ Help & Support
│       ├─ Keyboard Shortcuts
│       └─ Sign Out
│
└─> Breadcrumbs (Context Navigation)
    └─> Dashboard > [Section] > [Subsection]
```

### 3. Search Flow (Global Search)

```
START: Any dashboard page
│
├─> Trigger Search
│   ├─ Click search button (top nav)
│   ├─ Press ⌘K (Mac) / Ctrl+K (Windows)
│   └─ Type in search field
│
└─> Search Modal Opens
    │
    ├─> Display Search Interface
    │   ├─ Search input (auto-focused)
    │   ├─ Recent searches
    │   └─ Suggested actions
    │
    ├─> User Types Query
    │   ├─> [REAL-TIME SEARCH]
    │   │   ├─ Search leads
    │   │   ├─ Search conversations
    │   │   ├─ Search team members
    │   │   └─ Search settings
    │   │
    │   └─> Display Results (Grouped)
    │       ├─ Leads (top 5)
    │       ├─ Conversations (top 5)
    │       ├─ People (top 5)
    │       └─ Actions (relevant)
    │
    ├─> Select Result
    │   ├─> Navigate to selected item
    │   ├─> Close search modal
    │   └─> Add to recent searches
    │
    └─> Close Search
        ├─ Click outside modal
        ├─ Press ESC
        └─ Click close button
```

---

## Lead Management Flows

### 1. Lead Creation Flow (Manual)

```
START: Leads Page
│
├─> Click "Create Lead" Button
│
└─> Lead Creation Modal Opens
    │
    ├─> Fill Lead Form
    │   ├─ Contact Information
    │   │   ├─ Name (required)
    │   │   ├─ Email (required)
    │   │   ├─ Phone (optional)
    │   │   └─ Company (optional)
    │   │
    │   ├─ Lead Details
    │   │   ├─ Source (dropdown)
    │   │   ├─ Status (dropdown)
    │   │   ├─ Priority (low/medium/high)
    │   │   └─ Tags (multi-select)
    │   │
    │   └─ Notes (optional)
    │       └─ Rich text editor
    │
    ├─> [VALIDATION]
    │   ├─ Name not empty?
    │   ├─ Email format valid?
    │   ├─ Phone format valid (if provided)?
    │   └─ Source selected?
    │
    ├─> [SUCCESS] Create Lead
    │   ├─> Show loading state
    │   ├─> Save to database
    │   ├─> Show success toast
    │   ├─> Close modal
    │   ├─> Add to leads list
    │   └─> Option to view lead details
    │
    └─> [ERROR] Show error message
        ├─ Email already exists
        ├─ Required fields missing
        └─ Server error
```

### 2. Lead Detail View Flow

```
START: Leads List
│
├─> Click on Lead Row
│
└─> Lead Detail Page Opens
    │
    ├─> Display Lead Information
    │   ├─ Contact Card
    │   │   ├─ Name & avatar
    │   │   ├─ Email (with copy button)
    │   │   ├─ Phone (with call button)
    │   │   └─ Company
    │   │
    │   ├─ Status & Meta
    │   │   ├─ Current status (with edit)
    │   │   ├─ Priority (with edit)
    │   │   ├─ Source
    │   │   ├─ Created date
    │   │   └─ Last activity
    │   │
    │   ├─ Tags
    │   │   ├─ Display existing tags
    │   │   └─ Add/remove tags
    │   │
    │   ├─ Activity Timeline
    │   │   ├─ Conversations
    │   │   ├─ Status changes
    │   │   ├─ Notes added
    │   │   └─ Emails sent
    │   │
    │   └─ Notes Section
    │       ├─ Display all notes
    │       └─ Add new note
    │
    ├─> Available Actions
    │   ├─> Edit Lead
    │   │   └─> Open edit modal
    │   │
    │   ├─> Change Status
    │   │   └─> Status dropdown
    │   │
    │   ├─> Add Note
    │   │   └─> Note editor
    │   │
    │   ├─> Send Email
    │   │   └─> Email composer
    │   │
    │   ├─> View Conversations
    │   │   └─> Conversation history
    │   │
    │   └─> Delete Lead
    │       └─> Confirmation dialog
    │
    └─> Navigation Options
        ├─ Previous Lead
        ├─ Next Lead
        └─ Back to List
```

### 3. Lead Filtering & Sorting Flow

```
START: Leads List Page
│
├─> Apply Filters
│   │
│   ├─> Click "Filters" Button
│   │
│   └─> Filter Panel Opens (Sidebar or Dropdown)
│       │
│       ├─> Available Filters:
│       │   ├─ Status (checkboxes)
│       │   ├─ Priority (checkboxes)
│       │   ├─ Source (checkboxes)
│       │   ├─ Tags (multi-select)
│       │   ├─ Date Range (date picker)
│       │   └─ Assigned To (select)
│       │
│       ├─> Apply Filter
│       │   ├─> Update URL params
│       │   ├─> Fetch filtered data
│       │   ├─> Update leads list
│       │   └─> Show active filters
│       │
│       ├─> Clear Filters
│       │   └─> Reset to default view
│       │
│       └─> Save Filter as View
│           ├─> Name the view
│           └─> Save for quick access
│
├─> Sort Leads
│   │
│   ├─> Click Column Header
│   │   ├─ Name (A-Z / Z-A)
│   │   ├─ Date Created (New / Old)
│   │   ├─ Last Activity (Recent / Oldest)
│   │   └─ Priority (High to Low / Low to High)
│   │
│   └─> Or Select from Sort Dropdown
│       └─> Same options as column headers
│
└─> Search Leads
    ├─> Type in search box
    ├─> [REAL-TIME SEARCH]
    │   ├─ Search name
    │   ├─ Search email
    │   ├─ Search company
    │   └─ Search notes
    └─> Display filtered results
```

### 4. Bulk Lead Actions Flow

```
START: Leads List Page
│
├─> Select Multiple Leads
│   ├─ Click checkboxes
│   ├─ Select all (header checkbox)
│   └─ Select range (shift+click)
│
├─> Bulk Actions Bar Appears
│   └─> Shows: X leads selected
│
├─> Available Bulk Actions:
│   │
│   ├─> Change Status
│   │   ├─> Select new status
│   │   ├─> Confirm action
│   │   ├─> Update all selected
│   │   └─> Show success toast
│   │
│   ├─> Change Priority
│   │   └─> (Same flow as status)
│   │
│   ├─> Add Tags
│   │   ├─> Select/create tags
│   │   ├─> Confirm action
│   │   ├─> Add to all selected
│   │   └─> Show success toast
│   │
│   ├─> Assign To User
│   │   ├─> Select user
│   │   ├─> Confirm action
│   │   ├─> Assign all selected
│   │   └─> Show success toast
│   │
│   ├─> Export
│   │   ├─> Select format (CSV, Excel)
│   │   ├─> Generate file
│   │   ├─> Download
│   │   └─> Show success toast
│   │
│   └─> Delete
│       ├─> Show confirmation dialog
│       │   ├─ Warning message
│       │   └─ Count of leads to delete
│       ├─> [CONFIRM]
│       │   ├─> Delete all selected
│       │   ├─> Update list
│       │   └─> Show success toast
│       └─> [CANCEL]
│           └─> Close dialog
│
└─> Clear Selection
    ├─ Click "Clear" button
    ├─ Uncheck header checkbox
    └─ Hide bulk actions bar
```

---

## Chatbot Setup Flow

### 1. Initial Chatbot Configuration Flow

```
START: Chatbot Page (First Time)
│
└─> Chatbot Setup Wizard
    │
    ├─> Step 1: Welcome & Overview
    │   ├─ Explain chatbot features
    │   ├─ Show example conversation
    │   └─ "Let's Get Started" button
    │
    ├─> Step 2: Basic Configuration
    │   ├─ Chatbot Name (required)
    │   ├─ Greeting Message (required)
    │   ├─ Brand Color (color picker)
    │   ├─ Position (bottom-right/left)
    │   └─ Language (dropdown)
    │
    ├─> Step 3: Training Data
    │   ├─ Product Information
    │   │   ├─ Upload product catalog
    │   │   ├─ Enter product URLs
    │   │   └─ Paste product descriptions
    │   │
    │   ├─ Business Information
    │   │   ├─ Company description
    │   │   ├─ Business hours
    │   │   ├─ Contact information
    │   │   └─ FAQs
    │   │
    │   └─ Process Data
    │       ├─> Show loading state
    │       ├─> Generate embeddings
    │       └─> Confirm completion
    │
    ├─> Step 4: Lead Capture Settings
    │   ├─ When to ask for email
    │   │   ├─ After X messages
    │   │   ├─ Before answering questions
    │   │   └─ Only on request
    │   │
    │   ├─ Lead form fields
    │   │   ├─ Name (required)
    │   │   ├─ Email (required)
    │   │   ├─ Phone (optional)
    │   │   └─ Custom fields
    │   │
    │   └─ Lead qualification questions
    │       ├─ Budget range
    │       ├─ Timeline
    │       └─ Specific needs
    │
    ├─> Step 5: Test Chatbot
    │   ├─ Open test chat window
    │   ├─ Send sample messages
    │   ├─ Verify responses
    │   └─ Confirm satisfaction
    │
    └─> Step 6: Deploy
        ├─ Generate embed code
        ├─ Show installation instructions
        ├─ Copy code button
        └─ Mark setup as complete
            │
            └─> Navigate to Chatbot Dashboard
```

### 2. Chatbot Conversation Monitoring Flow

```
START: Chatbot Dashboard
│
├─> View Live Conversations
│   ├─ Active conversations (real-time)
│   ├─ Conversation history
│   └─ Analytics overview
│
├─> Select Conversation
│   │
│   └─> Conversation Detail View
│       │
│       ├─> Display Full Conversation
│       │   ├─ Message timeline
│       │   ├─ User information
│       │   ├─ Lead status
│       │   └─ Captured data
│       │
│       ├─> Available Actions
│       │   ├─> Mark as Lead
│       │   ├─> Add to existing lead
│       │   ├─> Add notes
│       │   ├─> Flag for review
│       │   └─> Export conversation
│       │
│       └─> AI Response Review
│           ├─ View AI confidence scores
│           ├─ Flag incorrect responses
│           └─> Provide feedback
│               ├─> Improve training data
│               └─> Add to FAQs
│
├─> Filter Conversations
│   ├─ By date range
│   ├─ By lead captured (yes/no)
│   ├─ By conversation length
│   └─ By sentiment
│
└─> Analytics View
    ├─ Total conversations
    ├─ Lead conversion rate
    ├─ Average response time
    ├─ Most asked questions
    └─ User satisfaction score
```

### 3. Chatbot Training Update Flow

```
START: Chatbot Configuration Page
│
├─> Navigate to Training Tab
│
├─> View Current Training Data
│   ├─ Product information
│   ├─ Business information
│   ├─ FAQs
│   └─ Last updated date
│
├─> Update Training Data
│   │
│   ├─> [OPTION 1] Add Products
│   │   ├─> Upload new catalog
│   │   ├─> Or enter manually
│   │   └─> Process & update
│   │
│   ├─> [OPTION 2] Update FAQs
│   │   ├─> Add new Q&A pairs
│   │   ├─> Edit existing FAQs
│   │   ├─> Delete outdated FAQs
│   │   └─> Save changes
│   │
│   ├─> [OPTION 3] Bulk Import
│   │   ├─> Upload CSV/JSON
│   │   ├─> Map fields
│   │   ├─> Preview import
│   │   └─> Confirm import
│   │
│   └─> [OPTION 4] Learn from Conversations
│       ├─> Review flagged responses
│       ├─> Select conversations
│       ├─> Extract Q&A pairs
│       └─> Add to training data
│
├─> Retrain Chatbot
│   ├─> Click "Retrain" button
│   ├─> Show processing status
│   │   ├─ Generating embeddings
│   │   ├─ Updating knowledge base
│   │   └─ Testing responses
│   ├─> Show completion
│   └─> Suggest testing
│
└─> Test Updated Chatbot
    ├─> Open test window
    ├─> Try problematic queries
    ├─> Verify improvements
    └─> Deploy changes
```

---

## Key Interaction Patterns

### Error Handling Pattern
```
[ACTION] → [VALIDATION] → [ERROR]
                 ↓
              [SUCCESS]
                 ↓
            [FEEDBACK]
         (Toast/Message)
                 ↓
          [NEXT STATE]
```

### Loading State Pattern
```
[TRIGGER ACTION]
       ↓
[DISABLE CONTROLS]
       ↓
[SHOW LOADING UI]
(Spinner + Text)
       ↓
[PROCESS REQUEST]
       ↓
[ENABLE CONTROLS]
       ↓
[UPDATE UI]
       ↓
[SHOW FEEDBACK]
```

### Modal Interaction Pattern
```
[TRIGGER] → [OPEN MODAL]
                ↓
         [TRAP FOCUS]
                ↓
         [USER ACTION]
                ↓
       [CLOSE MODAL]
                ↓
      [RESTORE FOCUS]
                ↓
     [UPDATE PARENT]
```

### Form Validation Pattern
```
[USER INPUT]
       ↓
[REAL-TIME VALIDATION]
       ↓
[SHOW ERRORS] (if any)
       ↓
[SUBMIT ATTEMPT]
       ↓
[FINAL VALIDATION]
       ↓
[SUCCESS/ERROR]
       ↓
[SHOW FEEDBACK]
```

---

## Accessibility Considerations

### Keyboard Navigation Flow
```
Tab:       Move to next focusable element
Shift+Tab: Move to previous focusable element
Enter:     Activate button/link
Space:     Activate button/toggle checkbox
Escape:    Close modal/dropdown
Arrow Keys: Navigate within component (dropdowns, tabs)
```

### Screen Reader Announcements
```
- Page navigation: Announce page title
- Form errors: Announce error count and messages
- Loading states: Announce "Loading..." and completion
- Success actions: Announce confirmation
- Dynamic content: Use ARIA live regions
```

### Focus Management
```
- Modal open: Trap focus within modal
- Modal close: Return focus to trigger element
- Form submission: Move focus to success message or first error
- Page navigation: Reset focus to main content
- Dropdown open: Focus first item
```
