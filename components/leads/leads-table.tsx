'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from './status-badge'
import { LeadScoreBadge } from './lead-score-badge'
import { RelativeTime } from './relative-time'
import { Lead, SortField, SortOrder } from '@/lib/types/lead'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LeadsTableProps {
  leads: Lead[]
  orgSlug: string
  onSort?: (field: SortField, order: SortOrder) => void
  currentSort?: { field: SortField; order: SortOrder }
}

export function LeadsTable({ leads, orgSlug, onSort, currentSort }: LeadsTableProps) {
  const router = useRouter()

  const handleSort = (field: SortField) => {
    if (!onSort) return

    const newOrder: SortOrder =
      currentSort?.field === field && currentSort?.order === 'asc' ? 'desc' : 'asc'
    onSort(field, newOrder)
  }

  const getSortIcon = (field: SortField) => {
    if (currentSort?.field !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return currentSort.order === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  const handleRowClick = (leadId: string) => {
    router.push(`/${orgSlug}/leads/${leadId}`)
  }

  return (
    <div className="rounded-lg border border-border-primary overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('name')}
                className="hover:bg-transparent font-semibold text-gray-400 hover:text-white px-0"
              >
                Name
                {getSortIcon('name')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('email')}
                className="hover:bg-transparent font-semibold text-gray-400 hover:text-white px-0"
              >
                Email
                {getSortIcon('email')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('status')}
                className="hover:bg-transparent font-semibold text-gray-400 hover:text-white px-0"
              >
                Status
                {getSortIcon('status')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('lead_score')}
                className="hover:bg-transparent font-semibold text-gray-400 hover:text-white px-0"
              >
                Score
                {getSortIcon('lead_score')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('created_at')}
                className="hover:bg-transparent font-semibold text-gray-400 hover:text-white px-0"
              >
                Created
                {getSortIcon('created_at')}
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No leads found.
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow
                key={lead.id}
                onClick={() => handleRowClick(lead.id)}
                className="cursor-pointer hover:bg-bg-elevated transition-colors"
              >
                <TableCell className="font-medium text-white">
                  <div>
                    <div>{lead.name}</div>
                    {lead.company && (
                      <div className="text-xs text-gray-500">{lead.company}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-gray-300">{lead.email}</TableCell>
                <TableCell>
                  <StatusBadge status={lead.status} />
                </TableCell>
                <TableCell>
                  <LeadScoreBadge score={lead.lead_score} />
                </TableCell>
                <TableCell className="text-gray-400">
                  <RelativeTime date={lead.created_at} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
