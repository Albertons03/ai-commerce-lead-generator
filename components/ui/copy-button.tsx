'use client'

import * as React from 'react'
import { Button } from './button'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CopyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  label?: string
  successMessage?: string
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'icon'
}

/**
 * CopyButton Component
 *
 * A reusable button that copies text to clipboard with visual feedback.
 * Shows a checkmark for 2 seconds after successful copy.
 *
 * @example
 * <CopyButton value="user@example.com" label="Copy Email" />
 */
export function CopyButton({
  value,
  label,
  successMessage = 'Copied!',
  variant = 'ghost',
  size = 'sm',
  className,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn('gap-1.5', className)}
      {...props}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          {label && <span className="text-xs">{successMessage}</span>}
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          {label && <span className="text-xs">{label}</span>}
        </>
      )}
    </Button>
  )
}
