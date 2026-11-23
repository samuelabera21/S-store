import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params

    const sections = await prisma.boardSection.findMany({
      where: { boardId },
      include: {
        _count: {
          select: { boardPins: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      sections: sections.map((s) => ({
        id: s.id,
        title: s.title,
        pinCount: s._count.boardPins,
        createdAt: s.createdAt,
      })),
    })
  } catch (error) {
    console.error('Error fetching board sections:', error)
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { boardId } = await params
    const { title } = await req.json()

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Section title is required' }, { status: 400 })
    }

    // Verify ownership
    const board = await prisma.board.findUnique({
      where: { id: boardId },
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    if (board.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const section = await prisma.boardSection.create({
      data: {
        title: title.trim(),
        boardId,
      },
    })

    return NextResponse.json(
      {
        section: {
          id: section.id,
          title: section.title,
          pinCount: 0,
          createdAt: section.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating section:', error)
    return NextResponse.json({ error: 'Failed to create section' }, { status: 500 })
  }
}
