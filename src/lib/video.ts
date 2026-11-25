/**
 * Video URL parsing helper for online video platforms (YouTube, Shorts, Vimeo, etc.)
 */
export interface ParsedVideoInfo {
  provider: 'youtube' | 'vimeo' | 'direct'
  videoId?: string
  embedUrl: string
  thumbnailUrl?: string
}

export function parseVideoUrl(url: string | null | undefined): ParsedVideoInfo | null {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null

  // 1. YouTube & YouTube Shorts
  // Matches: youtube.com/shorts/ID, youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:shorts\/|watch\?(?:.*&)?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  )
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1]
    return {
      provider: 'youtube',
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    }
  }

  // 2. Vimeo
  // Matches: vimeo.com/123456789
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/i)
  if (vimeoMatch && vimeoMatch[3]) {
    const videoId = vimeoMatch[3]
    return {
      provider: 'vimeo',
      videoId,
      embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1`,
      thumbnailUrl: undefined,
    }
  }

  // 3. Direct Video File (.mp4, .webm, .mov, etc.)
  if (/\.(mp4|webm|mov|ogg|m4v)(\?.*)?$/i.test(trimmed) || trimmed.includes('cloudinary.com') || trimmed.includes('gtv-videos')) {
    return {
      provider: 'direct',
      embedUrl: trimmed,
    }
  }

  return null
}
