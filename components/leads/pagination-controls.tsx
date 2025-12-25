'use client'

import { Button } from '@/components/ui/button'
import { PaginationMeta } from '@/lib/types/lead'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PaginationControlsProps {
  meta: PaginationMeta
  onPageChange: (page: number) => void
  onLimitChange?: (limit: number) => void
}

export function PaginationControls({
  meta,
  onPageChange,
  onLimitChange,
}: PaginationControlsProps) {
  const { page, total_pages, has_prev, has_next, total, limit } = meta

  const startItem = (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      {/* Results info */}
      <div className="text-sm text-gray-400">
        Showing <span className="font-medium text-white">{startItem}</span> to{' '}
        <span className="font-medium text-white">{endItem}</span> of{' '}
        <span className="font-medium text-white">{total}</span> results
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Items per page selector */}
        {onLimitChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Per page:</span>
            <Select
              value={limit.toString()}
              onValueChange={(value) => onLimitChange(Number(value))}
            >
              <SelectTrigger className="w-[70px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => onPageChange(1)}
            disabled={!has_prev}
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">First page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => onPageChange(page - 1)}
            disabled={!has_prev}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>

          <div className="flex items-center gap-1 px-2">
            <span className="text-sm text-white font-medium">{page}</span>
            <span className="text-sm text-gray-400">of</span>
            <span className="text-sm text-white font-medium">{total_pages}</span>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => onPageChange(page + 1)}
            disabled={!has_next}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => onPageChange(total_pages)}
            disabled={!has_next}
          >
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Last page</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
