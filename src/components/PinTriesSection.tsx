'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Camera, Star, Loader2, Plus, Sparkles, Check } from 'lucide-react'

interface PinTryItem {
  id: string
  imageUrl: string
  text: string | null
  rating: number | null
  createdAt: string
  user: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
}

interface PinTriesSectionProps {
  pinId: string
  sessionAuthenticated: boolean
  onOpenAuthModal?: () => void
}

export default function PinTriesSection({
  pinId,
  sessionAuthenticated,
  onOpenAuthModal,
}: PinTriesSectionProps) {
  const [tries, setTries] = useState<PinTryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [text, setText] = useState('')
  const [rating, setRating] = useState(5)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchTries = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/pins/${pinId}/tries`)
      const data = await res.json()
      setTries(data.tries || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTries()
  }, [pinId])

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setImageUrl(data.url)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Photo upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionAuthenticated) {
      onOpenAuthModal?.()
      return
    }
    if (!imageUrl) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/v1/pins/${pinId}/tries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          text,
          rating,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit recreation')

      setTries((prev) => [data.pinTry, ...prev])
      setIsFormOpen(false)
      setImageUrl('')
      setText('')
      setRating(5)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error submitting try')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Photos & Recreations</span>
            {tries.length > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full">
                {tries.length}
              </span>
            )}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Did you try this Pin? Share how it turned out!
          </p>
        </div>

        <button
          onClick={() => {
            if (!sessionAuthenticated) {
              onOpenAuthModal?.()
              return
            }
            setIsFormOpen((v) => !v)
          }}
          className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-bold rounded-full transition-colors flex items-center gap-1.5"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Add photo</span>
        </button>
      </div>

      {/* Submission Form */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-3xl mb-6 space-y-4 animate-in fade-in duration-150"
        >
          <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
            Show the community what you made
          </h4>

          {/* Photo uploader box */}
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
              }}
            />

            {imageUrl ? (
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                <img src={imageUrl} alt="Recreation preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full text-[10px]"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-24 h-24 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 flex flex-col items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold">Upload</span>
                  </>
                )}
              </button>
            )}

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-zinc-300 dark:text-zinc-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What did you think? Tips, adjustments, reviews..."
                className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs dark:text-zinc-100 focus:outline-none focus:border-zinc-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-1.5 bg-zinc-200/80 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-full hover:bg-zinc-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !imageUrl}
              className="px-5 py-1.5 bg-pinterest-red hover:bg-pinterest-redHover disabled:opacity-50 text-white text-xs font-bold rounded-full shadow-sm flex items-center gap-1"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Post recreation</span>
            </button>
          </div>
        </form>
      )}

      {/* Tries Gallery */}
      {loading ? (
        <div className="flex gap-3 overflow-x-auto py-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-32 h-44 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-2xl shrink-0" />
          ))}
        </div>
      ) : tries.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar">
          {tries.map((t) => (
            <div
              key={t.id}
              className="w-36 shrink-0 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-800 shadow-sm"
            >
              <div className="relative w-full h-36 bg-zinc-100 dark:bg-zinc-700">
                <img src={t.imageUrl} alt="Recreation" className="w-full h-full object-cover" />
                {t.rating && (
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-xs text-white rounded-full flex items-center gap-0.5 text-[10px] font-bold">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    <span>{t.rating}</span>
                  </div>
                )}
              </div>
              <div className="p-2 space-y-1">
                <div className="flex items-center gap-1.5">
                  <img
                    src={t.user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt={t.user.username}
                    className="w-4 h-4 rounded-full object-cover shrink-0"
                  />
                  <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate">
                    {t.user.displayName || t.user.username}
                  </span>
                </div>
                {t.text && (
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-tight">
                    {t.text}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl text-center text-xs text-zinc-400">
          No recreations yet. Be the first to try this idea!
        </div>
      )}
    </div>
  )
}
