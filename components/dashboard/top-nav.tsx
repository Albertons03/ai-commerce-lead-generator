'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Menu, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OrgSwitcher } from './org-switcher'
import { UserMenu } from './user-menu'
import type { GetUserOrganizationsResult } from '@/lib/supabase/types'

interface TopNavProps {
  orgSlug: string
  organizations: GetUserOrganizationsResult[]
  user: {
    id: string
    email: string
    full_name?: string | null
    avatar_url?: string | null
  }
  onMobileMenuToggle: () => void
  onCreateOrg: () => void
}

export function TopNav({
  orgSlug,
  organizations,
  user,
  onMobileMenuToggle,
  onCreateOrg,
}: TopNavProps) {
  const pathname = usePathname()

  // Generate breadcrumbs from pathname
  const breadcrumbs = React.useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    const items: { label: string; href: string }[] = []

    // Start with Dashboard
    items.push({
      label: 'Dashboard',
      href: `/${orgSlug}`,
    })

    // Process remaining segments (skip orgSlug)
    if (segments.length > 1) {
      for (let i = 1; i < segments.length; i++) {
        const segment = segments[i]
        const label = segment
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')

        items.push({
          label,
          href: `/${segments.slice(0, i + 1).join('/')}`,
        })
      }
    }

    return items
  }, [pathname, orgSlug])

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border-primary bg-bg-secondary/95 backdrop-blur supports-[backdrop-filter]:bg-bg-secondary/80">
      <div className="flex h-full items-center justify-between px-4 gap-4">
        {/* Left side: Mobile menu + Breadcrumbs */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileMenuToggle}
            className="lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm min-w-0" aria-label="Breadcrumb">
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={item.href}>
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
                )}
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-white font-medium truncate">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-gray-400 hover:text-white transition-colors truncate"
                  >
                    {item.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Right side: Org Switcher + User Menu */}
        <div className="flex items-center gap-3">
          <OrgSwitcher
            currentOrgSlug={orgSlug}
            organizations={organizations}
            onCreateOrg={onCreateOrg}
          />
          <UserMenu user={user} orgSlug={orgSlug} />
        </div>
      </div>
    </header>
  )
}
