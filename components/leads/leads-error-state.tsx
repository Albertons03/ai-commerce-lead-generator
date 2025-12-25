import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface LeadsErrorStateProps {
  error: string
  onRetry?: () => void
}

export function LeadsErrorState({ error, onRetry }: LeadsErrorStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-error-500 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          Failed to load leads
        </h3>
        <p className="text-gray-400 text-center mb-6 max-w-md">{error}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="default">
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
