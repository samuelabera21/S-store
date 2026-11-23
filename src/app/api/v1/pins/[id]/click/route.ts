import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const updated = await prisma.pin.update({
      where: { id },
      data: { clickCount: { increment: 1 } },
      select: { id: true, clickCount: true },
    })

    return NextResponse.json({ success: true, clickCount: updated.clickCount })
  } catch (error) {
    console.error('Error tracking click:', error)
    return NextResponse.json({ error: 'Failed to record click' }, { status: 500 })
  }
}
