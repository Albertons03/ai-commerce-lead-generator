import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/client'
import { getOrganizationBySlug } from '@/lib/supabase/helpers'
import { LeadDetailContent } from '@/components/leads/lead-detail-content'
import type { Lead } from '@/lib/types/lead'

interface LeadDetailPageProps {
  params: {
    orgSlug: string
    leadId: string
  }
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const supabase = await createServerSupabaseClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get organization
  const { data: org, error: orgError } = await getOrganizationBySlug(supabase, params.orgSlug)
  if (orgError || !org) {
    redirect('/dashboard')
  }

  // Fetch lead data
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', params.leadId)
    .eq('organization_id', org.id)
    .single()

  if (leadError || !lead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-6xl">🔍</div>
        <h1 className="text-2xl font-bold text-white">Lead Not Found</h1>
        <p className="text-gray-400 text-center max-w-md">
          The lead you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <a
          href={`/${params.orgSlug}/leads`}
          className="text-primary-400 hover:text-primary-300 underline"
        >
          Return to leads list
        </a>
      </div>
    )
  }

  return <LeadDetailContent lead={lead as Lead} orgSlug={params.orgSlug} />
}
