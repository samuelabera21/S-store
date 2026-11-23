'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import MasonryGrid from '@/components/MasonryGrid'
import CreateBoardModal from '@/components/CreateBoardModal'
import VisualSearchModal from '@/components/VisualSearchModal'
import Toast, { ToastMessage } from '@/components/Toast'
import { PinItem, SessionState } from '@/types'

export default function HomePage() {
  const router = useRouter()
  const [session, setSession] = useState<SessionState>({ authenticated: false, user: null })
  const [pins, setPins] = useState<PinItem[]>([])
  const [loading, setLoading] = useState(true)

  // Infinite Scroll Pagination
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Modals & UI state
  const [visualSearchPin, setVisualSearchPin] = useState<PinItem | null>(null)
  const [createBoardPinId, setCreateBoardPinId] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)

  // Fetch session
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/session')
      const data = await res.json()
      setSession(data)
    } catch (err) {
      console.error('Failed to load session:', err)
    }
  }, [])

  // Fetch pins
  const fetchPins = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '20')

      const res = await fetch(`/api/v1/pins?${params.toString()}`)
      const data = await res.json()
      setPins(data.pins || [])
      setNextCursor(data.nextCursor || null)
      setHasMore(Boolean(data.hasMore))
    } catch (err) {
      console.error('Failed to load pins:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch more pins for infinite scroll
  const fetchMorePins = useCallback(async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '20')
      params.set('cursor', nextCursor)

      const res = await fetch(`/api/v1/pins?${params.toString()}`)
      const data = await res.json()
      setPins((prev) => [...prev, ...(data.pins || [])])
      setNextCursor(data.nextCursor || null)
      setHasMore(Boolean(data.hasMore))
    } catch (err) {
      console.error('Failed to load more pins:', err)
    } finally {
      setLoadingMore(false)
    }
  }, [nextCursor, loadingMore])

  // Infinite scroll intersection observer
  useEffect(() => {
    if (!hasMore || loadingMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchMorePins()
        }
      },
      { rootMargin: '400px' }
    )
    if (sentinelRef.current) {
      observer.observe(sentinelRef.current)
    }
    return () => observer.disconnect()
  }, [hasMore, loadingMore, fetchMorePins])

  useEffect(() => {
    fetchSession()
    fetchPins()
  }, [fetchSession, fetchPins])

  // Quick Save
  const handleQuickSave = async (pinId: string) => {
    if (!session.authenticated) {
      window.location.href = `/pin/${pinId}`
      return
    }

    try {
      const boardsRes = await fetch('/api/v1/users/me/boards')
      const boardsData = await boardsRes.json()
      const boards = boardsData.boards || []

      if (boards.length === 0) {
        setCreateBoardPinId(pinId)
        return
      }

      const targetBoard = boards[0]

      setPins((prev) =>
        prev.map((p) =>
          p.id === pinId
            ? { ...p, isSaved: true, savedToBoards: [{ id: targetBoard.id, title: targetBoard.title }] }
            : p
        )
      )

      const res = await fetch(`/api/v1/boards/${targetBoard.id}/pins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinId }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save pin')
      }

      setToast({
        id: Date.now().toString(),
        title: `Saved to ${targetBoard.title}`,
        type: 'success',
      })
    } catch (err: unknown) {
      setPins((prev) =>
        prev.map((p) => (p.id === pinId ? { ...p, isSaved: false } : p))
      )
      setToast({
        id: Date.now().toString(),
        title: err instanceof Error ? err.message : 'Error saving pin',
        type: 'error',
      })
    }
  }

  // Save to specific board or section
  const handleSaveToSpecificBoard = async (
    pinId: string,
    boardId: string,
    boardTitle: string,
    sectionId?: string,
    sectionTitle?: string
  ) => {
    if (!session.authenticated) {
      window.location.href = `/pin/${pinId}`
      return
    }

    try {
      const destinationName = sectionTitle ? `${boardTitle} > ${sectionTitle}` : boardTitle
      setPins((prev) =>
        prev.map((p) =>
          p.id === pinId
            ? { ...p, isSaved: true, savedToBoards: [{ id: boardId, title: destinationName }] }
            : p
        )
      )


      const res = await fetch(`/api/v1/boards/${boardId}/pins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinId, sectionId }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save to board')
      }

      setToast({
        id: Date.now().toString(),
        title: `Saved to ${destinationName}`,
        type: 'success',
      })
    } catch (err: unknown) {
      setToast({
        id: Date.now().toString(),
        title: err instanceof Error ? err.message : 'Error saving to board',
        type: 'error',
      })
    }
  }

  const handleBoardCreated = (board: { id: string; title: string }) => {
    if (createBoardPinId) {
      setPins((prev) =>
        prev.map((p) =>
          p.id === createBoardPinId
            ? { ...p, isSaved: true, savedToBoards: [{ id: board.id, title: board.title }] }
            : p
        )
      )
      setToast({
        id: Date.now().toString(),
        title: `Created and saved to ${board.title}`,
        type: 'success',
      })
      setCreateBoardPinId(null)
    }
  }

  return (
    <div className="w-full">
      {/* Clean Edge-to-Edge Masonry Grid directly below TopHeader (matching Pinterest Screenshot 2) */}
      <div className="px-3 sm:px-4 md:px-6 pt-3 pb-16 max-w-[1920px] mx-auto">
        <MasonryGrid
          pins={pins}
          loading={loading}
          onOpenDetail={(pin) => router.push(`/pin/${pin.id}`)}
          onQuickSave={handleQuickSave}
          onSaveToSpecificBoard={handleSaveToSpecificBoard}
          onCreateBoardClick={(pinId) => setCreateBoardPinId(pinId)}
          onVisualSearchClick={(pin) => setVisualSearchPin(pin)}
        />

        {/* Infinite Scroll Sentinel */}
        <div ref={sentinelRef} className="py-12 flex flex-col items-center justify-center">
          {loadingMore && (
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold animate-pulse">
              <div className="w-2.5 h-2.5 rounded-full bg-[#e60023] animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#e60023] animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#e60023] animate-bounce" />
            </div>
          )}
        </div>
      </div>

      {/* Visual Search Modal */}
      {visualSearchPin && (
        <VisualSearchModal
          pin={visualSearchPin}
          isOpen={Boolean(visualSearchPin)}
          onClose={() => setVisualSearchPin(null)}
          onOpenDetail={(pin) => router.push(`/pin/${pin.id}`)}
          onQuickSave={handleQuickSave}
          onSaveToSpecificBoard={handleSaveToSpecificBoard}
          onCreateBoardClick={(pinId) => setCreateBoardPinId(pinId)}
        />
      )}

      {/* Create Board Modal */}
      <CreateBoardModal
        isOpen={Boolean(createBoardPinId)}
        initialPinId={createBoardPinId}
        onClose={() => setCreateBoardPinId(null)}
        onBoardCreated={handleBoardCreated}
      />

      {/* Global Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
