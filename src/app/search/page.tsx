'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import MasonryGrid from '@/components/MasonryGrid'
import PinDetailModal from '@/components/PinDetailModal'
import VisualSearchModal from '@/components/VisualSearchModal'
import CreateBoardModal from '@/components/CreateBoardModal'
import CreatePinModal from '@/components/CreatePinModal'
import AuthModal from '@/components/AuthModal'
import Toast, { ToastMessage } from '@/components/Toast'
import { PinItem, SessionState } from '@/types'
import { Search, Sparkles, User, Layers, Check, Lock } from 'lucide-react'

interface SearchBoard {
  id: string
  title: string
  description: string | null
  pinCount: number
  thumbnails: string[]
  isPrivate: boolean
  owner: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
}

interface SearchPerson {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  about: string | null
  followersCount: number
  pinsCount: number
  isFollowing: boolean
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get('q') || ''

  const [session, setSession] = useState<SessionState>({ authenticated: false, user: null })
  const [query, setQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState<'pins' | 'boards' | 'people'>('pins')
  const [pins, setPins] = useState<PinItem[]>([])
  const [boards, setBoards] = useState<SearchBoard[]>([])
  const [people, setPeople] = useState<SearchPerson[]>([])
  const [guidedTags, setGuidedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Modals & UI
  const [activePin, setActivePin] = useState<PinItem | null>(null)
  const [visualSearchPin, setVisualSearchPin] = useState<PinItem | null>(null)
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false)
  const [isCreatePinOpen, setIsCreatePinOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/v1/session')
      const data = await res.json()
      setSession(data)
    } catch (err) {
      console.error(err)
    }
  }

  const performSearch = async (searchTerm: string, filterType: string = activeTab) => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/v1/search?q=${encodeURIComponent(searchTerm)}&type=${encodeURIComponent(filterType)}`
      )
      const data = await res.json()
      setPins(data.pins || [])
      setBoards(data.boards || [])
      setPeople(data.people || [])
      setGuidedTags(data.guidedTags || [])
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSession()
  }, [])

  useEffect(() => {
    const q = searchParams.get('q') || ''
    setQuery(q)
    performSearch(q, activeTab)
  }, [searchParams, activeTab])

  const handleTogglePersonFollow = async (person: SearchPerson) => {
    if (!session.authenticated) {
      setIsAuthModalOpen(true)
      return
    }

    try {
      const method = person.isFollowing ? 'DELETE' : 'POST'
      const res = await fetch(`/api/v1/users/${person.username}/follow`, { method })
      if (res.ok) {
        setPeople((prev) =>
          prev.map((p) =>
            p.id === person.id
              ? {
                  ...p,
                  isFollowing: !p.isFollowing,
                  followersCount: p.isFollowing ? p.followersCount - 1 : p.followersCount + 1,
                }
              : p
          )
        )
      }
    } catch (err) {
      console.error('Error toggling follow:', err)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111] text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Guided Search Refinement Chips */}
      {guidedTags.length > 0 && query && (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-4 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Ideas:
            </span>
            {guidedTags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  const newQ = `${query} ${tag}`.trim()
                  setQuery(newQ)
                  router.push(`/search?q=${encodeURIComponent(newQ)}`)
                }}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-full whitespace-nowrap transition-colors shrink-0"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Category Tabs Bar */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-3 pb-4 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pins')}
            className={`px-5 py-2 text-xs font-bold rounded-full transition-all ${
              activeTab === 'pins'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
            }`}
          >
            All Pins {pins.length > 0 && `(${pins.length})`}
          </button>
          <button
            onClick={() => setActiveTab('boards')}
            className={`px-5 py-2 text-xs font-bold rounded-full transition-all ${
              activeTab === 'boards'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
            }`}
          >
            Boards {boards.length > 0 && `(${boards.length})`}
          </button>
          <button
            onClick={() => setActiveTab('people')}
            className={`px-5 py-2 text-xs font-bold rounded-full transition-all ${
              activeTab === 'people'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
            }`}
          >
            People {people.length > 0 && `(${people.length})`}
          </button>
        </div>

        <p className="text-xs text-zinc-400 hidden sm:block">
          Results for <span className="font-semibold text-zinc-700 dark:text-zinc-300">"{query}"</span>
        </p>
      </div>

      {/* Main Results View */}
      <main className="max-w-[1600px] mx-auto py-6">
        {/* Tab 1: Pins Masonry */}
        {activeTab === 'pins' && (
          <MasonryGrid
            pins={pins}
            loading={loading}
            onOpenDetail={(p) => setActivePin(p)}
            onQuickSave={async () => {}}
            onSaveToSpecificBoard={async () => {}}
            onCreateBoardClick={() => setIsCreateBoardOpen(true)}
            onVisualSearchClick={(p) => setVisualSearchPin(p)}
          />
        )}

        {/* Tab 2: Boards Grid */}
        {activeTab === 'boards' && (
          <div className="px-4 sm:px-6">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-64 bg-zinc-100 dark:bg-zinc-800 rounded-3xl animate-pulse" />
                ))}
              </div>
            ) : boards.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {boards.map((b) => (
                  <Link
                    key={b.id}
                    href={`/${b.owner.username}/${b.id}`}
                    className="group flex flex-col cursor-pointer"
                  >
                    <div className="w-full h-48 bg-zinc-100 dark:bg-zinc-800 rounded-3xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 transition-all group-hover:shadow-md group-hover:scale-[1.01] flex flex-col">
                      {b.thumbnails.length > 0 ? (
                        <div className="grid grid-cols-3 h-full gap-0.5">
                          <div className="col-span-2 h-full bg-zinc-200 dark:bg-zinc-700">
                            <img src={b.thumbnails[0]} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="col-span-1 flex flex-col gap-0.5 h-full">
                            <div className="h-1/2 bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                              {b.thumbnails[1] && (
                                <img src={b.thumbnails[1]} alt="" className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="h-1/2 bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                              {b.thumbnails[2] && (
                                <img src={b.thumbnails[2]} alt="" className="w-full h-full object-cover" />
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400">
                          <Layers className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="pt-2 px-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-pinterest-red transition-colors">
                        {b.title}
                      </h4>
                      <p className="text-xs text-zinc-500">
                        {b.pinCount} {b.pinCount === 1 ? 'Pin' : 'Pins'} · by @{b.owner.username}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-zinc-400 text-sm">
                No boards found matching "{query}".
              </div>
            )}
          </div>
        )}

        {/* Tab 3: People / Creators List */}
        {activeTab === 'people' && (
          <div className="max-w-xl mx-auto px-4 space-y-3">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />
              ))
            ) : people.length > 0 ? (
              people.map((p) => (
                <div
                  key={p.id}
                  className="p-4 bg-white dark:bg-zinc-800/80 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between transition-all hover:shadow-xs"
                >
                  <Link
                    href={`/${p.username}`}
                    className="flex items-center gap-3 truncate group"
                  >
                    <img
                      src={p.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                      alt={p.username}
                      className="w-12 h-12 rounded-full object-cover border border-zinc-200 shrink-0"
                    />
                    <div className="truncate">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:underline truncate">
                        {p.displayName || p.username}
                      </h4>
                      <p className="text-xs text-zinc-400 truncate">@{p.username} · {p.followersCount} followers</p>
                    </div>
                  </Link>

                  <button
                    onClick={() => handleTogglePersonFollow(p)}
                    className={`px-5 py-2 text-xs font-bold rounded-full transition-all shrink-0 ml-3 ${
                      p.isFollowing
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 text-zinc-900 dark:text-white'
                    }`}
                  >
                    {p.isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))
            ) : (
              <div className="py-20 text-center text-zinc-400 text-sm">
                No creators found matching "{query}".
              </div>
            )}
          </div>
        )}
      </main>

      {/* Pin Detail Modal */}
      <PinDetailModal
        pin={activePin}
        onClose={() => setActivePin(null)}
        onQuickSave={async () => {}}
        onSaveToSpecificBoard={async () => {}}
        onCreateBoardClick={() => setIsCreateBoardOpen(true)}
        onVisualSearchClick={(p) => setVisualSearchPin(p)}
      />

      {/* Visual Search Modal */}
      <VisualSearchModal
        pin={visualSearchPin}
        isOpen={Boolean(visualSearchPin)}
        onClose={() => setVisualSearchPin(null)}
        onOpenDetail={(p) => setActivePin(p)}
        onQuickSave={async () => {}}
        onSaveToSpecificBoard={async () => {}}
        onCreateBoardClick={() => setIsCreateBoardOpen(true)}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <SearchContent />
    </Suspense>
  )
}
