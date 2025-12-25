# Implementation Guide

## Table of Contents
1. [Setup Instructions](#setup-instructions)
2. [shadcn/ui Customization](#shadcnui-customization)
3. [Component Implementation Examples](#component-implementation-examples)
4. [Common Patterns](#common-patterns)
5. [Best Practices](#best-practices)

---

## Setup Instructions

### 1. Install Dependencies

```bash
# Install Tailwind CSS and plugins
npm install -D tailwindcss postcss autoprefixer @tailwindcss/forms @tailwindcss/typography

# Install shadcn/ui CLI
npx shadcn-ui@latest init

# Install required shadcn/ui components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add select
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add table
```

### 2. Configure Tailwind

Copy the `tailwind.config.ts` file from this repository to your project root.

### 3. Setup Global Styles

Create or update your `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Background colors */
    --bg-primary: #0A0E1A;
    --bg-secondary: #141729;
    --bg-tertiary: #1E2238;
    --bg-elevated: #252B47;
    --bg-hover: #2D3454;
  }

  * {
    @apply border-gray-800;
  }

  body {
    @apply bg-bg-primary text-white antialiased;
  }

  /* Improved focus visibility */
  *:focus-visible {
    @apply outline-none ring-2 ring-primary-500 ring-offset-2 ring-offset-bg-primary;
  }

  /* Scrollbar styling for dark theme */
  ::-webkit-scrollbar {
    @apply w-2 h-2;
  }

  ::-webkit-scrollbar-track {
    @apply bg-bg-secondary;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-gray-700 rounded-full hover:bg-gray-600;
  }

  /* Custom animations */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideInUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
}

@layer components {
  /* Custom component classes */
  .gradient-hero {
    @apply bg-gradient-to-br from-primary-500 to-secondary-500;
  }

  .gradient-teal {
    @apply bg-gradient-to-br from-primary-700 to-info-600;
  }

  .card-base {
    @apply bg-bg-secondary border border-gray-800 rounded-xl shadow-lg;
  }

  .input-base {
    @apply w-full px-4 py-3 bg-bg-tertiary border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-150;
  }

  .btn-primary {
    @apply px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-glow-primary hover:from-primary-600 hover:to-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-bg-primary transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-accent {
    @apply px-6 py-3 bg-gradient-to-r from-accent-400 to-accent-500 text-bg-primary font-semibold rounded-lg shadow-lg hover:shadow-glow-accent hover:from-accent-500 hover:to-accent-600 focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-bg-primary transition-all duration-150;
  }

  .btn-secondary {
    @apply px-6 py-3 bg-bg-tertiary text-white font-semibold rounded-lg border border-gray-700 hover:bg-bg-elevated hover:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-bg-primary transition-all duration-150;
  }

  .btn-ghost {
    @apply px-4 py-2 text-gray-400 font-medium rounded-lg hover:bg-bg-elevated hover:text-white focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-bg-primary transition-all duration-150;
  }
}
```

### 4. Setup Font (Inter)

Add to your `app/layout.tsx`:

```tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
```

---

## shadcn/ui Customization

### Button Component Customization

Update `components/ui/button.tsx` to use our color scheme:

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg hover:shadow-glow-primary hover:from-primary-600 hover:to-primary-700",
        accent: "bg-gradient-to-r from-accent-400 to-accent-500 text-bg-primary shadow-lg hover:shadow-glow-accent hover:from-accent-500 hover:to-accent-600",
        secondary: "bg-bg-tertiary text-white border border-gray-700 hover:bg-bg-elevated hover:border-gray-600",
        outline: "bg-transparent text-primary-400 border-2 border-primary-500 hover:bg-primary-500/10",
        ghost: "text-gray-400 hover:bg-bg-elevated hover:text-white",
        destructive: "bg-error-500 text-white shadow-lg hover:bg-error-600",
        link: "text-primary-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-9 px-4 py-2 text-xs",
        lg: "h-14 px-8 py-4 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### Input Component Customization

Update `components/ui/input.tsx`:

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-lg border border-gray-700 bg-bg-tertiary px-4 py-3 text-base text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-150",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```

### Card Component Customization

Update `components/ui/card.tsx`:

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-gray-800 bg-bg-secondary shadow-lg",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 border-b border-gray-800", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-white",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-400", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0 border-t border-gray-800 bg-bg-tertiary", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

### Toast Component Customization

Update `components/ui/toast.tsx` or create a custom toast implementation:

```tsx
import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-4 sm:right-4 sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start space-x-3 overflow-hidden rounded-xl border p-4 shadow-2xl transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-slide-in-right data-[state=closed]:animate-fade-out",
  {
    variants: {
      variant: {
        default: "border-gray-800 bg-bg-secondary",
        success: "border-success-500/50 bg-bg-secondary",
        error: "border-error-500/50 bg-bg-secondary",
        info: "border-info-500/50 bg-bg-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastIcon = ({ variant }: { variant?: "success" | "error" | "info" | "default" }) => {
  const iconClasses = "w-5 h-5"
  const wrapperClasses = "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"

  switch (variant) {
    case "success":
      return (
        <div className={cn(wrapperClasses, "bg-success-500/10")}>
          <CheckCircle className={cn(iconClasses, "text-success-500")} />
        </div>
      )
    case "error":
      return (
        <div className={cn(wrapperClasses, "bg-error-500/10")}>
          <AlertCircle className={cn(iconClasses, "text-error-500")} />
        </div>
      )
    case "info":
      return (
        <div className={cn(wrapperClasses, "bg-info-500/10")}>
          <Info className={cn(iconClasses, "text-info-500")} />
        </div>
      )
    default:
      return null
  }
}

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-gray-700 bg-transparent px-3 text-sm font-medium text-primary-400 transition-colors hover:bg-bg-elevated focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "flex-shrink-0 p-1 text-gray-400 hover:text-gray-300 hover:bg-bg-elevated rounded-lg transition-colors",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold text-white", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm text-gray-400", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastIcon,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
```

---

## Component Implementation Examples

### Login Form Component

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    // Validation
    const newErrors: Record<string, string> = {}
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsLoading(false)
      return
    }

    // TODO: Implement actual login logic with Supabase
    try {
      // await signIn(formData.email, formData.password)
      console.log('Login:', formData)
    } catch (error) {
      setErrors({ general: 'Invalid email or password' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-bg-secondary/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-800">
        {/* Logo & Heading */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
            AI
          </div>
          <span className="ml-3 text-xl font-bold text-white">AI Commerce</span>
        </div>

        <h1 className="text-3xl font-bold text-white text-center mb-2">
          Welcome Back
        </h1>
        <p className="text-center text-gray-400 text-sm mb-8">
          Sign in to your account
        </p>

        {/* Error Message */}
        {errors.general && (
          <div className="mb-6 p-4 bg-error-500/10 border border-error-500/50 rounded-lg">
            <p className="text-sm text-error-400 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              {errors.general}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={errors.email ? 'border-error-500' : ''}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-error-400 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={errors.password ? 'border-error-500 pr-10' : 'pr-10'}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-sm text-error-400 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.password}
              </p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center text-gray-400 cursor-pointer">
              <Checkbox
                checked={formData.rememberMe}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, rememberMe: checked === true })
                }
                className="mr-2"
              />
              <span>Remember me</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-primary-400 hover:text-primary-300 font-medium"
            >
              Forgot password?
            </Link>
          </div>

          {/* Sign In Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-bg-secondary text-gray-500">OR</span>
            </div>
          </div>

          {/* Social Auth Buttons */}
          <Button
            type="button"
            variant="secondary"
            className="w-full"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              {/* Google icon SVG */}
            </svg>
            Continue with Google
          </Button>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              {/* Microsoft icon SVG */}
            </svg>
            Continue with Microsoft
          </Button>
        </form>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-gray-400 mt-8">
          Don't have an account?{' '}
          <Link href="/signup" className="text-primary-400 hover:text-primary-300 font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
```

### Dashboard Stat Card Component

```tsx
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  change?: {
    value: string
    trend: 'up' | 'down' | 'neutral'
  }
  icon: LucideIcon
  iconBgColor?: string
  iconColor?: string
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  iconBgColor = 'bg-primary-500/10',
  iconColor = 'text-primary-400',
}: StatCardProps) {
  return (
    <Card className="hover:shadow-xl transition-shadow duration-150">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", iconBgColor)}>
            <Icon className={cn("w-6 h-6", iconColor)} />
          </div>
          {change && (
            <span
              className={cn(
                "px-2 py-1 text-xs font-semibold rounded-full",
                change.trend === 'up' && "bg-success-500/10 text-success-400",
                change.trend === 'down' && "bg-error-500/10 text-error-400",
                change.trend === 'neutral' && "bg-gray-800 text-gray-400"
              )}
            >
              {change.value}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-400 mb-1">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </CardContent>
    </Card>
  )
}

// Usage example:
// <StatCard
//   title="Total Leads"
//   value="1,234"
//   change={{ value: "+12%", trend: "up" }}
//   icon={Users}
// />
```

### Sidebar Navigation Component

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users, badge: '12' },
  { name: 'Chatbot', href: '/chatbot', icon: MessageSquare },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </Button>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen bg-bg-secondary border-r border-gray-800 flex flex-col z-40 transition-all duration-300",
          collapsed ? "w-[72px]" : "w-[280px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            AI
          </div>
          {!collapsed && (
            <span className="ml-3 text-lg font-bold text-white">AI Commerce</span>
          )}
        </div>

        {/* Organization Switcher */}
        <div className={cn("px-4 py-4 border-b border-gray-800", collapsed && "px-3")}>
          <button
            className={cn(
              "w-full px-3 py-2 bg-bg-tertiary hover:bg-bg-elevated rounded-lg flex items-center justify-between text-left transition-colors duration-150",
              collapsed && "justify-center"
            )}
          >
            <div className="flex items-center min-w-0">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                AC
              </div>
              {!collapsed && (
                <div className="ml-3 min-w-0">
                  <p className="text-sm font-medium text-white truncate">Acme Corporation</p>
                  <p className="text-xs text-gray-500">3 members</p>
                </div>
              )}
            </div>
            {!collapsed && <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150",
                  isActive
                    ? "text-white bg-primary-500/10 border-l-2 border-primary-500"
                    : "text-gray-400 hover:text-white hover:bg-bg-elevated",
                  collapsed && "justify-center"
                )}
                title={collapsed ? item.name : undefined}
              >
                <Icon className={cn("w-5 h-5", isActive && "text-primary-400")} />
                {!collapsed && (
                  <>
                    <span className="ml-3">{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs font-semibold rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-gray-800 hidden lg:block">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronRight className="w-5 h-5 mr-2" />
                Collapse
              </>
            )}
          </Button>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-t border-gray-800">
          <button
            className={cn(
              "w-full px-3 py-2 hover:bg-bg-elevated rounded-lg flex items-center text-left transition-colors duration-150",
              collapsed && "justify-center"
            )}
          >
            <img
              src="/avatar.jpg"
              alt="User avatar"
              className="w-8 h-8 rounded-full"
            />
            {!collapsed && (
              <div className="ml-3 min-w-0">
                <p className="text-sm font-medium text-white truncate">John Doe</p>
                <p className="text-xs text-gray-500">john@acme.com</p>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
```

---

## Common Patterns

### Form Validation Pattern

```tsx
import { useState } from 'react'

interface FormData {
  [key: string]: any
}

interface FormErrors {
  [key: string]: string
}

export function useFormValidation<T extends FormData>(
  initialData: T,
  validationRules: Record<keyof T, (value: any) => string | null>
) {
  const [formData, setFormData] = useState<T>(initialData)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    let isValid = true

    Object.keys(validationRules).forEach((key) => {
      const error = validationRules[key](formData[key])
      if (error) {
        newErrors[key] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }

  const handleChange = (field: keyof T, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field as string]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field as string]
        return newErrors
      })
    }
  }

  const handleSubmit = async (onSubmit: (data: T) => Promise<void>) => {
    if (!validate()) return

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    formData,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    setErrors,
  }
}

// Usage:
// const { formData, errors, isSubmitting, handleChange, handleSubmit } = useFormValidation(
//   { email: '', password: '' },
//   {
//     email: (value) => !value ? 'Email required' : !/\S+@\S+/.test(value) ? 'Invalid email' : null,
//     password: (value) => !value ? 'Password required' : value.length < 8 ? 'Too short' : null,
//   }
// )
```

### Loading State Pattern

```tsx
import { Loader2 } from 'lucide-react'

export function LoadingSpinner({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin text-primary-500`} />
  )
}

export function LoadingPage() {
  return (
    <div className="fixed inset-0 bg-bg-primary flex items-center justify-center z-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-400">Loading...</p>
      </div>
    </div>
  )
}

export function LoadingOverlay({ isLoading, children }: { isLoading: boolean; children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-bg-primary/80 backdrop-blur-sm flex items-center justify-center z-10">
          <LoadingSpinner />
        </div>
      )}
    </div>
  )
}
```

### Toast Notification Pattern

```tsx
// hooks/use-toast.ts
import { create } from 'zustand'

type ToastType = 'default' | 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(7)
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }))

    // Auto-remove after duration
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, toast.duration || 5000)
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))

export function useToast() {
  const { addToast } = useToastStore()

  return {
    toast: addToast,
    success: (title: string, description?: string) =>
      addToast({ type: 'success', title, description }),
    error: (title: string, description?: string) =>
      addToast({ type: 'error', title, description }),
    info: (title: string, description?: string) =>
      addToast({ type: 'info', title, description }),
  }
}
```

---

## Best Practices

### 1. Component Organization

```
components/
├── ui/                 # shadcn/ui components
│   ├── button.tsx
│   ├── input.tsx
│   └── ...
├── layout/             # Layout components
│   ├── sidebar.tsx
│   ├── navbar.tsx
│   └── breadcrumbs.tsx
├── features/           # Feature-specific components
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── signup-form.tsx
│   ├── leads/
│   │   ├── lead-list.tsx
│   │   ├── lead-detail.tsx
│   │   └── lead-form.tsx
│   └── chatbot/
│       └── ...
└── shared/             # Shared/common components
    ├── stat-card.tsx
    ├── empty-state.tsx
    └── loading-spinner.tsx
```

### 2. TypeScript Types

```typescript
// types/index.ts
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  organizationId: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  description?: string
  createdAt: string
}

export interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  status: 'new' | 'active' | 'qualified' | 'closed'
  priority: 'low' | 'medium' | 'high'
  source: 'chatbot' | 'manual' | 'import'
  tags: string[]
  notes: Note[]
  createdAt: string
  updatedAt: string
}

export interface Note {
  id: string
  content: string
  authorId: string
  createdAt: string
}
```

### 3. Error Handling

```tsx
// utils/error-handling.ts
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

// In components:
try {
  await submitForm(data)
  toast.success('Success!', 'Your changes have been saved.')
} catch (error) {
  toast.error('Error', getErrorMessage(error))
}
```

### 4. Accessibility Checklist

```tsx
// Always include:
// ✓ Semantic HTML (<nav>, <main>, <article>, etc.)
// ✓ Labels for form inputs
// ✓ ARIA labels for icon-only buttons
// ✓ Keyboard navigation support
// ✓ Focus management in modals
// ✓ Alt text for images
// ✓ Proper heading hierarchy (h1, h2, h3...)
// ✓ Color contrast (use design system colors)
// ✓ Touch targets (min 48px)

// Example accessible button:
<button
  aria-label="Close modal"
  onClick={handleClose}
  className="p-2 hover:bg-bg-elevated rounded-lg"
>
  <X className="w-5 h-5" />
</button>
```

### 5. Performance Optimization

```tsx
// Use React.memo for expensive components
export const StatCard = React.memo(StatCardComponent)

// Use dynamic imports for large components
const ChatbotConfig = dynamic(() => import('@/components/features/chatbot/config'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
})

// Debounce search inputs
import { useDebouncedValue } from '@/hooks/use-debounced-value'

function SearchInput() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)

  useEffect(() => {
    // Fetch results with debouncedSearch
  }, [debouncedSearch])

  return <Input value={search} onChange={(e) => setSearch(e.target.value)} />
}
```

---

## Next Steps

1. **Phase 1 Implementation**:
   - Set up Tailwind and shadcn/ui
   - Implement authentication pages
   - Build dashboard layout with sidebar
   - Create organization management UI

2. **Phase 2 Implementation**:
   - Implement lead list and detail views
   - Build lead creation/editing forms
   - Add filtering and search
   - Create bulk actions

3. **Phase 3 Implementation**:
   - Build chatbot configuration UI
   - Create conversation monitoring interface
   - Implement training data management
   - Generate embed code page

4. **Polish & Testing**:
   - Implement toast notifications
   - Add loading states everywhere
   - Test keyboard navigation
   - Verify color contrast
   - Test responsive layouts
   - Add error boundaries

---

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs/primitives/overview/introduction)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Aria Documentation](https://react-spectrum.adobe.com/react-aria/)
