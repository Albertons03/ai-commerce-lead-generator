import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserPlus, Search } from 'lucide-react'
import Link from 'next/link'

interface LeadsEmptyStateProps {
  hasFilters: boolean
  onClearFilters?: () => void
  orgSlug: string
}

export function LeadsEmptyState({
  hasFilters,
  onClearFilters,
  orgSlug,
}: LeadsEmptyStateProps) {
  if (hasFilters) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Search className="h-12 w-12 text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No leads found</h3>
          <p className="text-gray-400 text-center mb-6 max-w-md">
            No leads match your current filters. Try adjusting your search or filter
            criteria.
          </p>
          {onClearFilters && (
            <Button onClick={onClearFilters} variant="outline">
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <UserPlus className="h-12 w-12 text-gray-500 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No leads yet</h3>
        <p className="text-gray-400 text-center mb-6 max-w-md">
          Get started by adding your first lead manually or set up your chatbot to
          capture leads automatically.
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link href={`/${orgSlug}/leads/new`}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Lead
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/${orgSlug}/settings/chatbot`}>Configure Chatbot</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
