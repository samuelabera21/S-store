'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import MasonryGrid from '@/components/MasonryGrid'
import PinDetailModal from '@/components/PinDetailModal'
import CreateBoardModal from '@/components/CreateBoardModal'
import CreatePinModal from '@/components/CreatePinModal'
import AuthModal from '@/components/AuthModal'
import Toast, { ToastMessage } from '@/components/Toast'
import { PinItem, SessionState } from '@/types'
import { CheckCircle2, ChevronRight } from 'lucide-react'

interface FeaturedBoard {
  id: string
  title: string
  description: string | null
  pinCount: number
  owner: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
  thumbnails: string[]
}

export default function IdeasPage() {
  const [session, setSession] = useState<SessionState>({ authenticated: false, user: null })
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [featuredBoards, setFeaturedBoards] = useState<FeaturedBoard[]>([])
  const [pins, setPins] = useState<PinItem[]>([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [activePin, setActivePin] = useState<PinItem | null>(null)
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

  const fetchExploreData = async (cat = 'All') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/explore?category=${encodeURIComponent(cat)}`)
      const data = await res.json()
      setCategories(data.categories || [])
      setFeaturedBoards(data.featuredBoards || [])
      setPins(data.pins || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSession()
    fetchExploreData(selectedCategory)
  }, [selectedCategory])

  const handleQuickSave = async (pinId: string) => {
    if (!session.authenticated) {
      setIsAuthModalOpen(true)
      return
    }

    try {
      const boardsRes = await fetch('/api/v1/users/me/boards')
      const boardsData = await boardsRes.json()
      const bList = boardsData.boards || []

      if (bList.length === 0) {
        setIsCreateBoardOpen(true)
        return
      }

      const target = bList[0]
      await fetch(`/api/v1/boards/${target.id}/pins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinId }),
      })

      setPins((prev) =>
        prev.map((p) => (p.id === pinId ? { ...p, isSaved: true } : p))
      )
      setToast({
        id: Date.now().toString(),
        title: `Saved to ${target.title}`,
        type: 'success',
      })
    } catch {
      setToast({
        id: Date.now().toString(),
        title: 'Error saving pin',
        type: 'error',
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Category Tabs Scrollbar */}
      <div className="border-b border-zinc-200 sticky top-16 bg-white/95 backdrop-blur z-30 px-4 sm:px-6">
        <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar max-w-[1600px] mx-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6">
        {/* Explore Featured Boards Section */}
        {featuredBoards.length > 0 && selectedCategory === 'All' && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-zinc-900">Explore featured boards</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {featuredBoards.map((b) => (
                <Link
                  key={b.id}
                  href={`/${b.owner.username}/${b.id}`}
                  className="group block p-4 rounded-3xl bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200 transition-all shadow-2xs"
                >
                  <div className="aspect-[16/9] rounded-2xl bg-zinc-200 overflow-hidden mb-3 relative">
                    {b.thumbnails[0] ? (
                      <img
                        src={b.thumbnails[0]}
                        alt={b.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">
                        Empty Board
                      </div>
                    )}
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-base text-zinc-900 group-hover:text-pinterest-red transition-colors">
                        {b.title}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500 font-medium">
                        <span>{b.owner.displayName || b.owner.username}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-50" />
                        <span>· {b.pinCount} Pins</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Trending Pins Masonry Section */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 mb-4">
            {selectedCategory === 'All' ? "What's new on S-Store" : `${selectedCategory} Ideas`}
          </h2>

          <MasonryGrid
            pins={pins}
            loading={loading}
            onOpenDetail={(pin) => setActivePin(pin)}
            onQuickSave={handleQuickSave}
            onSaveToSpecificBoard={async (pinId, boardId, title) => {
              await fetch(`/api/v1/boards/${boardId}/pins`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pinId }),
              })
              setToast({
                id: Date.now().toString(),
                title: `Saved to ${title}`,
                type: 'success',
              })
            }}
            onCreateBoardClick={() => setIsCreateBoardOpen(true)}
          />
        </section>
      </main>

      {/* Pin Detail Modal */}
      <PinDetailModal
        pin={activePin}
        onClose={() => setActivePin(null)}
        onQuickSave={handleQuickSave}
        onSaveToSpecificBoard={async (pinId, boardId, title) => {
          await fetch(`/api/v1/boards/${boardId}/pins`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pinId }),
          })
          setToast({
            id: Date.now().toString(),
            title: `Saved to ${title}`,
            type: 'success',
          })
        }}
        onCreateBoardClick={() => setIsCreateBoardOpen(true)}
      />

      <CreateBoardModal
        isOpen={isCreateBoardOpen}
        onClose={() => setIsCreateBoardOpen(false)}
        onBoardCreated={() => fetchExploreData(selectedCategory)}
      />

      <CreatePinModal
        isOpen={isCreatePinOpen}
        onClose={() => setIsCreatePinOpen(false)}
        onPinCreated={() => fetchExploreData(selectedCategory)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSwitchUser={() => fetchSession()}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
