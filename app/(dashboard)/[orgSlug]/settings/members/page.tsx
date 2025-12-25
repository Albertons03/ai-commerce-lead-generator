'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import {
  getOrganizationBySlug,
  getOrganizationMembers,
  removeOrganizationMember,
  updateMemberRole,
} from '@/lib/supabase/helpers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { UserPlus, MoreVertical, Trash2, Shield } from 'lucide-react'
import type { OrganizationRole } from '@/lib/supabase/types'

interface MemberWithProfile {
  id: string
  user_id: string
  role: OrganizationRole
  joined_at: string
  user: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
}

export default function MembersSettingsPage() {
  const params = useParams()
  const orgSlug = params.orgSlug as string

  const [members, setMembers] = React.useState<MemberWithProfile[]>([])
  const [currentUserRole, setCurrentUserRole] = React.useState<OrganizationRole | null>(null)
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  // Load members
  React.useEffect(() => {
    async function loadMembers() {
      try {
        const supabase = createBrowserSupabaseClient()

        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        setCurrentUserId(user.id)

        // Get organization
        const { data: org } = await getOrganizationBySlug(supabase, orgSlug)
        if (!org) return

        // Get members with profiles
        const { data: memberData, error: membersError } = await supabase
          .from('organization_members')
          .select(`
            id,
            user_id,
            role,
            joined_at,
            user:users!organization_members_user_id_fkey (
              id,
              email,
              full_name,
              avatar_url
            )
          `)
          .eq('organization_id', org.id)
          .order('joined_at', { ascending: true })

        if (membersError) {
          toast.error('Failed to load members')
          console.error(membersError)
          return
        }

        // Find current user's role
        const currentMember = memberData?.find((m: any) => m.user_id === user.id)
        if (currentMember) {
          setCurrentUserRole(currentMember.role)
        }

        setMembers(memberData as any || [])
      } catch (error) {
        console.error('Error loading members:', error)
        toast.error('Failed to load members')
      } finally {
        setIsLoading(false)
      }
    }

    loadMembers()
  }, [orgSlug])

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail}?`)) {
      return
    }

    try {
      const supabase = createBrowserSupabaseClient()
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId)

      if (error) {
        toast.error('Failed to remove member')
        console.error(error)
        return
      }

      toast.success(`Removed ${memberEmail}`)
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Failed to remove member')
    }
  }

  const handleChangeRole = async (memberId: string, newRole: OrganizationRole) => {
    try {
      const supabase = createBrowserSupabaseClient()
      const { error } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('id', memberId)

      if (error) {
        toast.error('Failed to change role')
        console.error(error)
        return
      }

      toast.success('Role updated successfully')
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      )
    } catch (error) {
      console.error('Error changing role:', error)
      toast.error('Failed to change role')
    }
  }

  const getRoleBadgeColor = (role: OrganizationRole) => {
    switch (role) {
      case 'owner':
        return 'bg-primary-500/20 text-primary-400 border-primary-500/30'
      case 'admin':
        return 'bg-accent-500/20 text-accent-400 border-accent-500/30'
      case 'member':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-400 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                Manage who has access to your organization
              </CardDescription>
            </div>
            <Button disabled>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member (Coming Soon)
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => {
              const isCurrentUser = member.user_id === currentUserId
              const canRemove = canManageMembers && !isCurrentUser && member.role !== 'owner'

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border-primary bg-bg-secondary hover:bg-bg-elevated transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback className="bg-gradient-hero text-white font-semibold">
                        {member.user.full_name
                          ? member.user.full_name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)
                          : member.user.email.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">
                          {member.user.full_name || member.user.email}
                        </p>
                        {isCurrentUser && (
                          <span className="text-xs text-gray-400">(You)</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{member.user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                        member.role
                      )}`}
                    >
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>

                    {canRemove && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member.id, member.user.email)}
                        className="text-error-400 hover:text-error-300 hover:bg-error-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}

            {members.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No members found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role Explanations */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>
            Understanding member roles and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
              <Shield className="h-4 w-4 text-primary-400" />
            </div>
            <div>
              <p className="font-medium text-white">Owner</p>
              <p className="text-sm text-gray-400">
                Full access to all settings, can delete organization, manage all members
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-accent-500/20 flex items-center justify-center flex-shrink-0">
              <Shield className="h-4 w-4 text-accent-400" />
            </div>
            <div>
              <p className="font-medium text-white">Admin</p>
              <p className="text-sm text-gray-400">
                Can manage members, edit settings, but cannot delete organization
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-500/20 flex items-center justify-center flex-shrink-0">
              <Shield className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <p className="font-medium text-white">Member</p>
              <p className="text-sm text-gray-400">
                Can view and manage leads, chatbot, but cannot change settings
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
