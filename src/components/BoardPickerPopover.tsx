'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, Plus, Check, Lock, Folder, X, LogIn } from 'lucide-react'
import { UserBoard } from '@/types'

interface BoardPickerPopoverProps {
  pinId: string
  isOpen: boolean
  onClose: () => void
  onSaveToBoard: (boardId: string, boardTitle: string, sectionId?: string, sectionTitle?: string) => void
  onCreateBoardClick: () => void
}

export default function BoardPickerPopover({
  pinId,
  isOpen,
  onClose,
  onSaveToBoard,
  onCreateBoardClick,
}: BoardPickerPopoverProps) {
  const [boards, setBoards] = useState<UserBoard[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  const [savingTargetId, setSavingTargetId] = useState<string | null>(null)
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({})
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    setLoading(true)
    setIsGuest(false)

    fetch(`/api/v1/users/me/boards?pinId=${encodeURIComponent(pinId)}`)
      .then((res) => {
        if (res.status === 401) {
          setIsGuest(true)
          setLoading(false)
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (data) {
          setBoards(data.boards || [])
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('Failed to load boards:', err)
        setLoading(false)
      })
  }, [isOpen, pinId])

  // Smart Viewport Clamping: Prevents popover from ever clipping off the left or right edges
  useEffect(() => {
    if (!isOpen || !popoverRef.current) return

    const updatePosition = () => {
      if (!popoverRef.current) return
      const rect = popoverRef.current.getBoundingClientRect()
      
      // If clipped on the left of viewport
      if (rect.left < 12) {
        const shiftX = 12 - rect.left
        setPopoverStyle({ transform: `translateX(${shiftX}px)` })
      } 
      // If clipped on the right of viewport
      else if (rect.right > window.innerWidth - 12) {
        const shiftX = rect.right - (window.innerWidth - 12)
        setPopoverStyle({ transform: `translateX(-${shiftX}px)` })
      } else {
        setPopoverStyle({})
      }
    }

    // Run on open and after paint
    const timer = setTimeout(updatePosition, 10)
    window.addEventListener('resize', updatePosition)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen])

  if (!isOpen) return null

  const searchLower = search.toLowerCase().trim()

  const filteredBoards = boards.filter((b) => {
    if (!searchLower) return true
    if (b.title.toLowerCase().includes(searchLower)) return true
    return (b.sections || []).some((sec) => sec.title.toLowerCase().includes(searchLower))
  })

  const handleSelectBoard = async (boardId: string, boardTitle: string) => {
    setSavingTargetId(boardId)
    await onSaveToBoard(boardId, boardTitle)
    setSavingTargetId(null)
    onClose()
  }

  const handleSelectSection = async (
    boardId: string,
    boardTitle: string,
    sectionId: string,
    sectionTitle: string
  ) => {
    setSavingTargetId(sectionId)
    await onSaveToBoard(boardId, boardTitle, sectionId, sectionTitle)
    setSavingTargetId(null)
    onClose()
  }

  return (
    <>
      {/* Invisible Fullscreen Backdrop to guarantee clicking outside always closes the popover */}
      <div
        className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[0.5px] cursor-default"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      />

      {/* Floating Popover Container */}
      <div
        ref={popoverRef}
        style={popoverStyle}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-12 z-50 w-72 sm:w-80 max-w-[calc(100vw-24px)] bg-white rounded-3xl p-3 shadow-2xl border border-zinc-200 text-left animate-in fade-in zoom-in-95 duration-150 transition-transform"
      >
        {/* Header with Title and explicit Close button */}
        <div className="flex items-center justify-between px-2 pt-1 pb-2">
          <p className="text-xs font-bold text-zinc-900">Save to board</p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="p-1 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-800 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Guest prompt if user is not logged in */}
        {isGuest ? (
          <div className="py-6 px-3 text-center space-y-3">
            <p className="text-xs font-semibold text-zinc-700">
              Log in to save pins to your personal boards.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose()
                // Trigger login by dispatching custom event or redirecting
                window.location.href = '/?auth=login'
              }}
              className="w-full py-2 px-4 bg-[#e60023] hover:bg-[#ad081b] text-white text-xs font-bold rounded-full shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log in to S-Store</span>
            </button>
          </div>
        ) : (
          <>
            {/* Search Field */}
            <div className="px-1 pb-2.5">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search your boards & sections"
                  className="w-full pl-8 pr-3 py-1.5 bg-zinc-100 hover:bg-zinc-200/80 focus:bg-white text-xs rounded-full border border-transparent focus:border-zinc-300 focus:outline-none transition-all placeholder:text-zinc-400"
                />
              </div>
            </div>

            {/* Board & Section List */}
            <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {loading ? (
                <div className="py-6 text-center text-xs text-zinc-400">Loading boards...</div>
              ) : filteredBoards.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-400">
                  {boards.length === 0 ? 'No boards created yet' : 'No matching boards found'}
                </div>
              ) : (
                filteredBoards.map((board) => {
                  const visibleSections = (board.sections || []).filter(
                    (sec) =>
                      !searchLower ||
                      sec.title.toLowerCase().includes(searchLower) ||
                      board.title.toLowerCase().includes(searchLower)
                  )

                  return (
                    <div key={board.id} className="space-y-0.5">
                      {/* Main Board Row */}
                      <div
                        onClick={() => handleSelectBoard(board.id, board.title)}
                        className="group flex items-center justify-between p-1.5 rounded-2xl hover:bg-zinc-100 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          {/* Thumbnail */}
                          <div className="w-9 h-9 rounded-xl bg-zinc-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {board.coverThumbnail ? (
                              <img
                                src={board.coverThumbnail}
                                alt={board.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-[9px] font-bold text-zinc-400">EMPTY</div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="truncate">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-semibold text-zinc-900 truncate">
                                {board.title}
                              </span>
                              {board.isPrivate && <Lock className="w-3 h-3 text-zinc-400 shrink-0" />}
                            </div>
                            <span className="text-[10px] text-zinc-500">
                              {board.pinCount} {board.pinCount === 1 ? 'Pin' : 'Pins'}
                            </span>
                          </div>
                        </div>

                        {/* Action */}
                        {board.hasPin ? (
                          <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-zinc-700 bg-zinc-200 px-2.5 py-1 rounded-full">
                            <Check className="w-3 h-3" /> Saved
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={savingTargetId === board.id}
                            className="shrink-0 px-3 py-1 bg-[#e60023] hover:bg-[#ad081b] text-white text-xs font-bold rounded-full transition-all shadow-sm"
                          >
                            {savingTargetId === board.id ? '...' : 'Save'}
                          </button>
                        )}
                      </div>

                      {/* Indented Sections List */}
                      {visibleSections.length > 0 && (
                        <div className="ml-5 pl-2.5 border-l-2 border-zinc-200 space-y-0.5 py-0.5">
                          {visibleSections.map((sec) => (
                            <div
                              key={sec.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSelectSection(board.id, board.title, sec.id, sec.title)
                              }}
                              className="group flex items-center justify-between p-1 rounded-xl hover:bg-zinc-100 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <Folder className="w-3 h-3 text-zinc-400 shrink-0" />
                                <div className="truncate">
                                  <span className="text-xs font-medium text-zinc-800 truncate block">
                                    {sec.title}
                                  </span>
                                  <span className="text-[9px] text-zinc-400">
                                    {sec.pinCount} {sec.pinCount === 1 ? 'pin' : 'pins'}
                                  </span>
                                </div>
                              </div>

                              {sec.hasPin ? (
                                <span className="shrink-0 flex items-center gap-1 text-[9px] font-semibold text-zinc-700 bg-zinc-200 px-2 py-0.5 rounded-full">
                                  <Check className="w-2.5 h-2.5" /> Saved
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={savingTargetId === sec.id}
                                  className="shrink-0 px-2.5 py-0.5 bg-[#e60023] hover:bg-[#ad081b] text-white text-[11px] font-bold rounded-full transition-all shadow-sm"
                                >
                                  {savingTargetId === sec.id ? '...' : 'Save'}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Create Board Row */}
            <div className="pt-2 mt-2 border-t border-zinc-100">
              <button
                onClick={() => {
                  onCreateBoardClick()
                  onClose()
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-2xl hover:bg-zinc-100 text-left transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-zinc-100 group-hover:bg-zinc-200 flex items-center justify-center text-zinc-900">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-900 block">Create board</span>
                  <span className="text-[10px] text-zinc-500">Save this pin to a new board</span>
                </div>
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
