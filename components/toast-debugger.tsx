'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { X, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

interface ToastEvent {
  id: string
  type: 'success' | 'error' | 'info' | 'warning' | 'default'
  message: string
  timestamp: string
}

/**
 * Toast Debugger Component
 * Shows all toast notifications in a debug panel during development
 * Only visible in development mode
 */
export function ToastDebugger() {
  const [events, setEvents] = useState<ToastEvent[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Save original toast methods BEFORE overriding
    const originalSuccess = toast.success
    const originalError = toast.error
    const originalInfo = toast.info
    const originalWarning = toast.warning

    const createInterceptor = (type: ToastEvent['type'], originalFn: any) => {
      return (message: string, options?: any) => {
        const event: ToastEvent = {
          id: Math.random().toString(36).substring(7),
          type,
          message,
          timestamp: new Date().toLocaleTimeString(),
        }
        setEvents((prev) => [event, ...prev])

        // Call original toast function
        return originalFn.call(toast, message, options)
      }
    }

    // Override toast methods with interceptors
    ;(toast as any).success = createInterceptor('success', originalSuccess)
    ;(toast as any).error = createInterceptor('error', originalError)
    ;(toast as any).info = createInterceptor('info', originalInfo)
    ;(toast as any).warning = createInterceptor('warning', originalWarning)

    // Cleanup: restore original methods on unmount
    return () => {
      ;(toast as any).success = originalSuccess
      ;(toast as any).error = originalError
      ;(toast as any).info = originalInfo
      ;(toast as any).warning = originalWarning
    }
  }, [])

  const clearEvents = () => setEvents([])

  const getTypeColor = (type: ToastEvent['type']) => {
    switch (type) {
      case 'success': return 'bg-success-500'
      case 'error': return 'bg-error-500'
      case 'warning': return 'bg-warning-500'
      case 'info': return 'bg-info-500'
      default: return 'bg-gray-500'
    }
  }

  const getTypeLabel = (type: ToastEvent['type']) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 rounded-lg bg-bg-secondary p-2 text-xs text-gray-400 shadow-lg hover:bg-bg-elevated"
      >
        Show Toast Debugger
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-96 rounded-lg bg-bg-secondary shadow-2xl ring-1 ring-border-primary">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-primary p-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-accent-400 animate-pulse"></div>
          <h3 className="text-sm font-semibold text-white">
            Toast Debugger {events.length > 0 && `(${events.length})`}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded p-1 text-gray-400 transition-colors hover:bg-bg-elevated hover:text-white"
          >
            {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          {events.length > 0 && (
            <button
              onClick={clearEvents}
              className="rounded p-1 text-gray-400 transition-colors hover:bg-bg-elevated hover:text-white"
              title="Clear all"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={() => setIsVisible(false)}
            className="rounded p-1 text-gray-400 transition-colors hover:bg-bg-elevated hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Events List */}
      {isOpen && (
        <div className="max-h-96 overflow-y-auto p-2">
          {events.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              No toast events yet
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg bg-bg-elevated p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${getTypeColor(event.type)}`}></span>
                        <span className="text-xs font-medium text-gray-400">
                          {getTypeLabel(event.type)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {event.timestamp}
                        </span>
                      </div>
                      <p className="text-sm text-white">{event.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-border-primary px-3 py-2 text-xs text-gray-500">
        Development Mode Only
      </div>
    </div>
  )
}
