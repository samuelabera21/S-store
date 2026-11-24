import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'

export interface UploadResult {
  url: string
  fileName: string
  size: number
  mimeType: string
}

/**
 * Universal Storage Provider
 * - Cloudinary: Default production object storage (zero-configuration CDN + image/video optimization)
 * - S3 / R2: AWS S3 or Cloudflare R2 object storage
 * - Local Development: Fallback to public/uploads/ served via /uploads/[filename]
 */
export async function storeUploadedFile(file: File): Promise<UploadResult> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `${crypto.randomUUID()}.${ext}`

  // 1. Check Cloudinary Configuration
  const cloudinaryUrl = process.env.CLOUDINARY_URL
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (cloudinaryUrl || (cloudName && apiKey && apiSecret)) {
    if (cloudinaryUrl) {
      cloudinary.config({
        cloudinary_url: cloudinaryUrl,
        secure: true,
      })
    } else {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      })
    }

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 's-store',
          resource_type: 'auto',
        },
        (error, res) => {
          if (error || !res) return reject(error)
          resolve(res)
        }
      )
      uploadStream.end(buffer)
    })

    return {
      url: result.secure_url,
      fileName: result.public_id,
      size: result.bytes || file.size,
      mimeType: file.type || `${result.resource_type}/${result.format}`,
    }
  }

  // 2. Check S3 / Cloudflare R2 Configuration
  const s3Bucket = process.env.S3_BUCKET || process.env.R2_BUCKET
  const s3Endpoint = process.env.S3_ENDPOINT || process.env.R2_ENDPOINT
  const s3PublicUrl = process.env.S3_PUBLIC_DOMAIN || process.env.R2_PUBLIC_DOMAIN

  if (s3Bucket && s3Endpoint && s3PublicUrl) {
    const uploadEndpoint = `${s3Endpoint}/${s3Bucket}/${fileName}`
    const res = await fetch(uploadEndpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: buffer,
    })

    if (!res.ok) {
      throw new Error(`Cloud storage upload failed with status ${res.status}`)
    }

    return {
      url: `${s3PublicUrl}/${fileName}`,
      fileName,
      size: file.size,
      mimeType: file.type,
    }
  }

  // 3. Local filesystem storage fallback (Zero configuration required for local dev)
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadsDir, { recursive: true })

  const filePath = path.join(uploadsDir, fileName)
  await writeFile(filePath, buffer)

  return {
    url: `/uploads/${fileName}`,
    fileName,
    size: file.size,
    mimeType: file.type,
  }
}
