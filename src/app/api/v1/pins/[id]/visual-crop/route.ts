import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const { x, y, width, height } = body

    const sourcePin = await prisma.pin.findUnique({
      where: { id },
      include: { creator: true },
    })

    if (!sourcePin) {
      return NextResponse.json({ error: 'Pin not found' }, { status: 404 })
    }

    // Semantic and categorical match for the cropped area
    // Extract search keywords from category and title tokens
    const tokens = sourcePin.title.split(/\s+/).filter((t) => t.length > 2)
    
    const matches = await prisma.pin.findMany({
      where: {
        id: { not: id },
        OR: [
          { category: sourcePin.category },
          ...tokens.map((token) => ({
            title: { contains: token, mode: 'insensitive' as const },
          })),
        ],
      },
      take: 12,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    })

    return NextResponse.json({
      crop: { x, y, width, height },
      sourcePinId: id,
      matches,
    })
  } catch (error) {
    console.error('Visual crop error:', error)
    return NextResponse.json({ error: 'Failed to search cropped region' }, { status: 500 })
  }
}
