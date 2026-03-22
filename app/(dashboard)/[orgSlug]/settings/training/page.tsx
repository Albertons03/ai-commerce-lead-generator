"use client";

/**
 * Termék Import UI - CSV feltöltés
 * ==================================
 * Ez az oldal CSV fájlból importál termékeket az AI chatbot tudásbázisába.
 *
 * Folyamat:
 * 1. Felhasználó feltölt egy CSV fájlt (drag & drop vagy fájlválasztó)
 * 2. A böngészőben parsoljuk a CSV-t (nem kell server, gyorsabb UX)
 * 3. Előnézeti táblázat - a felhasználó látja mit fog importálni
 * 4. "Import" gomb → /api/train-bot hívás → embedding generálás
 * 5. Eredmény megjelenítése (hány termék ment be, hány hibázott)
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  RefreshCw,
  Link as LinkIcon,
  Unlink,
} from "lucide-react";
import { getOrganizationBySlug } from "@/lib/supabase/helpers";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

// =====================================================
// TÍPUSOK
// =====================================================

// Egy CSV sorból kinyert termék
interface ParsedProduct {
  product_id: string;       // UUID-t generálunk a name alapján
  product_name: string;
  product_description: string;
  category?: string;
  price?: number;
  metadata?: Record<string, unknown>;
}

// CSV parseolás eredménye
interface ParseResult {
  products: ParsedProduct[];
  errors: string[];        // Soronkénti hibák
  totalRows: number;
}

// API válasz (train-bot endpoint)
interface TrainResult {
  processed: number;
  inserted: number;
  updated: number;
  failed: number;
  estimatedCost: number;
  duration: number;
}

// =====================================================
// CSV PARSER
// =====================================================

/**
 * Egyszerű CSV parser - kezeli a quoted mezőket is.
 *
 * Miért nem Papa Parse? A TODO szerint felesleges dependency-t kerülünk.
 * Ez a parser elegendő a mi use case-ünkhöz (nincs beágyazott newline a mezőkben).
 *
 * RFC 4180 CSV szabvány főbb pontjai:
 * - Mezők vesszővel elválasztva
 * - Ha a mező vesszőt vagy idézőjelet tartalmaz, idézőjelbe kell tenni
 * - Az idézőjelet "" (dupla) jelöli a mezőn belül
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Dupla idézőjel = literális idézőjel a mezőn belül
        current += '"';
        i++; // ugorjuk át a következő "-t
      } else {
        // Idézőjel nyitás/zárás
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // Mező határ (csak ha nem vagyunk idézőjelen belül)
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  // Az utolsó mező (nincs utána vessző)
  fields.push(current.trim());
  return fields;
}

/**
 * Egy slugból determinisztikus "ID"-t generál.
 * Miért? A product_id-nek egyedinek kell lennie, de konzisztensnek is -
 * ha ugyanazt a terméket újra importálják, ugyanaz az ID kell (upsert).
 */
function slugToId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 60); // max 60 karakter
}

/**
 * CSV tartalom → ParsedProduct tömb
 * @param csvText - a nyers CSV szöveg (fájl tartalma)
 */
function parseCsv(csvText: string): ParseResult {
  // Sorokra bontás, üres sorok elhagyása
  const lines = csvText
    .split(/\r?\n/)        // \r\n (Windows) és \n (Unix) is OK
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      products: [],
      errors: ["CSV must have a header row and at least one data row."],
      totalRows: 0,
    };
  }

  // Fejléc sor parseolása és normalizálása (kisbetű, szóköz → _)
  const headers = parseCsvLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/\s+/g, "_")
  );

  // Kötelező mezők ellenőrzése
  const required = ["name", "description"];
  const missing = required.filter((r) => !headers.includes(r));
  if (missing.length > 0) {
    return {
      products: [],
      errors: [
        `Missing required columns: ${missing.join(", ")}. ` +
        `Found: ${headers.join(", ")}`,
      ],
      totalRows: 0,
    };
  }

  const products: ParsedProduct[] = [];
  const errors: string[] = [];

  // Adatsorok feldolgozása (az első sor a header, kihagyjuk)
  for (let i = 1; i < lines.length; i++) {
    const lineNum = i + 1; // emberi sorszám (1-tól)
    const fields = parseCsvLine(lines[i]);

    // Mező → fejléc párosítás (mint egy mini objektummá alakítás)
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = fields[idx] ?? "";
    });

    // Kötelező mezők validálása
    if (!row.name?.trim()) {
      errors.push(`Row ${lineNum}: "name" is empty, skipping.`);
      continue;
    }
    if (!row.description?.trim()) {
      errors.push(`Row ${lineNum}: "description" is empty, skipping.`);
      continue;
    }

    // Ár parseolása (opcionális) - "1,299.99" → 1299.99
    let price: number | undefined;
    if (row.price) {
      // Eltávolítjuk a valuta szimbólumokat és ezres elválasztókat
      const cleaned = row.price.replace(/[$€£,]/g, "");
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed) && parsed >= 0) {
        price = parsed;
      } else if (row.price) {
        errors.push(`Row ${lineNum}: Invalid price "${row.price}", ignored.`);
      }
    }

    // URL metadata-ként mentjük el (nincs külön mező az API-ban)
    const metadata: Record<string, unknown> = {};
    if (row.url) metadata.url = row.url;

    products.push({
      product_id:          slugToId(row.name),
      product_name:        row.name.trim(),
      product_description: row.description.trim(),
      category:            row.category?.trim() || undefined,
      price,
      metadata:            Object.keys(metadata).length > 0 ? metadata : undefined,
    });
  }

  return {
    products,
    errors,
    totalRows: lines.length - 1, // header nélkül
  };
}

// =====================================================
// FŐKOMPONENS
// =====================================================

// =====================================================
// SHOPIFY KAPCSOLAT TÍPUSOK
// =====================================================

interface ShopifyStatus {
  connected: boolean;
  shop_domain?: string;
  installed_at?: string;
  last_sync?: {
    synced_at: string;
    products_count: number;
    status: "success" | "failed" | "partial";
    error?: string;
  } | null;
}

interface ShopifySyncResult {
  products_count: number;
  inserted: number;
  updated: number;
  failed: number;
  duration_ms: number;
}

export default function TrainingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orgSlug = params.orgSlug as string;

  // ── CSV állapot ──
  const [isDragging, setIsDragging]           = useState(false);
  const [parseResult, setParseResult]         = useState<ParseResult | null>(null);
  const [fileName, setFileName]               = useState<string>("");
  const [isImporting, setIsImporting]         = useState(false);
  const [trainResult, setTrainResult]         = useState<TrainResult | null>(null);
  const [trainError, setTrainError]           = useState<string>("");
  const [overwriteExisting, setOverwriteExisting] = useState(false);

  // ── Shopify állapot ──
  const [shopifyStatus, setShopifyStatus]     = useState<ShopifyStatus | null>(null);
  const [shopDomainInput, setShopDomainInput] = useState("");
  const [isSyncing, setIsSyncing]             = useState(false);
  const [syncResult, setSyncResult]           = useState<ShopifySyncResult | null>(null);
  const [syncError, setSyncError]             = useState<string>("");
  const [orgId, setOrgId]                     = useState<string>("");

  // fileInputRef: programatikusan megnyitjuk a fájlválasztót a "Browse" gombra
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Org ID + Shopify státusz betöltése ──
  useEffect(() => {
    async function loadOrgAndShopify() {
      const supabase = createBrowserSupabaseClient();
      const { data: org } = await getOrganizationBySlug(supabase, orgSlug);
      if (!org) return;

      setOrgId(org.id);

      // Shopify kapcsolat státusz lekérése
      const res = await fetch(`/api/shopify/status?organization_id=${org.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setShopifyStatus(data.data);
      }

      // Ha a Shopify callback ide irányított vissza (?shopify=connected), frissítjük az állapotot
      if (searchParams.get("shopify") === "connected") {
        const refreshRes = await fetch(`/api/shopify/status?organization_id=${org.id}`);
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.success) setShopifyStatus(refreshData.data);
        }
      }
    }
    loadOrgAndShopify();
  }, [orgSlug, searchParams]);

  // ── CSV feldolgozás ──

  /**
   * useCallback: memorizált függvény - csak akkor jön létre újra,
   * ha a dependencies változnak. Drag & drop handlerekben fontos,
   * mert event listener-ként kerül regisztrálásra.
   */
  const handleFile = useCallback((file: File) => {
    // MIME type ellenőrzés (text/csv vagy text/plain)
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      setParseResult({
        products: [],
        errors: ["Only .csv files are supported."],
        totalRows: 0,
      });
      return;
    }

    // Max 5 MB limit
    if (file.size > 5 * 1024 * 1024) {
      setParseResult({
        products: [],
        errors: ["File too large. Maximum size is 5 MB."],
        totalRows: 0,
      });
      return;
    }

    setFileName(file.name);
    setTrainResult(null);
    setTrainError("");

    // FileReader: böngészőbe épített API fájlok olvasásához
    // Async callback-alapú (nem Promise), mert régebbi Web API
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseCsv(text);
      setParseResult(result);
    };
    reader.readAsText(file, "UTF-8"); // UTF-8 encoding (ékezetes nevek is OK)
  }, []);

  // ── Drag & Drop kezelők ──

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault(); // megakadályozza a böngésző alapértelmezett viselkedését (fájl megnyitása)
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Input törlése hogy ugyanaz a fájl újra feltölthető legyen
    e.target.value = "";
  }

  // ── Import ──

  async function handleImport() {
    if (!parseResult || parseResult.products.length === 0) return;

    setIsImporting(true);
    setTrainError("");
    setTrainResult(null);

    try {
      // Organization ID lekérése slug alapján
      const supabase = createBrowserSupabaseClient();
      const { data: org } = await getOrganizationBySlug(supabase, orgSlug);

      if (!org) {
        setTrainError("Organization not found.");
        return;
      }

      // API hívás a /api/train-bot endpointra
      // Az API generálja az embedding vektorokat OpenAI-jal,
      // majd elmenti a Supabase pgvector táblába.
      const response = await fetch("/api/train-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_id:   org.id,
          products:          parseResult.products,
          batch_size:        10,       // 10 terméket küldünk egyszerre az OpenAI-nak
          overwrite_existing: overwriteExisting,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTrainResult(data.data);
      } else {
        setTrainError(data.error?.message || "Import failed.");
      }
    } catch (err) {
      setTrainError("Network error. Please try again.");
      console.error("[CSV Import] Error:", err);
    } finally {
      setIsImporting(false);
    }
  }

  function handleReset() {
    setParseResult(null);
    setFileName("");
    setTrainResult(null);
    setTrainError("");
  }

  // ── Shopify handlerek ──

  /**
   * Shopify OAuth flow indítása.
   * Átirányítunk az /api/shopify/install-ra, ami a Shopify OAuth oldalra visz.
   */
  function handleShopifyConnect() {
    const domain = shopDomainInput.trim().toLowerCase();
    if (!domain || !orgId) return;

    // Ha a user csak a nevét írta be (.myshopify.com nélkül), hozzáadjuk
    const shopDomain = domain.includes(".myshopify.com")
      ? domain
      : `${domain}.myshopify.com`;

    // Teljes oldal redirect (nem fetch) - mert OAuth-nál böngésző átirányítás kell
    window.location.href = `/api/shopify/install?shop=${encodeURIComponent(shopDomain)}&org_id=${orgId}`;
  }

  /**
   * Shopify termék szinkronizálás indítása.
   */
  async function handleShopifySync() {
    if (!orgId || isSyncing) return;
    setIsSyncing(true);
    setSyncError("");
    setSyncResult(null);

    try {
      const res = await fetch("/api/shopify/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organization_id: orgId }),
      });

      const data = await res.json();

      if (data.success) {
        setSyncResult(data.data);
        // Frissítjük a státuszt (utolsó sync dátum megjelenik)
        const statusRes = await fetch(`/api/shopify/status?organization_id=${orgId}`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.success) setShopifyStatus(statusData.data);
        }
      } else {
        setSyncError(data.error?.message || "Sync failed.");
      }
    } catch {
      setSyncError("Network error. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-6">

      {/* ── FEJLÉC KÁRTYA ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-content-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle>Product Import</CardTitle>
              <CardDescription>
                Upload a CSV file to train your AI chatbot with product data.
                The AI will use these products to answer customer questions.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ── SHOPIFY INTEGRÁCIÓ ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#96bf48] flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Import from Shopify</CardTitle>
              <CardDescription>
                Connect your Shopify store to automatically sync products to your AI chatbot.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>

          {/* Nem csatlakoztatott állapot */}
          {shopifyStatus && !shopifyStatus.connected && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Enter your Shopify store name to connect. You&apos;ll be redirected to Shopify to authorize access.
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Input
                    value={shopDomainInput}
                    onChange={(e) => setShopDomainInput(e.target.value)}
                    placeholder="your-store"
                    onKeyDown={(e) => e.key === "Enter" && handleShopifyConnect()}
                  />
                  {/* Suffix: .myshopify.com vizuális jelzés */}
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    .myshopify.com
                  </span>
                </div>
                <Button
                  onClick={handleShopifyConnect}
                  disabled={!shopDomainInput.trim()}
                  className="gap-2"
                >
                  <LinkIcon className="h-4 w-4" />
                  Connect Shopify
                </Button>
              </div>
            </div>
          )}

          {/* Csatlakoztatott állapot */}
          {shopifyStatus?.connected && (
            <div className="space-y-4">
              {/* Státusz sor */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium">{shopifyStatus.shop_domain}</span>
                  <Badge variant="secondary" className="text-xs">Connected</Badge>
                </div>
                <Button
                  onClick={handleShopifySync}
                  disabled={isSyncing}
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                  {isSyncing ? "Syncing..." : "Sync Products"}
                </Button>
              </div>

              {/* Utolsó szinkronizáció info */}
              {shopifyStatus.last_sync && (
                <div className="text-xs text-muted-foreground bg-muted rounded-md px-3 py-2">
                  Last sync:{" "}
                  <span className="font-medium">
                    {new Date(shopifyStatus.last_sync.synced_at).toLocaleString()}
                  </span>
                  {" · "}
                  <span className="font-medium">{shopifyStatus.last_sync.products_count} products</span>
                  {" · "}
                  <Badge
                    variant={shopifyStatus.last_sync.status === "success" ? "default" : "destructive"}
                    className="text-xs ml-1"
                  >
                    {shopifyStatus.last_sync.status}
                  </Badge>
                </div>
              )}

              {/* Sync eredmény */}
              {syncResult && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <p className="text-sm font-medium text-green-800 mb-1">Sync complete!</p>
                  <div className="flex gap-4 text-xs text-green-700">
                    <span>{syncResult.products_count} fetched</span>
                    <span>{syncResult.inserted} inserted</span>
                    <span>{syncResult.updated} updated</span>
                    {syncResult.failed > 0 && (
                      <span className="text-red-600">{syncResult.failed} failed</span>
                    )}
                    <span>{(syncResult.duration_ms / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              )}

              {/* Sync hiba */}
              {syncError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-700">{syncError}</p>
                </div>
              )}
            </div>
          )}

          {/* Betöltés közben */}
          {shopifyStatus === null && (
            <div className="h-8 bg-muted animate-pulse rounded-md" />
          )}

        </CardContent>
      </Card>

      {/* ── CSV FORMÁTUM ÚTMUTATÓ ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Expected CSV Format
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Kötelező / opcionális oszlopok badge-ek */}
          <div className="flex flex-wrap gap-2">
            {[
              { col: "name",        req: true  },
              { col: "description", req: true  },
              { col: "price",       req: false },
              { col: "category",    req: false },
              { col: "url",         req: false },
            ].map(({ col, req }) => (
              <div key={col} className="flex items-center gap-1.5">
                <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                  {col}
                </code>
                <Badge variant={req ? "default" : "secondary"} className="text-xs">
                  {req ? "required" : "optional"}
                </Badge>
              </div>
            ))}
          </div>

          {/* Példa CSV */}
          <pre className="bg-muted rounded-md p-3 text-xs font-mono overflow-x-auto leading-relaxed">
{`name,description,price,category,url
"Wireless Headphones","Premium noise-cancelling headphones with 30h battery",149.99,Electronics,https://shop.com/headphones
"Laptop Stand","Adjustable aluminum stand, fits 13-17 inch laptops",39.99,Accessories,
"USB-C Hub","7-in-1 hub with HDMI 4K and 100W PD charging",59.99,Electronics,https://shop.com/hub`}
          </pre>
          <p className="text-xs text-muted-foreground">
            Max 100 products per upload · Max file size 5 MB · UTF-8 encoding
          </p>
        </CardContent>
      </Card>

      {/* ── FELTÖLTÉSI ZÓNA ── */}
      {!parseResult && (
        <Card>
          <CardContent className="pt-6">
            {/*
              Drag & Drop zóna.
              onDragOver: megakadályozza a böngésző alapértelmezett viselkedését
              (fájl megnyitása helyett a drop eseményt engedélyezi)
            */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={[
                "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50",
              ].join(" ")}
            >
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-base font-medium mb-1">
                Drop your CSV file here
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse
              </p>
              <Button variant="outline" size="sm" type="button">
                Choose File
              </Button>
            </div>

            {/* Rejtett fájl input - a div kattintásra nyitja meg */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleInputChange}
            />
          </CardContent>
        </Card>
      )}

      {/* ── PARSE EREDMÉNY + ELŐNÉZET ── */}
      {parseResult && !trainResult && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">{fileName}</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Change file
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Összegző badge-ek */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="font-medium">{parseResult.products.length}</span>
                <span className="text-muted-foreground">products ready</span>
              </div>
              {parseResult.errors.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">{parseResult.errors.length}</span>
                  <span className="text-muted-foreground">warnings</span>
                </div>
              )}
            </div>

            {/* Parse hibák / figyelmeztetések */}
            {parseResult.errors.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 space-y-1">
                {parseResult.errors.map((err, i) => (
                  <p key={i} className="text-xs text-yellow-800">
                    {err}
                  </p>
                ))}
              </div>
            )}

            {/* Ha nincsenek valid termékek */}
            {parseResult.products.length === 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
                <XCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-700 font-medium">No valid products found</p>
                <p className="text-xs text-red-500 mt-1">
                  Please fix the errors above and try again.
                </p>
              </div>
            )}

            {/* Előnézeti táblázat - első 5 termék */}
            {parseResult.products.length > 0 && (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      {["Name", "Description", "Price", "Category"].map((h) => (
                        <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parseResult.products.slice(0, 5).map((p, i) => (
                      <tr key={i} className="hover:bg-muted/50">
                        <td className="px-3 py-2 font-medium max-w-[180px] truncate">
                          {p.product_name}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground max-w-[240px] truncate">
                          {p.product_description}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {p.price != null ? `$${p.price}` : "—"}
                        </td>
                        <td className="px-3 py-2">
                          {p.category || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parseResult.products.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center py-2 border-t">
                    +{parseResult.products.length - 5} more products not shown
                  </p>
                )}
              </div>
            )}

            {/* Import beállítások */}
            {parseResult.products.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="overwrite"
                  checked={overwriteExisting}
                  onChange={(e) => setOverwriteExisting(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <label htmlFor="overwrite" className="text-sm text-muted-foreground cursor-pointer">
                  Overwrite existing products with the same name
                </label>
              </div>
            )}

            {/* Import gomb */}
            {parseResult.products.length > 0 && (
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="flex-1 sm:flex-none"
                >
                  {isImporting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Generating embeddings...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Import {parseResult.products.length} Products
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* API hiba */}
            {trainError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700">{trainError}</p>
              </div>
            )}

          </CardContent>
        </Card>
      )}

      {/* ── IMPORT EREDMÉNY ── */}
      {trainResult && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Import Complete!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your chatbot has been updated with the new product data.
                </p>
              </div>

              {/* Statisztikák */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                {[
                  { label: "Processed",  value: trainResult.processed, color: "text-foreground" },
                  { label: "Inserted",   value: trainResult.inserted,  color: "text-green-600" },
                  { label: "Updated",    value: trainResult.updated,   color: "text-blue-600" },
                  { label: "Failed",     value: trainResult.failed,    color: "text-red-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-muted rounded-lg p-3 text-center">
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                Estimated cost: ${trainResult.estimatedCost.toFixed(4)} ·{" "}
                Duration: {(trainResult.duration / 1000).toFixed(1)}s
              </p>

              <Button variant="outline" onClick={handleReset}>
                <Upload className="h-4 w-4 mr-2" />
                Import Another File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
