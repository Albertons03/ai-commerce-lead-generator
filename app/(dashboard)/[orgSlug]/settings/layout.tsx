'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Settings as SettingsIcon, Users, FileText, Key, CreditCard } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface SettingsTab {
  name: string
  href: string
  icon: LucideIcon
  badge?: string
}

const settingsTabs: SettingsTab[] = [
  {
    name: 'General',
    href: '/settings/general',
    icon: SettingsIcon,
  },
  {
    name: 'Members',
    href: '/settings/members',
    icon: Users,
  },
  {
    name: 'API Keys',
    href: '/settings/api-keys',
    icon: Key,
  },
  {
    name: 'Training',
    href: '/settings/training',
    icon: FileText,
  },
  {
    name: 'Billing',
    href: '/settings/billing',
    icon: CreditCard,
  },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const pathname = usePathname()
  const orgSlug = params.orgSlug as string

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Settings Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="mt-2 text-gray-400">
          Manage your organization settings and preferences
        </p>
      </div>

      {/* Settings Tabs */}
      <div className="border-b border-border-primary">
        <nav className="flex gap-6" aria-label="Settings tabs">
          {settingsTabs.map((tab) => {
            const href = `/${orgSlug}${tab.href}`
            const isActive = pathname === href
            const Icon = tab.icon

            return (
              <Link
                key={tab.name}
                href={href}
                className={cn(
                  'flex items-center gap-2 px-1 py-4 border-b-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-primary-400 text-primary-400'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
                {tab.badge && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-bg-tertiary text-gray-400 border border-border-primary">
                    {tab.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Settings Content */}
      <div>{children}</div>
    </div>
  )
}
