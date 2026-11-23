'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, Download, Copy, ExternalLink, EyeOff, Flag, QrCode } from 'lucide-react'

interface PinActionsMenuProps {
  imageUrl: string
  pinTitle: string
  onHidePin?: () => void
  onReportPin?: () => void
  onPincode?: () => void
}

export default function PinActionsMenu({
  imageUrl,
  pinTitle,
  onHidePin,
  onReportPin,
  onPincode,
}: PinActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isOpen])

  const handleDownloadImage = async () => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${pinTitle.replace(/[^a-zA-Z0-9_-]/g, '_') || 'pinterest_image'}.jpg`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      window.open(imageUrl, '_blank')
    }
    setIsOpen(false)
  }

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(imageUrl)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-700 dark:text-zinc-300 transition-colors"
        title="More options"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-12 w-52 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
          <button
            onClick={handleDownloadImage}
            className="w-full px-4 py-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2.5 transition-colors"
          >
            <Download className="w-4 h-4 text-zinc-500" />
            <span>Download image</span>
          </button>
          <button
            onClick={handleCopyLink}
            className="w-full px-4 py-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2.5 transition-colors"
          >
            <Copy className="w-4 h-4 text-zinc-500" />
            <span>Copy image link</span>
          </button>
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="w-full px-4 py-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2.5 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-zinc-500" />
            <span>Open in full tab</span>
          </a>

          {onPincode && (
            <button
              onClick={() => {
                setIsOpen(false)
                onPincode()
              }}
              className="w-full px-4 py-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2.5 transition-colors"
            >
              <QrCode className="w-4 h-4 text-zinc-500" />
              <span>Get Pincode</span>
            </button>
          )}

          {(onHidePin || onReportPin) && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />
          )}

          {onHidePin && (
            <button
              onClick={() => {
                setIsOpen(false)
                onHidePin()
              }}
              className="w-full px-4 py-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2.5 transition-colors"
            >
              <EyeOff className="w-4 h-4 text-zinc-500" />
              <span>Hide Pin</span>
            </button>
          )}

          {onReportPin && (
            <button
              onClick={() => {
                setIsOpen(false)
                onReportPin()
              }}
              className="w-full px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2.5 transition-colors"
            >
              <Flag className="w-4 h-4 text-red-500" />
              <span>Report Pin</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
