'use client'

import React, { useState } from 'react'
import { X, Copy, Check, MessageSquare, Mail, Share2 } from 'lucide-react'

interface ShareBoardModalProps {
  boardTitle: string
  isOpen: boolean
  onClose: () => void
}

export default function ShareBoardModal({
  boardTitle,
  isOpen,
  onClose,
}: ShareBoardModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareText = `Check out "${boardTitle}" on S-Store!`

  const handleCopy = () => {
    navigator.clipboard?.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: boardTitle,
          text: shareText,
          url: shareUrl,
        })
        onClose()
      } catch {
        // Ignored if cancelled
      }
    } else {
      handleCopy()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-5">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Share this board
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Social Share Buttons */}
        <div className="grid grid-cols-4 gap-3 mb-6 text-center">
          {/* WhatsApp */}
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">WhatsApp</span>
          </a>

          {/* X / Twitter */}
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center group-hover:scale-105 transition-transform">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">X / Twitter</span>
          </a>

          {/* Email */}
          <a
            href={`mailto:?subject=${encodeURIComponent(boardTitle)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Mail className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Email</span>
          </a>

          {/* System Share Sheet */}
          <button
            onClick={handleNativeShare}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">More</span>
          </button>
        </div>

        {/* Copy Link Input Bar */}
        <div className="flex items-center gap-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 bg-transparent px-2 text-xs text-zinc-600 dark:text-zinc-400 focus:outline-none truncate"
          />
          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              copied
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                : 'bg-pinterest-red hover:bg-pinterest-redHover text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
