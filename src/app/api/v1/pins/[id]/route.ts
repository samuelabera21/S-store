import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getSessionUser(req)

    const pin = await prisma.pin.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        boardPins: {
          where: currentUser ? { userId: currentUser.id } : { userId: '__UNAUTHENTICATED__' },
          include: {
            board: {
              select: { id: true, title: true },
            },
          },
        },
        _count: {
          select: { boardPins: true },
        },
      },
    })

    if (!pin) {
      return NextResponse.json({ error: 'Pin not found' }, { status: 404 })
    }

    const userBoards = (pin.boardPins || []).map((bp) => bp.board)
    const isOwner = currentUser?.id === pin.creator.id

    // Record analytics impression asynchronously
    prisma.analyticsEvent.create({
      data: {
        pinId: pin.id,
        userId: currentUser?.id || null,
        type: 'impression',
      },
    }).catch(() => {})

    return NextResponse.json({
      pin: {
        id: pin.id,
        title: pin.title,
        description: pin.description,
        imageUrl: pin.imageUrl,
        videoUrl: pin.videoUrl,
        mediaType: pin.mediaType,
        mediaUrls: pin.mediaUrls || [],
        imageWidth: pin.imageWidth ?? 800,
        imageHeight: pin.imageHeight ?? 1000,
        sourceLink: pin.sourceLink,
        category: pin.category,
        pinType: pin.pinType,
        price: pin.price,
        currency: pin.currency,
        availability: pin.availability,
        brand: pin.brand,
        ingredients: pin.ingredients,
        cookTime: pin.cookTime,
        servings: pin.servings,
        creator: pin.creator,
        isSaved: userBoards.length > 0,
        savedToBoards: userBoards,
        viewCount: pin.viewCount,
        clickCount: pin.clickCount,
        saveCount: pin._count.boardPins,
        createdAt: pin.createdAt,
        isOwner,
      },
    })
  } catch (error) {
    console.error('Error fetching pin detail:', error)
    return NextResponse.json({ error: 'Failed to fetch pin' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await params
    const { title, description, category, sourceLink } = await req.json()

    const pin = await prisma.pin.findUnique({ where: { id } })
    if (!pin) {
      return NextResponse.json({ error: 'Pin not found' }, { status: 404 })
    }

    if (pin.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You can only edit your own pins' }, { status: 403 })
    }

    const updated = await prisma.pin.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        description: description !== undefined ? description?.trim() || null : undefined,
        category: category !== undefined ? category.trim() : undefined,
        sourceLink: sourceLink !== undefined ? sourceLink?.trim() || null : undefined,
      },
    })

    return NextResponse.json({ pin: updated, message: 'Pin updated successfully' })
  } catch (error) {
    console.error('Error updating pin:', error)
    return NextResponse.json({ error: 'Failed to update pin' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await params

    const pin = await prisma.pin.findUnique({ where: { id } })
    if (!pin) {
      return NextResponse.json({ error: 'Pin not found' }, { status: 404 })
    }

    if (pin.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You can only delete your own pins' }, { status: 403 })
    }

    await prisma.pin.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Pin deleted successfully' })
  } catch (error) {
    console.error('Error deleting pin:', error)
    return NextResponse.json({ error: 'Failed to delete pin' }, { status: 500 })
  }
}
