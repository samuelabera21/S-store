import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'

export const dynamic = 'force-dynamic'

/**
 * Direct Cloudinary Upload Signature Endpoint
 * Allows clients to upload large files (e.g., HD videos up to 100MB) directly to Cloudinary,
 * completely bypassing Vercel's 4.5MB serverless request body limit.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { directUploadAvailable: false, message: 'Cloudinary not configured on server' },
        { status: 200 }
      )
    }

    const timestamp = Math.round(Date.now() / 1000)
    const folder = 's-store'

    const paramsToSign = {
      timestamp,
      folder,
    }

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret)

    return NextResponse.json({
      directUploadAvailable: true,
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder,
    })
  } catch (error) {
    console.error('Signature generation error:', error)
    return NextResponse.json({ error: 'Failed to generate upload signature' }, { status: 500 })
  }
}
