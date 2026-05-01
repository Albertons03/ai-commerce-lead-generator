'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Users, MessageSquare, Settings, ChevronLeft, ChevronRight, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  orgSlug: string
  orgName: string
  isOpen: boolean
  onToggle: () => void
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '',
    icon: Home,
  },
  {
    name: 'Leads',
    href: '/leads',
    icon: Users,
  },
  {
    name: 'Chatbot',
    href: '/chatbot',
    icon: MessageSquare,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export function Sidebar({ orgSlug, orgName, isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  // Load collapse state from localStorage on mount
  React.useEffect(() => {
    const collapsed = localStorage.getItem('sidebar-collapsed') === 'true'
    setIsCollapsed(collapsed)
  }, [])

  // Save collapse state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', String(newState))
  }

  const baseHref = `/${orgSlug}`

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-bg-secondary border-r border-border-primary z-50 flex flex-col transition-all duration-300',
          isCollapsed ? 'w-20' : 'w-64',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo/Org Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border-primary">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-gradient-hero flex items-center justify-center flex-shrink-0">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-white text-sm truncate">
                  {orgName}
                </h2>
              </div>
            </div>
          ) : (
            <div className="h-9 w-9 rounded-lg bg-gradient-hero flex items-center justify-center mx-auto">
              <Building2 className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navigationItems.map((item) => {
            const href = `${baseHref}${item.href}`
            const isActive = item.href === ''
              ? pathname === baseHref
              : pathname.startsWith(`${baseHref}${item.href}`)
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-bg-elevated text-primary-400 shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-bg-hover',
                  isCollapsed && 'justify-center px-2'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="flex-1">{item.name}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-border-primary">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className={cn(
              'w-full justify-start gap-3',
              isCollapsed && 'justify-center px-2'
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </>
  )
}
