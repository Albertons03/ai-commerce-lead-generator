'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, MessageSquare, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface WelcomeModalProps {
  userName: string
  orgSlug: string
}

export function WelcomeModal({ userName, orgSlug }: WelcomeModalProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Check if user has seen welcome modal
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome')
    if (!hasSeenWelcome) {
      // Small delay to let the dashboard render first
      setTimeout(() => setOpen(true), 500)
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem('hasSeenWelcome', 'true')
    setOpen(false)
  }

  const handleStartSetup = () => {
    localStorage.setItem('hasSeenWelcome', 'true')
    setOpen(false)
    // Navigate to setup wizard
    window.location.href = `/${orgSlug}/setup`
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <span className="text-3xl">👋</span>
            Welcome to Your AI Lead Generator, {userName}!
          </DialogTitle>
          <DialogDescription className="text-base mt-2 text-gray-400">
            Get your first qualified lead in 60 seconds. Here's how:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Step 1 */}
          <div className="flex gap-4 items-start p-4 rounded-lg bg-bg-secondary border border-border-primary hover:border-primary-500/30 transition-colors">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-hero text-white flex items-center justify-center font-bold text-lg shadow-lg">
              1
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary-400" />
                <h4 className="font-semibold text-white text-lg">Train Your AI on Products</h4>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Upload your product catalog or enter details manually. The AI learns what you sell
                and can answer customer questions instantly.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4 items-start p-4 rounded-lg bg-bg-secondary border border-border-primary hover:border-primary-500/30 transition-colors">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-hero text-white flex items-center justify-center font-bold text-lg shadow-lg">
              2
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-5 w-5 text-primary-400" />
                <h4 className="font-semibold text-white text-lg">Test the Chatbot</h4>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Chat as a customer would. Our AI detects purchase intent and captures leads
                automatically—no forms required.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4 items-start p-4 rounded-lg bg-bg-secondary border border-border-primary hover:border-primary-500/30 transition-colors">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-hero text-white flex items-center justify-center font-bold text-lg shadow-lg">
              3
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-primary-400" />
                <h4 className="font-semibold text-white text-lg">View Qualified Leads</h4>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                See leads scored 0-100 based on purchase intent, budget signals, and engagement.
                Focus on hot leads first.
              </p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-300 leading-relaxed">
            <strong className="text-white">Pro Tip:</strong> Start with just 3-5 products to test the system.
            You can add more products later as you see what works.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border-primary">
          <Button variant="outline" onClick={handleClose} className="order-2 sm:order-1">
            I'll Explore on My Own
          </Button>
          <Button onClick={handleStartSetup} className="order-1 sm:order-2 gap-2">
            Start Setup (Step 1: Add Products)
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
