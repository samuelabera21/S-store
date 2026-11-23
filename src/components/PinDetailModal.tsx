'use client'

import React, { useState } from 'react'
import { X, ArrowUpRight, Share2, Scan, Maximize2 } from 'lucide-react'
import { PinItem } from '@/types'
import SaveButton from './SaveButton'
import PinActionsMenu from './PinActionsMenu'
import PinLightboxModal from './PinLightboxModal'
import ReportPinModal from './ReportPinModal'
import PinNoteSection from './PinNoteSection'

interface PinDetailModalProps {
  pin: PinItem | null
  onClose: () => void
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

export default function PinDetailModal({
  pin,
  onClose,
  onQuickSave,
  onSaveToSpecificBoard,
  onCreateBoardClick,
  onVisualSearchClick,
}: PinDetailModalProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  if (!pin) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Close Button Floating */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 p-2.5 bg-white/90 hover:bg-white text-zinc-700 hover:text-zinc-950 rounded-full shadow-md transition-all"
          aria-label="Back to feed"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Image */}
          <div className="bg-zinc-100 flex items-center justify-center p-4 relative group">
            <img
              src={pin.imageUrl}
              alt={pin.title}
              className="max-h-[80vh] w-auto object-contain rounded-2xl shadow-sm"
            />
            <button
              onClick={() => setIsLightboxOpen(true)}
              className="absolute bottom-6 left-6 p-2.5 bg-white/95 hover:bg-white text-zinc-800 rounded-full shadow-lg transition-transform hover:scale-105"
              title="Fullscreen zoom & pan"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {onVisualSearchClick && (
              <button
                onClick={() => onVisualSearchClick(pin)}
                className="absolute bottom-6 right-6 flex items-center gap-1.5 px-3.5 py-2 bg-white/95 hover:bg-white text-zinc-900 rounded-full shadow-lg font-semibold text-xs transition-all hover:scale-105"
                title="Search within image"
              >
                <Scan className="w-4 h-4 text-pinterest-red" />
                <span>Visual search</span>
              </button>
            )}
          </div>

          {/* Right Column: Actions & Details */}
          <div className="p-8 flex flex-col justify-between">
            <div>
              {/* Header Actions */}
              <div className="flex items-center justify-between pb-6 border-b border-zinc-100 mb-6">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.origin + `/pin/${pin.id}`)
                      alert('Link copied to clipboard')
                    }}
                    className="p-3 hover:bg-zinc-100 rounded-full text-zinc-700 transition-colors"
                    title="Share link"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  <PinActionsMenu imageUrl={pin.imageUrl} pinTitle={pin.title} />
                </div>

                <SaveButton
                  pinId={pin.id}
                  isSaved={pin.isSaved}
                  onQuickSave={() => onQuickSave(pin.id)}
                  onSaveToSpecificBoard={(boardId, boardTitle, sectionId, sectionTitle) =>
                    onSaveToSpecificBoard(pin.id, boardId, boardTitle, sectionId, sectionTitle)
                  }
                  onCreateBoardClick={() => onCreateBoardClick(pin.id)}
                />
              </div>

              {/* Source Link */}
              {pin.sourceLink && (
                <a
                  href={pin.sourceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:underline mb-3"
                >
                  <span>{new URL(pin.sourceLink).hostname}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              )}

              {/* Title & Description */}
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 leading-tight mb-3">
                {pin.title}
              </h1>

              {pin.description && (
                <p className="text-sm text-zinc-600 leading-relaxed mb-6">
                  {pin.description}
                </p>
              )}

              {/* Creator Card */}
              <div className="flex items-center gap-3 pt-4 border-t border-zinc-100">
                <img
                  src={
                    pin.creator.avatarUrl ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
                  }
                  alt={pin.creator.displayName || pin.creator.username}
                  className="w-12 h-12 rounded-full object-cover border border-zinc-200"
                />
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">
                    {pin.creator.displayName || pin.creator.username}
                  </h4>
                  <p className="text-xs text-zinc-500">@{pin.creator.username}</p>
                </div>
              </div>
            </div>

            {/* Saved in Boards notice */}
            {pin.isSaved && pin.savedToBoards && pin.savedToBoards.length > 0 && (
              <div className="mt-8 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                <p className="text-xs font-semibold text-zinc-500 mb-1">
                  Saved to your boards:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {pin.savedToBoards.map((b) => (
                    <span
                      key={b.id}
                      className="px-3 py-1 bg-white border border-zinc-200 rounded-full text-xs font-medium text-zinc-800 shadow-2xs"
                    >
                      {b.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {/* Note to Self Section */}
            <div className="mt-6">
              <PinNoteSection
                pinId={pin.id}
                isSaved={pin.isSaved}
                sessionAuthenticated={true}
              />
            </div>
          </div>
        </div>
      </div>

      <PinLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        imageUrl={pin.imageUrl}
        title={pin.title}
      />
    </div>
  )
}
