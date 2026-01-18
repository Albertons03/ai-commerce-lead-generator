'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ArrowRight, ArrowLeft, Sparkles, MessageSquare, TrendingUp, Loader2 } from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import Link from 'next/link'

type SetupStep = 1 | 2 | 3 | 4

export default function SetupWizardPage() {
  const router = useRouter()
  const params = useParams()
  const orgSlug = params.orgSlug as string

  const [currentStep, setCurrentStep] = useState<SetupStep>(1)
  const [loading, setLoading] = useState(false)
  const [organizationId, setOrganizationId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrganization() {
      const supabase = createBrowserSupabaseClient()
      const { data } = (await supabase
        .from('organizations')
        .select('id')
        .eq('slug', orgSlug)
        .single()) as { data: { id: string } | null; error: any }

      if (data) {
        setOrganizationId(data.id)
      }
    }

    fetchOrganization()
  }, [orgSlug])

  const handleAddSampleData = async () => {
    setLoading(true)
    try {
      // Call API to seed sample products
      const response = await fetch('/api/training/seed-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: organizationId }),
      })

      if (response.ok) {
        setCurrentStep(2)
      } else {
        console.error('Failed to seed demo data')
        // Still allow progression for now
        setCurrentStep(2)
      }
    } catch (error) {
      console.error('Error seeding demo data:', error)
      // Still allow progression
      setCurrentStep(2)
    } finally {
      setLoading(false)
    }
  }

  const handleSkipSampleData = () => {
    setCurrentStep(2)
  }

  const handleTestChat = () => {
    router.push(`/${orgSlug}/chatbot?onboarding=true`)
  }

  const handleViewLeads = () => {
    router.push(`/${orgSlug}/leads`)
  }

  const handleComplete = () => {
    // Mark onboarding as complete
    localStorage.setItem('setupWizardComplete', 'true')
    router.push(`/${orgSlug}`)
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Setup Your AI Lead Generator
          </h1>
          <p className="text-gray-400">
            Follow these steps to start capturing qualified leads
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Progress</span>
            <span className="text-sm text-primary-400">
              Step {currentStep} of 3
            </span>
          </div>
          <div className="h-3 bg-bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-hero transition-all duration-500"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>

          {/* Step Indicators */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { num: 1, label: 'Add Products', icon: Sparkles },
              { num: 2, label: 'Test Chatbot', icon: MessageSquare },
              { num: 3, label: 'View Leads', icon: TrendingUp },
            ].map((step) => {
              const Icon = step.icon
              const isActive = currentStep === step.num
              const isComplete = currentStep > step.num

              return (
                <div
                  key={step.num}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                    isActive
                      ? 'border-primary-500 bg-primary-500/10'
                      : isComplete
                      ? 'border-success-500/30 bg-success-500/5'
                      : 'border-border-primary bg-bg-secondary'
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-success-400 flex-shrink-0" />
                  ) : (
                    <Icon
                      className={`h-5 w-5 flex-shrink-0 ${
                        isActive ? 'text-primary-400' : 'text-gray-500'
                      }`}
                    />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      isActive
                        ? 'text-white'
                        : isComplete
                        ? 'text-success-400'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {/* Step 1: Add Products */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-hero text-white flex items-center justify-center font-bold text-xl shadow-lg">
                    1
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Train Your AI on Products</CardTitle>
                    <CardDescription className="text-base mt-1">
                      Takes ~30 seconds
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-gray-400 leading-relaxed">
                  Let's start with demo products so you can see how lead scoring works.
                  You can replace these with your real products later.
                </p>

                <div className="bg-bg-secondary p-6 rounded-lg border border-border-primary">
                  <div className="flex items-start gap-4">
                    <Sparkles className="h-6 w-6 text-primary-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-white font-semibold mb-3">Demo includes:</h4>
                      <ul className="text-gray-400 space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-success-400" />
                          5 sample products with prices and descriptions
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-success-400" />
                          Pre-configured AI chatbot responses
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-success-400" />
                          Example lead scoring scenarios
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleAddSampleData}
                    disabled={loading}
                    size="lg"
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding Sample Data...
                      </>
                    ) : (
                      <>
                        Add Sample Products
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleSkipSampleData}
                    disabled={loading}
                  >
                    Skip for Now
                  </Button>
                </div>

                <div className="text-center">
                  <Button variant="ghost" asChild>
                    <Link href={`/${orgSlug}/settings/training`}>
                      Or add your own products manually
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Test Chatbot */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="h-8 w-8 text-success-400" />
                  <div className="w-12 h-12 rounded-full bg-gradient-hero text-white flex items-center justify-center font-bold text-xl shadow-lg">
                    2
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Test the Chatbot</CardTitle>
                    <CardDescription className="text-base mt-1">
                      Takes ~20 seconds
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-gray-400 leading-relaxed">
                  Try asking about products as a customer would. Watch how the AI detects
                  purchase intent and scores leads automatically.
                </p>

                <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-6">
                  <h4 className="text-white font-semibold mb-3">
                    Try these example questions:
                  </h4>
                  <ul className="text-gray-400 space-y-2">
                    <li>• "I need a laptop under $1000"</li>
                    <li>• "What's your best smartphone deal?"</li>
                    <li>• "My email is test@example.com, can you send me info?"</li>
                    <li>• "I want to buy this immediately, what's the total cost?"</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setCurrentStep(1)}
                    variant="outline"
                    size="lg"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleTestChat} size="lg" className="flex-1">
                    Open Chat Simulator
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentStep(3)}
                  >
                    Skip to next step
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: View Leads */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="h-8 w-8 text-success-400" />
                  <CheckCircle2 className="h-8 w-8 text-success-400" />
                  <div className="w-12 h-12 rounded-full bg-gradient-hero text-white flex items-center justify-center font-bold text-xl shadow-lg">
                    3
                  </div>
                  <div>
                    <CardTitle className="text-2xl">View Your Dashboard</CardTitle>
                    <CardDescription className="text-base mt-1">
                      You're all set!
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-6">
                  <div className="w-20 h-20 rounded-full bg-success-500/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-10 w-10 text-success-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    Setup Complete! 🎉
                  </h3>
                  <p className="text-gray-400 max-w-xl mx-auto mb-6">
                    Your AI lead generator is ready. Captured leads will appear in your
                    dashboard with scores from 0-100 based on purchase intent.
                  </p>
                </div>

                <div className="bg-bg-secondary p-6 rounded-lg border border-border-primary">
                  <h4 className="text-white font-semibold mb-3">What's next?</h4>
                  <ul className="text-gray-400 space-y-2">
                    <li className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary-400" />
                      View leads dashboard to see captured prospects
                    </li>
                    <li className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary-400" />
                      Add your real products to the training system
                    </li>
                    <li className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary-400" />
                      Embed the chatbot on your website
                    </li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    variant="outline"
                    size="lg"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleViewLeads} size="lg" className="flex-1">
                    View Leads Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <div className="text-center">
                  <Button variant="ghost" onClick={handleComplete}>
                    Go to Main Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Need help? Visit our{' '}
            <Link href="/docs" className="text-primary-400 hover:underline">
              documentation
            </Link>{' '}
            or{' '}
            <Link href="/support" className="text-primary-400 hover:underline">
              contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
