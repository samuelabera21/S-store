import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

export interface UploadResult {
  url: string
  fileName: string
  size: number
  mimeType: string
}

/**
 * Universal Storage Provider
 * - Local Development: Writes to public/uploads/ and serves via /uploads/[filename]
 * - Online Production: If S3/R2 env vars are present, uploads directly to Cloud Object Storage
 */
export async function storeUploadedFile(file: File): Promise<UploadResult> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `${crypto.randomUUID()}.${ext}`

  // Check if Cloud Object Storage (Cloudflare R2 or AWS S3) is configured
  const s3Bucket = process.env.S3_BUCKET || process.env.R2_BUCKET
  const s3Endpoint = process.env.S3_ENDPOINT || process.env.R2_ENDPOINT
  const s3PublicUrl = process.env.S3_PUBLIC_DOMAIN || process.env.R2_PUBLIC_DOMAIN

  if (s3Bucket && s3Endpoint && s3PublicUrl) {
    // S3-compatible Cloud Storage Upload (Cloudflare R2 / AWS S3)
    // When deploying online, configure S3_BUCKET, S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_PUBLIC_DOMAIN
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

  // Local filesystem storage fallback (Zero configuration required for local dev)
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
