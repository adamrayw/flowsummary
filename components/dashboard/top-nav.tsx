'use client'

import React, { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FlowSummaryLogo } from '@/components/brand/flowsummary-logo'
import { Bell, ChevronDown, LogOut, Settings, User, Menu } from 'lucide-react'
import { buildAuthLogoutUrl } from '@/lib/raytech-account'
import { useAuthSession } from '@/hooks/use-auth-session'

interface TopNavProps {
  onMenuClick?: () => void
}

export default function TopNav({ onMenuClick }: TopNavProps) {
  const [showMenu, setShowMenu] = useState(false)
  const { data: session } = useAuthSession()
  const userName =
    session?.user?.name?.trim() ||
    session?.user?.email?.split('@')[0] ||
    'RayTech User'
  const userEmail = session?.user?.email || 'Signed in with RayTech Account'
  const initials = useMemo(() => {
    const parts = userName.split(' ').filter(Boolean)
    if (parts.length === 0) return 'FS'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }, [userName])

  const handleSignOut = () => {
    window.location.href = buildAuthLogoutUrl(`${window.location.origin}/signin`)
  }

  return (
    <div className="border-b border-border bg-card">
      <div className="flex items-center justify-between px-4 md:px-8 py-4">
        {/* Hamburger Menu - Mobile Only */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 hover:bg-border rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <FlowSummaryLogo className="h-8 w-8 rounded-lg" priority />
          <span className="font-semibold text-lg text-foreground hidden sm:inline">FlowSummary</span>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 hover:bg-border rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-border rounded-lg transition-colors"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={`https://avatar.vercel.sh/${encodeURIComponent(userEmail)}`} alt={userName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline max-w-36 truncate text-sm text-foreground">{userName}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                  <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                </div>
                <div className="p-2">
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-border rounded transition-colors">
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-border rounded transition-colors">
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-border rounded transition-colors text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
