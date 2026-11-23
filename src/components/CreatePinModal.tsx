'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Link as LinkIcon,
  ChevronDown,
  UploadCloud,
  Loader2,
  Trash2,
  Video,
  ChevronLeft,
  ChevronRight,
  Plus,
  Layers,
} from 'lucide-react'
import { UserBoard } from '@/types'

interface CreatePinModalProps {
  isOpen: boolean
  onClose: () => void
  onPinCreated: (pin: { id: string; title: string }) => void
}

export default function CreatePinModal({
  isOpen,
  onClose,
  onPinCreated,
}: CreatePinModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [carouselSlide, setCarouselSlide] = useState(0)
  const [mediaUrlInput, setMediaUrlInput] = useState('')
  const [imageWidth, setImageWidth] = useState(800)
  const [imageHeight, setImageHeight] = useState(1000)
  const [sourceLink, setSourceLink] = useState('')
  const [boardId, setBoardId] = useState('')
  const [category, setCategory] = useState('Home Decor')
  const [boards, setBoards] = useState<UserBoard[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Web Scraping / Save from Site State
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file')
  const [webUrl, setWebUrl] = useState('')
  const [scraping, setScraping] = useState(false)
  const [scrapedImages, setScrapedImages] = useState<string[]>([])

  // Inline Create Board State
  const [isInlineCreateBoardOpen, setIsInlineCreateBoardOpen] = useState(false)
  const [inlineBoardTitle, setInlineBoardTitle] = useState('')
  const [inlineBoardPrivate, setInlineBoardPrivate] = useState(false)
  const [creatingBoard, setCreatingBoard] = useState(false)

  const handleCreateBoardInline = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inlineBoardTitle.trim()) return

    setCreatingBoard(true)
    try {
      const res = await fetch('/api/v1/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: inlineBoardTitle.trim(),
          isPrivate: inlineBoardPrivate,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create board')

      const newBoard: UserBoard = {
        id: data.board.id,
        title: data.board.title,
        description: data.board.description || null,
        isPrivate: data.board.isPrivate,
        pinCount: 0,
        coverThumbnail: null,
        hasPin: false,
      }
      setBoards((prev) => [newBoard, ...prev])
      setBoardId(newBoard.id)
      setIsInlineCreateBoardOpen(false)
      setInlineBoardTitle('')
      setInlineBoardPrivate(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creating board')
    } finally {
      setCreatingBoard(false)
    }
  }

  const handleScrapeUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!webUrl.trim()) return

    setScraping(true)
    setError(null)
    setScrapedImages([])

    try {
      const res = await fetch('/api/v1/pins/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webUrl.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch website')
      }

      const meta = data.metadata
      if (meta.title && !title) setTitle(meta.title)
      if (meta.description && !description) setDescription(meta.description)
      if (meta.sourceLink) setSourceLink(meta.sourceLink)

      if (meta.images && meta.images.length > 0) {
        setScrapedImages(meta.images)
        setImageUrl(meta.images[0])
        setMediaUrls([meta.images[0]])
        setVideoUrl('')
        setMediaUrlInput(meta.images[0])
      } else {
        setError('No images found on this webpage. You can choose a local file instead.')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error reading link')
    } finally {
      setScraping(false)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    fetch('/api/v1/users/me/boards')
      .then((res) => res.json())
      .then((data) => {
        const b = data.boards || []
        setBoards(b)
        if (b.length > 0 && !boardId) {
          setBoardId(b[0].id)
        }
      })
      .catch((err) => console.error(err))
  }, [isOpen, boardId])

  if (!isOpen) return null

  // Extract video frame thumbnail for crisp poster display
  const extractAndStoreVideoPoster = async (videoSrc: string) => {
    try {
      const video = document.createElement('video')
      video.crossOrigin = 'anonymous'
      video.src = videoSrc
      video.currentTime = 0.5
      video.muted = true
      video.playsInline = true
      await new Promise<void>((resolve) => {
        video.onloadeddata = () => resolve()
        video.onerror = () => resolve()
        setTimeout(() => resolve(), 3000)
      })

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 800
      canvas.height = video.videoHeight || 1000
      setImageWidth(canvas.width)
      setImageHeight(canvas.height)

      const ctx = canvas.getContext('2d')
      if (ctx && canvas.width > 0 && canvas.height > 0) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(async (blob) => {
          if (!blob) return
          const formData = new FormData()
          formData.append('file', new File([blob], 'poster.jpg', { type: 'image/jpeg' }))
          const res = await fetch('/api/v1/upload', { method: 'POST', body: formData })
          const data = await res.json()
          if (data?.url) {
            setImageUrl(data.url)
          }
        }, 'image/jpeg', 0.85)
      }
    } catch {}
  }

  // Handle direct URL paste for image or video
  const handleMediaUrlChange = (val: string) => {
    setMediaUrlInput(val)
    setError(null)
    const trimmed = val.trim()
    if (!trimmed) {
      setImageUrl('')
      setVideoUrl('')
      setMediaUrls([])
      return
    }

    const isVideoUrl =
      /\.(mp4|webm|mov|ogg|m4v)(\?.*)?$/i.test(trimmed) ||
      trimmed.includes('gtv-videos') ||
      trimmed.includes('.mp4')

    if (isVideoUrl) {
      setVideoUrl(trimmed)
      setImageUrl(trimmed)
      setMediaUrls([trimmed])
      extractAndStoreVideoPoster(trimmed)
    } else {
      setVideoUrl('')
      setImageUrl(trimmed)
      setMediaUrls([trimmed])

      const img = new Image()
      img.src = trimmed
      img.onload = () => {
        setImageWidth(img.naturalWidth || 800)
        setImageHeight(img.naturalHeight || 1000)
      }
    }
  }

  const handleFilesUpload = async (files: FileList | File[]) => {
    const fileList = Array.from(files)
    if (fileList.length === 0) return

    // Single video file
    if (fileList[0].type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(fileList[0].name)) {
      setUploading(true)
      setError(null)
      try {
        const formData = new FormData()
        formData.append('file', fileList[0])
        const res = await fetch('/api/v1/upload', { method: 'POST', body: formData })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to upload video')

        setVideoUrl(data.url)
        setImageUrl(data.url)
        setMediaUrls([data.url])
        setMediaUrlInput('')
        extractAndStoreVideoPoster(data.url)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Upload failed')
      } finally {
        setUploading(false)
      }
      return
    }

    // Images (supports single image or multiple images for Carousel)
    setUploading(true)
    setError(null)

    try {
      const uploadPromises = fileList.slice(0, 5).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/v1/upload', { method: 'POST', body: formData })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to upload image')
        return data.url as string
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      setMediaUrls((prev) => {
        const combined = [...prev, ...uploadedUrls].slice(0, 5)
        setImageUrl(combined[0])
        return combined
      })
      setVideoUrl('')
      setCarouselSlide(0)
      setMediaUrlInput('')

      // Measure first image
      const img = new Image()
      img.src = uploadedUrls[0]
      img.onload = () => {
        setImageWidth(img.naturalWidth || 800)
        setImageHeight(img.naturalHeight || 1000)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const activeMedia = mediaUrls.length > 0 ? mediaUrls[0] : imageUrl.trim() || videoUrl.trim()
    if (!title.trim() || !activeMedia) {
      setError('Please provide a title and upload or paste an image/video.')
      return
    }

    setLoading(true)
    setError(null)

    const pinMedia = mediaUrls.length > 0 ? mediaUrls : [activeMedia]
    const isCarousel = !videoUrl && pinMedia.length > 1

    try {
      const res = await fetch('/api/v1/pins/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          imageUrl: pinMedia[0] || activeMedia,
          videoUrl: videoUrl.trim() || null,
          mediaType: videoUrl ? 'video' : isCarousel ? 'carousel' : 'image',
          mediaUrls: pinMedia,
          sourceLink: sourceLink.trim() || null,
          boardId: boardId || null,
          category,
          imageWidth,
          imageHeight,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create pin')
      }

      onPinCreated(data.pin)
      onClose()
      // Reset form
      setTitle('')
      setDescription('')
      setImageUrl('')
      setVideoUrl('')
      setMediaUrls([])
      setMediaUrlInput('')
      setSourceLink('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creating pin')
    } finally {
      setLoading(false)
    }
  }

  const activeDisplayMedia = mediaUrls.length > 1 ? mediaUrls[carouselSlide] : imageUrl

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl my-auto text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div>
            <h2 className="text-xl font-bold text-[#111111]">Create Pin</h2>
            {mediaUrls.length > 1 && (
              <span className="text-xs font-semibold text-amber-600 flex items-center gap-1 mt-0.5">
                <Layers className="w-3.5 h-3.5" /> Carousel Pin ({mediaUrls.length} slides)
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#767676] hover:text-[#111111] hover:bg-[#e9e9e9] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-[#e60023] text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Media Upload Zone or Web Scraper */}
          <div className="flex flex-col">
            {/* Mode Switcher */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setUploadMode('file')}
                className={`flex-1 py-2 text-xs font-bold rounded-full transition-colors ${
                  uploadMode === 'file'
                    ? 'bg-[#111111] text-white'
                    : 'bg-[#e9e9e9] text-[#111111] hover:bg-[#e1e1e1]'
                }`}
              >
                Upload Files / Link
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('url')}
                className={`flex-1 py-2 text-xs font-bold rounded-full transition-colors ${
                  uploadMode === 'url'
                    ? 'bg-[#111111] text-white'
                    : 'bg-[#e9e9e9] text-[#111111] hover:bg-[#e1e1e1]'
                }`}
              >
                Save from site
              </button>
            </div>

            {uploadMode === 'file' ? (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,video/x-m4v"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFilesUpload(e.target.files)
                    }
                  }}
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragOver(true)
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => !activeDisplayMedia && !videoUrl && fileInputRef.current?.click()}
                  className={`flex-1 min-h-[340px] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 overflow-hidden relative ${
                    isDragOver
                      ? 'border-[#e60023] bg-red-50/40'
                      : activeDisplayMedia || videoUrl
                      ? 'border-zinc-200 bg-[#f9f9f9]'
                      : 'border-[#cdcdcd] hover:border-zinc-400 bg-[#f9f9f9] hover:bg-[#f0f0f0] cursor-pointer'
                  }`}
                >
                  {uploading ? (
                    <div className="text-center p-6 text-[#767676]">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#e60023]" />
                      <p className="text-xs font-semibold">Uploading media...</p>
                    </div>
                  ) : videoUrl ? (
                    <div className="relative group/preview w-full h-full flex flex-col items-center justify-center">
                      <video
                        src={videoUrl}
                        controls
                        autoPlay
                        loop
                        muted
                        className="max-h-[340px] w-auto rounded-xl shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setVideoUrl('')
                          setImageUrl('')
                          setMediaUrls([])
                          setMediaUrlInput('')
                        }}
                        className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white text-[#111111] hover:text-[#e60023] rounded-full shadow-md transition-colors"
                        title="Remove video"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <span className="absolute bottom-3 left-3 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Video className="w-3 h-3" /> Video Pin
                      </span>
                    </div>
                  ) : activeDisplayMedia ? (
                    <div className="relative group/preview w-full h-full flex flex-col items-center justify-center">
                      <img
                        src={activeDisplayMedia}
                        alt="Preview"
                        onError={() => setError('Invalid image URL or unable to load')}
                        className="max-h-[340px] w-auto object-contain rounded-xl shadow-sm"
                      />

                      {/* Carousel controls inside preview if multiple images */}
                      {mediaUrls.length > 1 && (
                        <>
                          <div className="absolute top-2 left-2 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-[11px] font-bold rounded-full">
                            Slide {carouselSlide + 1} of {mediaUrls.length}
                          </div>

                          <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setCarouselSlide((prev) => (prev - 1 + mediaUrls.length) % mediaUrls.length)
                              }}
                              className="pointer-events-auto p-1.5 rounded-full bg-white/90 hover:bg-white text-zinc-800 shadow-md transition-transform hover:scale-105"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setCarouselSlide((prev) => (prev + 1) % mediaUrls.length)
                              }}
                              className="pointer-events-auto p-1.5 rounded-full bg-white/90 hover:bg-white text-zinc-800 shadow-md transition-transform hover:scale-105"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setImageUrl('')
                          setVideoUrl('')
                          setMediaUrls([])
                          setMediaUrlInput('')
                        }}
                        className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white text-[#111111] hover:text-[#e60023] rounded-full shadow-md transition-colors"
                        title="Remove images"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center p-6 text-[#767676] pointer-events-none">
                      <div className="w-12 h-12 bg-[#e9e9e9] rounded-full flex items-center justify-center mx-auto mb-3 text-[#111111]">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-[#111111]">
                        Choose files or drag and drop here
                      </p>
                      <p className="text-[11px] text-[#767676] mt-1.5 leading-relaxed">
                        Select multiple images for a Carousel Pin, or a video file (MP4/MOV)
                      </p>
                    </div>
                  )}
                </div>

                {/* Multiple image thumbnail bar */}
                {mediaUrls.length > 0 && !videoUrl && (
                  <div className="flex items-center gap-2 mt-2.5 overflow-x-auto pb-1">
                    {mediaUrls.map((url, idx) => (
                      <div
                        key={idx}
                        onClick={() => setCarouselSlide(idx)}
                        className={`relative w-12 h-12 rounded-xl overflow-hidden cursor-pointer border-2 transition-all shrink-0 ${
                          carouselSlide === idx ? 'border-[#e60023] scale-105 shadow-xs' : 'border-zinc-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        {mediaUrls.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setMediaUrls((prev) => {
                                const next = prev.filter((_, i) => i !== idx)
                                if (carouselSlide >= next.length) setCarouselSlide(Math.max(0, next.length - 1))
                                if (next.length > 0) setImageUrl(next[0])
                                else setImageUrl('')
                                return next
                              })
                            }}
                            className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center text-[9px] hover:bg-red-600 transition-colors"
                            title="Remove slide"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}

                    {mediaUrls.length < 5 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-12 h-12 rounded-xl border-2 border-dashed border-[#cdcdcd] hover:border-zinc-400 flex flex-col items-center justify-center text-[#767676] hover:text-[#111111] transition-colors shrink-0"
                        title="Add more slides (max 5)"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-[9px] font-bold">Add</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Direct Image or Video Web Link Input */}
                <div className="mt-3">
                  <div className="relative flex items-center">
                    <LinkIcon className="w-3.5 h-3.5 text-[#767676] absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      value={mediaUrlInput}
                      onChange={(e) => handleMediaUrlChange(e.target.value)}
                      placeholder="Or paste an image or video web link..."
                      className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-[#cdcdcd] focus:outline-none focus:border-[#111111] bg-white text-[#111111] transition-colors"
                    />
                    {mediaUrlInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setMediaUrlInput('')
                          setImageUrl('')
                          setVideoUrl('')
                          setMediaUrls([])
                        }}
                        className="absolute right-2.5 p-1 text-[#767676] hover:text-[#111111]"
                        title="Clear link"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* URL / Web Scraper View */
              <div className="flex-1 flex flex-col min-h-[340px] bg-[#f9f9f9] rounded-2xl p-4 border border-zinc-200">
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={webUrl}
                    onChange={(e) => setWebUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleScrapeUrl()
                      }
                    }}
                    placeholder="https://example.com/article"
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-[#cdcdcd] focus:outline-none focus:border-[#111111] bg-white text-[#111111]"
                  />
                  <button
                    type="button"
                    onClick={() => handleScrapeUrl()}
                    disabled={scraping || !webUrl.trim()}
                    className="px-4 py-2 bg-[#e60023] hover:bg-[#ad081b] disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors shrink-0"
                  >
                    {scraping ? 'Searching...' : 'Search'}
                  </button>
                </div>

                {scraping && (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-[#767676]">
                    <Loader2 className="w-7 h-7 animate-spin text-[#e60023] mb-2" />
                    <p className="text-xs font-semibold">Extracting images from page...</p>
                  </div>
                )}

                {!scraping && scrapedImages.length > 0 && (
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-bold text-[#767676]">
                        Select images ({mediaUrls.length} selected, max 5 for Carousel):
                      </p>
                      {mediaUrls.length > 1 && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Layers className="w-3 h-3" /> Carousel Pin
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[280px] p-1">
                      {scrapedImages.map((src, idx) => {
                        const isSelected = mediaUrls.includes(src)
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setMediaUrls((prev) => {
                                if (prev.includes(src)) {
                                  const updated = prev.filter((u) => u !== src)
                                  if (imageUrl === src) setImageUrl(updated[0] || '')
                                  return updated
                                } else {
                                  if (prev.length >= 5) return prev
                                  setImageUrl(src)
                                  return [...prev, src]
                                }
                              })
                              setVideoUrl('')
                              setMediaUrlInput('')
                            }}
                            className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                              isSelected
                                ? 'border-[#e60023] ring-2 ring-[#e60023]/30 scale-95'
                                : 'border-transparent hover:border-zinc-300'
                            }`}
                          >
                            <img src={src} alt="" className="w-full h-full object-cover" />
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#e60023] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                                {mediaUrls.indexOf(src) + 1}
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {!scraping && scrapedImages.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#767676]">
                    <LinkIcon className="w-8 h-8 mb-2 text-zinc-300" />
                    <p className="text-xs font-bold text-[#111111]">Enter any web page URL</p>
                    <p className="text-[11px] text-[#767676] mt-1 max-w-xs">
                      We will automatically pull images, title, and link details.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Pin Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a title"
                className="w-full px-4 py-2.5 rounded-xl border border-[#cdcdcd] focus:outline-none focus:border-[#111111] text-sm font-medium bg-white text-[#111111]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is your pin about?"
                className="w-full px-4 py-2.5 rounded-xl border border-[#cdcdcd] focus:outline-none focus:border-[#111111] text-sm font-medium resize-none bg-white text-[#111111]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#cdcdcd] focus:outline-none focus:border-[#111111] text-xs font-medium bg-white text-[#111111]"
                >
                  <option value="Home Decor">Home Decor</option>
                  <option value="Architecture">Architecture</option>
                  <option value="DIY & Crafts">DIY & Crafts</option>
                  <option value="Food & Drinks">Food & Drinks</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Art & Design">Art & Design</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#111111]">
                    Board
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsInlineCreateBoardOpen(true)}
                    className="text-[11px] font-bold text-[#e60023] hover:underline"
                  >
                    + New
                  </button>
                </div>
                <div className="relative">
                  <select
                    value={boardId}
                    onChange={(e) => setBoardId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#cdcdcd] focus:outline-none focus:border-[#111111] text-xs font-medium appearance-none bg-white pr-8 truncate text-[#111111]"
                  >
                    {boards.length === 0 ? (
                      <option value="">No boards (click + New)</option>
                    ) : (
                      boards.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#767676] absolute right-2.5 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-1">
                Destination Link
              </label>
              <div className="relative flex items-center">
                <LinkIcon className="w-4 h-4 text-[#767676] absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={sourceLink}
                  onChange={(e) => setSourceLink(e.target.value)}
                  placeholder="https://yourwebsite.com/article"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#cdcdcd] focus:outline-none focus:border-[#111111] text-sm font-medium bg-white text-[#111111]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full font-semibold text-sm text-[#111111] hover:bg-[#e9e9e9] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || uploading || !title.trim() || (!imageUrl.trim() && !videoUrl.trim() && mediaUrls.length === 0)}
                className="px-6 py-2.5 rounded-full font-semibold text-sm text-white bg-[#e60023] hover:bg-[#ad081b] disabled:bg-[#e9e9e9] disabled:text-[#a5a5a5] disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {loading ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </form>

        {/* Inline Create Board Dialog */}
        {isInlineCreateBoardOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-100">
            <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-zinc-200">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
                <h3 className="text-sm font-bold text-[#111111]">Create new board</h3>
                <button
                  type="button"
                  onClick={() => setIsInlineCreateBoardOpen(false)}
                  className="p-1 hover:bg-[#e9e9e9] rounded-full text-[#767676]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateBoardInline} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111111] mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={inlineBoardTitle}
                    onChange={(e) => setInlineBoardTitle(e.target.value)}
                    placeholder='Like "Living Room" or "Recipes"'
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#cdcdcd] focus:outline-none focus:border-[#111111]"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 bg-[#f9f9f9] rounded-xl">
                  <div>
                    <p className="text-xs font-semibold text-[#111111]">Keep secret</p>
                    <p className="text-[10px] text-[#767676]">Only you can see this board.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={inlineBoardPrivate}
                    onChange={(e) => setInlineBoardPrivate(e.target.checked)}
                    className="w-4 h-4 rounded text-[#e60023] focus:ring-[#e60023]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setIsInlineCreateBoardOpen(false)}
                    className="px-4 py-1.5 text-xs font-bold text-[#111111] hover:bg-[#e9e9e9] rounded-full transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingBoard || !inlineBoardTitle.trim()}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-[#e60023] hover:bg-[#ad081b] disabled:opacity-50 rounded-full transition-colors"
                  >
                    {creatingBoard ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
