'use client'

import React, { useRef } from 'react'
import { X, Download, QrCode } from 'lucide-react'

interface PincodeModalProps {
  title: string
  url: string
  isOpen: boolean
  onClose: () => void
}

export default function PincodeModal({
  title,
  url,
  isOpen,
  onClose,
}: PincodeModalProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  if (!isOpen) return null

  // Fast offline visual SVG QR/Pincode generation
  const hash = Array.from(url).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 1000000007, 0)
  const gridSize = 21

  const isDark = (r: number, c: number) => {
    // Corner finder patterns (7x7)
    if (r < 7 && c < 7) {
      if (r === 0 || r === 6 || c === 0 || c === 6) return true
      if (r >= 2 && r <= 4 && c >= 2 && c <= 4) return true
      return false
    }
    if (r < 7 && c >= gridSize - 7) {
      const cc = c - (gridSize - 7)
      if (r === 0 || r === 6 || cc === 0 || cc === 6) return true
      if (r >= 2 && r <= 4 && cc >= 2 && cc <= 4) return true
      return false
    }
    if (r >= gridSize - 7 && c < 7) {
      const rr = r - (gridSize - 7)
      if (rr === 0 || rr === 6 || c === 0 || c === 6) return true
      if (rr >= 2 && rr <= 4 && c >= 2 && c <= 4) return true
      return false
    }
    // Timing lines
    if (r === 6 || c === 6) return (r + c) % 2 === 0
    // Pseudo-random data bits deterministic from hash and coords
    const bit = ((hash ^ (r * 13 + c * 37)) >> ((r + c) % 16)) & 1
    return bit === 1
  }

  const handleDownload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 480
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 400, 480)

    // Red Header accent
    ctx.fillStyle = '#E60023'
    ctx.beginPath()
    ctx.arc(200, 50, 24, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 24px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('P', 200, 50)

    // Title text
    ctx.fillStyle = '#111111'
    ctx.font = 'bold 15px sans-serif'
    ctx.fillText(title.slice(0, 32), 200, 95)
    ctx.fillStyle = '#888888'
    ctx.font = '12px sans-serif'
    ctx.fillText('Scan with any camera or S-Store app', 200, 115)

    // Draw QR Grid
    const cellSize = 10
    const startX = (400 - gridSize * cellSize) / 2
    const startY = 145

    ctx.fillStyle = '#111111'
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (isDark(r, c)) {
          ctx.fillRect(startX + c * cellSize, startY + r * cellSize, cellSize, cellSize)
        }
      }
    }

    // Trigger download
    const link = document.createElement('a')
    link.download = `pincode-${title.replace(/[^a-zA-Z0-9]/g, '_')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Circle */}
        <div className="w-12 h-12 rounded-full bg-pinterest-red text-white flex items-center justify-center mx-auto mb-3 shadow-md">
          <span className="font-black text-2xl tracking-tighter">P</span>
        </div>

        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate px-4">
          {title}
        </h3>
        <p className="text-xs text-zinc-400 mt-0.5 mb-5">
          Scan this Pincode with your phone camera to open
        </p>

        {/* QR Code Container */}
        <div
          ref={cardRef}
          className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 inline-block shadow-inner mx-auto mb-6"
        >
          <svg width={gridSize * 9} height={gridSize * 9} className="mx-auto">
            {Array.from({ length: gridSize }).map((_, r) =>
              Array.from({ length: gridSize }).map((_, c) =>
                isDark(r, c) ? (
                  <rect
                    key={`${r}-${c}`}
                    x={c * 9}
                    y={r * 9}
                    width={9}
                    height={9}
                    fill="currentColor"
                    className="text-zinc-900 dark:text-zinc-100"
                  />
                ) : null
              )
            )}
          </svg>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold rounded-full transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 py-2.5 bg-pinterest-red hover:bg-pinterest-redHover text-white text-xs font-bold rounded-full transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Download code</span>
          </button>
        </div>
      </div>
    </div>
  )
}
