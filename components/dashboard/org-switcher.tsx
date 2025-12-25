'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronsUpDown, Plus, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { GetUserOrganizationsResult } from '@/lib/supabase/types'

interface OrgSwitcherProps {
  currentOrgSlug: string
  organizations: GetUserOrganizationsResult[]
  onCreateOrg: () => void
}

export function OrgSwitcher({ currentOrgSlug, organizations, onCreateOrg }: OrgSwitcherProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  const currentOrg = organizations.find(
    (org) => org.organization_slug === currentOrgSlug
  )

  const handleSwitchOrg = (slug: string) => {
    if (slug !== currentOrgSlug) {
      router.push(`/${slug}`)
    }
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select organization"
          className="w-[200px] justify-between"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {currentOrg?.organization_name || 'Select organization'}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.organization_id}
            onSelect={() => handleSwitchOrg(org.organization_slug)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="truncate text-sm">
                    {org.organization_name}
                  </span>
                  <span className="text-xs text-gray-400 capitalize">
                    {org.user_role}
                  </span>
                </div>
              </div>
              {org.organization_slug === currentOrgSlug && (
                <Check className="h-4 w-4 flex-shrink-0 text-primary-400" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onCreateOrg} className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          <span>Create Organization</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
