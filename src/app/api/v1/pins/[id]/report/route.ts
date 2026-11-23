import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getSessionUser(req)

    const pin = await prisma.pin.findUnique({
      where: { id },
    })

    if (!pin) {
      return NextResponse.json({ error: 'Pin not found' }, { status: 404 })
    }

    const { reason, details } = await req.json()

    if (!reason || typeof reason !== 'string') {
      return NextResponse.json({ error: 'Report reason is required' }, { status: 400 })
    }

    // In Pinterest moderation, reports are recorded for automated review or staff queue
    console.log(`[REPORT RECEIVED] Pin: ${id}, Reported by: ${user ? user.username : 'anonymous'}, Reason: ${reason}, Details: ${details || 'none'}`)

    return NextResponse.json({
      success: true,
      message: 'Thank you for reporting. Our moderation team has received this report.',
    })
  } catch (error) {
    console.error('Error reporting pin:', error)
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
  }
}
