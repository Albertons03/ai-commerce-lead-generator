'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  Globe,
  MapPin,
  TrendingUp,
  MessageSquare,
  Clock,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { CopyButton } from '@/components/ui/copy-button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Lead, LeadStatus } from '@/lib/types/lead'
import { LEAD_STATUS_CONFIG, LEAD_SOURCE_CONFIG } from '@/lib/types/lead'

interface LeadDetailContentProps {
  lead: Lead
  orgSlug: string
}

export function LeadDetailContent({ lead: initialLead, orgSlug }: LeadDetailContentProps) {
  const router = useRouter()
  const [lead, setLead] = React.useState<Lead>(initialLead)
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false)
  const [newNote, setNewNote] = React.useState('')
  const [isSavingNote, setIsSavingNote] = React.useState(false)

  const handleStatusChange = async (newStatus: LeadStatus) => {
    setIsUpdatingStatus(true)
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      const result = await response.json()

      // Update local lead state with new values
      setLead(prevLead => ({
        ...prevLead,
        status: result.data.status,
        updated_at: result.data.updated_at,
      }))
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update lead status. Please try again.')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    setIsSavingNote(true)
    try {
      const existingNotes = lead.notes || ''
      const timestamp = new Date().toISOString()
      const formattedNote = `[${new Date(timestamp).toLocaleString()}]\n${newNote.trim()}\n\n`
      const updatedNotes = formattedNote + existingNotes

      const response = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: updatedNotes }),
      })

      if (!response.ok) {
        throw new Error('Failed to add note')
      }

      const result = await response.json()

      // Update local lead state with new values
      setLead(prevLead => ({
        ...prevLead,
        notes: result.data.notes,
        updated_at: result.data.updated_at,
      }))
      setNewNote('')
    } catch (error) {
      console.error('Error adding note:', error)
      alert('Failed to add note. Please try again.')
    } finally {
      setIsSavingNote(false)
    }
  }

  const getStatusBadgeVariant = (status: LeadStatus) => {
    const config = LEAD_STATUS_CONFIG[status]
    switch (config.color) {
      case 'blue':
        return 'info'
      case 'green':
        return 'success'
      case 'yellow':
        return 'warning'
      case 'red':
        return 'destructive'
      case 'purple':
        return 'purple'
      default:
        return 'default'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return formatDate(dateString)
  }

  // Build activity timeline
  const activityTimeline = React.useMemo(() => {
    const events: Array<{ type: string; description: string; timestamp: string }> = []

    // Created event
    events.push({
      type: 'created',
      description: `Lead created via ${LEAD_SOURCE_CONFIG[lead.source]?.label || lead.source}`,
      timestamp: lead.created_at,
    })

    // Last contacted event
    if (lead.last_contacted_at) {
      events.push({
        type: 'contacted',
        description: 'Lead was contacted',
        timestamp: lead.last_contacted_at,
      })
    }

    // Converted event
    if (lead.converted_at) {
      events.push({
        type: 'converted',
        description: 'Lead converted to customer',
        timestamp: lead.converted_at,
      })
    }

    // Sort by timestamp descending
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [lead])

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push(`/${orgSlug}/leads`)}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Leads
      </Button>

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">{lead.name}</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-gray-400">
              <Mail className="h-4 w-4" />
              <span className="text-sm">{lead.email}</span>
              <CopyButton value={lead.email} size="sm" variant="ghost" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Status:</span>
            <Select
              value={lead.status}
              onValueChange={(value) => handleStatusChange(value as LeadStatus)}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue>
                  <Badge variant={getStatusBadgeVariant(lead.status)}>
                    {LEAD_STATUS_CONFIG[lead.status].label}
                  </Badge>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LEAD_STATUS_CONFIG).map(([status, config]) => (
                  <SelectItem key={status} value={status}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-elevated border border-border-primary">
            <TrendingUp className="h-4 w-4 text-primary-400" />
            <span className="text-sm font-semibold text-white">
              Score: {lead.lead_score}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lead.phone && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-bg-elevated">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Phone</p>
                        <p className="text-sm font-medium text-white">{lead.phone}</p>
                      </div>
                    </div>
                    <CopyButton value={lead.phone} size="sm" variant="ghost" />
                  </div>
                )}

                {lead.company && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated">
                    <Building2 className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Company</p>
                      <p className="text-sm font-medium text-white">{lead.company}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lead Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lead Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Source</p>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                    <p className="text-sm font-medium text-white">
                      {LEAD_SOURCE_CONFIG[lead.source]?.label || lead.source}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-1">Lead Score</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                    <p className="text-sm font-medium text-white">{lead.lead_score} / 100</p>
                  </div>
                </div>

                {lead.product_interests && lead.product_interests.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-400 mb-2">Product Interests</p>
                    <div className="flex flex-wrap gap-2">
                      {lead.product_interests.map((interest, index) => (
                        <Badge key={index} variant="secondary">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {lead.conversation_summary && (
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-400 mb-2">Conversation Summary</p>
                    <p className="text-sm text-gray-300 bg-bg-elevated p-3 rounded-lg">
                      {lead.conversation_summary}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Marketing Attribution Card */}
          {(lead.utm_source || lead.utm_medium || lead.utm_campaign || lead.referrer_url || lead.landing_page) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Marketing Attribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lead.utm_source && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">UTM Source</p>
                      <p className="text-sm font-medium text-white">{lead.utm_source}</p>
                    </div>
                  )}

                  {lead.utm_medium && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">UTM Medium</p>
                      <p className="text-sm font-medium text-white">{lead.utm_medium}</p>
                    </div>
                  )}

                  {lead.utm_campaign && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">UTM Campaign</p>
                      <p className="text-sm font-medium text-white">{lead.utm_campaign}</p>
                    </div>
                  )}

                  {lead.utm_term && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">UTM Term</p>
                      <p className="text-sm font-medium text-white">{lead.utm_term}</p>
                    </div>
                  )}

                  {lead.utm_content && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">UTM Content</p>
                      <p className="text-sm font-medium text-white">{lead.utm_content}</p>
                    </div>
                  )}

                  {lead.referrer_url && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-400 mb-1">Referrer URL</p>
                      <p className="text-sm font-medium text-white break-all">{lead.referrer_url}</p>
                    </div>
                  )}

                  {lead.landing_page && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-400 mb-1">Landing Page</p>
                      <p className="text-sm font-medium text-white break-all">{lead.landing_page}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Note */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a note about this lead..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <Button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || isSavingNote}
                  size="sm"
                >
                  {isSavingNote ? 'Saving...' : 'Add Note'}
                </Button>
              </div>

              {/* Existing Notes */}
              {lead.notes && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-400">Previous Notes</h4>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {lead.notes.split('\n\n').filter(Boolean).map((note, index) => (
                        <div key={index} className="p-3 rounded-lg bg-bg-elevated border border-border-primary">
                          <p className="text-sm text-gray-300 whitespace-pre-wrap">{note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Activity Timeline Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityTimeline.map((event, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-primary-500/20 p-2">
                        <Clock className="h-3 w-3 text-primary-400" />
                      </div>
                      {index < activityTimeline.length - 1 && (
                        <div className="w-px h-full bg-border-primary mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium text-white">{event.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatRelativeTime(event.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Created</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-white">{formatDate(lead.created_at)}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-xs text-gray-400 mb-1">Last Updated</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-white">{formatDate(lead.updated_at)}</p>
                </div>
              </div>

              {lead.location_city && lead.location_country && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Location</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-white">
                        {lead.location_city}, {lead.location_country}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {lead.ip_address && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-gray-400 mb-1">IP Address</p>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-white font-mono">{lead.ip_address}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
