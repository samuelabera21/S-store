'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Camera, Mic, ChevronDown, Check, User, X, Sun, Moon, Monitor, Settings, BarChart3 } from 'lucide-react'
import { SessionState } from '@/types'
import SearchSuggestionsPopover from '@/components/SearchSuggestionsPopover'

interface TopHeaderProps {
  session: SessionState
  onSwitchUser: (username: string) => void
  onOpenAuthModal: (mode?: 'login' | 'signup') => void
  onOpenVisualSearch?: () => void
}

export default function TopHeader({
  session,
  onSwitchUser,
  onOpenAuthModal,
  onOpenVisualSearch,
}: TopHeaderProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchSubmit = (q: string) => {
    setIsSuggestionsOpen(false)
    if (q.trim()) {
      router.push(`/search?q=${encodeURIComponent(q.trim())}`)
    }
  }

  return (
    <header className="h-16 fixed top-0 left-[72px] right-0 bg-white border-b border-transparent px-4 sm:px-6 flex items-center gap-3 z-40">
      {/* Search Input Box */}
      <div className="flex-1 relative flex items-center">
        <div className="w-full bg-[#e9e9e9] hover:bg-[#e1e1e1] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#e60023]/30 rounded-full px-4 py-2.5 flex items-center gap-3 transition-all border border-transparent focus-within:border-zinc-300">
          <Search className="w-4 h-4 text-[#767676] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsSuggestionsOpen(true)}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearchSubmit(searchQuery)
              } else if (e.key === 'Escape') {
                setIsSuggestionsOpen(false)
              }
            }}
            placeholder="Search"
            className="flex-1 bg-transparent text-sm font-medium text-[#111111] placeholder-[#767676] focus:outline-none"
          />

          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('')
                setIsSuggestionsOpen(false)
              }}
              className="p-1 hover:bg-zinc-200 rounded-full text-zinc-500"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Visual Camera Lens Search Button */}
          <button
            type="button"
            onClick={onOpenVisualSearch}
            className="p-1.5 text-[#767676] hover:text-[#111111] hover:bg-zinc-200/80 rounded-full transition-colors"
            title="Search by image"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Audio Microphone Search Button */}
          <button
            type="button"
            onClick={() => {
              // Voice search mock / trigger
              const recognition =
                typeof window !== 'undefined' &&
                ((window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition ||
                  (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition)
              if (recognition) {
                // native speech
              }
            }}
            className="p-1.5 text-[#767676] hover:text-[#111111] hover:bg-zinc-200/80 rounded-full transition-colors"
            title="Search by voice"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>

        {/* Guided Search Suggestions Dropdown */}
        <SearchSuggestionsPopover
          isOpen={isSuggestionsOpen}
          query={searchQuery}
          onClose={() => setIsSuggestionsOpen(false)}
          onSelectSuggestion={(selected) => {
            setSearchQuery(selected)
            handleSearchSubmit(selected)
          }}
        />
      </div>

      {/* Right User Profile Dropdown Button */}
      <div className="relative shrink-0" ref={dropdownRef}>
        {session.authenticated && session.user ? (
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-1 p-1 hover:bg-[#e9e9e9] rounded-full transition-colors"
            title="Your account"
          >
            <div className="w-8 h-8 rounded-full bg-[#e9e9e9] overflow-hidden flex items-center justify-center font-bold text-xs text-[#111111] border border-zinc-200">
              {session.user.avatarUrl ? (
                <img
                  src={session.user.avatarUrl}
                  alt={session.user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{session.user.username.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#767676]" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAuthModal('login')}
              className="px-3.5 py-2 text-xs font-bold text-[#111111] bg-[#e9e9e9] hover:bg-[#e1e1e1] rounded-full transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => onOpenAuthModal('signup')}
              className="px-3.5 py-2 text-xs font-bold text-white bg-[#e60023] hover:bg-[#ad081b] rounded-full transition-colors"
            >
              Sign up
            </button>
          </div>
        )}

        {/* User Account Dropdown Menu */}
        {userDropdownOpen && session.user && (
          <div className="absolute right-0 top-12 w-64 bg-white rounded-3xl p-3 shadow-2xl border border-[#e9e9e9] z-50 animate-in fade-in zoom-in-95 duration-100 text-left">
            <div className="p-3 bg-[#e9e9e9]/60 rounded-2xl mb-2">
              <p className="text-[11px] font-medium text-[#767676]">Currently in</p>
              <Link
                href={`/${session.user.username}`}
                onClick={() => setUserDropdownOpen(false)}
                className="flex items-center gap-2.5 mt-1.5 group"
              >
                <div className="w-10 h-10 rounded-full bg-zinc-200 overflow-hidden shrink-0 border border-zinc-200">
                  {session.user.avatarUrl ? (
                    <img src={session.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-xs">
                      {session.user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-[#111111] group-hover:underline truncate">
                    {session.user.displayName || session.user.username}
                  </p>
                  <p className="text-[11px] text-[#767676] truncate">@{session.user.username}</p>
                </div>
              </Link>
            </div>

            <div className="space-y-0.5 text-xs font-bold text-[#111111]">
              <Link
                href={`/${session.user.username}`}
                onClick={() => setUserDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#e9e9e9] transition-colors"
              >
                <User className="w-4 h-4 text-[#767676]" />
                <span>Your profile</span>
              </Link>

              <Link
                href="/settings"
                onClick={() => setUserDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#e9e9e9] transition-colors"
              >
                <Settings className="w-4 h-4 text-[#767676]" />
                <span>Settings</span>
              </Link>

              <Link
                href="/analytics"
                onClick={() => setUserDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#e9e9e9] transition-colors"
              >
                <BarChart3 className="w-4 h-4 text-[#767676]" />
                <span>Analytics Studio</span>
              </Link>

              <div className="py-2 border-t border-zinc-100 mt-1">
                <p className="text-[11px] text-[#767676] px-3 font-semibold mb-1">Switch account</p>
                {['alice_designer', 'bob_builder', 'guest'].map((u) => (
                  <button
                    key={u}
                    onClick={() => {
                      onSwitchUser(u)
                      setUserDropdownOpen(false)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl hover:bg-[#e9e9e9] transition-colors"
                  >
                    <span>@{u}</span>
                    {session.user?.username === u && <Check className="w-3.5 h-3.5 text-[#e60023]" />}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-zinc-100">
                <button
                  onClick={() => {
                    onSwitchUser('guest')
                    setUserDropdownOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-[#e60023] hover:bg-red-50 rounded-xl transition-colors"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
