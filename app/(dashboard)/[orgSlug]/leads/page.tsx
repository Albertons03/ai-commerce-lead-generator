'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LeadsTable } from '@/components/leads/leads-table'
import { LeadFilters, FilterState } from '@/components/leads/lead-filters'
import { PaginationControls } from '@/components/leads/pagination-controls'
import { LeadsTableSkeleton } from '@/components/leads/leads-table-skeleton'
import { LeadsEmptyState } from '@/components/leads/leads-empty-state'
import { LeadsErrorState } from '@/components/leads/leads-error-state'
import { Lead, LeadsResponse, SortField, SortOrder } from '@/lib/types/lead'
import { UserPlus, Download } from 'lucide-react'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

interface LeadListPageProps {
  params: {
    orgSlug: string
  }
}

export default function LeadListPage({ params }: LeadListPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { orgSlug } = params

  // State
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [meta, setMeta] = useState<LeadsResponse['meta'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize filters from URL params
  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get('search') || '',
    status: (searchParams.get('status') as FilterState['status']) || 'all',
    source: (searchParams.get('source') as FilterState['source']) || 'all',
    dateRange: (searchParams.get('dateRange') as FilterState['dateRange']) || 'all',
  })

  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 25)
  const [sortField, setSortField] = useState<SortField>(
    (searchParams.get('sortField') as SortField) || 'created_at'
  )
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    (searchParams.get('sortOrder') as SortOrder) || 'desc'
  )

  // Fetch organization ID from slug
  useEffect(() => {
    async function fetchOrganization() {
      try {
        const supabase = createBrowserSupabaseClient()
        const { data, error } = (await supabase
          .from('organizations')
          .select('id')
          .eq('slug', orgSlug)
          .single()) as { data: { id: string } | null; error: any }

        if (error || !data) {
          console.error('Failed to fetch organization:', error)
          setError('Organization not found')
          setLoading(false)
          return
        }

        setOrganizationId(data.id)
      } catch (err) {
        console.error('Error fetching organization:', err)
        setError('Failed to load organization')
        setLoading(false)
      }
    }

    fetchOrganization()
  }, [orgSlug])

  // Update URL params when filters change
  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams()

    if (filters.search) params.set('search', filters.search)
    if (filters.status !== 'all') params.set('status', filters.status)
    if (filters.source !== 'all') params.set('source', filters.source)
    if (filters.dateRange !== 'all') params.set('dateRange', filters.dateRange)
    if (page !== 1) params.set('page', page.toString())
    if (limit !== 25) params.set('limit', limit.toString())
    if (sortField !== 'created_at') params.set('sortField', sortField)
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder)

    const queryString = params.toString()
    router.replace(`/${orgSlug}/leads${queryString ? `?${queryString}` : ''}`, {
      scroll: false,
    })
  }, [filters, page, limit, sortField, sortOrder, orgSlug, router])

  // Calculate date range for API call
  const getDateRange = (dateRange: FilterState['dateRange']) => {
    const now = new Date()
    const ranges: Record<string, { from?: string; to?: string }> = {
      all: {},
      today: {
        from: new Date(now.setHours(0, 0, 0, 0)).toISOString(),
        to: new Date(now.setHours(23, 59, 59, 999)).toISOString(),
      },
      '7days': {
        from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      '30days': {
        from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      '90days': {
        from: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      },
    }
    return ranges[dateRange] || {}
  }

  // Fetch leads from API
  const fetchLeads = useCallback(async () => {
    // Wait for organization ID to be loaded
    if (!organizationId) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const apiParams = new URLSearchParams()
      // ADD ORGANIZATION ID - THIS WAS MISSING!
      apiParams.set('organization_id', organizationId)
      apiParams.set('page', page.toString())
      apiParams.set('limit', limit.toString())
      apiParams.set('sort_by', sortField)
      apiParams.set('sort_order', sortOrder)

      if (filters.search) apiParams.set('search', filters.search)
      if (filters.status !== 'all') apiParams.set('status', filters.status)
      if (filters.source !== 'all') apiParams.set('source', filters.source)

      const dateRange = getDateRange(filters.dateRange)
      if (dateRange.from) apiParams.set('created_after', dateRange.from)
      if (dateRange.to) apiParams.set('created_before', dateRange.to)

      const response = await fetch(`/api/leads?${apiParams.toString()}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch leads')
      }

      const data: LeadsResponse = await response.json()
      setLeads(data.data)
      setMeta(data.meta)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [organizationId, page, limit, sortField, sortOrder, filters])

  // Fetch leads on mount and when dependencies change
  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // Update URL params when state changes
  useEffect(() => {
    updateUrlParams()
  }, [updateUrlParams])

  // Handle filter changes
  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page when filters change
  }

  // Handle sort changes
  const handleSort = (field: SortField, order: SortOrder) => {
    setSortField(field)
    setSortOrder(order)
    setPage(1) // Reset to first page when sort changes
  }

  // Handle page changes
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Handle limit changes
  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1) // Reset to first page when limit changes
  }

  // Calculate active filter count
  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.status !== 'all' ? 1 : 0) +
    (filters.source !== 'all' ? 1 : 0) +
    (filters.dateRange !== 'all' ? 1 : 0)

  const hasActiveFilters = activeFilterCount > 0

  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      source: 'all',
      dateRange: 'all',
    })
    setPage(1)
  }

  // Handle retry
  const handleRetry = () => {
    fetchLeads()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Leads</h1>
          <p className="text-gray-400 mt-2">
            {meta ? `${meta.total} total leads` : 'Manage your leads'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href={`/${orgSlug}/leads/export`}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/${orgSlug}/leads/new`}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Lead
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <LeadFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            activeFilterCount={activeFilterCount}
          />
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <LeadsTableSkeleton />
      ) : error ? (
        <LeadsErrorState error={error} onRetry={handleRetry} />
      ) : leads.length === 0 ? (
        <LeadsEmptyState
          hasFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
          orgSlug={orgSlug}
        />
      ) : (
        <>
          {/* Table */}
          <LeadsTable
            leads={leads}
            orgSlug={orgSlug}
            onSort={handleSort}
            currentSort={{ field: sortField, order: sortOrder }}
          />

          {/* Pagination */}
          {meta && (
            <Card>
              <CardContent className="py-4">
                <PaginationControls
                  meta={meta}
                  onPageChange={handlePageChange}
                  onLimitChange={handleLimitChange}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
