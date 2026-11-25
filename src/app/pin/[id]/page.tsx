'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import MasonryGrid from '@/components/MasonryGrid'
import SaveButton from '@/components/SaveButton'
import CreateBoardModal from '@/components/CreateBoardModal'
import VisualSearchModal from '@/components/VisualSearchModal'
import EditPinModal from '@/components/EditPinModal'
import MessagesDrawer from '@/components/MessagesDrawer'
import PinActionsMenu from '@/components/PinActionsMenu'
import PinLightboxModal from '@/components/PinLightboxModal'
import PinNoteSection from '@/components/PinNoteSection'
import PinTriesSection from '@/components/PinTriesSection'
import PincodeModal from '@/components/PincodeModal'
import Toast, { ToastMessage } from '@/components/Toast'
import InteractiveVisualCrop from '@/components/InteractiveVisualCrop'
import { PinItem, SessionState } from '@/types'
import { parseVideoUrl } from '@/lib/video'
import {
  ArrowLeft,
  ArrowUpRight,
  Heart,
  MessageCircle,
  Share2,
  Scan,
  Pencil,
  Maximize2,
  ChevronDown,
  Smile,
  Image as ImageIcon,
  Send,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Clock,
  CheckSquare,
  Square,
  ShoppingBag,
  ExternalLink,
  Crop,
} from 'lucide-react'

interface CommentItem {
  id: string
  text: string
  createdAt: string
  user: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
  replies?: CommentItem[]
}

export default function PinPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  const [session, setSession] = useState<SessionState>({ authenticated: false, user: null })
  const [pin, setPin] = useState<PinItem | null>(null)
  const [relatedPins, setRelatedPins] = useState<PinItem[]>([])
  const [comments, setComments] = useState<CommentItem[]>([])
  const [commentsExpanded, setCommentsExpanded] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  // Social Stats
  const [reactionCount, setReactionCount] = useState(0)
  const [hasReacted, setHasReacted] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)

  const [loading, setLoading] = useState(true)

  // Modals & Advanced States
  const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false)
  const [isCropModeOpen, setIsCropModeOpen] = useState(false)
  const [isEditPinOpen, setIsEditPinOpen] = useState(false)
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isSendInMessageOpen, setIsSendInMessageOpen] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isPincodeOpen, setIsPincodeOpen] = useState(false)
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)

  // Video Player States
  const [isVideoPlaying, setIsVideoPlaying] = useState(true)
  const [isVideoMuted, setIsVideoMuted] = useState(true)
  const videoPlayerRef = React.useRef<HTMLVideoElement>(null)

  // Recipe Rich Pin Checklist
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({})

  const handleSearchCrop = async (crop: { x: number; y: number; width: number; height: number }) => {
    try {
      const res = await fetch(`/api/v1/pins/${id}/visual-crop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(crop),
      })
      const data = await res.json()
      if (data.matches && data.matches.length > 0) {
        setRelatedPins(data.matches)
        setToast({ id: Date.now().toString(), title: `Found ${data.matches.length} matching visual items`, type: 'success' })
      } else {
        setToast({ id: Date.now().toString(), title: 'No visual matches found in this region', type: 'info' })
      }
      setIsCropModeOpen(false)
    } catch {
      setToast({ id: Date.now().toString(), title: 'Failed to search cropped region', type: 'error' })
    }
  }

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/v1/session')
      const data = await res.json()
      setSession(data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchPinData = async () => {
    setLoading(true)
    try {
      const [pinRes, commRes, reactRes] = await Promise.all([
        fetch(`/api/v1/pins/${id}`),
        fetch(`/api/v1/pins/${id}/comments`),
        fetch(`/api/v1/pins/${id}/reactions`),
      ])

      if (!pinRes.ok) throw new Error('Pin not found')

      const pinData = await pinRes.json()
      const commData = await commRes.json()
      const reactData = await reactRes.json()

      setPin(pinData.pin)
      setComments(commData.comments || [])
      setReactionCount(reactData.count || 0)
      setHasReacted(reactData.hasReacted || false)

      // Fetch follow stats for creator
      if (pinData.pin?.creator?.username) {
        const followRes = await fetch(`/api/v1/users/${pinData.pin.creator.username}/follow`)
        const followData = await followRes.json()
        setIsFollowing(followData.isFollowing || false)
        setFollowersCount(followData.followersCount || 0)
      }

      // Fetch related pins
      const relatedRes = await fetch('/api/v1/pins?limit=15')
      const relatedData = await relatedRes.json()
      setRelatedPins((relatedData.pins || []).filter((p: PinItem) => p.id !== id))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSession()
    fetchPinData()
  }, [id])

  const handleToggleReaction = async () => {
    if (!session.authenticated) {
      setToast({ id: Date.now().toString(), title: 'Please log in to react', type: 'info' })
      return
    }

    const nextState = !hasReacted
    setHasReacted(nextState)
    setReactionCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)))

    try {
      const res = await fetch(`/api/v1/pins/${id}/reactions`, {
        method: 'POST',
      })
      const data = await res.json()
      setReactionCount(data.count)
      setHasReacted(data.hasReacted)
    } catch {
      setHasReacted(!nextState)
      setReactionCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)))
    }
  }

  const handleToggleFollow = async () => {
    if (!session.authenticated) {
      setToast({ id: Date.now().toString(), title: 'Please log in to follow creators', type: 'info' })
      return
    }
    if (!pin) return

    const nextState = !isFollowing
    setIsFollowing(nextState)
    setFollowersCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)))

    try {
      const method = nextState ? 'POST' : 'DELETE'
      const res = await fetch(`/api/v1/users/${pin.creator.username}/follow`, { method })
      const data = await res.json()
      setIsFollowing(data.isFollowing)
      setFollowersCount(data.followersCount)
      setToast({
        id: Date.now().toString(),
        title: nextState ? `Following @${pin.creator.username}` : `Unfollowed @${pin.creator.username}`,
        type: 'info',
      })
    } catch {
      setIsFollowing(!nextState)
      setFollowersCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)))
    }
  }

  const handlePostReply = async (parentId: string) => {
    if (!session.authenticated) {
      setToast({ id: Date.now().toString(), title: 'Please log in to reply', type: 'info' })
      return
    }
    if (!replyText.trim()) return

    try {
      const res = await fetch(`/api/v1/pins/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyText.trim(), parentId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? { ...c, replies: [...(c.replies || []), data.comment] }
            : c
        )
      )
      setReplyingToId(null)
      setReplyText('')
      setToast({
        id: Date.now().toString(),
        title: 'Reply added',
        type: 'success',
      })
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error adding reply')
    }
  }

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session.authenticated) {
      setToast({ id: Date.now().toString(), title: 'Please log in to comment', type: 'info' })
      return
    }
    if (!commentText.trim()) return

    setSubmittingComment(true)
    try {
      const res = await fetch(`/api/v1/pins/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setComments((prev) => [data.comment, ...prev])
      setCommentText('')
      setToast({
        id: Date.now().toString(),
        title: 'Comment added',
        type: 'success',
      })
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error adding comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleQuickSave = async () => {
    if (!session.authenticated) {
      setToast({ id: Date.now().toString(), title: 'Please log in to save pins', type: 'info' })
      return
    }

    try {
      const boardsRes = await fetch('/api/v1/users/me/boards')
      const boardsData = await boardsRes.json()
      const bList = boardsData.boards || []

      if (bList.length === 0) {
        setIsCreateBoardOpen(true)
        return
      }

      const target = bList[0]
      await fetch(`/api/v1/boards/${target.id}/pins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinId: id }),
      })

      if (pin) setPin({ ...pin, isSaved: true })
      setToast({
        id: Date.now().toString(),
        title: `Saved to ${target.title}`,
        type: 'success',
      })
    } catch {
      setToast({
        id: Date.now().toString(),
        title: 'Error saving pin',
        type: 'error',
      })
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto py-12 px-4 animate-pulse">
        <div className="w-12 h-12 rounded-full bg-zinc-200 mb-6" />
        <div className="h-[600px] w-full bg-zinc-200 rounded-3xl" />
      </div>
    )
  }

  if (!pin) {
    return (
      <div className="w-full text-center py-24">
        <h2 className="text-2xl font-bold text-zinc-900">Pin Not Found</h2>
        <Link href="/" className="mt-4 inline-block text-[#e60023] font-semibold hover:underline">
          Return Home
        </Link>
      </div>
    )
  }

  const mediaList = pin.mediaUrls && pin.mediaUrls.length > 0 ? pin.mediaUrls : [pin.imageUrl]
  const isCarousel = mediaList.length > 1
  const activeImage = mediaList[activeMediaIndex] || pin.imageUrl

  const isPosterImage =
    Boolean(pin.imageUrl) &&
    pin.imageUrl !== pin.videoUrl &&
    !/\.(mp4|webm|mov|ogg|m4v)(\?.*)?$/i.test(pin.imageUrl)

  return (
    <div className="w-full min-h-screen pb-20">
      {/* Floating Circular Back Button (Pinterest Exact) */}
      <button
        onClick={() => router.back()}
        className="fixed top-20 left-4 sm:left-24 z-30 w-12 h-12 rounded-full bg-white hover:bg-zinc-100 shadow-md flex items-center justify-center transition-all hover:scale-105 text-[#111111] border border-zinc-200/80 cursor-pointer"
        title="Go back"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Centered Large Card (Exact Screenshot 3) */}
        <div className="bg-white rounded-[32px] border border-zinc-200/80 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 relative min-h-[600px]">
          {/* Left Column: Image or Video with Expand & Visual Search Buttons */}
          <div className="bg-zinc-100 relative group flex items-center justify-center min-h-[460px] md:min-h-[640px] overflow-hidden">
            {pin.mediaType === 'video' && pin.videoUrl ? (
              parseVideoUrl(pin.videoUrl)?.provider === 'youtube' ? (
                <div className="relative w-full h-full min-h-[500px] flex items-center justify-center bg-black">
                  <iframe
                    src={parseVideoUrl(pin.videoUrl)!.embedUrl}
                    title={pin.title}
                    className="w-full h-full min-h-[500px] border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="relative w-full h-full min-h-[500px] flex items-center justify-center bg-black">
                  <video
                    ref={videoPlayerRef}
                    src={pin.videoUrl}
                    poster={isPosterImage ? pin.imageUrl : undefined}
                    loop
                    playsInline
                    autoPlay
                    preload="auto"
                    muted={isVideoMuted}
                    className="w-full h-full object-contain max-h-[800px]"
                  />
                  {/* Video Play/Pause and Mute Controls */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 z-20">
                    <button
                      onClick={() => {
                        if (videoPlayerRef.current) {
                          if (isVideoPlaying) {
                            videoPlayerRef.current.pause()
                            setIsVideoPlaying(false)
                          } else {
                            videoPlayerRef.current.play()
                            setIsVideoPlaying(true)
                          }
                        }
                      }}
                      className="p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-xs transition-transform hover:scale-105"
                      title={isVideoPlaying ? 'Pause' : 'Play'}
                    >
                      {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                    </button>

                    <button
                      onClick={() => {
                        if (videoPlayerRef.current) {
                          videoPlayerRef.current.muted = !isVideoMuted
                          setIsVideoMuted(!isVideoMuted)
                        }
                      }}
                      className="p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-xs transition-transform hover:scale-105"
                      title={isVideoMuted ? 'Unmute' : 'Mute'}
                    >
                      {isVideoMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )
            ) : (
              <img
                src={activeImage}
                alt={pin.title}
                className="w-full h-full object-cover max-h-[800px]"
              />
            )}

            {/* Carousel navigation if multiple images */}
            {isCarousel && (
              <>
                <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-sm text-white font-bold text-xs rounded-full shadow-md">
                  {activeMediaIndex + 1} / {mediaList.length}
                </div>
                <div className="absolute inset-y-0 inset-x-4 flex items-center justify-between pointer-events-none">
                  <button
                    onClick={() =>
                      setActiveMediaIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length)
                    }
                    className="pointer-events-auto p-2 bg-white/90 hover:bg-white text-zinc-900 rounded-full shadow-lg transition-transform hover:scale-105"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() =>
                      setActiveMediaIndex((prev) => (prev + 1) % mediaList.length)
                    }
                    className="pointer-events-auto p-2 bg-white/90 hover:bg-white text-zinc-900 rounded-full shadow-lg transition-transform hover:scale-105"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}

            {/* Interactive Visual Crop Lens Overlay */}
            <InteractiveVisualCrop
              imageUrl={activeImage}
              isOpen={isCropModeOpen}
              onClose={() => setIsCropModeOpen(false)}
              onSearchCrop={handleSearchCrop}
            />

            {/* Image Overlay Controls: Fullscreen expand, Visual search & Crop Lens */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 z-20">
              <button
                onClick={() => setIsCropModeOpen(true)}
                className="p-2.5 bg-white/90 hover:bg-white text-[#111111] rounded-full shadow-md transition-transform hover:scale-105"
                title="Visual Lens Cropper (Focus object)"
              >
                <Crop className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsLightboxOpen(true)}
                className="p-2.5 bg-white/90 hover:bg-white text-[#111111] rounded-full shadow-md transition-transform hover:scale-105"
                title="Expand"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsVisualSearchOpen(true)}
                className="p-2.5 bg-white/90 hover:bg-white text-[#111111] rounded-full shadow-md transition-transform hover:scale-105"
                title="Visual Search"
              >
                <Scan className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Exact Top Actions, Creator, Comments, Sticky Comment Input */}
          <div className="p-6 sm:p-8 flex flex-col justify-between h-full bg-white">
            <div className="space-y-6">
              {/* Top Action Row (Exact Screenshot 3: ♡ Count, Message, Share, ···, Board Dropdown, Red Save) */}
              <div className="flex items-center justify-between">
                {/* Left Action Buttons */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={handleToggleReaction}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-colors ${
                      hasReacted
                        ? 'text-[#e60023] bg-red-50'
                        : 'text-[#111111] hover:bg-zinc-100'
                    }`}
                    title="React"
                  >
                    <Heart className={`w-5 h-5 ${hasReacted ? 'fill-[#e60023]' : ''}`} />
                    <span className="font-bold text-sm">{reactionCount}</span>
                  </button>

                  <button
                    onClick={() => setCommentsExpanded(true)}
                    className="p-2.5 hover:bg-zinc-100 rounded-full text-[#111111] transition-colors"
                    title="Comments"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href)
                      setToast({
                        id: Date.now().toString(),
                        title: 'Pin link copied to clipboard',
                        type: 'info',
                      })
                    }}
                    className="p-2.5 hover:bg-zinc-100 rounded-full text-[#111111] transition-colors"
                    title="Share"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>

                  <PinActionsMenu
                    imageUrl={pin.imageUrl}
                    pinTitle={pin.title}
                    onPincode={() => setIsPincodeOpen(true)}
                  />

                  {session.user?.username === pin.creator.username && (
                    <button
                      onClick={() => setIsEditPinOpen(true)}
                      className="p-2 hover:bg-zinc-100 rounded-full text-[#111111] transition-colors"
                      title="Edit Pin"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Right Action: Board selector & Red Save Button (Exact Screenshot 3) */}
                <div className="flex items-center gap-2">
                  <SaveButton
                    pinId={pin.id}
                    isSaved={pin.isSaved}
                    onQuickSave={handleQuickSave}
                    onSaveToSpecificBoard={async (boardId, boardTitle, sectionId, sectionTitle) => {
                      await fetch(`/api/v1/boards/${boardId}/pins`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pinId: pin.id, sectionId }),
                      })
                      const destinationName = sectionTitle ? `${boardTitle} > ${sectionTitle}` : boardTitle
                      setPin({ ...pin, isSaved: true })
                      setToast({
                        id: Date.now().toString(),
                        title: `Saved to ${destinationName}`,
                        type: 'success',
                      })
                    }}
                    onCreateBoardClick={() => setIsCreateBoardOpen(true)}
                  />
                </div>
              </div>

              {/* Source Link */}
              {pin.sourceLink && (
                <div>
                  <a
                    href={pin.sourceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#111111] underline hover:text-zinc-600"
                  >
                    <span>{new URL(pin.sourceLink).hostname}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Title & Description */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] leading-tight">
                  {pin.title}
                </h1>
                {pin.description && (
                  <p className="text-sm text-[#767676] mt-2 leading-relaxed">
                    {pin.description}
                  </p>
                )}
              </div>

              {/* Rich Pin: Product Shopping Details */}
              {pin.pinType === 'product' && pin.price != null && (
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-black text-[#111111]">
                        ${pin.price.toFixed(2)}
                      </span>
                      <span className="text-xs font-semibold text-[#767676] ml-1.5 uppercase">
                        {pin.currency || 'USD'}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        pin.availability === 'out_of_stock'
                          ? 'bg-zinc-200 text-zinc-600'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {pin.availability === 'out_of_stock' ? 'Out of stock' : 'In stock'}
                    </span>
                  </div>

                  {pin.brand && (
                    <p className="text-xs text-[#767676] font-medium">
                      Sold by <span className="font-bold text-[#111111]">{pin.brand}</span>
                    </p>
                  )}

                  {pin.sourceLink && (
                    <a
                      href={pin.sourceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#e60023] hover:bg-[#ad081b] text-white font-bold text-xs rounded-full shadow-sm transition-colors"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Visit Merchant Store</span>
                    </a>
                  )}
                </div>
              )}

              {/* Rich Pin: Recipe & Interactive Ingredients Checklist */}
              {pin.pinType === 'recipe' && (
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-3">
                  <div className="flex items-center gap-4 text-xs font-bold text-[#111111] pb-2 border-b border-zinc-200/60">
                    {pin.cookTime && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#e60023]" />
                        <span>{pin.cookTime} min prep & cook</span>
                      </div>
                    )}
                    {pin.servings && (
                      <span>· {pin.servings} servings</span>
                    )}
                  </div>

                  {pin.ingredients && pin.ingredients.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-[#111111] mb-2">Ingredients</h4>
                      <div className="space-y-1.5">
                        {pin.ingredients.map((ing, idx) => {
                          const isChecked = Boolean(checkedIngredients[ing])
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() =>
                                setCheckedIngredients((prev) => ({
                                  ...prev,
                                  [ing]: !prev[ing],
                                }))
                              }
                              className="flex items-center gap-2 w-full text-left text-xs text-[#111111] hover:bg-zinc-100 p-1.5 rounded-lg transition-colors"
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-[#e60023] shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-zinc-400 shrink-0" />
                              )}
                              <span className={isChecked ? 'line-through text-[#767676]' : ''}>
                                {ing}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Creator Row with Inline Red Follow Button (Exact Screenshot 3) */}
              <div className="flex items-center justify-between py-2">
                <Link
                  href={`/${pin.creator.username}`}
                  className="flex items-center gap-3 group"
                >
                  <img
                    src={
                      pin.creator.avatarUrl ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
                    }
                    alt={pin.creator.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-[#111111] group-hover:underline">
                      {pin.creator.displayName || pin.creator.username}
                    </h4>
                    <p className="text-xs text-[#767676]">
                      {followersCount} {followersCount === 1 ? 'follower' : 'followers'}
                    </p>
                  </div>
                </Link>

                {session.user?.username !== pin.creator.username && (
                  <button
                    onClick={handleToggleFollow}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                      isFollowing
                        ? 'bg-[#e9e9e9] hover:bg-[#e1e1e1] text-[#111111]'
                        : 'bg-[#e60023] hover:bg-[#ad081b] text-white shadow-sm'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>

              {/* Collapsible Comment Accordion (Exact Screenshot 3: [n] Comment(s) ∨) */}
              <div className="border-t border-zinc-100 pt-3">
                <button
                  type="button"
                  onClick={() => setCommentsExpanded((prev) => !prev)}
                  className="flex items-center justify-between w-full py-2 text-left font-bold text-sm text-[#111111] hover:opacity-80 transition-opacity"
                >
                  <span>
                    {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#111111] transition-transform ${
                      commentsExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {commentsExpanded && (
                  <div className="mt-3 space-y-3 max-h-60 overflow-y-auto pr-1">
                    {comments.length === 0 ? (
                      <p className="text-xs text-[#767676] italic">No comments yet. Share what you think!</p>
                    ) : (
                      comments.map((c) => (
                        <div key={c.id} className="space-y-1">
                          <div className="flex items-start gap-2.5 text-xs">
                            <div className="w-8 h-8 rounded-full bg-[#e9e9e9] text-[#111111] font-bold flex items-center justify-center shrink-0 uppercase">
                              {c.user.username.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <span className="font-bold text-[#111111]">
                                {c.user.displayName || c.user.username}
                              </span>
                              <span className="text-[#111111] ml-2">{c.text}</span>
                              <div className="flex items-center gap-3 mt-1 text-[11px] text-[#767676]">
                                <span>
                                  {new Date(c.createdAt).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                                <button
                                  onClick={() =>
                                    setReplyingToId((prev) => (prev === c.id ? null : c.id))
                                  }
                                  className="font-bold hover:underline"
                                >
                                  Reply
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Reply box */}
                          {replyingToId === c.id && (
                            <div className="pl-10 flex gap-2 pt-1">
                              <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={`Reply to @${c.user.username}...`}
                                autoFocus
                                className="flex-1 px-3 py-1.5 bg-[#e9e9e9] rounded-full text-xs text-[#111111] focus:outline-none"
                              />
                              <button
                                onClick={() => handlePostReply(c.id)}
                                disabled={!replyText.trim()}
                                className="px-3 py-1.5 bg-[#e60023] hover:bg-[#ad081b] text-white rounded-full text-xs font-bold disabled:opacity-50"
                              >
                                Reply
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Bottom Comment Pill Input (Exact Screenshot 3) */}
            <div className="pt-4 border-t border-zinc-100">
              <form
                onSubmit={handlePostComment}
                className="w-full bg-[#e9e9e9] hover:bg-[#e1e1e1] rounded-full px-4 py-2.5 flex items-center gap-2 transition-colors"
              >
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment"
                  className="flex-1 bg-transparent text-sm font-medium text-[#111111] placeholder-[#767676] focus:outline-none"
                />
                <button
                  type="button"
                  className="p-1 text-[#767676] hover:text-[#111111] rounded-full"
                  title="Insert emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="p-1 text-[#767676] hover:text-[#111111] rounded-full"
                  title="Attach media"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                {commentText.trim() && (
                  <button
                    type="submit"
                    disabled={submittingComment}
                    className="p-1.5 bg-[#e60023] hover:bg-[#ad081b] text-white rounded-full transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* More to explore / Related Pins Section (Exact Screenshot 3) */}
        {relatedPins.length > 0 && (
          <div className="mt-14">
            <h2 className="text-xl font-bold text-[#111111] text-center mb-6">
              More to explore
            </h2>
            <MasonryGrid
              pins={relatedPins}
              loading={false}
              onOpenDetail={(p) => router.push(`/pin/${p.id}`)}
              onQuickSave={handleQuickSave}
              onSaveToSpecificBoard={async (pinId, boardId, title) => {
                await fetch(`/api/v1/boards/${boardId}/pins`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ pinId }),
                })
                setToast({
                  id: Date.now().toString(),
                  title: `Saved to ${title}`,
                  type: 'success',
                })
              }}
              onCreateBoardClick={() => setIsCreateBoardOpen(true)}
            />
          </div>
        )}
      </div>

      {/* Edit Pin Modal */}
      {isEditPinOpen && pin && (
        <EditPinModal
          pin={pin}
          isOpen={isEditPinOpen}
          onClose={() => setIsEditPinOpen(false)}
          onPinUpdated={(updated) => {
            setPin((prev) => (prev ? { ...prev, ...updated } : null))
            setToast({ id: Date.now().toString(), title: 'Pin updated', type: 'success' })
          }}
          onPinDeleted={() => router.push('/')}
        />
      )}

      {/* Visual Search Modal */}
      {isVisualSearchOpen && pin && (
        <VisualSearchModal
          pin={pin}
          isOpen={isVisualSearchOpen}
          onClose={() => setIsVisualSearchOpen(false)}
          onOpenDetail={(p) => router.push(`/pin/${p.id}`)}
          onQuickSave={handleQuickSave}
          onSaveToSpecificBoard={async () => {}}
          onCreateBoardClick={() => setIsCreateBoardOpen(true)}
        />
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && pin && (
        <PinLightboxModal
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          imageUrl={activeImage}
          title={pin.title}
        />
      )}

      {/* Pincode Modal */}
      {isPincodeOpen && pin && (
        <PincodeModal
          isOpen={isPincodeOpen}
          onClose={() => setIsPincodeOpen(false)}
          title={pin.title}
          url={typeof window !== 'undefined' ? window.location.href : `/pin/${pin.id}`}
        />
      )}

      {/* Create Board Modal */}
      <CreateBoardModal
        isOpen={isCreateBoardOpen}
        initialPinId={pin.id}
        onClose={() => setIsCreateBoardOpen(false)}
        onBoardCreated={() => {
          setToast({ id: Date.now().toString(), title: 'Board created', type: 'success' })
        }}
      />

      {/* Global Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
