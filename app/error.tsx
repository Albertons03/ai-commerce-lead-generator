'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-bg-secondary p-8 text-center shadow-xl">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Something went wrong!</h2>
          <p className="text-sm text-gray-400">
            {error.message || 'An unexpected error occurred'}
          </p>
        </div>

        <button
          onClick={reset}
          className="w-full rounded-lg bg-primary-500 px-6 py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-primary-600 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
        >
          Try again
        </button>

        <button
          onClick={() => window.location.href = '/'}
          className="w-full rounded-lg border border-border-primary px-6 py-3 text-sm font-semibold text-gray-300 transition-all duration-150 hover:bg-bg-elevated focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
        >
          Go home
        </button>
      </div>
    </div>
  )
}
