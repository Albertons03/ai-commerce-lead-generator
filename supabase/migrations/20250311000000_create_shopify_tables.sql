-- =====================================================
-- Shopify Integration Tables
-- =====================================================
-- shopify_connections: egy organizáció egy Shopify store-hoz csatlakozhat
-- shopify_sync_logs:   minden szinkronizáció eredményét naplózza

-- ── shopify_connections ──────────────────────────────

CREATE TABLE shopify_connections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  shop_domain     TEXT NOT NULL,          -- pl. "my-store.myshopify.com"
  access_token    TEXT NOT NULL,          -- Shopify permanent access token (OAuth)
  scope           TEXT,                   -- engedélyezett scope-ok, pl. "read_products"
  installed_at    TIMESTAMP WITH TIME ZONE DEFAULT now(),
  -- Egy szervezetnek csak egy Shopify kapcsolata lehet domainenként
  UNIQUE(organization_id, shop_domain)
);

-- ── shopify_sync_logs ────────────────────────────────

CREATE TABLE shopify_sync_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id  UUID NOT NULL REFERENCES shopify_connections(id) ON DELETE CASCADE,
  synced_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
  products_count INTEGER DEFAULT 0,
  status         TEXT NOT NULL CHECK(status IN ('success', 'failed', 'partial')),
  error          TEXT  -- hibaüzenet, ha status = 'failed' vagy 'partial'
);

-- ── Row Level Security ───────────────────────────────

ALTER TABLE shopify_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_sync_logs   ENABLE ROW LEVEL SECURITY;

-- Organization tagok kezelhetik a Shopify kapcsolatokat
CREATE POLICY "org members can manage shopify connections"
  ON shopify_connections
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = shopify_connections.organization_id
        AND organization_members.user_id = auth.uid()
    )
  );

-- Sync logokat a kapcsolat tulajdonosai láthatják
CREATE POLICY "org members can see sync logs"
  ON shopify_sync_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
        FROM shopify_connections sc
        JOIN organization_members om ON om.organization_id = sc.organization_id
       WHERE sc.id = shopify_sync_logs.connection_id
         AND om.user_id = auth.uid()
    )
  );
