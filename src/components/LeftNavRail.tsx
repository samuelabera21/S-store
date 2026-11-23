'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, PlusSquare, Bell, MessageCircle, Settings } from 'lucide-react'

interface LeftNavRailProps {
  unreadCount?: number
  unreadMessagesCount?: number
  onCreateClick: () => void
  onNotificationsClick: () => void
  onMessagesClick: () => void
}

export default function LeftNavRail({
  unreadCount = 0,
  unreadMessagesCount = 0,
  onCreateClick,
  onNotificationsClick,
  onMessagesClick,
}: LeftNavRailProps) {
  const pathname = usePathname()

  const isHome = pathname === '/'
  const isExplore = pathname === '/ideas'
  const isSettings = pathname.startsWith('/settings')

  return (
    <aside className="w-[72px] h-screen fixed left-0 top-0 bottom-0 bg-white border-r border-[#e9e9e9] flex flex-col items-center justify-between py-4 z-40 select-none">
      {/* Top Group: Pinterest Logo & Navigation Icons */}
      <div className="flex flex-col items-center gap-2">
        {/* Exact Red S-Store Monogram Logo */}
        <Link
          href="/"
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-[#e9e9e9] transition-colors mb-2"
          title="S-Store Home"
        >
          <div className="w-9 h-9 rounded-full bg-[#e60023] flex items-center justify-center text-white shadow-2xs font-black text-lg select-none">
            S
          </div>
        </Link>

        {/* 1. Home */}
        <Link
          href="/"
          className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors ${
            isHome
              ? 'text-[#111111] bg-[#e9e9e9]'
              : 'text-[#767676] hover:bg-[#e9e9e9] hover:text-[#111111]'
          }`}
          title="Home"
        >
          <Home className={`w-6 h-6 ${isHome ? 'fill-current stroke-current' : ''}`} />
        </Link>

        {/* 2. Explore */}
        <Link
          href="/ideas"
          className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors ${
            isExplore
              ? 'text-[#111111] bg-[#e9e9e9]'
              : 'text-[#767676] hover:bg-[#e9e9e9] hover:text-[#111111]'
          }`}
          title="Explore"
        >
          <Compass className={`w-6 h-6 ${isExplore ? 'fill-current stroke-current' : ''}`} />
        </Link>

        {/* 3. Create */}
        <button
          onClick={onCreateClick}
          className="w-12 h-12 flex items-center justify-center rounded-full text-[#767676] hover:bg-[#e9e9e9] hover:text-[#111111] transition-colors"
          title="Create Pin"
        >
          <PlusSquare className="w-6 h-6" />
        </button>

        {/* 4. Notifications with Badge */}
        <div className="relative">
          <button
            onClick={onNotificationsClick}
            className="w-12 h-12 flex items-center justify-center rounded-full text-[#767676] hover:bg-[#e9e9e9] hover:text-[#111111] transition-colors"
            title="Notifications"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#e60023] rounded-full" />
            )}
          </button>
        </div>

        {/* 5. Messages */}
        <div className="relative">
          <button
            onClick={onMessagesClick}
            className="w-12 h-12 flex items-center justify-center rounded-full text-[#767676] hover:bg-[#e9e9e9] hover:text-[#111111] transition-colors"
            title="Messages"
          >
            <MessageCircle className="w-6 h-6" />
            {unreadMessagesCount > 0 && (
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#e60023] rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Bottom Group: Settings */}
      <div className="flex flex-col items-center">
        <Link
          href="/settings"
          className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors ${
            isSettings
              ? 'text-[#111111] bg-[#e9e9e9]'
              : 'text-[#767676] hover:bg-[#e9e9e9] hover:text-[#111111]'
          }`}
          title="Settings"
        >
          <Settings className="w-6 h-6" />
        </Link>
      </div>
    </aside>
  )
}
