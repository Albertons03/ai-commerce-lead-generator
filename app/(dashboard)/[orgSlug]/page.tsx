import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import { getOrganizationBySlug } from '@/lib/supabase/helpers'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { BarChart3, Users, MessageSquare, TrendingUp, Star, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { LeadStats } from '@/lib/types/leads'
import { formatPercentageChange, getChangeColor } from '@/lib/types/leads'

export default async function OrganizationDashboardPage({
  params,
}: {
  params: { orgSlug: string }
}) {
  const supabase = await createServerSupabaseClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get organization
  const { data: org, error } = await getOrganizationBySlug(supabase, params.orgSlug)

  if (error || !org) {
    redirect('/dashboard')
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const userName = profile?.full_name || user.email?.split('@')[0] || 'User'

  // Fetch lead statistics directly from Supabase
  let leadStats: LeadStats | null = null
  try {
    const daysBack = 30
    const now = new Date()
    const currentPeriodStart = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

    // Fetch current period leads
    const { data: currentLeads, error: currentError } = await supabase
      .from('leads')
      .select('status, lead_score')
      .eq('organization_id', org.id)
      .gte('created_at', currentPeriodStart.toISOString())
      .lte('created_at', now.toISOString())

    if (!currentError && currentLeads) {
      // Calculate stats
      const totalLeads = currentLeads.length
      const newLeads = currentLeads.filter((l) => l.status === 'new').length
      const qualifiedLeads = currentLeads.filter((l) => l.status === 'qualified').length
      const convertedLeads = currentLeads.filter((l) => l.status === 'converted').length
      const avgLeadScore =
        totalLeads > 0
          ? currentLeads.reduce((sum, l) => sum + l.lead_score, 0) / totalLeads
          : 0
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0

      leadStats = {
        total_leads: totalLeads,
        total_leads_change: totalLeads > 0 ? 100 : 0, // First leads = +100% change
        new_leads_7d: newLeads,
        new_leads_7d_change: newLeads > 0 ? 100 : 0,
        avg_lead_score: parseFloat(avgLeadScore.toFixed(1)),
        avg_lead_score_change: 0,
        conversion_rate: parseFloat(conversionRate.toFixed(1)),
        conversion_rate_change: conversionRate > 0 ? 100 : 0,
      }
    }
  } catch (error) {
    console.error('Failed to fetch lead stats:', error)
    // Continue rendering with null stats
  }

  // Helper function to render change indicator
  const ChangeIndicator = ({ change }: { change: number }) => {
    if (change === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
          <Minus className="h-3 w-3" />
          {formatPercentageChange(change)} from last period
        </span>
      )
    }

    return (
      <span className={`inline-flex items-center gap-1 text-xs ${getChangeColor(change)}`}>
        {change > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
        {formatPercentageChange(change)} from last period
      </span>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {userName}!
        </h1>
        <p className="text-gray-400 mt-2">
          Here's what's happening with {org.name} today
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Leads */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total Leads
              </CardTitle>
              <Users className="h-5 w-5 text-primary-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {leadStats ? leadStats.total_leads.toLocaleString() : '0'}
            </div>
            <p className="text-xs mt-1">
              {leadStats ? (
                <ChangeIndicator change={leadStats.total_leads_change} />
              ) : (
                <span className="text-gray-500">No data available</span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* New Leads (7 days) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">
                New Leads (7 days)
              </CardTitle>
              <MessageSquare className="h-5 w-5 text-secondary-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {leadStats ? leadStats.new_leads_7d.toLocaleString() : '0'}
            </div>
            <p className="text-xs mt-1">
              {leadStats ? (
                <ChangeIndicator change={leadStats.new_leads_7d_change} />
              ) : (
                <span className="text-gray-500">No data available</span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Average Lead Score */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">
                Avg Lead Score
              </CardTitle>
              <Star className="h-5 w-5 text-yellow-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {leadStats ? leadStats.avg_lead_score.toFixed(1) : '0.0'}
            </div>
            <p className="text-xs mt-1">
              {leadStats ? (
                <ChangeIndicator change={leadStats.avg_lead_score_change} />
              ) : (
                <span className="text-gray-500">No data available</span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">
                Conversion Rate
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-success-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {leadStats ? `${leadStats.conversion_rate.toFixed(1)}%` : '0%'}
            </div>
            <p className="text-xs mt-1">
              {leadStats ? (
                <ChangeIndicator change={leadStats.conversion_rate_change} />
              ) : (
                <span className="text-gray-500">No data available</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started with these common tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-border-primary hover:bg-bg-elevated transition-colors cursor-pointer">
              <h4 className="font-semibold text-white mb-2">Add New Lead</h4>
              <p className="text-sm text-gray-400">
                Manually add a new lead to your database
              </p>
            </div>
            <div className="p-4 rounded-lg border border-border-primary hover:bg-bg-elevated transition-colors cursor-pointer">
              <h4 className="font-semibold text-white mb-2">Configure Chatbot</h4>
              <p className="text-sm text-gray-400">
                Set up your AI chatbot integration
              </p>
            </div>
            <div className="p-4 rounded-lg border border-border-primary hover:bg-bg-elevated transition-colors cursor-pointer">
              <h4 className="font-semibold text-white mb-2">View Reports</h4>
              <p className="text-sm text-gray-400">
                Check your analytics and insights
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your latest interactions and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            No recent activity to display
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
