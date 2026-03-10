"use client";

/**
 * Onboarding Wizard - 3 lépéses
 * ================================
 * Cél: az új felhasználó 5 percen belül éles chatbot-ot kapjon.
 *
 * Step 1: Organization létrehozása (név, slug)
 * Step 2: Termékek feltöltése CSV-ből (opcionális, skipelhető)
 * Step 3: API key auto-generálás + embed kód megjelenítése
 *
 * Architekturális döntés: egyetlen oldal, `currentStep` state vezérli
 * melyik "panel" látszik. Nem külön route-ok, mert az állapot (org id,
 * api key) könnyen átadható komponensen belül.
 */

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  ArrowRight,
  Upload,
  Copy,
  Check,
  Sparkles,
  Building2,
  Code2,
  Loader2,
  SkipForward,
} from "lucide-react";
import { createOrganizationAction } from "@/lib/actions/organizations";
import { generateSlug, validateSlug } from "@/lib/supabase/helpers";

// =====================================================
// TÍPUSOK
// =====================================================

interface OrgData {
  id: string;
  name: string;
  slug: string;
}

interface ApiKeyData {
  key: string; // A teljes API kulcs - csak egyszer látható!
  id: string;
}

// =====================================================
// STEP INDICATOR KOMPONENS
// =====================================================

/**
 * Felső progress bar - mutatja hol tart a felhasználó.
 * Külön komponens, mert ugyanazt a markupot nem akarjuk 3x megismételni.
 */
function StepIndicator({ current }: { current: number }) {
  const steps = [
    { n: 1, label: "Organization" },
    { n: 2, label: "Products"     },
    { n: 3, label: "Embed Code"   },
  ];

  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((step, i) => (
        <React.Fragment key={step.n}>
          {/* Egy lépés */}
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={[
                "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                current > step.n
                  ? "bg-green-500 text-white"          // elvégzett lépés
                  : current === step.n
                  ? "bg-primary text-white"             // aktuális lépés
                  : "bg-muted text-muted-foreground",   // jövőbeli lépés
              ].join(" ")}
            >
              {current > step.n
                ? <CheckCircle2 className="w-5 h-5" />
                : step.n}
            </div>
            <span className={[
              "text-xs font-medium hidden sm:block",
              current === step.n ? "text-foreground" : "text-muted-foreground",
            ].join(" ")}>
              {step.label}
            </span>
          </div>

          {/* Összekötő vonal a lépések között (az utolsó után nem kell) */}
          {i < steps.length - 1 && (
            <div className={[
              "h-0.5 w-16 sm:w-24 mx-1 mb-4 transition-colors",
              current > step.n ? "bg-green-500" : "bg-muted",
            ].join(" ")} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// =====================================================
// CSV PARSER (inline - csak az onboardinghoz szükséges, egyszerűsített)
// =====================================================

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim()); current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function slugToId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").substring(0, 60);
}

function parseProductCsv(text: string) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return { products: [], count: 0 };

  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, "_"));
  if (!headers.includes("name") || !headers.includes("description")) {
    return { products: [], count: 0, error: 'CSV must have "name" and "description" columns.' };
  }

  const products = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = fields[idx] ?? ""; });
    if (!row.name?.trim() || !row.description?.trim()) continue;

    const price = row.price ? parseFloat(row.price.replace(/[$€£,]/g, "")) : undefined;
    products.push({
      product_id:          slugToId(row.name),
      product_name:        row.name.trim(),
      product_description: row.description.trim(),
      category:            row.category?.trim() || undefined,
      price:               price && !isNaN(price) ? price : undefined,
      metadata:            row.url ? { url: row.url } : undefined,
    });
  }
  return { products, count: products.length };
}

// =====================================================
// FŐKOMPONENS
// =====================================================

export default function OnboardingPage() {
  const router = useRouter();

  // Wizard állapot
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 - Org létrehozás
  const [orgName, setOrgName]         = useState("");
  const [orgSlug, setOrgSlug]         = useState("");
  const [slugEdited, setSlugEdited]   = useState(false);
  const [orgErrors, setOrgErrors]     = useState<Record<string, string>>({});
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [orgData, setOrgData]         = useState<OrgData | null>(null);

  // Step 2 - CSV feltöltés
  const [csvFile, setCsvFile]         = useState<File | null>(null);
  const [csvProducts, setCsvProducts] = useState<any[]>([]);
  const [csvError, setCsvError]       = useState("");
  const [isDragging, setIsDragging]   = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importDone, setImportDone]   = useState(false);
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  // Step 3 - Embed kód
  const [apiKeyData, setApiKeyData]   = useState<ApiKeyData | null>(null);
  const [isGenKey, setIsGenKey]       = useState(false);
  const [copied, setCopied]           = useState(false);

  // ── Slug auto-generálás a névből ──
  React.useEffect(() => {
    if (!slugEdited && orgName) {
      setOrgSlug(generateSlug(orgName));
    }
  }, [orgName, slugEdited]);

  // =====================================================
  // STEP 1: ORG LÉTREHOZÁS
  // =====================================================

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!orgName.trim() || orgName.length < 3) {
      errors.name = "Organization name must be at least 3 characters.";
    }
    const slugCheck = validateSlug(orgSlug);
    if (!slugCheck.valid) errors.slug = slugCheck.error || "Invalid slug";

    if (Object.keys(errors).length > 0) { setOrgErrors(errors); return; }

    setIsCreatingOrg(true);
    setOrgErrors({});

    // createOrganizationAction = Next.js Server Action
    // Miért Server Action és nem fetch? Mert az authentikáció
    // szerver oldalon ellenőrződik, nem kell külön API route.
    const result = await createOrganizationAction({
      name: orgName.trim(),
      slug: orgSlug.trim(),
    });

    setIsCreatingOrg(false);

    if (result.success && result.data) {
      setOrgData(result.data);
      setCurrentStep(2);
    } else {
      if (result.field) {
        setOrgErrors({ [result.field]: result.error || "Error" });
      } else {
        setOrgErrors({ general: result.error || "Failed to create organization." });
      }
    }
  }

  // =====================================================
  // STEP 2: CSV FELTÖLTÉS
  // =====================================================

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      setCsvError("Only .csv files are supported.");
      return;
    }
    setCsvFile(file);
    setCsvError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { products, count, error } = parseProductCsv(text) as any;
      if (error) { setCsvError(error); setCsvProducts([]); }
      else if (count === 0) { setCsvError("No valid products found in file."); setCsvProducts([]); }
      else setCsvProducts(products);
    };
    reader.readAsText(file, "UTF-8");
  }, []);

  async function handleImportAndContinue() {
    if (!orgData || csvProducts.length === 0) return;
    setIsImporting(true);
    try {
      const res = await fetch("/api/train-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_id: orgData.id,
          products: csvProducts,
          batch_size: 10,
          overwrite_existing: false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setImportDone(true);
        await generateApiKey();
      } else {
        setCsvError(data.error?.message || "Import failed.");
      }
    } catch {
      setCsvError("Network error during import.");
    } finally {
      setIsImporting(false);
    }
  }

  // Step 2 → 3 skip (CSV nélkül)
  async function handleSkipCsv() {
    await generateApiKey();
  }

  // =====================================================
  // STEP 3: API KEY AUTO-GENERÁLÁS
  // =====================================================

  /**
   * Az onboarding során automatikusan létrehozunk egy "Website Widget"
   * nevű API kulcsot, hogy a felhasználó azonnal másolhassa az embed kódot.
   * Ez megspórolja a Settings → API Keys oldalt a first-run experience-ben.
   */
  async function generateApiKey() {
    if (!orgData) return;
    setIsGenKey(true);
    setCurrentStep(3);

    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_id:      orgData.id,
          name:                 "Website Widget",  // default név
          rate_limit_per_minute: 60,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setApiKeyData({ key: data.data.api_key, id: data.data.id });
      }
    } catch (err) {
      console.error("[Onboarding] API key generation failed:", err);
      // Nem blokkoló hiba - a felhasználó majd manuálisan generálhat kulcsot
    } finally {
      setIsGenKey(false);
    }
  }

  // =====================================================
  // EMBED KÓD + MÁSOLÁS
  // =====================================================

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const embedCode = orgData && apiKeyData
    ? `<script\n  src="${appUrl}/widget.js"\n  data-api-key="${apiKeyData.key}"\n  data-org-id="${orgData.id}"\n  data-title="Chat with us"\n  data-theme="#6366f1"\n></script>`
    : "";

  async function handleCopy() {
    if (!embedCode) return;
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-background flex items-start justify-center p-4 pt-12">
      <div className="w-full max-w-lg space-y-6">

        {/* Fejléc */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold">Welcome!</h1>
          <p className="text-muted-foreground">
            Let's get your AI chatbot live in a few minutes.
          </p>
        </div>

        <StepIndicator current={currentStep} />

        {/* ═══════════════════════════════
            STEP 1 - Organization
            ═══════════════════════════════ */}
        {currentStep === 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Create your organization</h2>
                  <p className="text-sm text-muted-foreground">
                    This is your workspace for leads and chatbot settings.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateOrg} className="space-y-4">

                {/* Általános hiba */}
                {orgErrors.general && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    {orgErrors.general}
                  </p>
                )}

                {/* Org neve */}
                <div className="space-y-1.5">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    placeholder="Acme Store"
                    value={orgName}
                    onChange={e => { setOrgName(e.target.value); setOrgErrors(p => ({...p, name: ""})); }}
                    disabled={isCreatingOrg}
                    autoFocus
                  />
                  {orgErrors.name && <p className="text-xs text-red-500">{orgErrors.name}</p>}
                </div>

                {/* Slug */}
                <div className="space-y-1.5">
                  <Label htmlFor="org-slug">URL Slug</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground shrink-0">app/</span>
                    <Input
                      id="org-slug"
                      placeholder="acme-store"
                      value={orgSlug}
                      onChange={e => { setSlugEdited(true); setOrgSlug(e.target.value); setOrgErrors(p => ({...p, slug: ""})); }}
                      disabled={isCreatingOrg}
                    />
                  </div>
                  {orgErrors.slug
                    ? <p className="text-xs text-red-500">{orgErrors.slug}</p>
                    : <p className="text-xs text-muted-foreground">Lowercase letters, numbers, hyphens only</p>
                  }
                </div>

                <Button type="submit" className="w-full" disabled={isCreatingOrg}>
                  {isCreatingOrg ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
                  ) : (
                    <>Continue <ArrowRight className="h-4 w-4 ml-2" /></>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ═══════════════════════════════
            STEP 2 - CSV Upload (optional)
            ═══════════════════════════════ */}
        {currentStep === 2 && (
          <Card>
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Upload your products</h2>
                  <p className="text-sm text-muted-foreground">
                    Optional — adds product knowledge to your AI chatbot.
                  </p>
                </div>
              </div>

              {/* Formátum hint */}
              <p className="text-xs text-muted-foreground bg-muted rounded-md px-3 py-2">
                CSV columns: <code className="font-mono">name</code>,{" "}
                <code className="font-mono">description</code>,{" "}
                <code className="font-mono">price</code>,{" "}
                <code className="font-mono">category</code>,{" "}
                <code className="font-mono">url</code>
              </p>

              {/* Drag & Drop zóna */}
              {!csvFile ? (
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                  onClick={() => fileInputRef.current?.click()}
                  className={[
                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                    isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                  ].join(" ")}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Drop CSV here or click to browse</p>
                </div>
              ) : (
                // Fájl sikeresen kiválasztva
                <div className="flex items-center justify-between bg-muted rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">{csvFile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      — {csvProducts.length} products
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setCsvFile(null); setCsvProducts([]); setCsvError(""); }}
                  >
                    Change
                  </Button>
                </div>
              )}

              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />

              {csvError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {csvError}
                </p>
              )}

              {/* Akció gombok */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                {csvProducts.length > 0 && (
                  <Button
                    className="flex-1"
                    onClick={handleImportAndContinue}
                    disabled={isImporting}
                  >
                    {isImporting ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing...</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-2" /> Import {csvProducts.length} Products</>
                    )}
                  </Button>
                )}
                <Button
                  variant={csvProducts.length > 0 ? "outline" : "default"}
                  className={csvProducts.length > 0 ? "" : "w-full"}
                  onClick={handleSkipCsv}
                  disabled={isImporting}
                >
                  <SkipForward className="h-4 w-4 mr-2" />
                  {csvProducts.length > 0 ? "Skip" : "Skip for now"}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                You can always add products later from{" "}
                <span className="font-medium">Settings → Training</span>.
              </p>
            </CardContent>
          </Card>
        )}

        {/* ═══════════════════════════════
            STEP 3 - Embed Code
            ═══════════════════════════════ */}
        {currentStep === 3 && (
          <Card>
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Code2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Your chatbot is ready!</h2>
                  <p className="text-sm text-muted-foreground">
                    Copy this snippet and paste it into your website.
                  </p>
                </div>
              </div>

              {/* API key generálás folyamatban */}
              {isGenKey && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating API key...
                </div>
              )}

              {/* Embed kód */}
              {!isGenKey && embedCode && (
                <>
                  <div className="relative">
                    <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto leading-relaxed">
                      <code>{embedCode}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={handleCopy}
                    >
                      {copied
                        ? <><Check className="h-3 w-3 mr-1" /> Copied!</>
                        : <><Copy className="h-3 w-3 mr-1" /> Copy</>
                      }
                    </Button>
                  </div>

                  {/* Fontos figyelmeztetés az API kulcsról */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2 text-xs text-yellow-800">
                    Save your API key! It won't be shown again after you leave this page.
                    You can generate a new one anytime in{" "}
                    <strong>Settings → API Keys</strong>.
                  </div>
                </>
              )}

              {/* Ha az API key generálás sikertelen */}
              {!isGenKey && !apiKeyData && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2 text-sm text-yellow-800">
                  Could not auto-generate API key. Go to{" "}
                  <strong>Settings → API Keys</strong> to create one manually.
                </div>
              )}

              {/* Telepítési lépések */}
              <div className="space-y-2">
                <p className="text-sm font-medium">How to install:</p>
                <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Copy the script tag above</li>
                  <li>
                    Paste it before the{" "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">&lt;/body&gt;</code>{" "}
                    tag on your website
                  </li>
                  <li>The chat bubble will appear in the bottom-right corner</li>
                </ol>
              </div>

              {/* Dashboard gomb */}
              <Button
                className="w-full"
                onClick={() => router.push(`/${orgData?.slug}`)}
              >
                Open Dashboard <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
