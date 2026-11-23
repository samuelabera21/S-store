'use client'

import React, { useState, useEffect } from 'react'
import { X, Scan, Sparkles } from 'lucide-react'
import { PinItem } from '@/types'
import SaveButton from './SaveButton'

interface VisualSearchModalProps {
  pin: PinItem | null
  isOpen: boolean
  onClose: () => void
  onOpenDetail: (pin: PinItem) => void
  onQuickSave: (pinId: string) => Promise<void>
  onSaveToSpecificBoard: (pinId: string, boardId: string, boardTitle: string) => Promise<void>
  onCreateBoardClick: (pinId: string) => void
}

export default function VisualSearchModal({
  pin,
  isOpen,
  onClose,
  onOpenDetail,
  onQuickSave,
  onSaveToSpecificBoard,
  onCreateBoardClick,
}: VisualSearchModalProps) {
  const [similarPins, setSimilarPins] = useState<PinItem[]>([])
  const [loading, setLoading] = useState(false)
  // Interactive bounding box percentage coordinates [top, left, width, height]
  const [cropBox, setCropBox] = useState({ top: 20, left: 20, width: 60, height: 60 })

  useEffect(() => {
    if (!isOpen || !pin) return

    setLoading(true)
    fetch(`/api/v1/pins/${pin.id}/visual-similar`)
      .then((res) => res.json())
      .then((data) => {
        setSimilarPins(data.pins || [])
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [isOpen, pin])

  if (!isOpen || !pin) return null

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = ((e.clientX - rect.left) / rect.width) * 100
    const clickY = ((e.clientY - rect.top) / rect.height) * 100

    // Center a 50x50 crop box around click
    const newLeft = Math.max(5, Math.min(45, clickX - 25))
    const newTop = Math.max(5, Math.min(45, clickY - 25))
    setCropBox({ top: newTop, left: newLeft, width: 50, height: 50 })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-150 overflow-hidden">
      <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-zinc-100 text-pinterest-red rounded-full">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <span>Visual Discovery</span>
                <span className="text-xs font-normal px-2.5 py-0.5 bg-zinc-100 text-zinc-600 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> REA Lens
                </span>
              </h2>
              <p className="text-xs text-zinc-500">
                Tap anywhere on the image to focus the visual lens
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-full transition-colors"
            title="Close visual search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Two Columns */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left Column: Interactive Image Lens */}
          <div className="md:col-span-5 bg-zinc-950 p-6 flex flex-col items-center justify-center relative select-none">
            <div
              onClick={handleImageClick}
              className="relative max-h-[70vh] cursor-crosshair rounded-2xl overflow-hidden shadow-2xl group"
            >
              <img
                src={pin.imageUrl}
                alt={pin.title}
                className="max-h-[70vh] w-auto object-contain rounded-2xl"
              />

              {/* Interactive Visual Lens Crop Box */}
              <div
                style={{
                  top: `${cropBox.top}%`,
                  left: `${cropBox.left}%`,
                  width: `${cropBox.width}%`,
                  height: `${cropBox.height}%`,
                }}
                className="absolute border-2 border-white rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] transition-all duration-200 pointer-events-none"
              >
                {/* 4 Corner brackets styling Pinterest-like */}
                <span className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 border-t-4 border-l-4 border-white rounded-tl-sm" />
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 border-t-4 border-r-4 border-white rounded-tr-sm" />
                <span className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 border-b-4 border-l-4 border-white rounded-bl-sm" />
                <span className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 border-b-4 border-r-4 border-white rounded-br-sm" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-white rounded-full opacity-70 animate-ping" />
                </div>
              </div>
            </div>

            <p className="text-zinc-400 text-xs mt-4 text-center">
              Target: <span className="text-white font-medium">{pin.title}</span>
            </p>
          </div>

          {/* Right Column: Visually Similar Feed */}
          <div className="md:col-span-7 p-6 overflow-y-auto bg-zinc-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                Visually Similar Ideas ({similarPins.length})
              </h3>
              <span className="text-xs text-zinc-500 font-medium">
                Category: {pin.category || 'All'}
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] rounded-2xl bg-zinc-200 animate-pulse"
                  />
                ))}
              </div>
            ) : similarPins.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-zinc-500 text-sm">
                  No other similar pins found in this category yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {similarPins.map((item) => (
                  <div
                    key={item.id}
                    className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
                    onClick={() => {
                      onOpenDetail(item)
                      onClose()
                    }}
                  >
                    <div className="aspect-[3/4] relative overflow-hidden bg-zinc-100">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <SaveButton
                          pinId={item.id}
                          isSaved={item.isSaved}
                          onQuickSave={() => onQuickSave(item.id)}
                          onSaveToSpecificBoard={(bId, bTitle) =>
                            onSaveToSpecificBoard(item.id, bId, bTitle)
                          }
                          onCreateBoardClick={() => onCreateBoardClick(item.id)}
                        />
                      </div>
                    </div>

                    <div className="p-2.5">
                      <h4 className="text-xs font-semibold text-zinc-800 line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                        by @{item.creator.username}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
