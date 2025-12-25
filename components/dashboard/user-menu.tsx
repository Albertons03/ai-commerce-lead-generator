'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Settings, User as UserIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/lib/actions/auth'
import { toast } from 'sonner'

interface UserMenuProps {
  user: {
    id: string
    email: string
    full_name?: string | null
    avatar_url?: string | null
  }
  orgSlug: string
}

export function UserMenu({ user, orgSlug }: UserMenuProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)

  const initials = React.useMemo(() => {
    if (user.full_name) {
      return user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    }
    return user.email?.substring(0, 2).toUpperCase() || 'U'
  }, [user.full_name, user.email])

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      const result = await signOut()
      if (result.success) {
        toast.success('Signed out successfully')
        router.push('/login')
      } else {
        toast.error(result.error || 'Failed to sign out')
        setIsLoading(false)
      }
    } catch (error) {
      toast.error('An error occurred while signing out')
      setIsLoading(false)
    }
  }

  const handleSettings = () => {
    router.push(`/${orgSlug}/settings`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-bg-primary',
            'hover:opacity-80 transition-opacity'
          )}
          disabled={isLoading}
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || user.email} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-white">
              {user.full_name || 'User'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isLoading}
          className="cursor-pointer text-error-400 focus:text-error-400"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoading ? 'Signing out...' : 'Sign out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
