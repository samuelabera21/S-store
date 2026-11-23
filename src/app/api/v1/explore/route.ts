import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') || 'All'

    // Fetch featured public boards
    const featuredBoards = await prisma.board.findMany({
      where: { isPrivate: false },
      take: 6,
      orderBy: { updatedAt: 'desc' },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { boardPins: true },
        },
        boardPins: {
          take: 3,
          include: {
            pin: { select: { imageUrl: true } },
          },
        },
      },
    })

    // Fetch trending pins matching category (or all)
    const pins = await prisma.pin.findMany({
      where: category === 'All' ? undefined : { category },
      take: 20,
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
          take: 1,
          include: { board: { select: { id: true, title: true } } },
        },
      },
    })

    const categories = [
      'All',
      'Home Decor',
      'Food And Drink',
      'Art',
      'Design',
      'Travel',
      'Fashion',
      'Diy And Crafts',
      'Quotes',
    ]

    return NextResponse.json({
      categories,
      selectedCategory: category,
      featuredBoards: featuredBoards.map((b) => ({
        id: b.id,
        title: b.title,
        description: b.description,
        pinCount: b._count.boardPins,
        owner: b.owner,
        thumbnails: b.boardPins.map((bp) => bp.pin.imageUrl),
      })),
      pins: pins.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        imageUrl: p.imageUrl,
        imageWidth: p.imageWidth ?? 800,
        imageHeight: p.imageHeight ?? 1000,
        sourceLink: p.sourceLink,
        category: p.category,
        creator: p.creator,
        isSaved: p.boardPins.length > 0,
        savedToBoards: p.boardPins.map((bp) => bp.board),
      })),
    })
  } catch (error) {
    console.error('Error fetching explore data:', error)
    return NextResponse.json({ error: 'Failed to fetch explore data' }, { status: 500 })
  }
}
