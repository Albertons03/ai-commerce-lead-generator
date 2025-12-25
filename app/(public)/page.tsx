import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Simple landing page */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            AI Commerce Lead Generator
          </h1>

          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Transform your e-commerce business with AI-powered lead generation and intelligent chatbot integration
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" variant="accent">
                Get Started Free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="p-6 rounded-xl bg-bg-secondary border border-border-primary">
              <h3 className="text-xl font-semibold text-white mb-2">AI-Powered</h3>
              <p className="text-gray-400">
                Leverage advanced AI to identify and engage high-quality leads
              </p>
            </div>
            <div className="p-6 rounded-xl bg-bg-secondary border border-border-primary">
              <h3 className="text-xl font-semibold text-white mb-2">Real-time Analytics</h3>
              <p className="text-gray-400">
                Track performance with comprehensive analytics and insights
              </p>
            </div>
            <div className="p-6 rounded-xl bg-bg-secondary border border-border-primary">
              <h3 className="text-xl font-semibold text-white mb-2">Seamless Integration</h3>
              <p className="text-gray-400">
                Connect your existing tools and workflows effortlessly
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
