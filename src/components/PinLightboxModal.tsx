'use client'

import React, { useState, useEffect } from 'react'
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

interface PinLightboxModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  title: string
}

export default function PinLightboxModal({
  isOpen,
  onClose,
  imageUrl,
  title,
}: PinLightboxModalProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (isOpen) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleZoomIn = () => setScale((s) => Math.min(3.5, s + 0.5))
  const handleZoomOut = () => {
    setScale((s) => {
      const next = Math.max(1, s - 0.5)
      if (next === 1) setPosition({ x: 0, y: 0 })
      return next
    })
  }
  const handleReset = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => setIsDragging(false)

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 select-none animate-in fade-in duration-150"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Header */}
      <div className="w-full flex items-center justify-between text-white px-4 py-2 z-10">
        <h3 className="text-sm font-semibold truncate max-w-md">{title}</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
          title="Close fullscreen view"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Image Container */}
      <div
        className="flex-1 w-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing relative"
        onMouseDown={handleMouseDown}
      >
        <img
          src={imageUrl}
          alt={title}
          draggable={false}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
          className="max-h-[82vh] max-w-[90vw] object-contain rounded-lg shadow-2xl pointer-events-none"
        />
      </div>

      {/* Floating Bottom Controls */}
      <div className="z-10 bg-zinc-900/80 backdrop-blur-md rounded-full px-5 py-2.5 flex items-center gap-4 text-white border border-zinc-700/60 shadow-2xl mb-4">
        <button
          onClick={handleZoomOut}
          disabled={scale <= 1}
          className="p-1.5 hover:bg-white/10 rounded-full disabled:opacity-30 transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <span className="text-xs font-mono font-bold min-w-[42px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          disabled={scale >= 3.5}
          className="p-1.5 hover:bg-white/10 rounded-full disabled:opacity-30 transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <div className="h-4 w-px bg-zinc-700" />
        <button
          onClick={handleReset}
          className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          title="Reset zoom"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
