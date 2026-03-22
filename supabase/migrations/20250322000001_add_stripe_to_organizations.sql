-- =====================================================
-- Stripe mezők hozzáadása az organizations táblához
-- =====================================================
-- Ez a migráció hozzáadja a Stripe subscription kezeléshez
-- szükséges mezőket az organizations táblához.
--
-- Miért az organizations táblában és nem külön?
-- Egy szervezetnek egy előfizetése van.
-- Nem kell külön tábla, egyszerűbb JOIN nélkül olvasni.
-- =====================================================

ALTER TABLE public.organizations
    -- Stripe Customer ID (cus_xxx) - a Stripe-ban azonosítja a vásárlót
    ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,

    -- Stripe Subscription ID (sub_xxx) - aktív előfizetés azonosítója
    ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,

    -- Plan neve: 'starter' | 'growth' | 'pro' | 'free'
    ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free',

    -- Subscription státusz a Stripe-tól: 'active' | 'canceled' | 'past_due' | 'trialing'
    ADD COLUMN IF NOT EXISTS plan_status TEXT NOT NULL DEFAULT 'active',

    -- Mikor jár le a jelenlegi számlázási időszak (Unix timestamp vagy timestamptz)
    ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Index a gyors kereséshez Stripe ID alapján (webhook-ok használják)
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer
    ON public.organizations(stripe_customer_id)
    WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_stripe_subscription
    ON public.organizations(stripe_subscription_id)
    WHERE stripe_subscription_id IS NOT NULL;

-- Plan szerinti index (pl. "összes pro szervezet" lekérdezés)
CREATE INDEX IF NOT EXISTS idx_organizations_plan
    ON public.organizations(plan, plan_status);
