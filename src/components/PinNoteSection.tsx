'use client'

import React, { useState, useEffect } from 'react'
import { Lock, Edit2, Trash2, Check, Loader2, StickyNote } from 'lucide-react'

interface PinNoteSectionProps {
  pinId: string
  isSaved: boolean
  sessionAuthenticated: boolean
  onOpenAuthModal?: () => void
}

export default function PinNoteSection({
  pinId,
  isSaved,
  sessionAuthenticated,
  onOpenAuthModal,
}: PinNoteSectionProps) {
  const [note, setNote] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [draftNote, setDraftNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionAuthenticated) return

    setLoading(true)
    fetch(`/api/v1/pins/${pinId}/note`)
      .then((res) => res.json())
      .then((data) => {
        setNote(data.note || null)
        setDraftNote(data.note || '')
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [pinId, sessionAuthenticated])

  const handleSaveNote = async () => {
    if (!sessionAuthenticated) {
      onOpenAuthModal?.()
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/v1/pins/${pinId}/note`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: draftNote }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save note')

      setNote(data.note)
      setIsEditing(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving note')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteNote = async () => {
    if (!confirm('Delete this note to yourself?')) return

    setSaving(true)
    try {
      const res = await fetch(`/api/v1/pins/${pinId}/note`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete note')

      setNote(null)
      setDraftNote('')
      setIsEditing(false)
    } catch {
      alert('Error deleting note')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
          <StickyNote className="w-4 h-4 text-zinc-500" />
          <span>Note to self</span>
          <span className="flex items-center gap-1 text-[10px] text-zinc-400 font-normal ml-1">
            <Lock className="w-2.5 h-2.5" /> Only you can see this
          </span>
        </div>

        {note && !isEditing && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setDraftNote(note)
                setIsEditing(true)
              }}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
              title="Edit note"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDeleteNote}
              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full text-zinc-400 hover:text-red-600 transition-colors"
              title="Delete note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-2 p-2 bg-red-50 text-red-600 text-xs rounded-xl font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-10 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-2xl" />
      ) : isEditing ? (
        <div className="space-y-2">
          <textarea
            rows={3}
            value={draftNote}
            onChange={(e) => setDraftNote(e.target.value)}
            placeholder="Add a recipe tip, size measurement, or reminder..."
            maxLength={1000}
            autoFocus
            className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs dark:text-zinc-100 focus:outline-none focus:border-zinc-400 transition-colors resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400">{draftNote.length}/1000</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setDraftNote(note || '')
                  setIsEditing(false)
                }}
                className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={saving || !draftNote.trim()}
                className="px-4 py-1.5 bg-pinterest-red hover:bg-pinterest-redHover disabled:opacity-40 text-white font-bold text-xs rounded-full transition-colors shadow-sm flex items-center gap-1"
              >
                {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      ) : note ? (
        <div
          onClick={() => {
            setDraftNote(note)
            setIsEditing(true)
          }}
          className="p-3 bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100/80 dark:hover:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800 cursor-pointer transition-colors"
        >
          <p className="text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">{note}</p>
        </div>
      ) : (
        <button
          onClick={() => {
            if (!sessionAuthenticated) {
              onOpenAuthModal?.()
              return
            }
            if (!isSaved) {
              setError('Save this pin to a board first to add a note to self')
              return
            }
            setIsEditing(true)
          }}
          className="w-full py-2.5 px-3 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors text-left flex items-center gap-2"
        >
          <span>What do you want to remember about this Pin?</span>
        </button>
      )}
    </div>
  )
}
