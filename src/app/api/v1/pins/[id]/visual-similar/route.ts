import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sessionUser = await getSessionUser(req)

    const targetPin = await prisma.pin.findUnique({
      where: { id },
    })

    if (!targetPin) {
      return NextResponse.json({ error: 'Pin not found' }, { status: 404 })
    }

    // Extract search keywords from title & description
    const keywords = targetPin.title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3)

    // Query pins sharing the category or matching keywords
    const similarPins = await prisma.pin.findMany({
      where: {
        id: { not: id },
        OR: [
          { category: targetPin.category },
          ...keywords.map((kw) => ({
            title: { contains: kw, mode: 'insensitive' as const },
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
        boardPins: {
          where: sessionUser ? { userId: sessionUser.id } : { userId: '__UNAUTHENTICATED__' },
          include: {
            board: {
              select: { id: true, title: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedPins = similarPins.map((p) => {
      const isSaved = (p.boardPins || []).length > 0
      const savedToBoards = (p.boardPins || []).map((bp) => bp.board)
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        imageUrl: p.imageUrl,
        imageWidth: p.imageWidth || 400,
        imageHeight: p.imageHeight || 600,
        sourceLink: p.sourceLink,
        category: p.category,
        creator: p.creator,
        isSaved,
        savedToBoards,
      }
    })

    return NextResponse.json({
      targetPin: {
        id: targetPin.id,
        title: targetPin.title,
        imageUrl: targetPin.imageUrl,
      },
      pins: formattedPins,
    })
  } catch (error) {
    console.error('Error fetching visually similar pins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch visually similar pins' },
      { status: 500 }
    )
  }
}
