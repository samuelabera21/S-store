'use client'

import React, { useState } from 'react'
import { X, Flag, Check, Loader2 } from 'lucide-react'

interface ReportPinModalProps {
  pinId: string
  pinTitle: string
  isOpen: boolean
  onClose: () => void
  onReportSuccess: () => void
}

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam', desc: 'Misleading links, ads, or repetitive content' },
  { id: 'nudity', label: 'Nudity or sexually explicit content', desc: 'Adult imagery or explicit acts' },
  { id: 'hate', label: 'Hate speech or harassment', desc: 'Attacking individuals, slurs, or threats' },
  { id: 'self_harm', label: 'Self-harm or dangerous activities', desc: 'Promoting suicide, disordered eating, or violence' },
  { id: 'misinfo', label: 'Misinformation', desc: 'Health, political, or dangerous false claims' },
  { id: 'copyright', label: 'My intellectual property', desc: 'Infringes on a copyright or trademark you own' },
]

export default function ReportPinModal({
  pinId,
  pinTitle,
  isOpen,
  onClose,
  onReportSuccess,
}: ReportPinModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReason) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/v1/pins/${pinId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: selectedReason,
          details,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit report')
      }

      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        setSelectedReason('')
        setDetails('')
        onReportSuccess()
        onClose()
      }, 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error reporting pin')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/40 text-pinterest-red flex items-center justify-center">
              <Flag className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Report this Pin</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400 mx-auto flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Thanks for reporting
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
              Our safety and moderation system will review this pin against S-Store Community Guidelines.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Why are you reporting <span className="font-semibold text-zinc-800 dark:text-zinc-200">"{pinTitle}"</span>?
            </p>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.id}
                  onClick={() => setSelectedReason(r.id)}
                  className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                    selectedReason === r.id
                      ? 'border-pinterest-red bg-red-50/30 dark:bg-red-950/20'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={r.id}
                    checked={selectedReason === r.id}
                    onChange={() => setSelectedReason(r.id)}
                    className="mt-0.5 text-pinterest-red focus:ring-pinterest-red"
                  />
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{r.label}</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{r.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                Additional context (optional)
              </label>
              <textarea
                rows={2}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Help us understand the issue..."
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs dark:text-zinc-100 focus:outline-none focus:border-zinc-400 transition-colors resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedReason || submitting}
                className="px-5 py-2 bg-pinterest-red hover:bg-pinterest-redHover disabled:opacity-40 text-white font-bold text-xs rounded-full transition-colors shadow-sm flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Submit report</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
