import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const tries = await prisma.pinTry.findMany({
      where: { pinId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
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
      count: tries.length,
      tries,
    })
  } catch (error) {
    console.error('Error fetching pin tries:', error)
    return NextResponse.json({ error: 'Failed to fetch pin tries' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getSessionUser(req)

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const pin = await prisma.pin.findUnique({
      where: { id },
    })

    if (!pin) {
      return NextResponse.json({ error: 'Pin not found' }, { status: 404 })
    }

    const { imageUrl, text, rating } = await req.json()

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json({ error: 'Image photo is required to share a recreation' }, { status: 400 })
    }

    const createdTry = await prisma.pinTry.create({
      data: {
        pinId: id,
        userId: user.id,
        imageUrl: imageUrl.trim(),
        text: text ? text.trim() : null,
        rating: typeof rating === 'number' ? Math.min(Math.max(rating, 1), 5) : 5,
      },
      include: {
        user: {
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
      success: true,
      pinTry: createdTry,
      message: 'Photo recreation shared successfully!',
    })
  } catch (error) {
    console.error('Error creating pin try:', error)
    return NextResponse.json({ error: 'Failed to submit try' }, { status: 500 })
  }
}
