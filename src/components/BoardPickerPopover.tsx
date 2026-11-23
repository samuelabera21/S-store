'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, Plus, Check, Lock, Folder, ChevronRight } from 'lucide-react'
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
  const [savingTargetId, setSavingTargetId] = useState<string | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    setLoading(true)
    fetch(`/api/v1/users/me/boards?pinId=${encodeURIComponent(pinId)}`)
      .then((res) => res.json())
      .then((data) => {
        setBoards(data.boards || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load boards:', err)
        setLoading(false)
      })
  }, [isOpen, pinId])

  // Handle outside click to dismiss
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

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
    <div
      ref={popoverRef}
      className="absolute right-0 top-12 z-50 w-80 bg-white rounded-3xl p-3 shadow-2xl border border-zinc-200 text-left animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="px-2 pt-2 pb-3">
        <p className="text-xs font-bold text-zinc-600 mb-2">Save to board</p>

        {/* Search Field */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your boards & sections"
            className="w-full pl-9 pr-3 py-2 bg-zinc-100 hover:bg-zinc-200/80 focus:bg-white text-xs rounded-full border border-transparent focus:border-zinc-300 focus:outline-none transition-all placeholder:text-zinc-400"
          />
        </div>
      </div>

      {/* Board & Section List */}
      <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
        {loading ? (
          <div className="py-6 text-center text-xs text-zinc-400">Loading boards...</div>
        ) : filteredBoards.length === 0 ? (
          <div className="py-6 text-center text-xs text-zinc-400">No boards or sections found</div>
        ) : (
          filteredBoards.map((board) => {
            const visibleSections = (board.sections || []).filter(
              (sec) => !searchLower || sec.title.toLowerCase().includes(searchLower) || board.title.toLowerCase().includes(searchLower)
            )

            return (
              <div key={board.id} className="space-y-1">
                {/* Main Board Row */}
                <div
                  onClick={() => handleSelectBoard(board.id, board.title)}
                  className="group flex items-center justify-between p-2 rounded-2xl hover:bg-zinc-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {/* Thumbnail */}
                    <div className="w-10 h-10 rounded-xl bg-zinc-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {board.coverThumbnail ? (
                        <img
                          src={board.coverThumbnail}
                          alt={board.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-[10px] font-bold text-zinc-400">EMPTY</div>
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
                      <span className="text-[11px] text-zinc-500">
                        {board.pinCount} {board.pinCount === 1 ? 'Pin' : 'Pins'}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  {board.hasPin ? (
                    <span className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-zinc-700 bg-zinc-200 px-2.5 py-1.5 rounded-full">
                      <Check className="w-3 h-3" /> Saved
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={savingTargetId === board.id}
                      className="shrink-0 px-3 py-1.5 bg-[#e60023] hover:bg-[#ad081b] text-white text-xs font-bold rounded-full transition-all shadow-sm"
                    >
                      {savingTargetId === board.id ? '...' : 'Save'}
                    </button>
                  )}
                </div>

                {/* Indented Sections List */}
                {visibleSections.length > 0 && (
                  <div className="ml-5 pl-3 border-l-2 border-zinc-200 space-y-1 py-0.5">
                    {visibleSections.map((sec) => (
                      <div
                        key={sec.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectSection(board.id, board.title, sec.id, sec.title)
                        }}
                        className="group flex items-center justify-between p-1.5 rounded-xl hover:bg-zinc-100 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <Folder className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <div className="truncate">
                            <span className="text-xs font-medium text-zinc-800 truncate block">
                              {sec.title}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              {sec.pinCount} {sec.pinCount === 1 ? 'pin' : 'pins'}
                            </span>
                          </div>
                        </div>

                        {sec.hasPin ? (
                          <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-zinc-700 bg-zinc-200 px-2 py-1 rounded-full">
                            <Check className="w-3 h-3" /> Saved
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={savingTargetId === sec.id}
                            className="shrink-0 px-2.5 py-1 bg-[#e60023] hover:bg-[#ad081b] text-white text-[11px] font-bold rounded-full transition-all shadow-sm"
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
          className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-zinc-100 text-left transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-zinc-100 group-hover:bg-zinc-200 flex items-center justify-center text-zinc-900">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-zinc-900 block">Create board</span>
            <span className="text-[11px] text-zinc-500">Save this pin to a new board</span>
          </div>
        </button>
      </div>
    </div>
  )
}
