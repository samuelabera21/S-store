'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Camera, Loader2, Globe, User, Check } from 'lucide-react'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onProfileUpdated: (updatedUser: {
    username: string
    displayName: string | null
    avatarUrl: string | null
    about?: string | null
    website?: string | null
  }) => void
}

export default function EditProfileModal({
  isOpen,
  onClose,
  onProfileUpdated,
}: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [about, setAbout] = useState('')
  const [website, setWebsite] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    fetch('/api/v1/users/me/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setDisplayName(data.profile.displayName || '')
          setUsername(data.profile.username || '')
          setAbout(data.profile.about || '')
          setWebsite(data.profile.website || '')
          setAvatarUrl(data.profile.avatarUrl || '')
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [isOpen])

  if (!isOpen) return null

  const handleAvatarFile = async (file: File) => {
    setUploadingAvatar(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Avatar upload failed')

      setAvatarUrl(data.url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error uploading photo')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/v1/users/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          username,
          about,
          website,
          avatarUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update profile')

      onProfileUpdated(data.profile)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl my-auto text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Edit Profile</h2>
            <p className="text-xs text-zinc-500">
              People visiting your profile will see this information.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-50 text-red-600 text-xs rounded-xl font-semibold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-pinterest-red mb-2" />
            <p className="text-xs text-zinc-500 font-medium">Loading profile...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            {/* Avatar Row */}
            <div className="flex items-center gap-4 pb-4 border-b border-zinc-100">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleAvatarFile(e.target.files[0])
                  }
                }}
              />

              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <img
                  src={
                    avatarUrl ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
                  }
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-zinc-100 group-hover:opacity-80 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-white">
                  {uploadingAvatar ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-full transition-colors"
                >
                  {uploadingAvatar ? 'Uploading...' : 'Change photo'}
                </button>
                <p className="text-[11px] text-zinc-400 mt-1">Recommended: square format</p>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your full name or brand"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-400 text-sm font-medium"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Username
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-zinc-400 text-sm font-semibold select-none">
                  @
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                  }
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-400 text-sm font-medium"
                />
              </div>
            </div>

            {/* About / Bio */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                About you
              </label>
              <textarea
                rows={3}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Tell people your story, what you love, or what you design..."
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-400 text-sm font-medium resize-none"
              />
            </div>

            {/* Website Link */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Website
              </label>
              <div className="relative flex items-center">
                <Globe className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-400 text-sm font-medium"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full font-semibold text-xs text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-full font-bold text-xs text-white bg-pinterest-red hover:bg-pinterest-redHover disabled:opacity-50 transition-colors shadow-sm flex items-center gap-1.5"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Save</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
