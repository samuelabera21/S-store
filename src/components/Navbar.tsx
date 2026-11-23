'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Bell, MessageCircle, ChevronDown, Check, User, X, Sun, Moon, Monitor, Settings } from 'lucide-react'
import { SessionState } from '@/types'
import SearchSuggestionsPopover from '@/components/SearchSuggestionsPopover'
import NotificationsPopover from '@/components/NotificationsPopover'
import MessagesDrawer from '@/components/MessagesDrawer'

interface NavbarProps {
  session: SessionState
  searchQuery: string
  onSearchChange: (q: string) => void
  onSwitchUser: (username: string) => void
  onOpenAuthModal: (mode?: 'login' | 'signup') => void
  onCreatePinClick?: () => void
}

export default function Navbar({
  session,
  searchQuery,
  onSearchChange,
  onSwitchUser,
  onOpenAuthModal,
  onCreatePinClick,
}: NavbarProps) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isMessagesOpen, setIsMessagesOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system'
    setTheme(saved)
  }, [])

  const applyTheme = (t: 'light' | 'dark' | 'system') => {
    setTheme(t)
    localStorage.setItem('theme', t)
    if (t === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (t === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  useEffect(() => {
    if (session.authenticated) {
      fetch('/api/v1/notifications')
        .then((res) => res.json())
        .then((data) => setUnreadCount(data.unreadCount || 0))
        .catch(() => {})
    }
  }, [session.authenticated])

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#111111] border-b border-zinc-100 dark:border-zinc-800/80 px-4 py-2.5 flex items-center gap-3 transition-colors">
      {/* S-Store Mark */}
      <Link
        href="/"
        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-100 text-pinterest-red transition-colors shrink-0"
        title="S-Store Home"
      >
        <span className="font-black text-2xl tracking-tighter">S</span>
      </Link>

      {/* Nav Pill Links */}
      <nav className="hidden md:flex items-center gap-1 font-bold text-sm">
        <Link
          href="/"
          className="px-4 py-2.5 bg-zinc-900 text-white rounded-full transition-colors"
        >
          Home
        </Link>
        <Link
          href="/ideas"
          className="px-4 py-2.5 text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors"
        >
          Explore
        </Link>
        <button
          onClick={onCreatePinClick}
          className="px-4 py-2.5 text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors"
        >
          Create
        </button>
      </nav>

      {/* Main Search Bar with Popover */}
      <div className="flex-1 relative flex items-center">
        <Search className="w-4 h-4 text-zinc-400 absolute left-4 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onFocus={() => setIsSuggestionsOpen(true)}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setIsSuggestionsOpen(false)
              if (searchQuery.trim()) {
                window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`
              }
            } else if (e.key === 'Escape') {
              setIsSuggestionsOpen(false)
            }
          }}
          placeholder="Search for ideas, furniture, recipes..."
          className="w-full pl-11 pr-10 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/70 focus:bg-white dark:focus:bg-zinc-900 text-sm dark:text-zinc-100 rounded-full border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 focus:outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
        />

        {searchQuery && (
          <button
            onClick={() => {
              onSearchChange('')
              setIsSuggestionsOpen(false)
            }}
            className="absolute right-3.5 p-1 rounded-full hover:bg-zinc-200 text-zinc-400 hover:text-zinc-600 transition-colors"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <SearchSuggestionsPopover
          isOpen={isSuggestionsOpen}
          query={searchQuery}
          onClose={() => setIsSuggestionsOpen(false)}
          onSelectSuggestion={(text) => {
            onSearchChange(text)
            setIsSuggestionsOpen(false)
            if (text.trim()) {
              window.location.href = `/search?q=${encodeURIComponent(text.trim())}`
            }
          }}
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {session.authenticated && session.user ? (
          <>
            {/* Notifications Trigger & Popover */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen((v) => !v)}
                className="p-2.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-pinterest-red text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-sm animate-in zoom-in-75">
                    {unreadCount}
                  </span>
                )}
              </button>

              <NotificationsPopover
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                onUpdateUnreadCount={setUnreadCount}
              />
            </div>
            <button
              onClick={() => setIsMessagesOpen((v) => !v)}
              className="p-2.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors relative"
              title="Messages"
            >
              <MessageCircle className="w-5 h-5" />
            </button>

            <MessagesDrawer
              isOpen={isMessagesOpen}
              onClose={() => setIsMessagesOpen(false)}
              session={session}
            />

            {/* Profile Avatar Quick Link */}
            <Link
              href={`/${session.user.username}`}
              title="Your profile"
              className="w-8 h-8 rounded-full overflow-hidden border border-zinc-200 hover:opacity-85 transition-opacity"
            >
              <img
                src={
                  session.user.avatarUrl ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
                }
                alt={session.user.username}
                className="w-full h-full object-cover"
              />
            </Link>

            {/* User Session Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen((v) => !v)}
                className="p-1 hover:bg-zinc-100 rounded-full transition-colors"
                title="Account settings & switch test users"
              >
                <ChevronDown className="w-4 h-4 text-zinc-500" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-12 w-64 bg-white dark:bg-zinc-900 rounded-3xl p-3 shadow-2xl border border-zinc-200 dark:border-zinc-800 z-50 text-left animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-2">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Currently signed in:</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {session.user.displayName || session.user.username}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <Link
                        href={`/${session.user.username}`}
                        onClick={() => setUserDropdownOpen(false)}
                        className="text-xs text-pinterest-red font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <User className="w-3.5 h-3.5" /> Profile
                      </Link>
                      <span className="text-zinc-300 dark:text-zinc-700">·</span>
                      <Link
                        href="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="text-xs text-zinc-600 dark:text-zinc-400 font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <Settings className="w-3.5 h-3.5" /> Settings
                      </Link>
                    </div>
                  </div>

                  {/* Theme Mode Switcher */}
                  <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Appearance
                    </p>
                    <div className="grid grid-cols-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-1 gap-1">
                      <button
                        onClick={() => applyTheme('light')}
                        className={`py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                          theme === 'light'
                            ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white font-bold'
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                        title="Light mode"
                      >
                        <Sun className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Light</span>
                      </button>
                      <button
                        onClick={() => applyTheme('dark')}
                        className={`py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                          theme === 'dark'
                            ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white font-bold'
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                        title="Dark mode"
                      >
                        <Moon className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Dark</span>
                      </button>
                      <button
                        onClick={() => applyTheme('system')}
                        className={`py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                          theme === 'system'
                            ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white font-bold'
                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                        title="System default"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Auto</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 px-3 py-1">
                    Switch Test Account
                  </p>

                  <button
                    onClick={() => {
                      onSwitchUser('alice_designer')
                      setUserDropdownOpen(false)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-2xl hover:bg-zinc-100 transition-colors text-zinc-800"
                  >
                    <span>Alice (Designer)</span>
                    {session.user.username === 'alice_designer' && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      onSwitchUser('bob_builder')
                      setUserDropdownOpen(false)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-2xl hover:bg-zinc-100 transition-colors text-zinc-800"
                  >
                    <span>Bob (Maker)</span>
                    {session.user.username === 'bob_builder' && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                  </button>

                  <div className="pt-2 mt-2 border-t border-zinc-100">
                    <button
                      onClick={async () => {
                        await fetch('/api/v1/auth/logout', { method: 'POST' })
                        onSwitchUser('guest')
                        setUserDropdownOpen(false)
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold rounded-2xl hover:bg-red-50 text-red-600 transition-colors"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAuthModal('login')}
              className="px-4 py-2 bg-pinterest-red hover:bg-pinterest-redHover text-white text-xs font-bold rounded-full transition-colors shadow-sm"
            >
              Log in
            </button>
            <button
              onClick={() => onOpenAuthModal('signup')}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-bold rounded-full transition-colors hidden sm:block"
            >
              Sign up
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
