# Component Specifications

## Table of Contents
1. [Authentication Components](#authentication-components)
2. [Dashboard Layout](#dashboard-layout)
3. [UI Components](#ui-components)
4. [Organization Management](#organization-management)
5. [Lead Components](#lead-components)

---

## Authentication Components

### 1. Login Form

#### Visual Description
Centered card on dark background with cyan/purple gradient overlay. Card has white/semi-transparent background with rounded corners and elevation shadow.

#### Layout Structure
```
┌─────────────────────────────────────────┐
│         [Logo + App Name]               │
│                                         │
│     Welcome Back                        │
│     Sign in to your account             │
│                                         │
│     [Email Input Field]                 │
│     [Password Input Field]              │
│                                         │
│     □ Remember me    [Forgot password?] │
│                                         │
│     [Sign In Button - Full Width]       │
│                                         │
│     ─────────── OR ───────────          │
│                                         │
│     [Google Sign In]                    │
│     [Microsoft Sign In]                 │
│                                         │
│     Don't have an account? Sign up      │
└─────────────────────────────────────────┘
```

#### Component Specifications

**Container Card**
```tsx
// Tailwind Classes
className="w-full max-w-md mx-auto bg-bg-secondary/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 space-y-6"

// Styles
- Width: max-w-md (448px)
- Background: bg-bg-secondary with 95% opacity
- Backdrop: backdrop-blur-sm
- Border radius: rounded-2xl
- Shadow: shadow-2xl
- Padding: p-8 (32px)
- Spacing: space-y-6 (24px between children)
```

**Heading Section**
```tsx
// Logo + App Name
<div className="flex items-center justify-center mb-8">
  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
    {/* Icon or logo */}
  </div>
  <span className="ml-3 text-xl font-bold text-white">AI Commerce</span>
</div>

// Heading
<h1 className="text-3xl font-bold text-white text-center">Welcome Back</h1>
<p className="text-center text-gray-400 text-sm">Sign in to your account</p>
```

**Email Input**
```tsx
<div className="space-y-2">
  <label htmlFor="email" className="block text-sm font-medium text-gray-300">
    Email address
  </label>
  <input
    id="email"
    type="email"
    autoComplete="email"
    required
    className="w-full px-4 py-3 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-150"
    placeholder="you@example.com"
  />
</div>
```

**Password Input**
```tsx
<div className="space-y-2">
  <label htmlFor="password" className="block text-sm font-medium text-gray-300">
    Password
  </label>
  <div className="relative">
    <input
      id="password"
      type="password"
      autoComplete="current-password"
      required
      className="w-full px-4 py-3 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-150"
      placeholder="••••••••"
    />
    <button
      type="button"
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
      aria-label="Toggle password visibility"
    >
      {/* Eye icon */}
    </button>
  </div>
</div>
```

**Remember Me & Forgot Password**
```tsx
<div className="flex items-center justify-between text-sm">
  <label className="flex items-center text-gray-400 cursor-pointer">
    <input
      type="checkbox"
      className="w-4 h-4 rounded border-gray-600 bg-bg-tertiary text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-bg-secondary"
    />
    <span className="ml-2">Remember me</span>
  </label>
  <a href="#" className="text-primary-400 hover:text-primary-300 font-medium">
    Forgot password?
  </a>
</div>
```

**Sign In Button**
```tsx
<button
  type="submit"
  className="w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-glow-primary hover:from-primary-600 hover:to-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-bg-secondary transition-all duration-150"
>
  Sign in
</button>
```

**Divider**
```tsx
<div className="relative">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-gray-700"></div>
  </div>
  <div className="relative flex justify-center text-sm">
    <span className="px-4 bg-bg-secondary text-gray-500">OR</span>
  </div>
</div>
```

**Social Auth Buttons**
```tsx
// Google Button
<button
  type="button"
  className="w-full px-4 py-3 bg-white text-gray-900 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-bg-secondary transition-colors duration-150 flex items-center justify-center"
>
  <GoogleIcon className="w-5 h-5 mr-2" />
  Continue with Google
</button>

// Microsoft Button
<button
  type="button"
  className="w-full px-4 py-3 bg-bg-tertiary text-white font-medium rounded-lg border border-gray-700 hover:bg-bg-elevated hover:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-bg-secondary transition-colors duration-150 flex items-center justify-center"
>
  <MicrosoftIcon className="w-5 h-5 mr-2" />
  Continue with Microsoft
</button>
```

**Sign Up Link**
```tsx
<p className="text-center text-sm text-gray-400">
  Don't have an account?{' '}
  <a href="/signup" className="text-primary-400 hover:text-primary-300 font-semibold">
    Sign up
  </a>
</p>
```

#### Validation States

**Error State (Invalid Input)**
```tsx
// Input with error
<input
  className="w-full px-4 py-3 bg-bg-tertiary border-2 border-error-500 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-error-500 focus:border-error-500"
  aria-invalid="true"
  aria-describedby="email-error"
/>
<p id="email-error" className="mt-2 text-sm text-error-400 flex items-center">
  <AlertCircleIcon className="w-4 h-4 mr-1" />
  Please enter a valid email address
</p>
```

**Loading State**
```tsx
<button
  type="submit"
  disabled
  className="w-full px-6 py-3 bg-primary-500/80 text-white font-semibold rounded-lg cursor-wait flex items-center justify-center"
>
  <LoadingSpinner className="w-5 h-5 mr-2 animate-spin" />
  Signing in...
</button>
```

#### Accessibility Requirements
- All inputs must have associated labels (using `htmlFor` and `id`)
- Form must be keyboard navigable (tab order: email → password → remember me → forgot password → sign in → social buttons → sign up link)
- Error messages must be announced to screen readers (`aria-invalid`, `aria-describedby`)
- Password toggle button must have `aria-label`
- Social auth buttons must have clear text labels (not icon-only)
- Focus states must be visible (2px ring in primary color)

#### Responsive Behavior
```
Mobile (< 640px):
- Card padding: p-6 (24px)
- Heading size: text-2xl
- Button padding: py-2.5

Tablet/Desktop (>= 640px):
- Card padding: p-8 (32px)
- Heading size: text-3xl
- Button padding: py-3
- Center card with max-w-md
```

---

### 2. Sign Up Form

Similar to login form with these additions:

**Additional Fields**
```tsx
// Full Name Input
<div className="space-y-2">
  <label htmlFor="name" className="block text-sm font-medium text-gray-300">
    Full name
  </label>
  <input
    id="name"
    type="text"
    autoComplete="name"
    required
    className="w-full px-4 py-3 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-150"
    placeholder="John Doe"
  />
</div>

// Organization Name Input
<div className="space-y-2">
  <label htmlFor="organization" className="block text-sm font-medium text-gray-300">
    Organization name
  </label>
  <input
    id="organization"
    type="text"
    required
    className="w-full px-4 py-3 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-150"
    placeholder="Acme Inc."
  />
</div>

// Password Confirmation
<div className="space-y-2">
  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300">
    Confirm password
  </label>
  <input
    id="confirm-password"
    type="password"
    autoComplete="new-password"
    required
    className="w-full px-4 py-3 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-150"
    placeholder="••••••••"
  />
</div>

// Terms Acceptance
<label className="flex items-start text-sm text-gray-400 cursor-pointer">
  <input
    type="checkbox"
    required
    className="w-4 h-4 mt-0.5 rounded border-gray-600 bg-bg-tertiary text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-bg-secondary"
  />
  <span className="ml-2">
    I agree to the{' '}
    <a href="#" className="text-primary-400 hover:text-primary-300 underline">
      Terms of Service
    </a>{' '}
    and{' '}
    <a href="#" className="text-primary-400 hover:text-primary-300 underline">
      Privacy Policy
    </a>
  </span>
</label>
```

**Password Strength Indicator**
```tsx
<div className="mt-2 space-y-1">
  <div className="flex gap-1">
    <div className={`h-1 flex-1 rounded-full ${strength >= 1 ? 'bg-error-500' : 'bg-gray-700'}`}></div>
    <div className={`h-1 flex-1 rounded-full ${strength >= 2 ? 'bg-warning-500' : 'bg-gray-700'}`}></div>
    <div className={`h-1 flex-1 rounded-full ${strength >= 3 ? 'bg-success-500' : 'bg-gray-700'}`}></div>
    <div className={`h-1 flex-1 rounded-full ${strength >= 4 ? 'bg-success-600' : 'bg-gray-700'}`}></div>
  </div>
  <p className="text-xs text-gray-500">
    Use 8+ characters with a mix of letters, numbers & symbols
  </p>
</div>
```

---

## Dashboard Layout

### 1. Main Layout Structure

```
┌──────────────────────────────────────────────────────────────┐
│ Sidebar  │  Top Navigation Bar                               │
│          ├────────────────────────────────────────────────────┤
│          │  Breadcrumbs                                       │
│  [Nav]   ├────────────────────────────────────────────────────┤
│  [Nav]   │                                                    │
│  [Nav]   │                                                    │
│  [Nav]   │          Main Content Area                        │
│  [Nav]   │          (Scrollable)                             │
│          │                                                    │
│          │                                                    │
│          │                                                    │
└──────────┴────────────────────────────────────────────────────┘
```

### 2. Sidebar Navigation

#### Expanded State (280px width)
```tsx
<aside className="fixed top-0 left-0 h-screen w-[280px] bg-bg-secondary border-r border-gray-800 flex flex-col z-20">
  {/* Logo Section */}
  <div className="h-16 flex items-center px-6 border-b border-gray-800">
    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg"></div>
    <span className="ml-3 text-lg font-bold text-white">AI Commerce</span>
  </div>

  {/* Organization Switcher */}
  <div className="px-4 py-4 border-b border-gray-800">
    <button className="w-full px-3 py-2 bg-bg-tertiary hover:bg-bg-elevated rounded-lg flex items-center justify-between text-left transition-colors duration-150">
      <div className="flex items-center min-w-0">
        <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          AC
        </div>
        <div className="ml-3 min-w-0">
          <p className="text-sm font-medium text-white truncate">Acme Corporation</p>
          <p className="text-xs text-gray-500">3 members</p>
        </div>
      </div>
      <ChevronDownIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
    </button>
  </div>

  {/* Navigation Items */}
  <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
    {/* Active Item */}
    <a
      href="/dashboard"
      className="flex items-center px-3 py-2 text-sm font-medium text-white bg-primary-500/10 border-l-2 border-primary-500 rounded-r-lg hover:bg-primary-500/20 transition-colors duration-150"
    >
      <DashboardIcon className="w-5 h-5 text-primary-400" />
      <span className="ml-3">Dashboard</span>
    </a>

    {/* Regular Items */}
    <a
      href="/leads"
      className="flex items-center px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-bg-elevated rounded-lg transition-colors duration-150"
    >
      <LeadsIcon className="w-5 h-5" />
      <span className="ml-3">Leads</span>
      <span className="ml-auto px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs font-semibold rounded-full">
        12
      </span>
    </a>

    <a
      href="/chatbot"
      className="flex items-center px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-bg-elevated rounded-lg transition-colors duration-150"
    >
      <ChatIcon className="w-5 h-5" />
      <span className="ml-3">Chatbot</span>
    </a>

    <a
      href="/settings"
      className="flex items-center px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-bg-elevated rounded-lg transition-colors duration-150"
    >
      <SettingsIcon className="w-5 h-5" />
      <span className="ml-3">Settings</span>
    </a>

    {/* Divider */}
    <div className="pt-4 mt-4 border-t border-gray-800">
      <p className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Organization
      </p>
    </div>

    <a
      href="/team"
      className="flex items-center px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-bg-elevated rounded-lg transition-colors duration-150"
    >
      <TeamIcon className="w-5 h-5" />
      <span className="ml-3">Team</span>
    </a>

    <a
      href="/billing"
      className="flex items-center px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-bg-elevated rounded-lg transition-colors duration-150"
    >
      <BillingIcon className="w-5 h-5" />
      <span className="ml-3">Billing</span>
    </a>
  </nav>

  {/* User Profile Section */}
  <div className="p-4 border-t border-gray-800">
    <button className="w-full px-3 py-2 hover:bg-bg-elevated rounded-lg flex items-center text-left transition-colors duration-150">
      <img
        src="/avatar.jpg"
        alt="User avatar"
        className="w-8 h-8 rounded-full"
      />
      <div className="ml-3 min-w-0">
        <p className="text-sm font-medium text-white truncate">John Doe</p>
        <p className="text-xs text-gray-500">john@acme.com</p>
      </div>
      <MoreIcon className="w-4 h-4 text-gray-400 ml-auto" />
    </button>
  </div>
</aside>
```

#### Collapsed State (72px width)
```tsx
<aside className="fixed top-0 left-0 h-screen w-[72px] bg-bg-secondary border-r border-gray-800 flex flex-col z-20">
  {/* Logo Section */}
  <div className="h-16 flex items-center justify-center border-b border-gray-800">
    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg"></div>
  </div>

  {/* Organization Switcher - Icon Only */}
  <div className="px-3 py-4 border-b border-gray-800">
    <button className="w-full h-10 bg-bg-tertiary hover:bg-bg-elevated rounded-lg flex items-center justify-center transition-colors duration-150">
      <div className="w-6 h-6 bg-primary-500 rounded-md text-white text-xs font-semibold flex items-center justify-center">
        AC
      </div>
    </button>
  </div>

  {/* Navigation Items - Icons Only */}
  <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
    <a
      href="/dashboard"
      className="w-full h-10 flex items-center justify-center text-primary-400 bg-primary-500/10 border-l-2 border-primary-500 rounded-r-lg hover:bg-primary-500/20 transition-colors duration-150"
      title="Dashboard"
    >
      <DashboardIcon className="w-5 h-5" />
    </a>
    {/* More items... */}
  </nav>

  {/* Toggle Button */}
  <div className="p-3 border-t border-gray-800">
    <button
      className="w-full h-10 flex items-center justify-center hover:bg-bg-elevated rounded-lg transition-colors duration-150"
      title="Expand sidebar"
    >
      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
    </button>
  </div>
</aside>
```

### 3. Top Navigation Bar

```tsx
<header className="fixed top-0 left-0 right-0 h-16 bg-bg-secondary border-b border-gray-800 z-10 ml-[280px]">
  <div className="h-full px-6 flex items-center justify-between">
    {/* Left Section - Breadcrumbs/Page Title */}
    <div className="flex items-center space-x-4">
      <h1 className="text-xl font-semibold text-white">Dashboard</h1>
    </div>

    {/* Right Section - Actions & User Menu */}
    <div className="flex items-center space-x-4">
      {/* Search */}
      <button className="flex items-center px-4 py-2 bg-bg-tertiary hover:bg-bg-elevated rounded-lg text-gray-400 text-sm transition-colors duration-150">
        <SearchIcon className="w-4 h-4 mr-2" />
        <span>Search...</span>
        <kbd className="ml-4 px-1.5 py-0.5 bg-bg-primary rounded text-xs font-mono text-gray-500">
          ⌘K
        </kbd>
      </button>

      {/* Notifications */}
      <button className="relative p-2 hover:bg-bg-elevated rounded-lg transition-colors duration-150">
        <BellIcon className="w-5 h-5 text-gray-400" />
        <span className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full"></span>
      </button>

      {/* User Menu Dropdown */}
      <button className="flex items-center space-x-3 p-2 hover:bg-bg-elevated rounded-lg transition-colors duration-150">
        <img
          src="/avatar.jpg"
          alt="User avatar"
          className="w-8 h-8 rounded-full"
        />
        <ChevronDownIcon className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  </div>
</header>
```

### 4. Breadcrumbs

```tsx
<nav aria-label="Breadcrumb" className="h-12 px-6 ml-[280px] flex items-center border-b border-gray-800 bg-bg-primary">
  <ol className="flex items-center space-x-2 text-sm">
    <li>
      <a href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
        Dashboard
      </a>
    </li>
    <li className="text-gray-600">
      <ChevronRightIcon className="w-4 h-4" />
    </li>
    <li>
      <a href="/leads" className="text-gray-400 hover:text-white transition-colors">
        Leads
      </a>
    </li>
    <li className="text-gray-600">
      <ChevronRightIcon className="w-4 h-4" />
    </li>
    <li aria-current="page" className="text-white font-medium">
      Lead Details
    </li>
  </ol>
</nav>
```

### 5. Main Content Area

```tsx
<main className="ml-[280px] mt-16 min-h-screen bg-bg-primary">
  <div className="max-w-7xl mx-auto px-6 py-8">
    {/* Page content goes here */}
  </div>
</main>
```

---

## UI Components

### 1. Buttons

#### Primary Button
```tsx
<button
  type="button"
  className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-glow-primary hover:from-primary-600 hover:to-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-bg-primary transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
>
  Primary Button
</button>
```

#### Accent/CTA Button (Yellow)
```tsx
<button
  type="button"
  className="px-6 py-3 bg-gradient-to-r from-accent-400 to-accent-500 text-bg-primary font-semibold rounded-lg shadow-lg hover:shadow-glow-accent hover:from-accent-500 hover:to-accent-600 focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-bg-primary transition-all duration-150"
>
  Get Started
</button>
```

#### Secondary Button
```tsx
<button
  type="button"
  className="px-6 py-3 bg-bg-tertiary text-white font-semibold rounded-lg border border-gray-700 hover:bg-bg-elevated hover:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-bg-primary transition-all duration-150"
>
  Secondary Button
</button>
```

#### Outline Button
```tsx
<button
  type="button"
  className="px-6 py-3 bg-transparent text-primary-400 font-semibold rounded-lg border-2 border-primary-500 hover:bg-primary-500/10 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-bg-primary transition-all duration-150"
>
  Outline Button
</button>
```

#### Ghost Button
```tsx
<button
  type="button"
  className="px-4 py-2 text-gray-400 font-medium rounded-lg hover:bg-bg-elevated hover:text-white focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-bg-primary transition-all duration-150"
>
  Ghost Button
</button>
```

#### Destructive Button
```tsx
<button
  type="button"
  className="px-6 py-3 bg-error-500 text-white font-semibold rounded-lg shadow-lg hover:bg-error-600 focus:ring-2 focus:ring-error-500 focus:ring-offset-2 focus:ring-offset-bg-primary transition-all duration-150"
>
  Delete
</button>
```

#### Button Sizes
```tsx
// Small
className="px-4 py-2 text-sm"

// Medium (default)
className="px-6 py-3 text-base"

// Large
className="px-8 py-4 text-lg"
```

#### Icon Buttons
```tsx
// Icon only
<button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-bg-elevated transition-colors duration-150">
  <PlusIcon className="w-5 h-5 text-gray-400" />
</button>

// Icon + Text
<button className="px-4 py-2 flex items-center space-x-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-150">
  <PlusIcon className="w-4 h-4" />
  <span>Add New</span>
</button>
```

#### Loading Button
```tsx
<button
  disabled
  className="px-6 py-3 bg-primary-500/80 text-white font-semibold rounded-lg cursor-wait flex items-center justify-center"
>
  <LoadingSpinner className="w-5 h-5 mr-2 animate-spin" />
  Processing...
</button>
```

### 2. Input Fields

#### Text Input
```tsx
<div className="space-y-2">
  <label htmlFor="input-id" className="block text-sm font-medium text-gray-300">
    Label
  </label>
  <input
    id="input-id"
    type="text"
    className="w-full px-4 py-3 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-150"
    placeholder="Enter text..."
  />
  <p className="text-sm text-gray-500">Helper text goes here</p>
</div>
```

#### Input with Icon
```tsx
<div className="relative">
  <div className="absolute left-3 top-1/2 -translate-y-1/2">
    <SearchIcon className="w-5 h-5 text-gray-500" />
  </div>
  <input
    type="text"
    className="w-full pl-10 pr-4 py-3 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
    placeholder="Search..."
  />
</div>
```

#### Input Error State
```tsx
<div className="space-y-2">
  <label htmlFor="error-input" className="block text-sm font-medium text-gray-300">
    Email
  </label>
  <input
    id="error-input"
    type="email"
    className="w-full px-4 py-3 bg-bg-tertiary border-2 border-error-500 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-error-500"
    aria-invalid="true"
    aria-describedby="error-message"
  />
  <p id="error-message" className="text-sm text-error-400 flex items-center">
    <AlertCircleIcon className="w-4 h-4 mr-1" />
    Invalid email format
  </p>
</div>
```

#### Input Success State
```tsx
<div className="relative">
  <input
    type="text"
    className="w-full px-4 py-3 pr-10 bg-bg-tertiary border-2 border-success-500 rounded-lg text-white focus:ring-2 focus:ring-success-500"
  />
  <div className="absolute right-3 top-1/2 -translate-y-1/2">
    <CheckCircleIcon className="w-5 h-5 text-success-500" />
  </div>
</div>
```

#### Textarea
```tsx
<textarea
  rows={4}
  className="w-full px-4 py-3 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
  placeholder="Enter description..."
></textarea>
```

#### Select Dropdown
```tsx
<select
  className="w-full px-4 py-3 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none cursor-pointer"
  style={{
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
    backgroundPosition: 'right 0.5rem center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '1.5em 1.5em',
    paddingRight: '2.5rem'
  }}
>
  <option>Select an option</option>
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

### 3. Cards

#### Basic Card
```tsx
<div className="bg-bg-secondary border border-gray-800 rounded-xl p-6 shadow-lg">
  <h3 className="text-lg font-semibold text-white mb-2">Card Title</h3>
  <p className="text-gray-400">Card content goes here...</p>
</div>
```

#### Card with Header
```tsx
<div className="bg-bg-secondary border border-gray-800 rounded-xl shadow-lg overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-800">
    <h3 className="text-lg font-semibold text-white">Card Header</h3>
    <p className="text-sm text-gray-400">Subtitle or description</p>
  </div>
  <div className="p-6">
    <p className="text-gray-400">Card body content...</p>
  </div>
  <div className="px-6 py-4 border-t border-gray-800 bg-bg-tertiary">
    <button className="text-primary-400 hover:text-primary-300 font-medium text-sm">
      Card Action
    </button>
  </div>
</div>
```

#### Stat Card
```tsx
<div className="bg-bg-secondary border border-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-150">
  <div className="flex items-center justify-between mb-4">
    <div className="w-12 h-12 bg-primary-500/10 rounded-lg flex items-center justify-center">
      <UsersIcon className="w-6 h-6 text-primary-400" />
    </div>
    <span className="px-2 py-1 bg-success-500/10 text-success-400 text-xs font-semibold rounded-full">
      +12%
    </span>
  </div>
  <p className="text-sm text-gray-400 mb-1">Total Leads</p>
  <p className="text-3xl font-bold text-white">1,234</p>
</div>
```

#### Interactive Card (Clickable)
```tsx
<button className="w-full text-left bg-bg-secondary border border-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl hover:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-bg-primary transition-all duration-150">
  {/* Card content */}
</button>
```

### 4. Modal/Dialog

```tsx
// Backdrop
<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-center justify-center p-4">
  {/* Modal Container */}
  <div
    className="bg-bg-secondary border border-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
    role="dialog"
    aria-labelledby="modal-title"
    aria-modal="true"
  >
    {/* Modal Header */}
    <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
      <h2 id="modal-title" className="text-xl font-semibold text-white">
        Modal Title
      </h2>
      <button
        className="p-1 hover:bg-bg-elevated rounded-lg transition-colors"
        aria-label="Close modal"
      >
        <XIcon className="w-5 h-5 text-gray-400" />
      </button>
    </div>

    {/* Modal Body */}
    <div className="flex-1 px-6 py-6 overflow-y-auto">
      <p className="text-gray-400">Modal content goes here...</p>
    </div>

    {/* Modal Footer */}
    <div className="px-6 py-4 border-t border-gray-800 bg-bg-tertiary flex items-center justify-end space-x-3">
      <button className="px-4 py-2 text-gray-400 font-medium rounded-lg hover:bg-bg-elevated hover:text-white transition-colors">
        Cancel
      </button>
      <button className="px-6 py-2 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors">
        Confirm
      </button>
    </div>
  </div>
</div>
```

### 5. Dropdown Menu

```tsx
<div className="relative inline-block text-left">
  {/* Trigger Button */}
  <button className="flex items-center space-x-2 px-4 py-2 bg-bg-tertiary hover:bg-bg-elevated rounded-lg transition-colors">
    <span className="text-white">Options</span>
    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
  </button>

  {/* Dropdown Panel */}
  <div className="absolute right-0 mt-2 w-56 bg-bg-secondary border border-gray-800 rounded-xl shadow-xl z-10 overflow-hidden">
    <div className="py-1">
      <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-bg-elevated hover:text-white transition-colors flex items-center">
        <EditIcon className="w-4 h-4 mr-3" />
        Edit
      </button>
      <button className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-bg-elevated hover:text-white transition-colors flex items-center">
        <DuplicateIcon className="w-4 h-4 mr-3" />
        Duplicate
      </button>
      <div className="my-1 border-t border-gray-800"></div>
      <button className="w-full px-4 py-2 text-left text-sm text-error-400 hover:bg-error-500/10 hover:text-error-300 transition-colors flex items-center">
        <TrashIcon className="w-4 h-4 mr-3" />
        Delete
      </button>
    </div>
  </div>
</div>
```

### 6. Toast Notifications

```tsx
// Success Toast
<div className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-bg-secondary border border-gray-800 rounded-xl shadow-2xl p-4 flex items-start space-x-3">
  <div className="flex-shrink-0 w-8 h-8 bg-success-500/10 rounded-lg flex items-center justify-center">
    <CheckCircleIcon className="w-5 h-5 text-success-500" />
  </div>
  <div className="flex-1 min-w-0">
    <p className="text-sm font-semibold text-white">Success!</p>
    <p className="text-sm text-gray-400">Your changes have been saved.</p>
  </div>
  <button className="flex-shrink-0 p-1 hover:bg-bg-elevated rounded-lg transition-colors">
    <XIcon className="w-4 h-4 text-gray-400" />
  </button>
</div>

// Error Toast
<div className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-bg-secondary border border-error-500/50 rounded-xl shadow-2xl p-4 flex items-start space-x-3">
  <div className="flex-shrink-0 w-8 h-8 bg-error-500/10 rounded-lg flex items-center justify-center">
    <AlertCircleIcon className="w-5 h-5 text-error-500" />
  </div>
  <div className="flex-1 min-w-0">
    <p className="text-sm font-semibold text-white">Error</p>
    <p className="text-sm text-gray-400">Something went wrong. Please try again.</p>
  </div>
  <button className="flex-shrink-0 p-1 hover:bg-bg-elevated rounded-lg transition-colors">
    <XIcon className="w-4 h-4 text-gray-400" />
  </button>
</div>

// Info Toast
<div className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-bg-secondary border border-gray-800 rounded-xl shadow-2xl p-4 flex items-start space-x-3">
  <div className="flex-shrink-0 w-8 h-8 bg-info-500/10 rounded-lg flex items-center justify-center">
    <InfoIcon className="w-5 h-5 text-info-500" />
  </div>
  <div className="flex-1 min-w-0">
    <p className="text-sm font-semibold text-white">Info</p>
    <p className="text-sm text-gray-400">New features have been released.</p>
  </div>
  <button className="flex-shrink-0 p-1 hover:bg-bg-elevated rounded-lg transition-colors">
    <XIcon className="w-4 h-4 text-gray-400" />
  </button>
</div>
```

### 7. Loading Spinner

```tsx
// Small Spinner
<svg className="animate-spin h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
</svg>

// Large Spinner
<svg className="animate-spin h-12 w-12 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
</svg>

// Full Page Loading
<div className="fixed inset-0 bg-bg-primary flex items-center justify-center z-50">
  <div className="text-center">
    <svg className="animate-spin h-12 w-12 text-primary-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="text-gray-400">Loading...</p>
  </div>
</div>
```

### 8. Empty State

```tsx
<div className="py-12 text-center">
  <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
    <InboxIcon className="w-8 h-8 text-gray-600" />
  </div>
  <h3 className="text-lg font-semibold text-white mb-2">No leads yet</h3>
  <p className="text-gray-400 mb-6 max-w-sm mx-auto">
    Get started by creating your first lead or connecting your chatbot.
  </p>
  <button className="px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors">
    Create Lead
  </button>
</div>
```

### 9. Badge/Tag

```tsx
// Status Badges
<span className="px-2 py-1 bg-success-500/10 text-success-400 text-xs font-semibold rounded-full">
  Active
</span>

<span className="px-2 py-1 bg-warning-500/10 text-warning-400 text-xs font-semibold rounded-full">
  Pending
</span>

<span className="px-2 py-1 bg-error-500/10 text-error-400 text-xs font-semibold rounded-full">
  Closed
</span>

<span className="px-2 py-1 bg-gray-800 text-gray-400 text-xs font-semibold rounded-full">
  Inactive
</span>

// Removable Tag
<span className="inline-flex items-center px-3 py-1 bg-primary-500/10 text-primary-400 text-sm font-medium rounded-full">
  Tag Name
  <button className="ml-2 hover:text-primary-300">
    <XIcon className="w-3 h-3" />
  </button>
</span>
```

### 10. Progress Bar

```tsx
<div className="space-y-2">
  <div className="flex items-center justify-between text-sm">
    <span className="text-gray-400">Progress</span>
    <span className="text-white font-medium">75%</span>
  </div>
  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
    <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300" style={{ width: '75%' }}></div>
  </div>
</div>
```

---

## Organization Management

### 1. Organization Creation Modal

```tsx
<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 flex items-center justify-center p-4">
  <div className="bg-bg-secondary border border-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
    {/* Header */}
    <div className="px-6 py-4 border-b border-gray-800">
      <h2 className="text-xl font-semibold text-white">Create Organization</h2>
      <p className="text-sm text-gray-400 mt-1">Set up your new organization</p>
    </div>

    {/* Body */}
    <div className="px-6 py-6 space-y-4">
      {/* Organization Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Organization Name
        </label>
        <input
          type="text"
          className="w-full px-4 py-3 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Acme Corporation"
        />
      </div>

      {/* Organization Slug */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          URL Slug
        </label>
        <div className="flex items-center">
          <span className="px-3 py-3 bg-bg-elevated border border-gray-700 border-r-0 rounded-l-lg text-gray-500 text-sm">
            app.aicommerce.com/
          </span>
          <input
            type="text"
            className="flex-1 px-4 py-3 bg-bg-tertiary border border-gray-700 rounded-r-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="acme-corp"
          />
        </div>
        <p className="text-xs text-gray-500">Only lowercase letters, numbers, and hyphens</p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Description (optional)
        </label>
        <textarea
          rows={3}
          className="w-full px-4 py-3 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          placeholder="Brief description of your organization"
        ></textarea>
      </div>
    </div>

    {/* Footer */}
    <div className="px-6 py-4 border-t border-gray-800 bg-bg-tertiary flex items-center justify-end space-x-3">
      <button className="px-4 py-2 text-gray-400 font-medium rounded-lg hover:bg-bg-elevated hover:text-white transition-colors">
        Cancel
      </button>
      <button className="px-6 py-2 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors">
        Create Organization
      </button>
    </div>
  </div>
</div>
```

### 2. Member Invitation Form

```tsx
<div className="bg-bg-secondary border border-gray-800 rounded-xl p-6 shadow-lg">
  <h3 className="text-lg font-semibold text-white mb-4">Invite Team Members</h3>

  <div className="space-y-4">
    {/* Email Input */}
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        Email Address
      </label>
      <input
        type="email"
        className="w-full px-4 py-3 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        placeholder="colleague@example.com"
      />
    </div>

    {/* Role Select */}
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        Role
      </label>
      <select
        className="w-full px-4 py-3 bg-bg-tertiary border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        <option>Member</option>
        <option>Admin</option>
      </select>
    </div>

    {/* Personal Message */}
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        Personal Message (optional)
      </label>
      <textarea
        rows={2}
        className="w-full px-4 py-3 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
        placeholder="Add a personal note..."
      ></textarea>
    </div>

    {/* Buttons */}
    <div className="flex space-x-3">
      <button className="flex-1 px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors">
        Send Invitation
      </button>
      <button className="px-6 py-3 bg-bg-tertiary text-gray-400 font-medium rounded-lg border border-gray-700 hover:bg-bg-elevated hover:text-white transition-colors">
        Copy Link
      </button>
    </div>
  </div>
</div>
```

### 3. Member List Table

```tsx
<div className="bg-bg-secondary border border-gray-800 rounded-xl shadow-lg overflow-hidden">
  {/* Header */}
  <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
    <h3 className="text-lg font-semibold text-white">Team Members</h3>
    <button className="px-4 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors flex items-center">
      <PlusIcon className="w-4 h-4 mr-2" />
      Invite Member
    </button>
  </div>

  {/* Table */}
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="bg-bg-tertiary border-b border-gray-800">
          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Member
          </th>
          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Role
          </th>
          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Joined
          </th>
          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-800">
        {/* Member Row */}
        <tr className="hover:bg-bg-tertiary transition-colors">
          <td className="px-6 py-4">
            <div className="flex items-center">
              <img
                src="/avatar.jpg"
                alt="User avatar"
                className="w-10 h-10 rounded-full"
              />
              <div className="ml-3">
                <p className="text-sm font-medium text-white">John Doe</p>
                <p className="text-sm text-gray-400">john@acme.com</p>
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            <span className="px-2 py-1 bg-primary-500/10 text-primary-400 text-xs font-semibold rounded-full">
              Admin
            </span>
          </td>
          <td className="px-6 py-4">
            <span className="px-2 py-1 bg-success-500/10 text-success-400 text-xs font-semibold rounded-full">
              Active
            </span>
          </td>
          <td className="px-6 py-4 text-sm text-gray-400">
            Jan 15, 2024
          </td>
          <td className="px-6 py-4 text-right">
            <button className="p-2 hover:bg-bg-elevated rounded-lg transition-colors">
              <MoreIcon className="w-5 h-5 text-gray-400" />
            </button>
          </td>
        </tr>

        {/* Pending Invitation Row */}
        <tr className="hover:bg-bg-tertiary transition-colors opacity-60">
          <td className="px-6 py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                <MailIcon className="w-5 h-5 text-gray-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">jane@acme.com</p>
                <p className="text-sm text-gray-400">Invitation pending</p>
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            <span className="px-2 py-1 bg-gray-800 text-gray-400 text-xs font-semibold rounded-full">
              Member
            </span>
          </td>
          <td className="px-6 py-4">
            <span className="px-2 py-1 bg-warning-500/10 text-warning-400 text-xs font-semibold rounded-full">
              Pending
            </span>
          </td>
          <td className="px-6 py-4 text-sm text-gray-400">
            Invited 2 days ago
          </td>
          <td className="px-6 py-4 text-right">
            <button className="text-primary-400 hover:text-primary-300 text-sm font-medium mr-3">
              Resend
            </button>
            <button className="text-error-400 hover:text-error-300 text-sm font-medium">
              Cancel
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

---

## Responsive Behavior Summary

### Mobile (< 640px)
- Sidebar: Hidden by default, slide-in drawer when opened
- Navigation: Bottom tab bar or hamburger menu
- Cards: Full width, single column
- Forms: Full width inputs, vertical stacking
- Tables: Horizontal scroll or card-based mobile view
- Modals: Full screen or near-full screen

### Tablet (640px - 1024px)
- Sidebar: Collapsed (icons only) or hidden with drawer
- Navigation: Collapsed sidebar with icons
- Cards: 2-column grid
- Forms: 2-column layouts where appropriate
- Tables: Full table with horizontal scroll if needed

### Desktop (>= 1024px)
- Sidebar: Expanded with labels
- Navigation: Full sidebar navigation
- Cards: 3-4 column grid
- Forms: Multi-column with inline labels
- Tables: Full table with all columns visible
- Max content width: 1280px (xl)

---

## Accessibility Checklist

- [ ] All interactive elements keyboard accessible
- [ ] Logical tab order
- [ ] Visible focus indicators (2px ring, primary color)
- [ ] All images have alt text
- [ ] Form inputs have associated labels
- [ ] Error messages announced to screen readers
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Touch targets minimum 48x48px
- [ ] Semantic HTML structure
- [ ] ARIA labels for icon-only buttons
- [ ] Reduced motion support
- [ ] Skip navigation links
