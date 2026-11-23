'use client'

import React, { useState, useEffect } from 'react'
import { X, UserPlus, Trash2, Loader2, Check, Shield } from 'lucide-react'

interface Collaborator {
  id: string
  userId: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  role: string
}

interface BoardCollaboratorsModalProps {
  boardId: string
  boardTitle: string
  isOwner: boolean
  isOpen: boolean
  onClose: () => void
}

export default function BoardCollaboratorsModal({
  boardId,
  boardTitle,
  isOwner,
  isOpen,
  onClose,
}: BoardCollaboratorsModalProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [inviteUsername, setInviteUsername] = useState('')
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor')
  const [loading, setLoading] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const fetchCollaborators = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/boards/${boardId}/collaborators`)
      const data = await res.json()
      setCollaborators(data.collaborators || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchCollaborators()
      setError(null)
      setSuccessMsg(null)
    }
  }, [isOpen, boardId])

  if (!isOpen) return null

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteUsername.trim()) return

    setInviting(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await fetch(`/api/v1/boards/${boardId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: inviteUsername.trim(), role: inviteRole }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add collaborator')
      }

      setSuccessMsg(data.message)
      setInviteUsername('')
      fetchCollaborators()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error adding collaborator')
    } finally {
      setInviting(false)
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/v1/boards/${boardId}/collaborators`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update role')
      setCollaborators((prev) =>
        prev.map((c) => (c.userId === userId ? { ...c, role: newRole } : c))
      )
      setSuccessMsg(data.message)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating role')
    }
  }

  const handleRemove = async (userId: string, username: string) => {
    if (!confirm(`Remove @${username} from this board?`)) return

    try {
      const res = await fetch(`/api/v1/boards/${boardId}/collaborators?userId=${userId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to remove collaborator')

      setCollaborators((prev) => prev.filter((c) => c.userId !== userId))
      setSuccessMsg(`Removed @${username}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error removing collaborator')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl my-auto text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Collaborators</h2>
            <p className="text-xs text-zinc-500">
              Manage who can save and organize pins on &ldquo;{boardTitle}&rdquo;
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
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-xl font-semibold">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 text-xs rounded-xl font-semibold flex items-center gap-1.5">
            <Check className="w-4 h-4 text-green-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Invite Form (Owner Only) */}
        {isOwner && (
          <form onSubmit={handleInvite} className="mb-6">
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Invite a collaborator
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={inviteUsername}
                onChange={(e) => setInviteUsername(e.target.value)}
                placeholder="Enter username (e.g. bob_builder)"
                className="flex-1 px-4 py-2.5 rounded-2xl border border-zinc-200 focus:outline-none focus:border-zinc-400 text-sm font-medium"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
                aria-label="Collaborator role"
                className="px-3 py-2.5 bg-zinc-100 rounded-2xl text-xs font-bold text-zinc-700 border border-zinc-200 focus:outline-none"
              >
                <option value="editor">Editor (Can save & edit)</option>
                <option value="viewer">Viewer (Can only view)</option>
              </select>
              <button
                type="submit"
                disabled={inviting || !inviteUsername.trim()}
                className="px-5 py-2.5 bg-[#e60023] hover:bg-[#ad081b] disabled:opacity-50 text-white font-bold text-xs rounded-full transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                <span>Invite</span>
              </button>
            </div>

            {/* Quick 1-click test account suggestion chips */}
            <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500">
              <span className="text-[11px] font-medium text-zinc-400">Quick invite:</span>
              {['alice_designer', 'bob_builder'].map((uname) => (
                <button
                  key={uname}
                  type="button"
                  onClick={() => setInviteUsername(uname)}
                  className="px-2.5 py-0.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-[11px] font-semibold transition-colors"
                >
                  @{uname}
                </button>
              ))}
            </div>
          </form>
        )}

        {/* Collaborators List */}
        <div>
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
            Board Members ({collaborators.length})
          </h3>

          {loading ? (
            <div className="py-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-zinc-400" />
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {collaborators.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        c.avatarUrl ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'
                      }
                      alt={c.username}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-200"
                    />
                    <div>
                      <p className="text-sm font-bold text-zinc-900 leading-tight">
                        {c.displayName || c.username}
                      </p>
                      <p className="text-xs text-zinc-500">@{c.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isOwner && c.role !== 'owner' ? (
                      <select
                        value={c.role}
                        onChange={(e) => handleUpdateRole(c.userId, e.target.value)}
                        aria-label={`Change role for @${c.username}`}
                        className="text-[11px] font-bold px-2 py-1 rounded-full border border-zinc-200 bg-white text-zinc-800 cursor-pointer focus:outline-none hover:bg-zinc-50"
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          c.role === 'owner'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-zinc-100 text-zinc-700'
                        }`}
                      >
                        {c.role}
                      </span>
                    )}

                    {isOwner && c.role !== 'owner' && (
                      <button
                        onClick={() => handleRemove(c.userId, c.username)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
