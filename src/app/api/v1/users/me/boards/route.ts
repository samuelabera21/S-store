import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req)

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const pinId = searchParams.get('pinId')

    const boards = await prisma.board.findMany({
      where: {
        OR: [
          { userId: user.id },
          { collaborators: { some: { userId: user.id } } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { boardPins: true },
        },
        sections: {
          orderBy: { createdAt: 'asc' },
          include: {
            _count: {
              select: { boardPins: true },
            },
          },
        },
        boardPins: {
          take: 1,
          orderBy: { savedAt: 'desc' },
          include: {
            pin: {
              select: { imageUrl: true },
            },
          },
        },
      },
    })

    // If pinId is provided, check which boards and sections contain this pin
    let containingBoardIds: Set<string> = new Set()
    let containingSectionIds: Set<string> = new Set()
    if (pinId) {
      const existingSaves = await prisma.boardPin.findMany({
        where: {
          userId: user.id,
          pinId: pinId,
        },
        select: { boardId: true, sectionId: true },
      })
      containingBoardIds = new Set(existingSaves.map((s) => s.boardId))
      containingSectionIds = new Set(
        existingSaves
          .filter((s) => Boolean(s.sectionId))
          .map((s) => s.sectionId as string)
      )
    }

    const formattedBoards = boards.map((b) => ({
      id: b.id,
      title: b.title,
      description: b.description,
      isPrivate: b.isPrivate,
      isArchived: b.isArchived,
      pinCount: b._count.boardPins,
      coverThumbnail: b.boardPins[0]?.pin.imageUrl ?? null,
      hasPin: containingBoardIds.has(b.id),
      sections: b.sections.map((sec) => ({
        id: sec.id,
        title: sec.title,
        boardId: b.id,
        pinCount: sec._count.boardPins,
        hasPin: containingSectionIds.has(sec.id),
      })),
      updatedAt: b.updatedAt,
    }))

    return NextResponse.json({
      boards: formattedBoards,
    })
  } catch (error) {
    console.error('Error fetching boards:', error)
    return NextResponse.json({ error: 'Failed to fetch user boards' }, { status: 500 })
  }
}
