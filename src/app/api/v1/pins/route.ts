import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getSessionUser(req)
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')
    const feed = searchParams.get('feed')
    const category = searchParams.get('category') || searchParams.get('topic')
    const limitParam = searchParams.get('limit')
    const cursor = searchParams.get('cursor')

    const whereClause: any = {}

    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
      ]
    }

    if (category && category.toLowerCase() !== 'all') {
      whereClause.category = { contains: category, mode: 'insensitive' }
    }

    if (feed === 'following') {
      if (!currentUser) {
        return NextResponse.json({ count: 0, pins: [], nextCursor: null, hasMore: false })
      }
      const myFollows = await prisma.follow.findMany({
        where: { followerId: currentUser.id },
        select: { followingId: true },
      })
      const followedUserIds = myFollows.map((f) => f.followingId)
      whereClause.userId = { in: followedUserIds }
    }

    const isAll = limitParam === 'all'
    const take = isAll ? undefined : Math.min(Number(limitParam) || 20, 50)

    const pins = await prisma.pin.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      take: take ? take + 1 : undefined,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
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
      },
    })

    const hasMore = Boolean(take && pins.length > take)
    const returnedPins = hasMore ? pins.slice(0, take) : pins
    const nextCursor = hasMore ? returnedPins[returnedPins.length - 1].id : null

    const formattedPins = returnedPins.map((pin) => {
      const userBoards = (pin.boardPins || []).map((bp) => bp.board)
      return {
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
        cookTime: pin.cookTime,
        servings: pin.servings,
        creator: pin.creator,
        isSaved: userBoards.length > 0,
        savedToBoards: userBoards,
        createdAt: pin.createdAt,
      }
    })

    return NextResponse.json({
      count: formattedPins.length,
      pins: formattedPins,
      nextCursor,
      hasMore,
    })
  } catch (error) {
    console.error('Error fetching pins:', error)
    return NextResponse.json({ error: 'Failed to fetch pins' }, { status: 500 })
  }
}
