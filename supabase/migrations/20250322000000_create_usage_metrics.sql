-- =====================================================
-- Usage Metrics Migration
-- Havi szintű chat/token/lead metrikák szervezetenként
-- Billing limitek és analitika alapja
-- =====================================================

CREATE TABLE public.usage_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Melyik szervezethez tartozik
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Hónap YYYY-MM formátumban (pl. "2026-03")
    -- Ez az egyedi kulcs a szervezet+hónap kombinációra
    month TEXT NOT NULL,

    -- Számlálók
    chats INTEGER NOT NULL DEFAULT 0,   -- összes chat üzenet ebben a hónapban
    tokens INTEGER NOT NULL DEFAULT 0,  -- összes felhasznált OpenAI token
    leads INTEGER NOT NULL DEFAULT 0,   -- rögzített leadek száma

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Egy szervezetnek egy hónapban csak egy sora lehet
    CONSTRAINT usage_metrics_org_month_unique UNIQUE (organization_id, month),

    -- Hónap formátum ellenőrzés: YYYY-MM
    CONSTRAINT month_format CHECK (month ~* '^\d{4}-\d{2}$')
);

-- Index a gyors lekérdezéshez (szervezet + hónap szerint)
CREATE INDEX idx_usage_metrics_org_month ON public.usage_metrics(organization_id, month DESC);

-- updated_at automatikus frissítés
CREATE TRIGGER update_usage_metrics_updated_at
    BEFORE UPDATE ON public.usage_metrics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Row Level Security
-- =====================================================

ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;

-- Saját szervezet metrikáit láthatja a tag
CREATE POLICY "Org members can view usage metrics"
    ON public.usage_metrics
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = public.usage_metrics.organization_id
            AND user_id = auth.uid()
        )
    );

-- Service role (szerver oldali kód) tud írni - RLS bypass admin klienssel
-- A szerver oldali kód SUPABASE_SERVICE_ROLE_KEY-jel hívja az upsert-et

-- Authenticated user is láthat/írhat (dashboard saját org-ra)
CREATE POLICY "Service role can manage usage metrics"
    ON public.usage_metrics
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- increment_usage_metrics függvény
-- =====================================================
-- Atomikusan inkrementálja a számlálókat.
-- Ha nincs még sor az org+hónapra, INSERT-el egyet.
-- Ha már van, UPDATE-el (hozzáadja az értékeket).
--
-- Miért függvény és nem sima upsert?
-- A Supabase JS kliens upsert + increment kombinációja
-- nem triviális. Egy SQL függvénnyel ez atomi és egyszerű.

CREATE OR REPLACE FUNCTION public.increment_usage_metrics(
    p_organization_id UUID,
    p_month TEXT,
    p_chats INTEGER DEFAULT 0,
    p_tokens INTEGER DEFAULT 0,
    p_leads INTEGER DEFAULT 0
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.usage_metrics (organization_id, month, chats, tokens, leads)
    VALUES (p_organization_id, p_month, p_chats, p_tokens, p_leads)
    ON CONFLICT (organization_id, month)
    DO UPDATE SET
        chats  = public.usage_metrics.chats  + EXCLUDED.chats,
        tokens = public.usage_metrics.tokens + EXCLUDED.tokens,
        leads  = public.usage_metrics.leads  + EXCLUDED.leads,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Service role és szerver oldali kód futtathatja
GRANT EXECUTE ON FUNCTION public.increment_usage_metrics TO service_role;

-- =====================================================
-- Grants
-- =====================================================

GRANT SELECT ON public.usage_metrics TO authenticated;
GRANT ALL ON public.usage_metrics TO service_role;
