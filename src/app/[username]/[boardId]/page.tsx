'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import MasonryGrid from '@/components/MasonryGrid'
import PinDetailModal from '@/components/PinDetailModal'
import CreatePinModal from '@/components/CreatePinModal'
import AuthModal from '@/components/AuthModal'
import Toast, { ToastMessage } from '@/components/Toast'
import { PinItem, SessionState, BoardSectionData } from '@/types'
import { Lock, Share2, Trash2, Plus, FolderPlus, X, UserPlus, Archive, Edit3, Check, ArrowRightLeft, LayoutGrid, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import VisualSearchModal from '@/components/VisualSearchModal'
import BoardCollaboratorsModal from '@/components/BoardCollaboratorsModal'
import ShareBoardModal from '@/components/ShareBoardModal'

interface BoardData {
  id: string
  title: string
  description: string | null
  isPrivate: boolean
  isArchived?: boolean
  coverImageUrl?: string | null
  pinCount: number
  isOwner: boolean
  sections?: BoardSectionData[]
  owner: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
}

export default function BoardDetailPage({
  params,
}: {
  params: Promise<{ username: string; boardId: string }>
}) {
  const { username, boardId } = use(params)
  const router = useRouter()

  const [session, setSession] = useState<SessionState>({ authenticated: false, user: null })
  const [board, setBoard] = useState<BoardData | null>(null)
  const [pins, setPins] = useState<PinItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSectionId, setActiveSectionId] = useState<string | 'all'>('all')

  // Modals
  const [activePin, setActivePin] = useState<PinItem | null>(null)
  const [visualSearchPin, setVisualSearchPin] = useState<PinItem | null>(null)
  const [isCreatePinOpen, setIsCreatePinOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isCreateSectionOpen, setIsCreateSectionOpen] = useState(false)
  const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'custom' | 'recent' | 'oldest' | 'az' | 'za'>('custom')
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Edit Board Modal
  const [isEditBoardOpen, setIsEditBoardOpen] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editIsPrivate, setEditIsPrivate] = useState(false)
  const [editIsArchived, setEditIsArchived] = useState(false)
  const [editCoverImageUrl, setEditCoverImageUrl] = useState<string | null>(null)

  // Organize Mode State
  const [isOrganizing, setIsOrganizing] = useState(false)
  const [selectedPinIds, setSelectedPinIds] = useState<string[]>([])
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false)

  const toggleSelectPin = (pinId: string) => {
    setSelectedPinIds((prev) =>
      prev.includes(pinId) ? prev.filter((id) => id !== pinId) : [...prev, pinId]
    )
  }

  const handleShiftPin = async (pinId: string, direction: 'left' | 'right') => {
    const idx = pins.findIndex((p) => p.id === pinId)
    if (idx === -1) return
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= pins.length) return

    const reordered = [...pins]
    const temp = reordered[idx]
    reordered[idx] = reordered[targetIdx]
    reordered[targetIdx] = temp

    const updatedWithPositions = reordered.map((p, i) => ({ ...p, position: i }))
    setPins(updatedWithPositions)
    setSortBy('custom')

    try {
      await fetch(`/api/v1/boards/${boardId}/pins/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinIds: updatedWithPositions.map((p) => p.id) }),
      })
    } catch (err) {
      console.error('Failed to save reorder:', err)
    }
  }

  const handleMoveSelectedPins = async (targetSectionId: string | null) => {
    if (selectedPinIds.length === 0) return

    try {
      await Promise.all(
        selectedPinIds.map((pinId) =>
          fetch(`/api/v1/boards/${boardId}/pins/${pinId}/section`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sectionId: targetSectionId }),
          })
        )
      )

      setPins((prev) =>
        prev.map((p) =>
          selectedPinIds.includes(p.id) ? { ...p, sectionId: targetSectionId } : p
        )
      )
      setSelectedPinIds([])
      setIsMoveModalOpen(false)
      setIsOrganizing(false)
      setToast({
        id: Date.now().toString(),
        title: 'Pins organized successfully',
        type: 'success',
      })
    } catch {
      alert('Error moving pins')
    }
  }

  const handleDeleteSelectedPins = async () => {
    if (!confirm(`Remove ${selectedPinIds.length} pin(s) from this board?`)) return

    try {
      await Promise.all(
        selectedPinIds.map((pinId) =>
          fetch(`/api/v1/boards/${boardId}/pins?pinId=${encodeURIComponent(pinId)}`, {
            method: 'DELETE',
          })
        )
      )

      setPins((prev) => prev.filter((p) => !selectedPinIds.includes(p.id)))
      setSelectedPinIds([])
      setIsOrganizing(false)
      setToast({
        id: Date.now().toString(),
        title: 'Pins removed from board',
        type: 'info',
      })
    } catch {
      alert('Error removing pins')
    }
  }

  const openEditModal = () => {
    if (!board) return
    setEditTitle(board.title)
    setEditDescription(board.description || '')
    setEditIsPrivate(board.isPrivate)
    setEditIsArchived(!!board.isArchived)
    setEditCoverImageUrl(board.coverImageUrl || (pins.length > 0 ? pins[0].imageUrl : null))
    setIsEditBoardOpen(true)
  }

  const handleUpdateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTitle.trim()) return

    try {
      const res = await fetch(`/api/v1/boards/${boardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          isPrivate: editIsPrivate,
          isArchived: editIsArchived,
          coverImageUrl: editCoverImageUrl,
        }),
      })

      if (!res.ok) throw new Error('Failed to update board')
      const data = await res.json()
      setBoard((prev) =>
        prev
          ? {
              ...prev,
              title: data.board.title,
              description: data.board.description,
              isPrivate: data.board.isPrivate,
              isArchived: data.board.isArchived,
              coverImageUrl: data.board.coverImageUrl,
            }
          : prev
      )
      setIsEditBoardOpen(false)
      setToast({
        id: Date.now().toString(),
        title: 'Board settings updated',
        type: 'success',
      })
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error updating board')
    }
  }

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/v1/session')
      const data = await res.json()
      setSession(data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchBoard = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/boards/${boardId}`)
      if (!res.ok) throw new Error('Board not found')
      const data = await res.json()
      setBoard(data.board)
      setPins(data.pins)
    } catch (err) {
      console.error('Failed to load board:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSession()
    fetchBoard()
  }, [boardId])

  const handleDeleteBoard = async () => {
    if (!confirm('Are you sure you want to delete this board and its contents?')) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/v1/boards/${boardId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete board')

      router.push(`/${username}`)
    } catch {
      alert('Error deleting board')
      setIsDeleting(false)
    }
  }

  const handleUnsavePin = async (pinId: string) => {
    try {
      await fetch(`/api/v1/boards/${boardId}/pins?pinId=${encodeURIComponent(pinId)}`, {
        method: 'DELETE',
      })

      setPins((prev) => prev.filter((p) => p.id !== pinId))
      setToast({
        id: Date.now().toString(),
        title: 'Pin removed from board',
        type: 'info',
      })
    } catch {
      setToast({
        id: Date.now().toString(),
        title: 'Error removing pin',
        type: 'error',
      })
    }
  }

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSectionTitle.trim()) return

    try {
      const res = await fetch(`/api/v1/boards/${boardId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSectionTitle.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create section')

      setBoard((prev) =>
        prev
          ? {
              ...prev,
              sections: [...(prev.sections || []), data.section],
            }
          : prev
      )
      setNewSectionTitle('')
      setIsCreateSectionOpen(false)
      setToast({
        id: Date.now().toString(),
        title: `Section "${data.section.title}" created`,
        type: 'success',
      })
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error creating section')
    }
  }

  const handleDeleteSection = async (sectionId: string, sectionTitle: string) => {
    if (!confirm(`Delete section "${sectionTitle}"? Pins in this section will become unorganized.`)) return

    try {
      const res = await fetch(`/api/v1/boards/${boardId}/sections/${sectionId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete section')

      setBoard((prev) =>
        prev
          ? {
              ...prev,
              sections: (prev.sections || []).filter((s) => s.id !== sectionId),
            }
          : prev
      )
      setPins((prev) =>
        prev.map((p) => (p.sectionId === sectionId ? { ...p, sectionId: null } : p))
      )
      if (activeSectionId === sectionId) {
        setActiveSectionId('all')
      }
      setToast({
        id: Date.now().toString(),
        title: `Section "${sectionTitle}" deleted`,
        type: 'info',
      })
    } catch {
      alert('Error deleting section')
    }
  }

  if (loading) {
    return (
      <div className="w-full">
        <div className="max-w-xl mx-auto py-20 text-center animate-pulse">
          <div className="h-8 w-64 bg-zinc-200 mx-auto rounded-md mb-3" />
          <div className="h-4 w-40 bg-zinc-200 mx-auto rounded-md" />
        </div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="w-full text-center py-24">
        <h2 className="text-2xl font-bold text-zinc-900">Board Not Found</h2>
        <Link href="/" className="mt-4 inline-block text-[#e60023] font-semibold hover:underline">
          Return Home
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full">
      <main className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-8">
        {/* Board Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900">
              {board.title}
            </h1>
            {board.isPrivate && (
              <span title="Secret board" className="p-1 bg-zinc-100 rounded-full text-zinc-600">
                <Lock className="w-4 h-4" />
              </span>
            )}
          </div>

          {board.description && (
            <p className="text-sm text-zinc-600 leading-relaxed mb-3">
              {board.description}
            </p>
          )}

          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-zinc-500">
            <span>By</span>
            <Link
              href={`/${board.owner.username}`}
              className="inline-flex items-center gap-1.5 text-zinc-900 hover:underline"
            >
              <img
                src={
                  board.owner.avatarUrl ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'
                }
                alt={board.owner.username}
                className="w-5 h-5 rounded-full object-cover"
              />
              <span>{board.owner.displayName || board.owner.username}</span>
            </Link>
            <span>·</span>
            <span>{pins.length} {pins.length === 1 ? 'Pin' : 'Pins'}</span>
          </div>

          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="p-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-full transition-colors"
              title="Share Board"
            >
              <Share2 className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsCollaboratorsOpen(true)}
              className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs rounded-full transition-colors flex items-center gap-1.5"
              title="Manage Collaborators"
            >
              <UserPlus className="w-4 h-4 text-zinc-700" />
              <span>Collaborators</span>
            </button>

            {board.isOwner && (
              <>
                <button
                  onClick={openEditModal}
                  className="p-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-full transition-colors"
                  title="Edit board settings"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDeleteBoard}
                  disabled={isDeleting}
                  className="p-2.5 bg-zinc-100 hover:bg-red-50 text-zinc-700 hover:text-red-600 rounded-full transition-colors"
                  title="Delete Board"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Archived Board Alert Banner */}
        {board.isArchived && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 text-amber-900 font-medium">
              <Archive className="w-5 h-5 text-amber-700 shrink-0" />
              <span>
                This board is archived. It is hidden from public profile and cannot accept new pins.
              </span>
            </div>
            {board.isOwner && (
              <button
                onClick={openEditModal}
                className="px-3.5 py-1.5 bg-amber-200/90 hover:bg-amber-300 font-bold rounded-full text-amber-950 transition-colors shrink-0"
              >
                Manage archive
              </button>
            )}
          </div>
        )}

        {/* Board Sections Bar */}
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setActiveSectionId('all')}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeSectionId === 'all'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
              }`}
            >
              All Pins ({pins.length})
            </button>

            {(board.sections || []).map((sec) => (
              <div key={sec.id} className="relative group/sec flex items-center">
                <button
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all pr-7 ${
                    activeSectionId === sec.id
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                  }`}
                >
                  {sec.title} ({pins.filter((p) => p.sectionId === sec.id).length})
                </button>
                {board.isOwner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteSection(sec.id, sec.title)
                    }}
                    className="absolute right-2 p-0.5 rounded-full hover:bg-zinc-300 text-zinc-400 hover:text-red-600 transition-colors"
                    title={`Delete section "${sec.title}"`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}

            {/* Unorganized Tab if there are sections */}
            {(board.sections || []).length > 0 && (
              <button
                onClick={() => setActiveSectionId('unorganized')}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeSectionId === 'unorganized'
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                }`}
              >
                Unorganized ({pins.filter((p) => !p.sectionId).length})
              </button>
            )}
          </div>

          {/* Controls: Sort, Organize & Add Section */}
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {/* Sort Dropdown */}
            <div className="relative flex items-center">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none pl-7 pr-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-full transition-colors cursor-pointer focus:outline-none"
              >
                <option value="custom">Custom order</option>
                <option value="recent">Recently saved</option>
                <option value="oldest">Oldest first</option>
                <option value="az">A to Z</option>
                <option value="za">Z to A</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 pointer-events-none" />
            </div>

            {board.isOwner && (
              <>
                <button
                  onClick={() => {
                    setIsOrganizing((v) => !v)
                    setSelectedPinIds([])
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-full transition-colors ${
                    isOrganizing
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                  }`}
                  title="Select and organize pins"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>{isOrganizing ? 'Done' : 'Organize'}</span>
                </button>
                <button
                  onClick={() => setIsCreateSectionOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-full transition-colors"
                  title="Add Section to organize pins"
                >
                  <FolderPlus className="w-4 h-4 text-zinc-600" />
                  <span>Add section</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Board Pins Masonry or Organize Grid */}
        {(() => {
          let displayedPins =
            activeSectionId === 'all'
              ? pins
              : activeSectionId === 'unorganized'
              ? pins.filter((p) => !p.sectionId)
              : pins.filter((p) => p.sectionId === activeSectionId)

          displayedPins = [...displayedPins].sort((a, b) => {
            if (sortBy === 'custom') return (a.position ?? 0) - (b.position ?? 0)
            if (sortBy === 'az') return a.title.localeCompare(b.title)
            if (sortBy === 'za') return b.title.localeCompare(a.title)
            if (sortBy === 'oldest') {
              return new Date(a.savedAt || 0).getTime() - new Date(b.savedAt || 0).getTime()
            }
            return new Date(b.savedAt || 0).getTime() - new Date(a.savedAt || 0).getTime()
          })

          if (displayedPins.length === 0) {
            return (
              <div className="py-20 text-center max-w-sm mx-auto">
                <h3 className="text-lg font-bold text-zinc-800 mb-2">No Pins in this section</h3>
                <p className="text-xs text-zinc-500 mb-6">
                  Save ideas from the home feed or organize existing pins into this section.
                </p>
                <Link
                  href="/"
                  className="px-6 py-3 bg-pinterest-red hover:bg-pinterest-redHover text-white font-bold text-xs rounded-full transition-colors shadow-sm inline-block"
                >
                  Explore Pins
                </Link>
              </div>
            )
          }

          if (isOrganizing) {
            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-24">
                {displayedPins.map((pin) => {
                  const isSelected = selectedPinIds.includes(pin.id)
                  return (
                    <div
                      key={pin.id}
                      onClick={() => toggleSelectPin(pin.id)}
                      className={`relative cursor-pointer rounded-2xl overflow-hidden border-2 transition-all ${
                        isSelected
                          ? 'border-pinterest-red ring-2 ring-pinterest-red/40 scale-[0.98]'
                          : 'border-transparent hover:border-zinc-300'
                      }`}
                    >
                      <img
                        src={pin.imageUrl}
                        alt={pin.title}
                        className="w-full h-48 object-cover rounded-xl"
                      />
                      {/* Reposition Left / Right Controls */}
                      <div
                        className="absolute top-2.5 left-2.5 flex items-center gap-1 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleShiftPin(pin.id, 'left')}
                          className="p-1 rounded-full bg-white/90 hover:bg-white text-zinc-700 shadow-sm transition-transform hover:scale-105"
                          title="Move left"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShiftPin(pin.id, 'right')}
                          className="p-1 rounded-full bg-white/90 hover:bg-white text-zinc-700 shadow-sm transition-transform hover:scale-105"
                          title="Move right"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div
                        className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                          isSelected
                            ? 'bg-pinterest-red border-pinterest-red text-white'
                            : 'bg-white/80 border-zinc-400 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <div className="p-2 bg-white/90">
                        <p className="text-xs font-bold text-zinc-800 truncate">{pin.title}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          }

          return (
            <MasonryGrid
              pins={displayedPins}
              loading={false}
              onOpenDetail={(pin) => setActivePin(pin)}
              onQuickSave={async () => {}}
              onSaveToSpecificBoard={async () => {}}
              onCreateBoardClick={() => {}}
              onVisualSearchClick={(pin) => setVisualSearchPin(pin)}
            />
          )
        })()}

        {/* Floating Organize Toolbar */}
        {isOrganizing && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-zinc-900 rounded-full shadow-2xl border border-zinc-200 dark:border-zinc-800 px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-150">
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
              {selectedPinIds.length} Pin{selectedPinIds.length === 1 ? '' : 's'} selected
            </span>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
            <button
              onClick={() => setIsMoveModalOpen(true)}
              disabled={selectedPinIds.length === 0}
              className="px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 text-xs font-bold rounded-full text-zinc-900 dark:text-zinc-100 transition-colors flex items-center gap-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" /> Move
            </button>
            <button
              onClick={handleDeleteSelectedPins}
              disabled={selectedPinIds.length === 0}
              className="px-4 py-1.5 bg-red-50 hover:bg-red-100 disabled:opacity-40 text-xs font-bold rounded-full text-red-600 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            <button
              onClick={() => {
                setIsOrganizing(false)
                setSelectedPinIds([])
              }}
              className="px-4 py-1.5 bg-zinc-900 text-white text-xs font-bold rounded-full hover:bg-zinc-800 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </main>

      {/* Pin Detail Modal */}
      <PinDetailModal
        pin={activePin}
        onClose={() => setActivePin(null)}
        onQuickSave={async () => {}}
        onSaveToSpecificBoard={async () => {}}
        onCreateBoardClick={() => {}}
        onVisualSearchClick={(pin) => setVisualSearchPin(pin)}
      />

      {/* Visual Search Modal */}
      <VisualSearchModal
        pin={visualSearchPin}
        isOpen={Boolean(visualSearchPin)}
        onClose={() => setVisualSearchPin(null)}
        onOpenDetail={(p) => setActivePin(p)}
        onQuickSave={async () => {}}
        onSaveToSpecificBoard={async () => {}}
        onCreateBoardClick={() => {}}
      />

      {/* Create Section In-Flow Modal */}
      {isCreateSectionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
              <h3 className="text-lg font-bold text-zinc-900">Name this section</h3>
              <button
                onClick={() => setIsCreateSectionOpen(false)}
                className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSection} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1.5">
                  Section Title
                </label>
                <input
                  type="text"
                  required
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder='Like "Lighting", "Art Prints", or "Chairs"'
                  autoFocus
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm focus:outline-none focus:border-zinc-400 focus:bg-white transition-colors"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateSectionOpen(false)}
                  className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newSectionTitle.trim()}
                  className="px-5 py-2.5 bg-pinterest-red hover:bg-pinterest-redHover disabled:opacity-50 text-white font-bold text-xs rounded-full transition-colors shadow-sm"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Board Modal */}
      {isEditBoardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-5">
              <h3 className="text-lg font-bold text-zinc-900">Edit your board</h3>
              <button
                onClick={() => setIsEditBoardOpen(false)}
                className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBoard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm focus:outline-none focus:border-zinc-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="What's your board about?"
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm focus:outline-none focus:border-zinc-400 focus:bg-white resize-none"
                />
              </div>

              {/* Board Cover Photo Selector */}
              {pins.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1.5">
                    Board Cover
                  </label>
                  <p className="text-[11px] text-zinc-400 mb-2">
                    Choose which pin appears as the main thumbnail on your profile.
                  </p>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {pins.map((p) => {
                      const isCover = editCoverImageUrl === p.imageUrl
                      return (
                        <div
                          key={p.id}
                          onClick={() => setEditCoverImageUrl(p.imageUrl)}
                          className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 cursor-pointer border-2 transition-all ${
                            isCover
                              ? 'border-pinterest-red ring-2 ring-pinterest-red/30'
                              : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={p.imageUrl}
                            alt={p.title}
                            className="w-full h-full object-cover"
                          />
                          {isCover && (
                            <div className="absolute inset-0 bg-black/25 flex items-center justify-center text-white">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Secret board switch */}
              <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                <div>
                  <p className="text-xs font-bold text-zinc-800">Keep this board secret</p>
                  <p className="text-[11px] text-zinc-500">Only you and collaborators can see it.</p>
                </div>
                <input
                  type="checkbox"
                  checked={editIsPrivate}
                  onChange={(e) => setEditIsPrivate(e.target.checked)}
                  className="w-4 h-4 rounded text-pinterest-red focus:ring-pinterest-red"
                />
              </div>

              {/* Archive board switch */}
              <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-2xl border border-amber-100">
                <div>
                  <p className="text-xs font-bold text-zinc-800">Archive board</p>
                  <p className="text-[11px] text-zinc-500">Hide from profile & disable new saves.</p>
                </div>
                <input
                  type="checkbox"
                  checked={editIsArchived}
                  onChange={(e) => setEditIsArchived(e.target.checked)}
                  className="w-4 h-4 rounded text-pinterest-red focus:ring-pinterest-red"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsEditBoardOpen(false)}
                  className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editTitle.trim()}
                  className="px-5 py-2.5 bg-pinterest-red hover:bg-pinterest-redHover disabled:opacity-50 text-white font-bold text-xs rounded-full transition-colors shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Move Pins to Section Modal */}
      {isMoveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <h3 className="text-base font-bold text-zinc-900">
                Move {selectedPinIds.length} Pin{selectedPinIds.length === 1 ? '' : 's'} to:
              </h3>
              <button
                onClick={() => setIsMoveModalOpen(false)}
                className="p-1 hover:bg-zinc-100 rounded-full text-zinc-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              <button
                onClick={() => handleMoveSelectedPins(null)}
                className="w-full text-left px-4 py-2.5 rounded-2xl hover:bg-zinc-100 transition-colors flex items-center justify-between text-xs font-semibold text-zinc-800"
              >
                <span>No section (Unorganized)</span>
              </button>

              {(board?.sections || []).map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => handleMoveSelectedPins(sec.id)}
                  className="w-full text-left px-4 py-2.5 rounded-2xl hover:bg-zinc-100 transition-colors flex items-center justify-between text-xs font-semibold text-zinc-800"
                >
                  <span>{sec.title}</span>
                  <span className="text-[11px] text-zinc-400 font-normal">
                    {sec.pinCount} pins
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-3 mt-3 border-t border-zinc-100 flex justify-end">
              <button
                onClick={() => setIsMoveModalOpen(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-xs font-bold text-zinc-700 rounded-full"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {board && (
        <>
          <BoardCollaboratorsModal
            boardId={board.id}
            boardTitle={board.title}
            isOwner={board.isOwner}
            isOpen={isCollaboratorsOpen}
            onClose={() => setIsCollaboratorsOpen(false)}
          />

          <ShareBoardModal
            boardTitle={board.title}
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
          />
        </>
      )}

      <CreatePinModal
        isOpen={isCreatePinOpen}
        onClose={() => setIsCreatePinOpen(false)}
        onPinCreated={() => fetchBoard()}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSwitchUser={() => {}}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
