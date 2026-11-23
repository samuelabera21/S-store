'use client'

import React, { useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import BoardPickerPopover from './BoardPickerPopover'

interface SaveButtonProps {
  pinId: string
  isSaved: boolean
  defaultBoardTitle?: string
  onQuickSave: () => Promise<void>
  onSaveToSpecificBoard: (boardId: string, boardTitle: string, sectionId?: string, sectionTitle?: string) => Promise<void>
  onCreateBoardClick: () => void
}

export default function SaveButton({
  pinId,
  isSaved,
  defaultBoardTitle,
  onQuickSave,
  onSaveToSpecificBoard,
  onCreateBoardClick,
}: SaveButtonProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleMainClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isSaved) return

    setLoading(true)
    try {
      await onQuickSave()
    } finally {
      setLoading(false)
    }
  }

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsPopoverOpen((prev) => !prev)
  }

  return (
    <div className="relative inline-flex items-center">
      {isSaved ? (
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-900 text-white font-bold text-xs rounded-full shadow-sm">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>Saved</span>
          <button
            onClick={handleChevronClick}
            className="p-0.5 hover:bg-zinc-800 rounded-full transition-colors ml-0.5"
            aria-label="Change board"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          {/* Board Selector Dropdown Pill (Exact Screenshot 3: [Board ∨]) */}
          <button
            type="button"
            onClick={handleChevronClick}
            className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-[#111111] hover:bg-zinc-100 rounded-full transition-colors"
          >
            <span className="max-w-[90px] truncate">{defaultBoardTitle || 'Quick Saves'}</span>
            <ChevronDown className="w-4 h-4 text-[#111111]" />
          </button>

          {/* Red Save Button (Exact Screenshot 3: [Save]) */}
          <button
            type="button"
            onClick={handleMainClick}
            disabled={loading}
            className="px-4 py-2.5 bg-[#e60023] hover:bg-[#ad081b] text-white font-bold text-xs rounded-full shadow-sm transition-colors"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}

      {/* Floating Board Picker Popover */}
      <BoardPickerPopover
        pinId={pinId}
        isOpen={isPopoverOpen}
        onClose={() => setIsPopoverOpen(false)}
        onSaveToBoard={onSaveToSpecificBoard}
        onCreateBoardClick={onCreateBoardClick}
      />
    </div>
  )
}
