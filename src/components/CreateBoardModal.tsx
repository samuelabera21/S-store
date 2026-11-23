'use client'

import React, { useState } from 'react'
import { X, Lock } from 'lucide-react'

interface CreateBoardModalProps {
  isOpen: boolean
  initialPinId?: string | null
  onClose: () => void
  onBoardCreated: (board: { id: string; title: string }) => void
}

export default function CreateBoardModal({
  isOpen,
  initialPinId,
  onClose,
  onBoardCreated,
}: CreateBoardModalProps) {
  const [title, setTitle] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/v1/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          isPrivate,
          initialPinId: initialPinId || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create board')
      }

      onBoardCreated(data.board)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creating board')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-[500px] bg-white rounded-3xl p-7 shadow-2xl text-left">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <h2 className="text-xl font-bold text-zinc-900">Create board</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1.5">
              Name
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Like "Places to Go" or "Recipes to Make"'
              className="w-full px-4 py-3 rounded-2xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm font-medium"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="pr-4">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 cursor-pointer">
                <span>Keep this board secret</span>
                <Lock className="w-3.5 h-3.5 text-zinc-500" />
              </label>
              <p className="text-xs text-zinc-500">
                So only you and collaborators can see it.
              </p>
            </div>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-5 h-5 accent-zinc-900 rounded cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full font-semibold text-sm text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="px-6 py-2.5 rounded-full font-semibold text-sm text-white bg-pinterest-red hover:bg-pinterest-redHover disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
