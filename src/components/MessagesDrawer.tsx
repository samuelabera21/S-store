'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  X,
  Send,
  MessageSquare,
  Search,
  ArrowLeft,
  Minimize2,
  Maximize2,
  ExternalLink,
  Check,
} from 'lucide-react'
import { ConversationSummary, DirectMessage, SessionState } from '@/types'

interface MessagesDrawerProps {
  isOpen: boolean
  onClose: () => void
  session: SessionState
  initialSharedPin?: {
    id: string
    title: string
    imageUrl: string
  } | null
  onClearSharedPin?: () => void
}

export default function MessagesDrawer({
  isOpen,
  onClose,
  session,
  initialSharedPin,
  onClearSharedPin,
}: MessagesDrawerProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  // New Chat User Search
  const [isNewChat, setIsNewChat] = useState(false)
  const [searchUserQuery, setSearchUserQuery] = useState('')
  const [startingChat, setStartingChat] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load conversations
  const fetchConversations = async () => {
    if (!session.authenticated) return
    try {
      const res = await fetch('/api/v1/conversations')
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
      }
    } catch (err) {
      console.error('Error fetching conversations:', err)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchConversations()
    }
  }, [isOpen, session.authenticated])

  // Load messages for active conversation
  const fetchMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/v1/conversations/${convId}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    } catch (err) {
      console.error('Error loading messages:', err)
    }
  }

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId)
      const interval = setInterval(() => {
        fetchMessages(activeConversationId)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [activeConversationId])

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!activeConversationId || (!inputText.trim() && !initialSharedPin)) return

    const textToSend = inputText.trim()
    const pinToSend = initialSharedPin?.id || null

    setInputText('')
    if (onClearSharedPin) onClearSharedPin()

    try {
      const res = await fetch(`/api/v1/conversations/${activeConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSend,
          sharedPinId: pinToSend,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, data.message])
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 50)
        fetchConversations()
      }
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const handleStartNewChatWithUser = async (targetUsername: string) => {
    if (!targetUsername.trim()) return
    setStartingChat(true)
    try {
      const res = await fetch('/api/v1/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientUsername: targetUsername.trim(),
          initialMessage: initialSharedPin ? 'Check out this Pin!' : undefined,
          sharedPinId: initialSharedPin?.id || undefined,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setIsNewChat(false)
        setSearchUserQuery('')
        setActiveConversationId(data.conversation.id)
        if (onClearSharedPin) onClearSharedPin()
        fetchConversations()
      } else {
        const err = await res.json()
        alert(err.error || 'User not found')
      }
    } catch (err) {
      console.error('Error starting conversation:', err)
    } finally {
      setStartingChat(false)
    }
  }

  if (!isOpen) return null

  const activeConv = conversations.find((c) => c.id === activeConversationId)

  return (
    <div
      className={`fixed bottom-0 right-6 z-50 w-96 bg-white rounded-t-3xl shadow-2xl border border-zinc-200 transition-all duration-200 flex flex-col ${
        isMinimized ? 'h-14' : 'h-[540px]'
      }`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 rounded-t-3xl">
        <div className="flex items-center gap-2">
          {activeConversationId ? (
            <button
              onClick={() => setActiveConversationId(null)}
              className="p-1 hover:bg-zinc-200/60 rounded-full transition-colors text-zinc-600"
              title="Back to inbox"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <MessageSquare className="w-5 h-5 text-pinterest-red" />
          )}

          <div className="flex items-center gap-2">
            {activeConv?.otherUser ? (
              <>
                <img
                  src={
                    activeConv.otherUser.avatarUrl ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'
                  }
                  alt={activeConv.otherUser.username}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="text-sm font-bold text-zinc-900 truncate max-w-[140px]">
                  {activeConv.otherUser.displayName || activeConv.otherUser.username}
                </span>
              </>
            ) : (
              <span className="text-sm font-bold text-zinc-900">
                {isNewChat ? 'New Message' : 'Direct Messages'}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/60 rounded-full transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/60 rounded-full transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* VIEW: CONVERSATIONS LIST */}
          {!activeConversationId && !isNewChat && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-zinc-100 flex items-center gap-2">
                <button
                  onClick={() => setIsNewChat(true)}
                  className="w-full py-2 px-3 bg-zinc-100 hover:bg-zinc-200/70 text-zinc-800 text-xs font-bold rounded-full transition-colors flex items-center justify-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Start new conversation</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-zinc-50">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-zinc-400">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 text-zinc-300" />
                    <p className="text-sm font-semibold text-zinc-700">No messages yet</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Connect and share pins with other creators.
                    </p>
                  </div>
                ) : (
                  conversations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveConversationId(c.id)}
                      className={`w-full text-left p-3 flex items-center gap-3 hover:bg-zinc-50 transition-colors ${
                        c.hasUnread ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={
                            c.otherUser?.avatarUrl ||
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60'
                          }
                          alt={c.otherUser?.username || 'user'}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        {c.hasUnread && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-pinterest-red border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-zinc-900 truncate">
                            {c.otherUser?.displayName || c.otherUser?.username || 'Unknown'}
                          </p>
                          <span className="text-[10px] text-zinc-400">
                            {new Date(c.updatedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 truncate mt-0.5">
                          {c.lastMessage?.sharedPinId
                            ? '📌 Shared a Pin'
                            : c.lastMessage?.text || 'Started a conversation'}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* VIEW: NEW CHAT SEARCH */}
          {!activeConversationId && isNewChat && (
            <div className="flex-1 flex flex-col p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-700">Find user to message:</span>
                <button
                  onClick={() => setIsNewChat(false)}
                  className="text-xs text-zinc-500 hover:underline"
                >
                  Cancel
                </button>
              </div>

              <div className="relative mb-3">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Enter username (e.g. alice_designer, bob_builder)"
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleStartNewChatWithUser(searchUserQuery)
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-100 rounded-full text-xs border border-transparent focus:border-zinc-300 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Quick suggestions */}
              <div className="space-y-1 mt-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Suggested Accounts
                </p>
                {['alice_designer', 'bob_builder']
                  .filter((u) => u !== session.user?.username)
                  .map((username) => (
                    <button
                      key={username}
                      onClick={() => handleStartNewChatWithUser(username)}
                      disabled={startingChat}
                      className="w-full text-left px-3 py-2 hover:bg-zinc-100 rounded-xl flex items-center justify-between text-xs font-medium text-zinc-800 transition-colors"
                    >
                      <span>@{username}</span>
                      <span className="text-[10px] bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full">
                        Chat
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* VIEW: ACTIVE CONVERSATION MESSAGES */}
          {activeConversationId && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Message scroll container */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3">
                {messages.map((m) => {
                  const isMe = m.senderId === session.user?.id

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      {/* Shared Pin Preview Card */}
                      {m.sharedPin && (
                        <Link
                          href={`/pin/${m.sharedPin.id}`}
                          target="_blank"
                          className="mb-1 block max-w-[220px] rounded-2xl overflow-hidden border border-zinc-200 shadow-sm hover:opacity-95 transition-opacity group"
                        >
                          <img
                            src={m.sharedPin.imageUrl}
                            alt={m.sharedPin.title}
                            className="w-full h-28 object-cover"
                          />
                          <div className="p-2 bg-zinc-50 flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-800 truncate">
                              {m.sharedPin.title}
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600" />
                          </div>
                        </Link>
                      )}

                      {/* Bubble */}
                      {m.text && (
                        <div
                          className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-xs ${
                            isMe
                              ? 'bg-pinterest-red text-white rounded-br-none'
                              : 'bg-zinc-100 text-zinc-900 rounded-bl-none'
                          }`}
                        >
                          <p className="break-words leading-relaxed">{m.text}</p>
                        </div>
                      )}

                      <span className="text-[9px] text-zinc-400 mt-0.5 px-1">
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Shared Pin Attachment Banner before sending */}
              {initialSharedPin && (
                <div className="p-2 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <img
                      src={initialSharedPin.imageUrl}
                      alt={initialSharedPin.title}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <span className="text-xs font-semibold text-zinc-700 truncate">
                      Attached: {initialSharedPin.title}
                    </span>
                  </div>
                  {onClearSharedPin && (
                    <button
                      onClick={onClearSharedPin}
                      className="p-1 hover:bg-zinc-200 rounded-full text-zinc-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Message Input Box */}
              <form
                onSubmit={handleSendMessage}
                className="p-2 border-t border-zinc-100 flex items-center gap-2 bg-white"
              >
                <input
                  type="text"
                  placeholder="Send a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-3 py-2 bg-zinc-100 rounded-full text-xs border border-transparent focus:bg-white focus:border-zinc-300 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() && !initialSharedPin}
                  className="p-2 bg-pinterest-red hover:bg-pinterest-redHover disabled:opacity-40 text-white rounded-full transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
