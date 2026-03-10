import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { getOrganizationBySlug } from "@/lib/supabase/helpers";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Users,
  MessageSquare,
  TrendingUp,
  Star,
  ArrowUp,
  ArrowDown,
  Minus,
  Bot,
} from "lucide-react";
import type { User } from "@/lib/supabase/types";
import { LeadStats } from "@/lib/types/leads";
import { formatPercentageChange, getChangeColor } from "@/lib/types/leads";
import { WelcomeModal } from "@/components/dashboard/welcome-modal";
import { SetupProgress } from "@/components/dashboard/setup-progress";
import { getSetupSteps } from "@/lib/dashboard/setup-steps";

export default async function OrganizationDashboardPage({
  params,
}: {
  params: { orgSlug: string };
}) {
  const supabase = await createServerSupabaseClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Get organization
  const { data: org, error } = await getOrganizationBySlug(
    supabase,
    params.orgSlug
  );

  if (error || !org) {
    redirect("/dashboard");
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single() as { data: User | null };

  const userName = profile?.full_name || user.email?.split("@")[0] || "User";

  // Check setup completion status
  const { data: products } = await supabase
    .from("product_training")
    .select("id")
    .eq("organization_id", org.id)
    .limit(1);

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id")
    .eq("organization_id", org.id)
    .limit(1);

  const { data: leads } = await supabase
    .from("leads")
    .select("id")
    .eq("organization_id", org.id)
    .limit(1);

  const hasProducts = Boolean(products && products.length > 0);
  const hasTestedChat = Boolean(conversations && conversations.length > 0);
  const hasLeads = Boolean(leads && leads.length > 0);
  const setupSteps = await getSetupSteps(
    params.orgSlug,
    hasProducts,
    hasTestedChat,
    hasLeads
  );
  const isSetupComplete = setupSteps.every((step) => step.completed);

  // ── Chat (conversation) statisztikák ──
  // Közvetlenül a Supabase-ből olvassuk - nincs szükség külön API route-ra,
  // mert ez egy Server Component (fut a szerveren, hozzáfér a DB-hez).
  let totalChats = 0;
  let recentLeads: Array<{
    id: string;
    name: string;
    email: string;
    lead_score: number;
    status: string;
    created_at: string;
    product_interests: string[];
  }> = [];

  try {
    // Összes conversation száma az org-ban
    const { count: chatCount } = await supabase
      .from("conversations")
      .select("*", { count: "exact", head: true }) // head:true = csak a count, adatot ne töltsön le
      .eq("organization_id", org.id);
    totalChats = chatCount ?? 0;

    // Legutóbbi 5 lead a "Recent Activity" szekcióhoz
    const { data: recentLeadsData } = await supabase
      .from("leads")
      .select("id, name, email, lead_score, status, created_at, product_interests")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false })
      .limit(5) as { data: typeof recentLeads | null };

    recentLeads = recentLeadsData ?? [];
  } catch (err) {
    console.error("Failed to fetch chat/activity stats:", err);
  }

  // ── Lead statisztikák ──
  let leadStats: LeadStats | null = null;
  try {
    const daysBack = 30;
    const now = new Date();
    const currentPeriodStart = new Date(
      now.getTime() - daysBack * 24 * 60 * 60 * 1000
    );

    // Fetch current period leads
    const { data: currentLeads, error: currentError } = (await supabase
      .from("leads")
      .select("status, lead_score")
      .eq("organization_id", org.id)
      .gte("created_at", currentPeriodStart.toISOString())
      .lte("created_at", now.toISOString())) as {
      data: Array<{ status: string; lead_score: number }> | null;
      error: any;
    };

    if (!currentError && currentLeads) {
      // Calculate stats
      const totalLeads = currentLeads.length;
      const newLeads = currentLeads.filter((l) => l.status === "new").length;
      const qualifiedLeads = currentLeads.filter(
        (l) => l.status === "qualified"
      ).length;
      const convertedLeads = currentLeads.filter(
        (l) => l.status === "converted"
      ).length;
      const avgLeadScore =
        totalLeads > 0
          ? currentLeads.reduce((sum, l) => sum + l.lead_score, 0) / totalLeads
          : 0;
      const conversionRate =
        totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      leadStats = {
        total_leads: totalLeads,
        total_leads_change: totalLeads > 0 ? 100 : 0, // First leads = +100% change
        new_leads_7d: newLeads,
        new_leads_7d_change: newLeads > 0 ? 100 : 0,
        avg_lead_score: parseFloat(avgLeadScore.toFixed(1)),
        avg_lead_score_change: 0,
        conversion_rate: parseFloat(conversionRate.toFixed(1)),
        conversion_rate_change: conversionRate > 0 ? 100 : 0,
      };
    }
  } catch (error) {
    console.error("Failed to fetch lead stats:", error);
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
      );
    }

    return (
      <span
        className={`inline-flex items-center gap-1 text-xs ${getChangeColor(
          change
        )}`}
      >
        {change > 0 ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )}
        {formatPercentageChange(change)} from last period
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Welcome Modal (shows on first visit) */}
      <WelcomeModal userName={userName} orgSlug={params.orgSlug} />

      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {userName}!
        </h1>
        <p className="text-gray-400 mt-2">
          Here's what's happening with {org.name} today
        </p>
      </div>

      {/* Setup Progress (only show if not complete) */}
      {!isSetupComplete && (
        <SetupProgress steps={setupSteps} orgSlug={params.orgSlug} />
      )}

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
              {leadStats ? leadStats.total_leads.toLocaleString() : "0"}
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

        {/* Total Chats */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total Chats
              </CardTitle>
              {/* Bot ikon: a chatbot-on folytatott összes conversation */}
              <Bot className="h-5 w-5 text-secondary-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {totalChats.toLocaleString()}
            </div>
            <p className="text-xs mt-1 text-gray-500">
              All time conversations
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
              {leadStats ? leadStats.avg_lead_score.toFixed(1) : "0.0"}
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
              {leadStats ? `${leadStats.conversion_rate.toFixed(1)}%` : "0%"}
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
          <CardDescription>Get started with these common tasks</CardDescription>
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
              <h4 className="font-semibold text-white mb-2">
                Configure Chatbot
              </h4>
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

      {/* Recent Leads */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>Latest leads captured by your chatbot</CardDescription>
            </div>
            {recentLeads.length > 0 && (
              <a
                href={`/${params.orgSlug}/leads`}
                className="text-sm text-primary-400 hover:underline"
              >
                View all →
              </a>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {recentLeads.length === 0 ? (
            // Üres állapot - még nincs egyetlen lead sem
            <div className="text-center py-10 space-y-2">
              <Users className="h-10 w-10 mx-auto text-gray-600" />
              <p className="text-gray-400 font-medium">No leads yet</p>
              <p className="text-sm text-gray-500">
                Leads captured by your chatbot will appear here.
              </p>
            </div>
          ) : (
            // Lead lista - táblázat helyett kártya-szerű sorok
            <div className="divide-y divide-border-primary">
              {recentLeads.map((lead) => {
                // Lead score szín: piros < 40, sárga < 70, zöld >= 70
                const scoreColor =
                  lead.lead_score >= 70 ? "text-green-400" :
                  lead.lead_score >= 40 ? "text-yellow-400" :
                  "text-red-400";

                // Dátum formázás: "2 hours ago" stílus
                const createdAt = new Date(lead.created_at);
                const diffMs = Date.now() - createdAt.getTime();
                const diffHours = Math.floor(diffMs / 3_600_000);
                const diffDays = Math.floor(diffHours / 24);
                const timeAgo =
                  diffDays > 0   ? `${diffDays}d ago` :
                  diffHours > 0  ? `${diffHours}h ago` :
                  "Just now";

                return (
                  <div key={lead.id} className="flex items-center justify-between py-3 gap-4">
                    {/* Avatar + név + email */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Initials avatar */}
                      <div className="h-9 w-9 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-sm font-semibold flex-shrink-0">
                        {lead.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {lead.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{lead.email}</p>
                      </div>
                    </div>

                    {/* Score + státusz + idő */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-sm font-bold ${scoreColor}`}>
                        {lead.lead_score}
                      </span>
                      <span className="text-xs text-gray-500 hidden sm:block">
                        {timeAgo}
                      </span>
                      <a
                        href={`/${params.orgSlug}/leads/${lead.id}`}
                        className="text-xs text-primary-400 hover:underline"
                      >
                        View
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
