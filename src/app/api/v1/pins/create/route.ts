import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const {
      title,
      description,
      imageUrl,
      videoUrl,
      mediaType,
      mediaUrls,
      imageWidth,
      imageHeight,
      sourceLink,
      category,
      boardId,
      pinType,
      price,
      currency,
      availability,
      brand,
      ingredients,
      cookTime,
      servings,
    } = await req.json()

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!imageUrl || !imageUrl.trim()) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    const pinMedia = Array.isArray(mediaUrls) && mediaUrls.length > 0 ? mediaUrls : [imageUrl.trim()]

    // Atomic transaction: Create pin, and optionally save to designated board
    const newPin = await prisma.$transaction(async (tx) => {
      const pin = await tx.pin.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          imageUrl: imageUrl.trim(),
          videoUrl: videoUrl?.trim() || null,
          mediaType: mediaType || (videoUrl ? 'video' : pinMedia.length > 1 ? 'carousel' : 'image'),
          mediaUrls: pinMedia,
          imageWidth: imageWidth ? parseInt(imageWidth, 10) : 800,
          imageHeight: imageHeight ? parseInt(imageHeight, 10) : 1000,
          sourceLink: sourceLink?.trim() || null,
          category: category || 'All',
          pinType: pinType || 'standard',
          price: price ? parseFloat(price) : null,
          currency: currency || 'USD',
          availability: availability || (price ? 'in_stock' : null),
          brand: brand?.trim() || null,
          ingredients: Array.isArray(ingredients) ? ingredients : [],
          cookTime: cookTime ? parseInt(cookTime, 10) : null,
          servings: servings ? parseInt(servings, 10) : null,
          userId: user.id,
        },
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

      if (boardId) {
        await tx.boardPin.create({
          data: {
            boardId,
            pinId: pin.id,
            userId: user.id,
          },
        })
      }

      return pin
    })

    return NextResponse.json(
      {
        status: 'success',
        pin: {
          id: newPin.id,
          title: newPin.title,
          description: newPin.description,
          imageUrl: newPin.imageUrl,
          imageWidth: newPin.imageWidth,
          imageHeight: newPin.imageHeight,
          sourceLink: newPin.sourceLink,
          creator: newPin.creator,
          isSaved: Boolean(boardId),
          createdAt: newPin.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating pin:', error)
    return NextResponse.json({ error: 'Failed to create pin' }, { status: 500 })
  }
}
