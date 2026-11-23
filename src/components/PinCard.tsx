'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ArrowUpRight, Share2, Scan, ChevronLeft, ChevronRight, Volume2, VolumeX, Play, Tag, Clock } from 'lucide-react'
import { PinItem } from '@/types'
import SaveButton from './SaveButton'
import PinActionsMenu from './PinActionsMenu'
import ReportPinModal from './ReportPinModal'

interface PinCardProps {
  pin: PinItem
  onOpenDetail: (pin: PinItem) => void
  onQuickSave: (pinId: string) => Promise<void>
  onSaveToSpecificBoard: (
    pinId: string,
    boardId: string,
    boardTitle: string,
    sectionId?: string,
    sectionTitle?: string
  ) => Promise<void>
  onCreateBoardClick: (pinId: string) => void
  onVisualSearchClick?: (pin: PinItem) => void
}

export default function PinCard({
  pin,
  onOpenDetail,
  onQuickSave,
  onSaveToSpecificBoard,
  onCreateBoardClick,
  onVisualSearchClick,
}: PinCardProps) {
  const [isHidden, setIsHidden] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  const mediaList = pin.mediaUrls && pin.mediaUrls.length > 0 ? pin.mediaUrls : [pin.imageUrl]
  const isCarousel = mediaList.length > 1
  const isVideo = pin.mediaType === 'video' && Boolean(pin.videoUrl)

  // Ensure poster is a genuine image, not an MP4/video link
  const isPosterImage =
    Boolean(pin.imageUrl) &&
    pin.imageUrl !== pin.videoUrl &&
    !/\.(mp4|webm|mov|ogg|m4v)(\?.*)?$/i.test(pin.imageUrl)

  // Autoplay video when mounted
  useEffect(() => {
    if (!isVideo || !videoRef.current) return
    const video = videoRef.current
    video.defaultMuted = true
    video.muted = true
    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Fallback if browser requires interaction
        })
    }
  }, [isVideo, pin.videoUrl])

  // Viewport intersection observer to play when visible
  useEffect(() => {
    if (!isVideo || !videoRef.current) return
    const el = videoRef.current
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.play()
              .then(() => setIsPlaying(true))
              .catch(() => {})
          } else {
            el.pause()
            setIsPlaying(false)
          }
        })
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [isVideo, pin.videoUrl])

  const handleNextSlide = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentSlide((prev) => (prev + 1) % mediaList.length)
  }

  const handlePrevSlide = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentSlide((prev) => (prev - 1 + mediaList.length) % mediaList.length)
  }

  const handleMouseEnter = () => {
    if (isVideo && videoRef.current && videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
    }
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  // Pinterest clamps vertical pins to maximum 1:2.1 ratio (210%)
  const rawRatio = (pin.imageHeight / (pin.imageWidth || 800)) * 100
  const aspectRatio = Math.min(Math.max(rawRatio, 60), 210)

  if (isHidden) {
    return (
      <div className="masonry-item p-6 bg-zinc-100 rounded-2xl text-center text-xs text-zinc-500 border border-dashed border-zinc-300 space-y-2">
        <p className="font-semibold text-zinc-700">Pin hidden</p>
        <p className="text-[11px] text-zinc-400">We won't show this idea in your feed anymore.</p>
        <button
          onClick={() => setIsHidden(false)}
          className="px-3 py-1 bg-white text-zinc-900 font-bold rounded-full shadow-2xs hover:bg-zinc-50 transition-colors"
        >
          Undo
        </button>
      </div>
    )
  }

  return (
    <div
      className="masonry-item group relative cursor-pointer hover:z-10 focus-within:z-20"
      onMouseEnter={handleMouseEnter}
    >
      <div className="relative rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md">
        {/* Media Container with overflow-hidden for rounded corners */}
        <div
          onClick={() => onOpenDetail(pin)}
          className="relative overflow-hidden rounded-2xl bg-zinc-100"
        >
          {/* Dynamic Aspect Ratio Container */}
          <div style={{ paddingTop: `${aspectRatio}%` }} className="relative w-full">
            {isVideo ? (
              <div className="absolute inset-0 w-full h-full bg-black">
                <video
                  ref={videoRef}
                  src={pin.videoUrl!}
                  poster={isPosterImage ? pin.imageUrl : undefined}
                  autoPlay
                  muted={isMuted}
                  loop
                  playsInline
                  preload="auto"
                  className="w-full h-full object-cover"
                />
                {/* Video Play Indicator Badge */}
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white font-bold text-[11px] rounded-full flex items-center gap-1 z-10">
                  <Play className="w-3 h-3 fill-white" />
                  <span>Video</span>
                </div>

                {/* Mute/Unmute audio button */}
                <button
                  type="button"
                  onClick={toggleMute}
                  className="absolute bottom-3 left-3 p-2 rounded-full bg-black/70 hover:bg-black/90 text-white shadow-md z-20 transition-transform hover:scale-105"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            ) : (
              <img
                src={mediaList[currentSlide]}
                alt={pin.title}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            )}

            {/* Carousel Left/Right Controls on Hover */}
            {isCarousel && (
              <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  className="pointer-events-auto p-1.5 rounded-full bg-white/90 hover:bg-white text-zinc-800 shadow-md transition-transform hover:scale-105"
                  title="Previous image"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextSlide}
                  className="pointer-events-auto p-1.5 rounded-full bg-white/90 hover:bg-white text-zinc-800 shadow-md transition-transform hover:scale-105"
                  title="Next image"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Carousel Dot Indicators */}
            {isCarousel && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10 pointer-events-none">
                {mediaList.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentSlide ? 'w-3.5 bg-white shadow-sm' : 'w-1.5 bg-white/60'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Hover Dark Scrim Overlay */}
          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
        </div>

        {/* Floating Top Right: Save Button (Outside overflow-hidden so popover is never clipped) */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto z-20">
          <SaveButton
            pinId={pin.id}
            isSaved={pin.isSaved}
            onQuickSave={() => onQuickSave(pin.id)}
            onSaveToSpecificBoard={(boardId, boardTitle, sectionId, sectionTitle) =>
              onSaveToSpecificBoard(pin.id, boardId, boardTitle, sectionId, sectionTitle)
            }
            onCreateBoardClick={() => onCreateBoardClick(pin.id)}
          />
        </div>

        {/* Floating Bottom Action Icons */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto z-20">
          {onVisualSearchClick && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onVisualSearchClick(pin)
              }}
              className="p-2 bg-white/90 hover:bg-white text-zinc-900 rounded-full shadow-md transition-colors"
              title="Visual search"
            >
              <Scan className="w-4 h-4 text-zinc-800" />
            </button>
          )}
          {pin.sourceLink && (
            <a
              href={pin.sourceLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 bg-white/90 hover:bg-white text-zinc-900 rounded-full shadow-md transition-colors"
              title="Visit source"
            >
              <ArrowUpRight className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigator.clipboard?.writeText(window.location.origin + `/pin/${pin.id}`)
            }}
            className="p-2 bg-white/90 hover:bg-white text-zinc-900 rounded-full shadow-md transition-colors"
            title="Copy link"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <div onClick={(e) => e.stopPropagation()}>
            <PinActionsMenu
              imageUrl={pin.imageUrl}
              pinTitle={pin.title}
              onHidePin={() => setIsHidden(true)}
              onReportPin={() => setIsReportOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Card Info & Rich Pin Badges Underneath Image */}
      <div className="pt-2 px-1">
        {/* Rich Pin Product Price or Recipe Pill */}
        {pin.pinType === 'product' && pin.price != null && (
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-bold text-zinc-900">
              ${pin.price.toFixed(2)}
            </span>
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {pin.availability === 'out_of_stock' ? 'Out of stock' : 'In stock'}
            </span>
            {pin.brand && (
              <span className="text-[11px] text-zinc-500 font-medium truncate">
                · {pin.brand}
              </span>
            )}
          </div>
        )}

        {pin.pinType === 'recipe' && pin.cookTime != null && (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-600 mb-1">
            <Clock className="w-3 h-3 text-zinc-500" />
            <span>{pin.cookTime} min</span>
            {pin.servings && <span>· {pin.servings} servings</span>}
          </div>
        )}

        <h3 className="text-xs font-semibold text-zinc-900 line-clamp-1 leading-snug">
          {pin.title}
        </h3>
        <div className="flex items-center gap-1.5 mt-1">
          {pin.creator.avatarUrl && (
            <img
              src={pin.creator.avatarUrl}
              alt={pin.creator.username}
              className="w-5 h-5 rounded-full object-cover shrink-0"
            />
          )}
          <span className="text-[11px] text-zinc-500 truncate">
            {pin.creator.displayName || pin.creator.username}
          </span>
        </div>
      </div>

      <ReportPinModal
        pinId={pin.id}
        pinTitle={pin.title}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onReportSuccess={() => setIsHidden(true)}
      />
    </div>
  )
}
