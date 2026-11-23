'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Search, TrendingUp, Clock, X, ArrowUpRight } from 'lucide-react'

interface SearchSuggestionsPopoverProps {
  isOpen: boolean
  query: string
  onClose: () => void
  onSelectSuggestion: (text: string) => void
}

interface PreviewPin {
  id: string
  title: string
  imageUrl: string
}

export default function SearchSuggestionsPopover({
  isOpen,
  query,
  onClose,
  onSelectSuggestion,
}: SearchSuggestionsPopoverProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [trending, setTrending] = useState<string[]>([])
  const [previewPins, setPreviewPins] = useState<PreviewPin[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const popoverRef = useRef<HTMLDivElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pinterest_recent_searches')
      if (stored) {
        setRecentSearches(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
  }, [isOpen])

  // Fetch suggestions from API
  useEffect(() => {
    if (!isOpen) return

    fetch(`/api/v1/search/suggestions?q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => {
        setSuggestions(data.suggestions || [])
        setTrending(data.trending || [])
        setPreviewPins(data.previewPins || [])
      })
      .catch((err) => console.error(err))
  }, [isOpen, query])

  // Dismiss on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSelect = (text: string) => {
    // Add to recent searches in localStorage
    try {
      const updated = Array.from(new Set([text, ...recentSearches])).slice(0, 6)
      setRecentSearches(updated)
      localStorage.setItem('pinterest_recent_searches', JSON.stringify(updated))
    } catch {
      // ignore
    }
    onSelectSuggestion(text)
    onClose()
  }

  const handleClearRecent = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRecentSearches([])
    localStorage.removeItem('pinterest_recent_searches')
  }

  return (
    <div
      ref={popoverRef}
      className="absolute left-0 right-0 top-14 bg-white rounded-3xl p-5 shadow-2xl border border-zinc-200 z-50 text-left animate-in fade-in zoom-in-95 duration-150 max-h-[80vh] overflow-y-auto"
    >
      {/* 1. When Query is Empty: Recent + Trending */}
      {!query.trim() ? (
        <div className="space-y-6">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Recent Searches
                </span>
                <button
                  onClick={handleClearRecent}
                  className="text-xs text-zinc-400 hover:text-zinc-700 font-medium transition-colors"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((item) => (
                  <button
                    key={item}
                    onClick={() => handleSelect(item)}
                    className="flex items-center gap-2 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-full transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending Searches */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 px-2">
              <TrendingUp className="w-4 h-4 text-pinterest-red" />
              <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                Trending on S-Store
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {trending.map((item) => (
                <button
                  key={item}
                  onClick={() => handleSelect(item)}
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-zinc-100 text-left text-sm font-semibold text-zinc-800 group transition-colors"
                >
                  <span className="truncate pr-2">{item}</span>
                  <ArrowUpRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* 2. When Query is Non-Empty: Autocomplete + Live Previews */
        <div className="space-y-4">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-2">
            Matching Ideas
          </p>

          <div className="space-y-1">
            {suggestions.length === 0 ? (
              <p className="text-sm text-zinc-500 px-2 py-4 text-center">
                Search for &quot;{query}&quot;
              </p>
            ) : (
              suggestions.map((item) => (
                <button
                  key={item}
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-zinc-100 text-left text-sm font-semibold text-zinc-900 transition-colors"
                >
                  <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="truncate">{item}</span>
                </button>
              ))
            )}
          </div>

          {/* Preview Pins Matching */}
          {previewPins.length > 0 && (
            <div className="pt-4 border-t border-zinc-100">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-2 mb-3">
                Top Visual Matches
              </p>
              <div className="grid grid-cols-3 gap-3">
                {previewPins.map((pin) => (
                  <div
                    key={pin.id}
                    onClick={() => handleSelect(pin.title)}
                    className="group cursor-pointer rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-zinc-200">
                      <img
                        src={pin.imageUrl}
                        alt={pin.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <p className="p-2 text-xs font-bold text-zinc-800 line-clamp-1">
                      {pin.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
