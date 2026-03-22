import Link from 'next/link'
import {
  Brain, Target, MessageSquare, TrendingUp, Zap,
  ShoppingBag, ArrowRight, CheckCircle, Star,
  BarChart3, Shield, Sparkles, ChevronRight,
} from 'lucide-react'

// =====================================================
// Navbar
// =====================================================
function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5"
         style={{ background: 'rgba(10, 14, 26, 0.85)', backdropFilter: 'blur(16px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg">LeadAI</span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">How it works</a>
            <a href="#features"     className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#pricing"      className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</a>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block">
              Sign in
            </Link>
            <Link href="/signup"
              className="btn-glow text-sm font-semibold px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-400 text-white transition-colors">
              Start free
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

// =====================================================
// Chat Mockup - Hero preview
// =====================================================
function ChatMockup() {
  return (
    <div className="glass-card rounded-2xl p-4 w-full max-w-sm mx-auto shadow-2xl animate-float">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-white text-sm font-semibold">AI Assistant</p>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-3">
        <div className="flex justify-end">
          <div className="bg-primary-500/20 border border-primary-500/30 rounded-2xl rounded-tr-sm px-3 py-2 max-w-[80%]">
            <p className="text-sm text-white">Do you have wireless headphones under $100?</p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex-shrink-0 mt-1" />
          <div className="glass-card rounded-2xl rounded-tl-sm px-3 py-2 max-w-[85%]">
            <p className="text-sm text-gray-200">
              Yes! The <span className="text-primary-400 font-medium">SoundMax Pro X</span> at $89 has
              40h battery life and is our top seller. Want me to send you the full specs?
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="bg-primary-500/20 border border-primary-500/30 rounded-2xl rounded-tr-sm px-3 py-2">
            <p className="text-sm text-white">Yes please! My email is…</p>
          </div>
        </div>
      </div>

      {/* Lead captured badge */}
      <div className="mt-4 flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2">
        <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
        <p className="text-xs text-green-300 font-medium">Lead captured — Score: <span className="text-green-400 font-bold">87/100</span></p>
      </div>
    </div>
  )
}

// =====================================================
// Stats Bar
// =====================================================
function StatsBar() {
  const stats = [
    { value: '2,400+', label: 'Leads captured' },
    { value: '38%',    label: 'Avg. conversion lift' },
    { value: '5 min',  label: 'Setup time' },
    { value: '24/7',   label: 'Always on' },
  ]

  return (
    <section className="border-y border-white/5" style={{ background: 'rgba(20, 23, 41, 0.5)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl md:text-4xl font-bold animate-gradient-text">{s.value}</p>
              <p className="text-sm text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// =====================================================
// How It Works
// =====================================================
function HowItWorks() {
  const steps = [
    {
      number: '01',
      icon: <ShoppingBag className="h-7 w-7 text-primary-400" />,
      title: 'Connect your store',
      desc: 'Import products via CSV or connect Shopify directly. Our AI learns your catalog in minutes.',
      color: 'from-primary-500/20 to-primary-600/5',
      border: 'border-primary-500/30',
    },
    {
      number: '02',
      icon: <Zap className="h-7 w-7 text-secondary-400" />,
      title: 'Embed one line of code',
      desc: 'Copy-paste a single script tag. The chatbot appears on your site instantly — no dev skills needed.',
      color: 'from-secondary-500/20 to-secondary-600/5',
      border: 'border-secondary-500/30',
    },
    {
      number: '03',
      icon: <Target className="h-7 w-7 text-accent-400" />,
      title: 'Get scored leads',
      desc: 'AI detects purchase intent in real-time. Leads scored 0-100 land in your dashboard automatically.',
      color: 'from-accent-500/20 to-accent-600/5',
      border: 'border-accent-500/30',
    },
  ]

  return (
    <section id="how-it-works" className="py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <span className="text-xs font-semibold tracking-widest text-primary-400 uppercase">Simple Setup</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold text-white">
            From zero to leads
            <span className="block animate-gradient-text">in three steps</span>
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-xl mx-auto">
            No engineers, no complex integrations. If you can copy-paste, you're ready.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-14 left-1/3 right-1/3 h-px bg-gradient-to-r from-primary-500/50 via-secondary-500/50 to-accent-500/50" />

          {steps.map((step, i) => (
            <div key={i}
              className={`glass-card rounded-2xl p-8 bg-gradient-to-b ${step.color} border ${step.border} relative`}>
              {/* Step number */}
              <span className="absolute top-6 right-6 text-4xl font-black text-white/5 select-none">{step.number}</span>

              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-b ${step.color} border ${step.border} flex items-center justify-center mb-6`}>
                {step.icon}
              </div>

              <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
              <p className="text-gray-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// =====================================================
// Features
// =====================================================
function Features() {
  const features = [
    {
      icon: <Brain className="h-6 w-6" />,
      color: 'text-primary-400 bg-primary-500/10',
      title: 'RAG-Powered AI',
      desc: 'Answers product questions using your exact inventory. Vector search finds the right products every time.',
    },
    {
      icon: <Target className="h-6 w-6" />,
      color: 'text-secondary-400 bg-secondary-500/10',
      title: 'Intent Scoring 0–100',
      desc: 'AI analyzes every message for purchase intent, budget signals, and urgency. No guesswork.',
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      color: 'text-accent-400 bg-accent-500/10',
      title: 'Zero-friction Capture',
      desc: 'No pop-ups, no forms. The AI naturally asks for contact details mid-conversation.',
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'text-green-400 bg-green-500/10',
      title: 'Real-Time Dashboard',
      desc: 'Conversion rate, lead quality trends, chat analytics — all in one clean interface.',
    },
    {
      icon: <ShoppingBag className="h-6 w-6" />,
      color: 'text-primary-400 bg-primary-500/10',
      title: 'Shopify Integration',
      desc: 'Connect your Shopify store with OAuth. Products sync automatically — always up to date.',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      color: 'text-secondary-400 bg-secondary-500/10',
      title: 'Enterprise Security',
      desc: 'API key auth, rate limiting, input sanitization. Built production-ready from day one.',
    },
    {
      icon: <Zap className="h-6 w-6" />,
      color: 'text-accent-400 bg-accent-500/10',
      title: 'Streaming Responses',
      desc: 'Real-time typing effect via SSE streaming. Feels fast and natural — no waiting.',
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      color: 'text-green-400 bg-green-500/10',
      title: 'Email Alerts',
      desc: 'Get notified instantly when a high-score lead is captured. Never miss a hot prospect.',
    },
  ]

  return (
    <section id="features" className="py-28 bg-bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <span className="text-xs font-semibold tracking-widest text-primary-400 uppercase">Features</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold text-white">
            Everything you need to
            <span className="block animate-gradient-text">convert visitors</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <div key={i}
              className="glass-card rounded-2xl p-6 hover:border-white/20 transition-colors group">
              <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                {f.icon}
              </div>
              <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// =====================================================
// Pricing
// =====================================================
function Pricing() {
  const plans = [
    {
      name: 'Starter',
      price: 39,
      desc: 'Perfect for small stores getting started with AI lead gen.',
      plan: 'starter',
      features: ['500 chats / month', '1 Shopify store', 'Lead scoring', 'Email notifications', 'CSV product import', 'Lead export'],
      cta: 'Get started',
      highlight: false,
    },
    {
      name: 'Growth',
      price: 99,
      desc: 'For growing brands that need more volume and stores.',
      plan: 'growth',
      features: ['3,000 chats / month', '3 Shopify stores', 'Everything in Starter', 'Priority support', 'Usage analytics', 'Custom AI persona'],
      cta: 'Start growing',
      highlight: true,
      badge: 'Most popular',
    },
    {
      name: 'Pro',
      price: 249,
      desc: 'Unlimited power for high-volume stores and agencies.',
      plan: 'pro',
      features: ['Unlimited chats', 'Unlimited stores', 'Everything in Growth', 'Dedicated support', 'API access', 'White-label option'],
      cta: 'Go Pro',
      highlight: false,
    },
  ]

  return (
    <section id="pricing" className="py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <span className="text-xs font-semibold tracking-widest text-primary-400 uppercase">Pricing</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold text-white">
            Simple,
            <span className="animate-gradient-text"> transparent pricing</span>
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            No hidden fees. No enterprise contracts. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.name}
              className={`relative rounded-2xl p-8 flex flex-col ${
                plan.highlight
                  ? 'bg-gradient-to-b from-primary-500/20 to-secondary-500/10 border-2 border-primary-500/50 shadow-glow-primary'
                  : 'glass-card'
              }`}>

              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="text-gray-400 text-sm mt-1">{plan.desc}</p>
                <div className="mt-5 flex items-end gap-1">
                  <span className="text-5xl font-black text-white">${plan.price}</span>
                  <span className="text-gray-400 mb-2">/mo</span>
                </div>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link href={`/signup?plan=${plan.plan}`}
                className={`w-full py-3 rounded-xl font-semibold text-sm text-center transition-all ${
                  plan.highlight
                    ? 'btn-glow bg-primary-500 hover:bg-primary-400 text-white'
                    : 'border border-white/20 text-white hover:bg-white/5'
                }`}>
                {plan.cta} <ChevronRight className="inline h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  )
}

// =====================================================
// Final CTA
// =====================================================
function FinalCTA() {
  return (
    <section className="py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/40 via-secondary-600/30 to-bg-secondary" />
          {/* Grid overlay */}
          <div className="absolute inset-0 hero-grid-bg opacity-40" />

          {/* Glow blobs */}
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-secondary-500/20 rounded-full blur-3xl" />

          <div className="relative py-20 px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-4 py-1.5 mb-6">
              <Star className="h-4 w-4 text-accent-400 fill-accent-400" />
              <span className="text-sm text-gray-300">Start free, no credit card required</span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white max-w-3xl mx-auto leading-tight">
              Ready to capture
              <span className="block animate-gradient-text">more qualified leads?</span>
            </h2>

            <p className="mt-6 text-lg text-gray-300 max-w-xl mx-auto">
              Join e-commerce teams using AI to turn website visitors into customers — automatically.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup"
                className="btn-glow bg-primary-500 hover:bg-primary-400 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors flex items-center gap-2">
                Start free trial <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/login"
                className="border border-white/20 text-white hover:bg-white/5 font-semibold px-8 py-4 rounded-xl text-lg transition-colors">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// =====================================================
// Footer
// =====================================================
function Footer() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-white">LeadAI</span>
          </div>
          <p className="text-sm text-gray-500">
            © 2026 LeadAI. Built with Next.js, Supabase & OpenAI.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/login"  className="text-sm text-gray-500 hover:text-white transition-colors">Sign in</Link>
            <Link href="/signup" className="text-sm text-gray-500 hover:text-white transition-colors">Sign up</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

// =====================================================
// Fő oldal
// =====================================================
export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg-primary overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Háttér rétegek */}
        <div className="absolute inset-0 hero-grid-bg" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-primary" />

        {/* Glow blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-secondary-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Bal oldal - szöveg */}
            <div className="animate-fade-up">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-1.5 mb-8">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-primary-300 font-medium">AI-powered lead generation</span>
              </div>

              {/* Főcím */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] text-white">
                Turn visitors into
                <span className="block animate-gradient-text mt-1">qualified leads</span>
              </h1>

              {/* Alcím */}
              <p className="mt-6 text-xl text-gray-300 leading-relaxed max-w-lg">
                AI chatbot that knows your products, detects purchase intent,
                and scores leads <strong className="text-white">0-100 automatically.</strong>{' '}
                No forms. No friction.
              </p>

              {/* CTA gombok */}
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link href="/signup"
                  className="btn-glow bg-primary-500 hover:bg-primary-400 text-white font-bold px-7 py-4 rounded-xl text-base transition-colors flex items-center justify-center gap-2">
                  Start free — 5 min setup <ArrowRight className="h-5 w-5" />
                </Link>
                <a href="#how-it-works"
                  className="border border-white/15 text-gray-300 hover:text-white hover:border-white/30 font-semibold px-7 py-4 rounded-xl text-base transition-colors flex items-center justify-center gap-2">
                  See how it works
                </a>
              </div>

              {/* Social proof mini */}
              <div className="mt-8 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['bg-primary-400', 'bg-secondary-400', 'bg-accent-400', 'bg-green-400'].map((c, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-bg-primary`} />
                  ))}
                </div>
                <p className="text-sm text-gray-400">
                  <span className="text-white font-semibold">2,400+</span> leads captured this month
                </p>
              </div>
            </div>

            {/* Jobb oldal - chat mockup */}
            <div className="flex justify-center lg:justify-end animate-fade-up-delay-2">
              <ChatMockup />
            </div>
          </div>
        </div>
      </section>

      <StatsBar />
      <HowItWorks />
      <Features />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  )
}
