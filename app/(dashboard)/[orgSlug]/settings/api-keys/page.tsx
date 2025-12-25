'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { getOrganizationBySlug } from '@/lib/supabase/helpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Clock,
  Activity,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react'
import type { Organization } from '@/lib/supabase/types'
import type {
  ApiKeyDisplay,
  GenerateApiKeyInput,
} from '@/lib/types/api-keys'
import {
  maskApiKey,
  formatLastUsed,
  formatCreatedDate,
  formatUsageCount,
  getKeyStatusBadgeColor,
  getKeyStatusLabel,
  validateKeyName,
  validateDomains,
  MAX_API_KEYS_PER_ORG,
} from '@/lib/types/api-keys'

export default function ApiKeysSettingsPage() {
  const params = useParams()
  const orgSlug = params.orgSlug as string

  const [organization, setOrganization] = React.useState<Organization | null>(null)
  const [apiKeys, setApiKeys] = React.useState<ApiKeyDisplay[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [isRevoking, setIsRevoking] = React.useState<string | null>(null)

  // Generate Key Modal State
  const [showGenerateModal, setShowGenerateModal] = React.useState(false)
  const [generateForm, setGenerateForm] = React.useState<GenerateApiKeyInput>({
    name: '',
    allowed_domains: [],
    rate_limit_per_minute: 60,
  })
  const [domainInput, setDomainInput] = React.useState('')

  // Success Modal State (showing the generated key)
  const [showSuccessModal, setShowSuccessModal] = React.useState(false)
  const [generatedKey, setGeneratedKey] = React.useState<string | null>(null)
  const [copiedKey, setCopiedKey] = React.useState(false)
  const [showFullKey, setShowFullKey] = React.useState(false)

  // Revoke Confirmation Modal State
  const [showRevokeModal, setShowRevokeModal] = React.useState(false)
  const [keyToRevoke, setKeyToRevoke] = React.useState<ApiKeyDisplay | null>(null)

  // Load organization and API keys
  React.useEffect(() => {
    loadData()
  }, [orgSlug])

  async function loadData() {
    try {
      setIsLoading(true)
      const supabase = createBrowserSupabaseClient()

      // Load organization
      const { data: orgData, error: orgError } = await getOrganizationBySlug(
        supabase,
        orgSlug
      )

      if (orgError || !orgData) {
        toast.error('Failed to load organization')
        return
      }

      setOrganization(orgData)

      // Load API keys
      const response = await fetch(`/api/api-keys?organization_id=${orgData.id}`)
      const keysData = await response.json()

      if (keysData.success) {
        setApiKeys(keysData.data || [])

        // Show warning if approaching limit
        if (keysData.warning) {
          toast.warning(keysData.warning)
        }
      } else {
        toast.error(keysData.error || 'Failed to load API keys')
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load API keys')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGenerateKey() {
    if (!organization) return

    // Validate form
    const nameValidation = validateKeyName(generateForm.name)
    if (!nameValidation.valid) {
      toast.error(nameValidation.error)
      return
    }

    // Validate domains
    if (generateForm.allowed_domains && generateForm.allowed_domains.length > 0) {
      const domainsValidation = validateDomains(generateForm.allowed_domains)
      if (!domainsValidation.valid) {
        toast.error(`Invalid domains: ${domainsValidation.errors.join(', ')}`)
        return
      }
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organization.id,
          ...generateForm,
        }),
      })

      const data = await response.json()

      if (data.success && data.data) {
        // Show the generated key once
        setGeneratedKey(data.data.api_key)
        setShowSuccessModal(true)
        setShowGenerateModal(false)

        // Reset form
        setGenerateForm({
          name: '',
          allowed_domains: [],
          rate_limit_per_minute: 60,
        })
        setDomainInput('')

        // Reload keys list
        await loadData()

        toast.success('API key generated successfully')
      } else {
        toast.error(data.error || 'Failed to generate API key')
      }
    } catch (error) {
      console.error('Error generating API key:', error)
      toast.error('Failed to generate API key')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleRevokeKey() {
    if (!keyToRevoke) return

    setIsRevoking(keyToRevoke.id)

    try {
      const response = await fetch(`/api/api-keys/${keyToRevoke.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('API key revoked successfully')
        setShowRevokeModal(false)
        setKeyToRevoke(null)

        // Reload keys list
        await loadData()
      } else {
        toast.error(data.error || 'Failed to revoke API key')
      }
    } catch (error) {
      console.error('Error revoking API key:', error)
      toast.error('Failed to revoke API key')
    } finally {
      setIsRevoking(null)
    }
  }

  function handleAddDomain() {
    if (domainInput.trim()) {
      const domains = generateForm.allowed_domains || []
      if (!domains.includes(domainInput.trim())) {
        setGenerateForm({
          ...generateForm,
          allowed_domains: [...domains, domainInput.trim()],
        })
      }
      setDomainInput('')
    }
  }

  function handleRemoveDomain(domain: string) {
    setGenerateForm({
      ...generateForm,
      allowed_domains: (generateForm.allowed_domains || []).filter((d) => d !== domain),
    })
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(true)
      toast.success('API key copied to clipboard')
      setTimeout(() => setCopiedKey(false), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  function openRevokeModal(key: ApiKeyDisplay) {
    setKeyToRevoke(key)
    setShowRevokeModal(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-400 border-t-transparent" />
      </div>
    )
  }

  if (!organization) {
    return (
      <Card className="border-error-500/20 bg-error-500/5">
        <CardHeader>
          <CardTitle className="text-error-400">Organization not found</CardTitle>
          <CardDescription>
            The organization could not be loaded. Please try again.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const canAddMoreKeys = apiKeys.length < MAX_API_KEYS_PER_ORG

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage API keys for secure authentication of public lead capture requests
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowGenerateModal(true)}
              disabled={!canAddMoreKeys}
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate New Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Warning about key limit */}
            {apiKeys.length >= MAX_API_KEYS_PER_ORG - 1 && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-400">
                    Approaching key limit
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    You have {apiKeys.length} of {MAX_API_KEYS_PER_ORG} API keys. Revoke
                    unused keys to create new ones.
                  </p>
                </div>
              </div>
            )}

            {/* API Keys List */}
            {apiKeys.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border-primary rounded-lg">
                <Key className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  No API keys yet
                </h3>
                <p className="text-gray-400 mb-6">
                  Generate your first API key to start capturing leads via the API
                </p>
                <Button onClick={() => setShowGenerateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate First Key
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <Card key={key.id} className="bg-bg-tertiary">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          {/* Key Name and Status */}
                          <div className="flex items-center gap-3">
                            <Key className="h-5 w-5 text-primary-400 flex-shrink-0" />
                            <div className="flex-1">
                              <h4 className="text-base font-semibold text-white">
                                {key.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getKeyStatusBadgeColor(
                                    key.is_active
                                  )}`}
                                >
                                  {getKeyStatusLabel(key.is_active)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Masked Key */}
                          <div className="flex items-center gap-2 bg-bg-primary px-3 py-2 rounded-lg border border-border-primary">
                            <code className="text-sm text-gray-300 font-mono flex-1">
                              {key.masked_key}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(key.masked_key)}
                              className="h-8 w-8 p-0"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Metadata */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-400 text-xs mb-1">Created</p>
                              <p className="text-white font-medium">
                                {formatCreatedDate(key.created_at)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs mb-1">Last Used</p>
                              <p className="text-white font-medium flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatLastUsed(key.last_used_at)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs mb-1">Usage</p>
                              <p className="text-white font-medium flex items-center gap-1">
                                <Activity className="h-3 w-3" />
                                {formatUsageCount(key.usage_count)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs mb-1">Rate Limit</p>
                              <p className="text-white font-medium">
                                {key.rate_limit_per_minute}/min
                              </p>
                            </div>
                          </div>

                          {/* Allowed Domains */}
                          {key.allowed_domains && key.allowed_domains.length > 0 && (
                            <div>
                              <p className="text-gray-400 text-xs mb-1">
                                Allowed Domains (CORS)
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {key.allowed_domains.map((domain) => (
                                  <span
                                    key={domain}
                                    className="inline-flex items-center px-2 py-1 rounded text-xs bg-bg-primary border border-border-primary text-gray-300"
                                  >
                                    {domain}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="ml-4">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openRevokeModal(key)}
                            disabled={isRevoking === key.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generate Key Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate New API Key</DialogTitle>
            <DialogDescription>
              Create a new API key to authenticate public lead capture requests. You'll
              only see the full key once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Key Name */}
            <div className="space-y-2">
              <Label htmlFor="key-name">
                Key Name <span className="text-error-400">*</span>
              </Label>
              <Input
                id="key-name"
                placeholder="Production Website"
                value={generateForm.name}
                onChange={(e) =>
                  setGenerateForm({ ...generateForm, name: e.target.value })
                }
                disabled={isGenerating}
              />
              <p className="text-xs text-gray-400">
                A descriptive name to help you identify this key
              </p>
            </div>

            {/* Rate Limit */}
            <div className="space-y-2">
              <Label htmlFor="rate-limit">Rate Limit (requests per minute)</Label>
              <Input
                id="rate-limit"
                type="number"
                min="1"
                max="1000"
                value={generateForm.rate_limit_per_minute}
                onChange={(e) =>
                  setGenerateForm({
                    ...generateForm,
                    rate_limit_per_minute: parseInt(e.target.value) || 60,
                  })
                }
                disabled={isGenerating}
              />
              <p className="text-xs text-gray-400">
                Maximum number of requests per minute (default: 60)
              </p>
            </div>

            {/* Allowed Domains (CORS) */}
            <div className="space-y-2">
              <Label htmlFor="domains">Allowed Domains (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="domains"
                  placeholder="example.com"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddDomain()
                    }
                  }}
                  disabled={isGenerating}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddDomain}
                  disabled={isGenerating || !domainInput.trim()}
                >
                  Add
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                Restrict API key usage to specific domains. Leave empty for no
                restrictions.
              </p>

              {/* Domain Tags */}
              {generateForm.allowed_domains &&
                generateForm.allowed_domains.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {generateForm.allowed_domains.map((domain) => (
                      <span
                        key={domain}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-bg-tertiary border border-border-primary text-white"
                      >
                        {domain}
                        <button
                          type="button"
                          onClick={() => handleRemoveDomain(domain)}
                          className="hover:text-error-400 transition-colors"
                          disabled={isGenerating}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGenerateModal(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerateKey} disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Generate Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal - Show Generated Key */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-success-400">API Key Generated!</DialogTitle>
            <DialogDescription>
              Make sure to copy your API key now. You won't be able to see it again!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Warning Banner */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-400">
                  Save this key securely
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  This is the only time you'll see the full key. Store it in a safe
                  place like a password manager or environment variables.
                </p>
              </div>
            </div>

            {/* Generated Key Display */}
            <div className="space-y-2">
              <Label>Your API Key</Label>
              <div className="relative">
                <div className="flex items-center gap-2 bg-bg-primary px-3 py-3 rounded-lg border border-primary-500/30">
                  <code className="text-sm text-white font-mono flex-1 break-all">
                    {showFullKey
                      ? generatedKey
                      : generatedKey
                      ? maskApiKey(generatedKey)
                      : ''}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFullKey(!showFullKey)}
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    {showFullKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => generatedKey && copyToClipboard(generatedKey)}
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    {copiedKey ? (
                      <Check className="h-4 w-4 text-success-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Usage Instructions */}
            <div className="space-y-2">
              <Label>Usage Example</Label>
              <div className="bg-bg-primary px-3 py-3 rounded-lg border border-border-primary">
                <code className="text-xs text-gray-300 font-mono block">
                  curl -X POST https://your-app.com/api/leads \<br />
                  &nbsp;&nbsp;-H "Authorization: Bearer {generatedKey?.substring(0, 20)}..." \<br />
                  &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
                  &nbsp;&nbsp;-d '{`{"name":"John Doe","email":"john@example.com"}`}'
                </code>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setShowSuccessModal(false)
                setGeneratedKey(null)
                setShowFullKey(false)
              }}
            >
              I've Saved the Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Modal */}
      <Dialog open={showRevokeModal} onOpenChange={setShowRevokeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-error-400">Revoke API Key?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The key will immediately stop working.
            </DialogDescription>
          </DialogHeader>

          {keyToRevoke && (
            <div className="py-4">
              <div className="p-4 rounded-lg bg-bg-tertiary border border-border-primary">
                <p className="text-sm text-gray-400 mb-1">Key Name</p>
                <p className="text-white font-medium">{keyToRevoke.name}</p>
                <p className="text-sm text-gray-400 mt-3 mb-1">Key</p>
                <code className="text-sm text-gray-300 font-mono">
                  {keyToRevoke.masked_key}
                </code>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRevokeModal(false)
                setKeyToRevoke(null)
              }}
              disabled={isRevoking !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevokeKey}
              disabled={isRevoking !== null}
            >
              {isRevoking ? 'Revoking...' : 'Revoke Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
