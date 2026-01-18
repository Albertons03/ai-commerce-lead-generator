import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Brain, Target, MessageSquare, TrendingUp, Zap, DollarSign } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-block">
            <span className="px-4 py-1.5 rounded-full bg-primary-500/10 text-primary-400 text-sm font-medium border border-primary-500/20">
              Built for E-commerce SMBs
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
            Turn Website Visitors Into
            <span className="block bg-gradient-hero bg-clip-text text-transparent mt-2">
              Qualified Leads
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            AI-powered chatbot that understands your products, detects purchase intent,
            and scores leads 0-100 automatically. No forms. No friction. Just conversations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/signup">
              <Button size="lg" variant="accent" className="text-lg px-8 py-6">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Book a Demo
              </Button>
            </Link>
          </div>

          <p className="text-sm text-gray-500">
            No credit card required • Setup in 5 minutes • Cancel anytime
          </p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-4 py-12 border-y border-border-primary">
        <p className="text-center text-gray-500 mb-8">Trusted by growing e-commerce teams</p>
        <div className="flex flex-wrap items-center justify-center gap-12 opacity-50">
          <div className="text-gray-600 font-semibold text-lg">Your Brand Here</div>
          <div className="text-gray-600 font-semibold text-lg">Your Brand Here</div>
          <div className="text-gray-600 font-semibold text-lg">Your Brand Here</div>
          <div className="text-gray-600 font-semibold text-lg">Your Brand Here</div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-400">
              From setup to qualified leads in 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-hero" />
              <CardContent className="pt-8 pb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-500/10 text-primary-400 font-bold text-xl mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Train Your AI
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Upload product catalogs, pricing, and FAQs. Our RAG system learns
                  your inventory in minutes—no coding required.
                </p>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-hero" />
              <CardContent className="pt-8 pb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-500/10 text-primary-400 font-bold text-xl mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Embed on Your Site
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  Copy-paste one line of code. The chatbot appears on your site
                  and handles customer questions 24/7.
                </p>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-hero" />
              <CardContent className="pt-8 pb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-500/10 text-primary-400 font-bold text-xl mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Get Qualified Leads
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  AI detects purchase intent, budget signals, and urgency.
                  Leads scored 0-100 land in your dashboard automatically.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Not a CRM? */}
      <section className="bg-bg-secondary/30 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                Not Another CRM
              </h2>
              <p className="text-xl text-gray-400">
                We don't manage your sales pipeline. We fill it with qualified leads.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-bg-secondary">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-error-500/10 flex items-center justify-center">
                      <span className="text-2xl">❌</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-2">Generic CRMs</h4>
                      <ul className="text-sm text-gray-400 space-y-1">
                        <li>• Manual lead entry</li>
                        <li>• No context on buyer intent</li>
                        <li>• Requires forms (friction)</li>
                        <li>• Built for sales teams, not marketing</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary-500/30 bg-bg-secondary">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                      <span className="text-2xl">✅</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-2">Our AI Lead Generator</h4>
                      <ul className="text-sm text-gray-400 space-y-1">
                        <li>• Auto-captures leads from chat</li>
                        <li>• Scores intent 0-100 (Hot/Warm/Cold)</li>
                        <li>• Natural conversations, zero forms</li>
                        <li>• Built for e-commerce conversion</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything You Need to Convert Visitors
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <Brain className="h-10 w-10 text-primary-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  RAG-Powered AI
                </h3>
                <p className="text-sm text-gray-400">
                  Answers product questions using your actual inventory data with pgvector search.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Target className="h-10 w-10 text-primary-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Smart Lead Scoring
                </h3>
                <p className="text-sm text-gray-400">
                  AI analyzes conversation context to score leads 0-100 based on purchase intent.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <MessageSquare className="h-10 w-10 text-primary-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Natural Conversations
                </h3>
                <p className="text-sm text-gray-400">
                  No forms or popups. Just helpful AI chat that captures contact info naturally.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <TrendingUp className="h-10 w-10 text-primary-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Real-Time Dashboard
                </h3>
                <p className="text-sm text-gray-400">
                  Track lead quality, conversion rates, and chat analytics in one clean interface.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Zap className="h-10 w-10 text-primary-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  5-Minute Setup
                </h3>
                <p className="text-sm text-gray-400">
                  No technical skills required. Upload products, copy-paste embed code, done.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <DollarSign className="h-10 w-10 text-primary-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Transparent Pricing
                </h3>
                <p className="text-sm text-gray-400">
                  Pay per qualified lead, not per conversation. No hidden fees or enterprise contracts.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto bg-gradient-hero border-0">
          <CardContent className="pt-12 pb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Capture More Qualified Leads?
            </h2>
            <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">
              Join e-commerce teams using AI to convert visitors into customers.
              Start free, no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-white/10 hover:bg-white/20 border-white/20">
                  Talk to Sales
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-border-primary">
        <div className="text-center text-gray-500 text-sm">
          <p>© 2026 AI Commerce Lead Generator. Built with Next.js, Supabase & OpenAI.</p>
        </div>
      </footer>
    </div>
  )
}
