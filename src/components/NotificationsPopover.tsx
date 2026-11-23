'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Bell, Check, UserPlus, Heart, MessageSquare, Bookmark, X, CheckCheck } from 'lucide-react'

interface NotificationItem {
  id: string
  type: string
  message: string
  isRead: boolean
  createdAt: string
  actor: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
  pin?: {
    id: string
    title: string
    imageUrl: string
  } | null
}

interface NotificationsPopoverProps {
  isOpen: boolean
  onClose: () => void
  onUpdateUnreadCount: (count: number) => void
}

export default function NotificationsPopover({
  isOpen,
  onClose,
  onUpdateUnreadCount,
}: NotificationsPopoverProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [tabFilter, setTabFilter] = useState<'all' | 'unread'>('all')
  const popoverRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/notifications')
      const data = await res.json()
      setNotifications(data.notifications || [])
      onUpdateUnreadCount(data.unreadCount || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  // Click outside to close
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

  const handleMarkAllRead = async () => {
    await fetch('/api/v1/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    onUpdateUnreadCount(0)
  }

  const handleMarkOneRead = async (id: string) => {
    await fetch('/api/v1/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id }),
    })
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    onUpdateUnreadCount(notifications.filter((n) => !n.isRead && n.id !== id).length)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="w-3.5 h-3.5 text-blue-600" />
      case 'save':
        return <Bookmark className="w-3.5 h-3.5 text-[#e60023]" />
      case 'comment':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
      case 'reaction':
        return <Heart className="w-3.5 h-3.5 text-[#e60023] fill-[#e60023]" />
      default:
        return <Bell className="w-3.5 h-3.5 text-zinc-600" />
    }
  }

  const filteredNotifications =
    tabFilter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications

  return (
    <div
      ref={popoverRef}
      className="fixed left-[76px] top-3 bottom-3 w-[380px] sm:w-[420px] bg-white rounded-3xl p-5 shadow-2xl border border-zinc-200/90 z-50 text-left animate-in fade-in slide-in-from-left-4 duration-200 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100 shrink-0">
        <div>
          <h3 className="text-xl font-bold text-[#111111]">Updates</h3>
          <p className="text-xs text-[#767676] mt-0.5">Activity on your Pins and profile</p>
        </div>

        <div className="flex items-center gap-1">
          {notifications.some((n) => !n.isRead) && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-xs text-[#767676] hover:text-[#111111] font-bold px-2.5 py-1.5 hover:bg-[#e9e9e9] rounded-full transition-colors"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark read</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#e9e9e9] rounded-full text-[#767676] hover:text-[#111111] transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab Filter */}
      <div className="flex items-center gap-2 pt-3 pb-2 shrink-0">
        <button
          onClick={() => setTabFilter('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
            tabFilter === 'all'
              ? 'bg-[#111111] text-white shadow-xs'
              : 'bg-[#e9e9e9] text-[#111111] hover:bg-[#e1e1e1]'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setTabFilter('unread')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
            tabFilter === 'unread'
              ? 'bg-[#111111] text-white shadow-xs'
              : 'bg-[#e9e9e9] text-[#111111] hover:bg-[#e1e1e1]'
          }`}
        >
          Unread ({notifications.filter((n) => !n.isRead).length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1 divide-y divide-zinc-100 mt-2 pr-1 -mr-1">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#767676] font-medium animate-pulse">
            Loading updates...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-20 text-center text-[#767676] px-4">
            <div className="w-12 h-12 rounded-full bg-[#e9e9e9] flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6 text-[#767676]" />
            </div>
            <p className="text-sm font-bold text-[#111111]">No updates yet</p>
            <p className="text-xs text-[#767676] mt-1 leading-relaxed">
              When people save your Pins, react, or follow you, your updates will show up here.
            </p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.isRead) handleMarkOneRead(n.id)
              }}
              className={`p-3 rounded-2xl flex items-start gap-3 transition-colors cursor-pointer my-1 ${
                n.isRead ? 'hover:bg-zinc-50' : 'bg-red-50/50 hover:bg-red-50/80'
              }`}
            >
              <div className="relative shrink-0">
                <Link href={`/${n.actor.username}`} onClick={onClose}>
                  <img
                    src={
                      n.actor.avatarUrl ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'
                    }
                    alt={n.actor.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </Link>
                <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-xs">
                  {getIcon(n.type)}
                </div>
              </div>

              <div className="flex-1 text-xs">
                <p className="text-[#111111] leading-snug">
                  <Link
                    href={`/${n.actor.username}`}
                    onClick={onClose}
                    className="font-bold hover:underline mr-1"
                  >
                    {n.actor.displayName || n.actor.username}
                  </Link>
                  <span>{n.message}</span>
                </p>
                <span className="text-[11px] text-[#767676] mt-1 block">
                  {new Date(n.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>

              {n.pin && (
                <Link
                  href={`/pin/${n.pin.id}`}
                  onClick={onClose}
                  className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-zinc-200 group"
                >
                  <img
                    src={n.pin.imageUrl}
                    alt={n.pin.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
