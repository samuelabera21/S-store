'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import MasonryGrid from '@/components/MasonryGrid'
import VisualSearchModal from '@/components/VisualSearchModal'
import CreateBoardModal from '@/components/CreateBoardModal'
import EditProfileModal from '@/components/EditProfileModal'
import UserListModal from '@/components/UserListModal'
import Toast, { ToastMessage } from '@/components/Toast'
import { PinItem, SessionState } from '@/types'
import { Share2, MoreHorizontal, Lock, Archive, Plus } from 'lucide-react'

interface ProfileBoard {
  id: string
  title: string
  description: string | null
  isPrivate: boolean
  isArchived?: boolean
  pinCount: number
  thumbnails: string[]
}

interface ProfileUser {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  about?: string | null
  website?: string | null
  pinCount: number
  boardCount: number
  followersCount?: number
  followingCount?: number
  isFollowing?: boolean
  isOwner: boolean
}

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = use(params)
  const router = useRouter()

  const [session, setSession] = useState<SessionState>({ authenticated: false, user: null })
  const [user, setUser] = useState<ProfileUser | null>(null)
  const [boards, setBoards] = useState<ProfileBoard[]>([])
  const [createdPins, setCreatedPins] = useState<PinItem[]>([])
  const [activeTab, setActiveTab] = useState<'saved' | 'created'>('saved')
  const [loading, setLoading] = useState(true)

  // Modals
  const [visualSearchPin, setVisualSearchPin] = useState<PinItem | null>(null)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false)
  const [isUserListOpen, setIsUserListOpen] = useState(false)
  const [userListType, setUserListType] = useState<'followers' | 'following'>('followers')
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

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/users/${username}`)
      if (!res.ok) throw new Error('User not found')
      const data = await res.json()
      setUser(data.user)
      setBoards(data.boards || [])
      setCreatedPins(data.createdPins || [])
    } catch (err) {
      console.error('Failed to load profile:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSession()
    fetchProfile()
  }, [username])

  const handleToggleProfileFollow = async () => {
    if (!session.authenticated) {
      setToast({ id: Date.now().toString(), title: 'Please log in to follow creators', type: 'info' })
      return
    }
    if (!user) return

    try {
      const method = user.isFollowing ? 'DELETE' : 'POST'
      const res = await fetch(`/api/v1/users/${user.username}/follow`, { method })
      if (res.ok) {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                isFollowing: !prev.isFollowing,
                followersCount: prev.isFollowing
                  ? Math.max(0, (prev.followersCount || 1) - 1)
                  : (prev.followersCount || 0) + 1,
              }
            : prev
        )
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err)
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto py-16 text-center animate-pulse">
        <div className="w-32 h-32 rounded-full bg-zinc-200 mx-auto mb-4" />
        <div className="h-8 w-48 bg-zinc-200 mx-auto rounded-md mb-2" />
        <div className="h-4 w-32 bg-zinc-200 mx-auto rounded-md" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="w-full text-center py-24">
        <h2 className="text-2xl font-bold text-zinc-900">User Not Found</h2>
        <Link href="/" className="mt-4 inline-block text-[#e60023] font-semibold hover:underline">
          Return Home
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4">
        {/* Top-Right Floating Share & More Options (Exact Screenshot 5) */}
        <div className="flex justify-end gap-1">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href)
              setToast({ id: Date.now().toString(), title: 'Profile link copied', type: 'info' })
            }}
            className="p-3 hover:bg-zinc-100 rounded-full text-[#111111] transition-colors"
            title="Share"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            className="p-3 hover:bg-zinc-100 rounded-full text-[#111111] transition-colors"
            title="More options"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Header (Exact Screenshot 5: Large Centered Avatar, Bold Name, Handle, Stats, Action Pills) */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full mx-auto mb-4 overflow-hidden bg-[#e9e9e9]">
            <img
              src={
                user.avatarUrl ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'
              }
              alt={user.displayName || user.username}
              className="w-full h-full object-cover"
            />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-[#111111] tracking-tight">
            {user.displayName || user.username}
          </h1>

          <p className="text-sm text-[#767676] mt-1 font-medium">
            {user.username}
          </p>

          <div className="flex items-center justify-center gap-2 mt-2 text-sm font-semibold text-[#111111]">
            <button
              onClick={() => {
                setUserListType('followers')
                setIsUserListOpen(true)
              }}
              className="hover:underline"
            >
              {user.followersCount ?? 0} followers
            </button>
            <span>·</span>
            <button
              onClick={() => {
                setUserListType('following')
                setIsUserListOpen(true)
              }}
              className="hover:underline"
            >
              {user.followingCount ?? 0} following
            </button>
          </div>

          {/* Action Pills: Message & Follow (or Share & Edit Profile if owner) - Exact Screenshot 5 */}
          <div className="flex items-center justify-center gap-3 mt-5">
            {!user.isOwner ? (
              <>
                <button
                  onClick={() => {
                    setToast({ id: Date.now().toString(), title: 'Opening message...', type: 'info' })
                  }}
                  className="px-5 py-2.5 bg-[#e9e9e9] hover:bg-[#e1e1e1] text-[#111111] font-bold text-sm rounded-full transition-colors"
                >
                  Message
                </button>
                <button
                  onClick={handleToggleProfileFollow}
                  className={`px-5 py-2.5 font-bold text-sm rounded-full transition-all ${
                    user.isFollowing
                      ? 'bg-[#e9e9e9] hover:bg-[#e1e1e1] text-[#111111]'
                      : 'bg-[#e60023] hover:bg-[#ad081b] text-white'
                  }`}
                >
                  {user.isFollowing ? 'Following' : 'Follow'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href)
                    setToast({ id: Date.now().toString(), title: 'Profile link copied', type: 'info' })
                  }}
                  className="px-5 py-2.5 bg-[#e9e9e9] hover:bg-[#e1e1e1] text-[#111111] font-bold text-sm rounded-full transition-colors"
                >
                  Share
                </button>
                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className="px-5 py-2.5 bg-[#e9e9e9] hover:bg-[#e1e1e1] text-[#111111] font-bold text-sm rounded-full transition-colors"
                >
                  Edit profile
                </button>
              </>
            )}
          </div>
        </div>

        {/* Navigation Tabs: Created vs Saved (Exact Screenshot 5: thick black underline on active) */}
        <div className="flex justify-center gap-8 border-b border-transparent mb-6">
          <button
            onClick={() => setActiveTab('created')}
            className={`pb-2 text-sm font-bold transition-colors ${
              activeTab === 'created'
                ? 'border-b-2 border-[#111111] text-[#111111]'
                : 'text-[#767676] hover:text-[#111111]'
            }`}
          >
            Created
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`pb-2 text-sm font-bold transition-colors ${
              activeTab === 'saved'
                ? 'border-b-2 border-[#111111] text-[#111111]'
                : 'text-[#767676] hover:text-[#111111]'
            }`}
          >
            Saved
          </button>
        </div>

        {/* Tab Content: Saved Boards 4-Cell Collage Cards (Exact Screenshot 5) */}
        {activeTab === 'saved' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-bold text-[#767676]">
                {boards.length} {boards.length === 1 ? 'Board' : 'Boards'}
              </span>

              {user.isOwner && (
                <button
                  onClick={() => setIsCreateBoardOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#e9e9e9] hover:bg-[#e1e1e1] text-[#111111] font-bold text-xs rounded-full transition-colors"
                  title="Create new board"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create board</span>
                </button>
              )}
            </div>

            {boards.length === 0 ? (
              <div className="py-20 text-center max-w-sm mx-auto">
                <p className="text-[#767676] text-sm">No boards saved yet.</p>
                {user.isOwner && (
                  <button
                    onClick={() => setIsCreateBoardOpen(true)}
                    className="mt-4 px-5 py-2.5 bg-[#e60023] hover:bg-[#ad081b] text-white font-bold text-sm rounded-full transition-colors"
                  >
                    Create board
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                {boards.map((board) => (
                  <Link
                    key={board.id}
                    href={`/${user.username}/${board.id}`}
                    className="group block"
                  >
                    {/* 4-Cell Collage Card: 1 Large Hero on Left + 3 Stacked Preview Cells on Right (Exact Screenshot 5) */}
                    <div className="aspect-[4/3] rounded-2xl bg-[#e9e9e9] overflow-hidden grid grid-cols-3 gap-0.5 border border-zinc-200/60 group-hover:opacity-95 transition-opacity">
                      {board.thumbnails && board.thumbnails.length > 0 ? (
                        <>
                          {/* Left 2/3: Large Hero Image */}
                          <div className="col-span-2 h-full bg-[#e9e9e9]">
                            <img
                              src={board.thumbnails[0]}
                              alt={board.title}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Right 1/3: 3 Stacked Preview Cells */}
                          <div className="col-span-1 grid grid-rows-3 gap-0.5 h-full">
                            <div className="bg-[#e9e9e9] overflow-hidden">
                              {board.thumbnails[1] && (
                                <img
                                  src={board.thumbnails[1]}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="bg-[#e9e9e9] overflow-hidden">
                              {board.thumbnails[2] && (
                                <img
                                  src={board.thumbnails[2]}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="bg-[#e9e9e9] overflow-hidden">
                              {board.thumbnails[3] && (
                                <img
                                  src={board.thumbnails[3]}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="col-span-3 h-full flex items-center justify-center text-xs font-semibold text-[#767676] bg-[#e9e9e9]">
                          Empty board
                        </div>
                      )}
                    </div>

                    {/* Board Title & Pin Count underneath (Exact Screenshot 5) */}
                    <div className="mt-2 px-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-[#111111] truncate">
                          {board.title}
                        </h3>
                        {board.isPrivate && (
                          <Lock className="w-3.5 h-3.5 text-[#767676] shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-[#767676] mt-0.5">
                        {board.pinCount} {board.pinCount === 1 ? 'Pin' : 'Pins'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Created Pins */}
        {activeTab === 'created' && (
          <div>
            {createdPins.length === 0 ? (
              <div className="py-20 text-center max-w-sm mx-auto">
                <p className="text-[#767676] text-sm">Nothing to show... yet! Pins you create will live here.</p>
                {user.isOwner && (
                  <button
                    onClick={() => router.push('/')}
                    className="mt-4 px-5 py-2.5 bg-[#e60023] hover:bg-[#ad081b] text-white font-bold text-sm rounded-full transition-colors"
                  >
                    Create Pin
                  </button>
                )}
              </div>
            ) : (
              <MasonryGrid
                pins={createdPins}
                loading={false}
                onOpenDetail={(p) => router.push(`/pin/${p.id}`)}
                onQuickSave={async () => {}}
                onSaveToSpecificBoard={async () => {}}
                onCreateBoardClick={() => {}}
                onVisualSearchClick={(p) => setVisualSearchPin(p)}
              />
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && user && (
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          onProfileUpdated={() => fetchProfile()}
        />
      )}

      {/* Create Board Modal */}
      {isCreateBoardOpen && (
        <CreateBoardModal
          isOpen={isCreateBoardOpen}
          onClose={() => setIsCreateBoardOpen(false)}
          onBoardCreated={() => fetchProfile()}
        />
      )}

      {/* User List Modal */}
      {isUserListOpen && (
        <UserListModal
          isOpen={isUserListOpen}
          username={user.username}
          type={userListType}
          onClose={() => setIsUserListOpen(false)}
        />
      )}

      {/* Visual Search Modal */}
      {visualSearchPin && (
        <VisualSearchModal
          pin={visualSearchPin}
          isOpen={Boolean(visualSearchPin)}
          onClose={() => setVisualSearchPin(null)}
          onOpenDetail={(p) => router.push(`/pin/${p.id}`)}
          onQuickSave={async () => {}}
          onSaveToSpecificBoard={async () => {}}
          onCreateBoardClick={() => {}}
        />
      )}

      {/* Global Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
