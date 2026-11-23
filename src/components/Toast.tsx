'use client'

import React, { useEffect } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

export interface ToastMessage {
  id: string
  title: string
  type?: 'success' | 'error' | 'info'
  actionLabel?: string
  onAction?: () => void
}

interface ToastProps {
  toast: ToastMessage | null
  onClose: () => void
}

export default function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => {
      onClose()
    }, 4500)
    return () => clearTimeout(timer)
  }, [toast, onClose])

  if (!toast) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-zinc-900 text-white px-5 py-3.5 rounded-full shadow-2xl text-sm font-medium animate-in fade-in slide-in-from-bottom-4 duration-200">
      {toast.type === 'error' ? (
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
      ) : (
        <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
      )}
      <span>{toast.title}</span>
      {toast.actionLabel && toast.onAction && (
        <button
          onClick={toast.onAction}
          className="ml-2 font-semibold underline hover:text-zinc-200 transition-colors"
        >
          {toast.actionLabel}
        </button>
      )}
      <button
        onClick={onClose}
        className="ml-2 p-1 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
