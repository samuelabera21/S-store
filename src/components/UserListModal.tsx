'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Search, Loader2 } from 'lucide-react'

interface UserListItem {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  about: string | null
  isFollowing: boolean
  isSelf: boolean
}

interface UserListModalProps {
  isOpen: boolean
  onClose: () => void
  username: string
  type: 'followers' | 'following'
  onFollowChange?: () => void
}

export default function UserListModal({
  isOpen,
  onClose,
  username,
  type,
  onFollowChange,
}: UserListModalProps) {
  const [users, setUsers] = useState<UserListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterQuery, setFilterQuery] = useState('')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    setLoading(true)
    fetch(`/api/v1/users/${username}/${type}`)
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users || [])
      })
      .catch((err) => console.error('Error fetching user list:', err))
      .finally(() => setLoading(false))
  }, [isOpen, username, type])

  if (!isOpen) return null

  const handleToggleFollow = async (item: UserListItem) => {
    setTogglingId(item.id)
    try {
      const method = item.isFollowing ? 'DELETE' : 'POST'
      const res = await fetch(`/api/v1/users/${item.username}/follow`, {
        method,
      })
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === item.id ? { ...u, isFollowing: !u.isFollowing } : u))
        )
        if (onFollowChange) onFollowChange()
      }
    } catch (err) {
      console.error('Error toggling follow:', err)
    } finally {
      setTogglingId(null)
    }
  }

  const filteredUsers = users.filter((u) => {
    const q = filterQuery.toLowerCase()
    return (
      u.username.toLowerCase().includes(q) ||
      (u.displayName && u.displayName.toLowerCase().includes(q))
    )
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <h2 className="text-lg font-bold text-zinc-900 capitalize">
            {type === 'followers' ? 'Followers' : 'Following'} ({users.length})
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search within list */}
        <div className="relative my-3">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-100 hover:bg-zinc-200/70 focus:bg-white text-xs rounded-full border border-transparent focus:border-zinc-300 focus:outline-none transition-all"
          />
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin text-pinterest-red mb-2" />
              <p className="text-xs">Loading {type}...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-xs">
              {filterQuery ? 'No matching creators' : `No ${type} yet`}
            </div>
          ) : (
            filteredUsers.map((item) => (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-zinc-50/50 px-1 rounded-2xl transition-colors"
              >
                <Link
                  href={`/${item.username}`}
                  onClick={onClose}
                  className="flex items-center gap-3 overflow-hidden min-w-0 flex-1 group"
                >
                  <img
                    src={
                      item.avatarUrl ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'
                    }
                    alt={item.username}
                    className="w-10 h-10 rounded-full object-cover shrink-0 group-hover:opacity-90"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 truncate group-hover:underline">
                      {item.displayName || item.username}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate">@{item.username}</p>
                    {item.about && (
                      <p className="text-[10px] text-zinc-400 truncate mt-0.5">{item.about}</p>
                    )}
                  </div>
                </Link>

                {!item.isSelf && (
                  <button
                    onClick={() => handleToggleFollow(item)}
                    disabled={togglingId === item.id}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                      item.isFollowing
                        ? 'bg-zinc-200 hover:bg-zinc-300 text-zinc-800'
                        : 'bg-pinterest-red hover:bg-pinterest-redHover text-white shadow-sm'
                    }`}
                  >
                    {togglingId === item.id ? '...' : item.isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
