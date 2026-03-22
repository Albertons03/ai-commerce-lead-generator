'use client'

/**
 * =====================================================
 * /[orgSlug]/settings/billing - Billing oldal
 * =====================================================
 * Megjelenítő:
 * - Jelenlegi plan + státusz
 * - Havi usage (chatok / limit)
 * - Pricing kártyák az upgrade-hez
 * - Következő számlázási dátum
 *
 * Hogyan működik az upgrade?
 * 1. Felhasználó rákattint egy plan kártyán az "Upgrade" gombra
 * 2. POST /api/stripe/checkout → Stripe Checkout Session URL
 * 3. Átirányítás a Stripe hosted fizetési oldalra
 * 4. Sikeres fizetés után visszajön: ?success=true
 * =====================================================
 */

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Zap, TrendingUp, Crown, AlertCircle } from 'lucide-react'
import { PLANS, PlanName, PlanLimits } from '@/lib/billing/plan-limits'

// =====================================================
// Típusok
// =====================================================

interface OrgBillingData {
  plan: PlanName
  plan_status: string
  current_period_end: string | null
  stripe_subscription_id: string | null
}

interface UsageData {
  chats: number
  tokens: number
  leads: number
}

// =====================================================
// Plan kártya komponens
// =====================================================

function PlanCard({
  plan,
  currentPlan,
  orgSlug,
}: {
  plan: PlanLimits
  currentPlan: PlanName
  orgSlug: string
}) {
  const [loading, setLoading] = useState(false)
  const isCurrentPlan = plan.name === currentPlan
  const isUpgrade = plan.price > (PLANS[currentPlan]?.price ?? 0)
  const isDowngrade = plan.price < (PLANS[currentPlan]?.price ?? 0) && plan.name !== 'free'

  // Ikon a plan névhez
  const icons: Record<string, React.ReactNode> = {
    free: <Zap className="h-6 w-6 text-gray-400" />,
    starter: <Zap className="h-6 w-6 text-blue-400" />,
    growth: <TrendingUp className="h-6 w-6 text-purple-400" />,
    pro: <Crown className="h-6 w-6 text-yellow-400" />,
  }

  async function handleCheckout() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgSlug, plan: plan.name }),
      })
      const data = await res.json()

      if (data.url) {
        // Stripe Checkout oldalra irányítás
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to start checkout')
      }
    } catch (err) {
      alert('Network error, please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`
        relative rounded-xl border p-6 flex flex-col gap-4
        ${isCurrentPlan
          ? 'border-primary-400 bg-bg-secondary'
          : 'border-border-primary bg-bg-tertiary hover:border-gray-500 transition-colors'
        }
      `}
    >
      {/* Current plan badge */}
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary-400 text-bg-primary text-xs font-semibold px-3 py-1 rounded-full">
            Current Plan
          </span>
        </div>
      )}

      {/* Plan header */}
      <div className="flex items-center gap-3">
        {icons[plan.name]}
        <div>
          <h3 className="text-white font-semibold text-lg">{plan.displayName}</h3>
          <p className="text-gray-400 text-sm">
            {plan.price === 0 ? 'Free forever' : `$${plan.price}/month`}
          </p>
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-2 flex-1">
        <FeatureRow
          text={plan.chatsPerMonth === -1 ? 'Unlimited chats' : `${plan.chatsPerMonth.toLocaleString()} chats/month`}
        />
        <FeatureRow
          text={plan.storeLimit === -1 ? 'Unlimited stores' : `${plan.storeLimit} Shopify store${plan.storeLimit > 1 ? 's' : ''}`}
        />
        <FeatureRow text="Lead capture" />
        <FeatureRow text="CSV product import" />
        {plan.leadExport && <FeatureRow text="Lead export" />}
        {plan.emailNotifications && <FeatureRow text="Email notifications" />}
      </ul>

      {/* CTA gomb */}
      {isCurrentPlan ? (
        <div className="text-center text-gray-400 text-sm py-2">Active</div>
      ) : plan.name === 'free' ? (
        <div className="text-center text-gray-500 text-sm py-2">Downgrade via support</div>
      ) : (
        <button
          onClick={handleCheckout}
          disabled={loading}
          className={`
            w-full py-2.5 rounded-lg font-medium text-sm transition-colors
            ${isUpgrade
              ? 'bg-primary-400 hover:bg-primary-300 text-bg-primary'
              : 'border border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {loading ? 'Loading...' : isUpgrade ? `Upgrade to ${plan.displayName}` : `Switch to ${plan.displayName}`}
        </button>
      )}
    </div>
  )
}

function FeatureRow({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-gray-300">
      <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
      {text}
    </li>
  )
}

// =====================================================
// Fő oldal komponens
// =====================================================

export default function BillingPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const orgSlug = params.orgSlug as string

  const [billing, setBilling] = useState<OrgBillingData | null>(null)
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  // Success / canceled query paramek
  const isSuccess = searchParams.get('success') === 'true'
  const isCanceled = searchParams.get('canceled') === 'true'

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/organizations/${orgSlug}/billing`)
        if (res.ok) {
          const data = await res.json()
          setBilling(data.billing)
          setUsage(data.usage)
        }
      } catch (err) {
        console.error('Failed to load billing data:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orgSlug])

  const currentPlan = billing?.plan ?? 'free'
  const planLimits = PLANS[currentPlan]
  const chatLimit = planLimits.chatsPerMonth
  const chatUsage = usage?.chats ?? 0
  const usagePercent = chatLimit === -1 ? 0 : Math.min(100, (chatUsage / chatLimit) * 100)

  // Paid plans megjelenítése (starter, growth, pro)
  const paidPlans: PlanLimits[] = [PLANS.starter, PLANS.growth, PLANS.pro]

  return (
    <div className="space-y-8">
      {/* Success / Canceled értesítés */}
      {isSuccess && (
        <div className="flex items-center gap-3 p-4 bg-green-900/30 border border-green-700 rounded-lg text-green-400">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <p>Payment successful! Your plan has been activated.</p>
        </div>
      )}
      {isCanceled && (
        <div className="flex items-center gap-3 p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-400">
          <XCircle className="h-5 w-5 flex-shrink-0" />
          <p>Checkout was canceled. No changes were made.</p>
        </div>
      )}

      {/* Jelenlegi plan összefoglaló */}
      <div className="bg-bg-secondary border border-border-primary rounded-xl p-6">
        <h2 className="text-white font-semibold text-xl mb-4">Current Plan</h2>

        {loading ? (
          <div className="animate-pulse h-20 bg-bg-tertiary rounded-lg" />
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-white capitalize">{planLimits.displayName}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  billing?.plan_status === 'active'
                    ? 'bg-green-900/50 text-green-400 border border-green-700'
                    : 'bg-red-900/50 text-red-400 border border-red-700'
                }`}>
                  {billing?.plan_status ?? 'active'}
                </span>
              </div>

              {billing?.current_period_end && (
                <p className="text-gray-400 text-sm mt-1">
                  Renews on {new Date(billing.current_period_end).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </p>
              )}
            </div>

            {/* Chat usage bar */}
            <div className="flex-1 max-w-xs">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Chats this month</span>
                <span>
                  {chatUsage.toLocaleString()}
                  {chatLimit !== -1 && ` / ${chatLimit.toLocaleString()}`}
                </span>
              </div>
              {chatLimit !== -1 && (
                <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-yellow-500' : 'bg-primary-400'
                    }`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              )}
              {chatLimit === -1 && (
                <p className="text-green-400 text-sm">Unlimited</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pricing kártyák */}
      <div>
        <h2 className="text-white font-semibold text-xl mb-4">Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {paidPlans.map((plan) => (
            <PlanCard
              key={plan.name}
              plan={plan}
              currentPlan={currentPlan}
              orgSlug={orgSlug}
            />
          ))}
        </div>
      </div>

      {/* Sandbox figyelmeztetés fejlesztés alatt */}
      <div className="flex items-start gap-3 p-4 bg-blue-900/20 border border-blue-800 rounded-lg text-blue-300 text-sm">
        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <p>
          <strong>Test mode:</strong> Stripe is in sandbox mode. Use test card{' '}
          <code className="bg-bg-tertiary px-1.5 py-0.5 rounded text-xs">4242 4242 4242 4242</code>{' '}
          with any future expiry and any CVC.
        </p>
      </div>
    </div>
  )
}
