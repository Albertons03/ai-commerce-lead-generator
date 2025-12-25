'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X, Filter } from 'lucide-react'
import { LeadStatus, LeadSource } from '@/lib/types/lead'

export interface FilterState {
  search: string
  status: LeadStatus | 'all'
  source: LeadSource | 'all'
  dateRange: 'all' | 'today' | '7days' | '30days' | '90days'
}

interface LeadFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  activeFilterCount: number
}

export function LeadFilters({
  filters,
  onFiltersChange,
  activeFilterCount,
}: LeadFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFiltersChange({ ...filters, search: searchValue })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchValue])

  const handleClearFilters = () => {
    setSearchValue('')
    onFiltersChange({
      search: '',
      status: 'all',
      source: 'all',
      dateRange: 'all',
    })
  }

  const hasActiveFilters = activeFilterCount > 0

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status filter */}
        <Select
          value={filters.status}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, status: value as LeadStatus | 'all' })
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <SelectValue placeholder="Status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>

        {/* Source filter */}
        <Select
          value={filters.source}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, source: value as LeadSource | 'all' })
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <SelectValue placeholder="Source" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="chatbot">AI Chatbot</SelectItem>
            <SelectItem value="manual">Manual Entry</SelectItem>
            <SelectItem value="import">Import</SelectItem>
            <SelectItem value="web_form">Web Form</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
          </SelectContent>
        </Select>

        {/* Date range filter */}
        <Select
          value={filters.dateRange}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              dateRange: value as FilterState['dateRange'],
            })
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <SelectValue placeholder="Date Range" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="90days">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Active filter indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Filter className="h-4 w-4" />
          <span>
            {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
          </span>
        </div>
      )}
    </div>
  )
}
