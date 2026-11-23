'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { X, Search, Check } from 'lucide-react'

interface CropRegion {
  x: number // percentage 0-100
  y: number // percentage 0-100
  width: number // percentage 0-100
  height: number // percentage 0-100
}

interface InteractiveVisualCropProps {
  imageUrl: string
  isOpen: boolean
  onClose: () => void
  onSearchCrop: (crop: CropRegion) => void
}

export default function InteractiveVisualCrop({
  imageUrl,
  isOpen,
  onClose,
  onSearchCrop,
}: InteractiveVisualCropProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [crop, setCrop] = useState<CropRegion>({ x: 20, y: 20, width: 60, height: 60 })
  const [activeHandle, setActiveHandle] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState<{ x: number; y: number; crop: CropRegion } | null>(null)

  const handlePointerDown = (handle: string, e: React.PointerEvent) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    setActiveHandle(handle)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      crop: { ...crop },
    })
  }

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!activeHandle || !dragStart || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return

      const dx = ((e.clientX - dragStart.x) / rect.width) * 100
      const dy = ((e.clientY - dragStart.y) / rect.height) * 100

      setCrop((prev) => {
        let newX = dragStart.crop.x
        let newY = dragStart.crop.y
        let newW = dragStart.crop.width
        let newH = dragStart.crop.height

        if (activeHandle === 'move') {
          newX = Math.max(0, Math.min(100 - newW, dragStart.crop.x + dx))
          newY = Math.max(0, Math.min(100 - newH, dragStart.crop.y + dy))
        } else if (activeHandle === 'nw') {
          const right = dragStart.crop.x + dragStart.crop.width
          const bottom = dragStart.crop.y + dragStart.crop.height
          newX = Math.max(0, Math.min(right - 15, dragStart.crop.x + dx))
          newY = Math.max(0, Math.min(bottom - 15, dragStart.crop.y + dy))
          newW = right - newX
          newH = bottom - newY
        } else if (activeHandle === 'ne') {
          const bottom = dragStart.crop.y + dragStart.crop.height
          newY = Math.max(0, Math.min(bottom - 15, dragStart.crop.y + dy))
          newW = Math.max(15, Math.min(100 - dragStart.crop.x, dragStart.crop.width + dx))
          newH = bottom - newY
        } else if (activeHandle === 'sw') {
          const right = dragStart.crop.x + dragStart.crop.width
          newX = Math.max(0, Math.min(right - 15, dragStart.crop.x + dx))
          newW = right - newX
          newH = Math.max(15, Math.min(100 - dragStart.crop.y, dragStart.crop.height + dy))
        } else if (activeHandle === 'se') {
          newW = Math.max(15, Math.min(100 - dragStart.crop.x, dragStart.crop.width + dx))
          newH = Math.max(15, Math.min(100 - dragStart.crop.y, dragStart.crop.height + dy))
        }

        return { x: newX, y: newY, width: newW, height: newH }
      })
    },
    [activeHandle, dragStart]
  )

  const handlePointerUp = () => {
    if (activeHandle) {
      setActiveHandle(null)
      setDragStart(null)
      onSearchCrop(crop)
    }
  }

  if (!isOpen) return null

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs select-none">
      {/* Top Bar with Dismiss and Search */}
      <div className="absolute top-4 inset-x-4 flex items-center justify-between z-40">
        <button
          onClick={onClose}
          className="p-2 bg-white/90 hover:bg-white text-zinc-900 rounded-full shadow-lg transition-transform hover:scale-105"
          title="Exit crop search"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-full shadow-md">
          Drag box to focus on an object
        </span>
        <button
          onClick={() => onSearchCrop(crop)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#e60023] hover:bg-[#ad081b] text-white font-bold text-xs rounded-full shadow-lg transition-transform hover:scale-105"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search Object</span>
        </button>
      </div>

      {/* Main Image Cropper Container */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative max-w-full max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl cursor-crosshair"
      >
        <img
          src={imageUrl}
          alt="Visual Lens Target"
          className="max-h-[80vh] w-auto object-contain block pointer-events-none"
        />

        {/* Resizable Bounding Box */}
        <div
          style={{
            left: `${crop.x}%`,
            top: `${crop.y}%`,
            width: `${crop.width}%`,
            height: `${crop.height}%`,
          }}
          onPointerDown={(e) => handlePointerDown('move', e)}
          className="absolute border-2 border-white rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] cursor-grab active:cursor-grabbing z-30 transition-shadow"
        >
          {/* Corner Handles */}
          <div
            onPointerDown={(e) => handlePointerDown('nw', e)}
            className="absolute -top-2.5 -left-2.5 w-5 h-5 rounded-full bg-white border-2 border-[#111111] shadow-md cursor-nwse-resize z-40"
          />
          <div
            onPointerDown={(e) => handlePointerDown('ne', e)}
            className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-white border-2 border-[#111111] shadow-md cursor-nesw-resize z-40"
          />
          <div
            onPointerDown={(e) => handlePointerDown('sw', e)}
            className="absolute -bottom-2.5 -left-2.5 w-5 h-5 rounded-full bg-white border-2 border-[#111111] shadow-md cursor-nesw-resize z-40"
          />
          <div
            onPointerDown={(e) => handlePointerDown('se', e)}
            className="absolute -bottom-2.5 -right-2.5 w-5 h-5 rounded-full bg-white border-2 border-[#111111] shadow-md cursor-nwse-resize z-40"
          />
        </div>
      </div>
    </div>
  )
}
