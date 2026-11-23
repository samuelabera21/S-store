'use client'

import React, { useState } from 'react'
import { X, Loader2, Trash2 } from 'lucide-react'

interface EditPinModalProps {
  pin: {
    id: string
    title: string
    description?: string | null
    category?: string
    sourceLink?: string | null
  }
  isOpen: boolean
  onClose: () => void
  onPinUpdated: (updatedPin: {
    id: string
    title: string
    description: string | null
    category?: string
    sourceLink: string | null
  }) => void
  onPinDeleted: () => void
}

export default function EditPinModal({
  pin,
  isOpen,
  onClose,
  onPinUpdated,
  onPinDeleted,
}: EditPinModalProps) {
  const [title, setTitle] = useState(pin.title)
  const [description, setDescription] = useState(pin.description || '')
  const [category, setCategory] = useState(pin.category || 'Home Decor')
  const [sourceLink, setSourceLink] = useState(pin.sourceLink || '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/v1/pins/${pin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          sourceLink,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update pin')

      onPinUpdated(data.pin)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating pin')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this pin? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/v1/pins/${pin.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete pin')

      onPinDeleted()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error deleting pin')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl my-auto text-left">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
          <h2 className="text-xl font-bold text-zinc-900">Edit this Pin</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-400 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-400 text-sm font-medium resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-400 text-xs font-medium bg-white"
            >
              <option value="Home Decor">Home Decor</option>
              <option value="Architecture">Architecture</option>
              <option value="DIY & Crafts">DIY & Crafts</option>
              <option value="Food & Drinks">Food & Drinks</option>
              <option value="Fashion">Fashion</option>
              <option value="Art & Design">Art & Design</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Destination Link
            </label>
            <input
              type="url"
              value={sourceLink}
              onChange={(e) => setSourceLink(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-400 text-sm font-medium"
            />
          </div>

          <div className="flex items-center justify-between pt-5 border-t border-zinc-100">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-full transition-colors flex items-center gap-1.5"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span>Delete Pin</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !title.trim()}
                className="px-6 py-2.5 bg-pinterest-red hover:bg-pinterest-redHover disabled:opacity-50 text-white font-bold text-xs rounded-full transition-colors shadow-sm flex items-center gap-1.5"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Save</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
