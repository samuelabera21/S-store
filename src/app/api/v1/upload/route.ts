import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { storeUploadedFile } from '@/lib/storage'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Supported formats: Images & Videos (matching Pinterest desktop web specs)
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v', 'video/m4v']
    const isImage = allowedImageTypes.includes(file.type) || /\.(jpe?g|png|webp|gif)$/i.test(file.name)
    const isVideo = allowedVideoTypes.includes(file.type) || /\.(mp4|webm|mov|m4v)$/i.test(file.name)

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'Supported formats: Images (JPG, PNG, WEBP, GIF) or Videos (MP4, WEBM, MOV, M4V)' },
        { status: 400 }
      )
    }

    // Size limit: 25MB for images, 100MB for videos
    const maxSizeBytes = isVideo ? 100 * 1024 * 1024 : 25 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: `File size exceeds limit (${isVideo ? '100MB for videos' : '25MB for images'})` },
        { status: 400 }
      )
    }

    const result = await storeUploadedFile(file)

    return NextResponse.json({
      url: result.url,
      fileName: result.fileName,
      size: result.size,
      mimeType: result.mimeType,
      mediaType: isVideo ? 'video' : 'image',
    })
  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({ error: 'Failed to process file upload' }, { status: 500 })
  }
}
