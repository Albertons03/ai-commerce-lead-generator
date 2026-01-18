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
      <CardContent className="flex flex-col items-center justify-center py-16 px-6">
        <div className="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center mb-6">
          <UserPlus className="h-8 w-8 text-primary-400" />
        </div>

        <h3 className="text-2xl font-bold text-white mb-3">Your AI is Ready to Capture Leads</h3>

        <p className="text-gray-400 text-center mb-2 max-w-lg leading-relaxed">
          Your AI lead generator is ready. Train it on your products and start capturing
          qualified leads automatically—no forms, no friction, just conversations.
        </p>

        <p className="text-gray-500 text-center mb-8 max-w-md text-sm">
          Leads are scored 0-100 based on purchase intent, budget signals, and engagement.
          Focus on hot leads first to maximize conversions.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button size="lg" asChild>
            <Link href={`/${orgSlug}/settings/training`}>
              Start Training AI
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href={`/${orgSlug}/chatbot`}>
              Test Chatbot
            </Link>
          </Button>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-bg-elevated rounded-lg border border-border-primary max-w-md">
          <p className="text-sm text-gray-400 text-center">
            <strong className="text-white">Pro Tip:</strong> Test the chatbot first to see
            how lead scoring works, then add your real products.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
