'use client'

import React from 'react'
import { PinItem } from '@/types'
import PinCard from './PinCard'

interface MasonryGridProps {
  pins: PinItem[]
  loading: boolean
  onOpenDetail: (pin: PinItem) => void
  onQuickSave: (pinId: string) => Promise<void>
  onSaveToSpecificBoard: (
    pinId: string,
    boardId: string,
    boardTitle: string,
    sectionId?: string,
    sectionTitle?: string
  ) => Promise<void>
  onCreateBoardClick: (pinId: string) => void
  onVisualSearchClick?: (pin: PinItem) => void
}

export default function MasonryGrid({
  pins,
  loading,
  onOpenDetail,
  onQuickSave,
  onSaveToSpecificBoard,
  onCreateBoardClick,
  onVisualSearchClick,
}: MasonryGridProps) {
  if (loading) {
    return (
      <div className="masonry-grid max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="masonry-item rounded-2xl bg-zinc-200 animate-pulse"
            style={{ height: `${240 + (i % 3) * 80}px` }}
          />
        ))}
      </div>
    )
  }

  if (pins.length === 0) {
    return (
      <div className="py-20 text-center">
        <h3 className="text-lg font-bold text-zinc-800 mb-2">No Pins Found</h3>
        <p className="text-sm text-zinc-500">Try a different search query or explore ideas.</p>
      </div>
    )
  }

  return (
    <div className="masonry-grid max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
      {pins.map((pin) => (
        <PinCard
          key={pin.id}
          pin={pin}
          onOpenDetail={onOpenDetail}
          onQuickSave={onQuickSave}
          onSaveToSpecificBoard={onSaveToSpecificBoard}
          onCreateBoardClick={onCreateBoardClick}
          onVisualSearchClick={onVisualSearchClick}
        />
      ))}
    </div>
  )
}
