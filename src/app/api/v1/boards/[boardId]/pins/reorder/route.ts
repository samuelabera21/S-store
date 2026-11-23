import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { boardId } = await params
    const { pinIds } = await req.json()

    if (!Array.isArray(pinIds)) {
      return NextResponse.json({ error: 'pinIds array is required' }, { status: 400 })
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: { collaborators: true },
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    const isOwner = board.userId === user.id
    const isEditor = board.collaborators.some((c) => c.userId === user.id && c.role === 'editor')

    if (!isOwner && !isEditor) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to reorder pins on this board' },
        { status: 403 }
      )
    }

    // Update positions transactionally
    await prisma.$transaction(
      pinIds.map((pinId: string, index: number) =>
        prisma.boardPin.updateMany({
          where: {
            boardId,
            pinId,
          },
          data: {
            position: index,
          },
        })
      )
    )

    return NextResponse.json({ message: 'Pins reordered successfully' })
  } catch (error) {
    console.error('Error reordering board pins:', error)
    return NextResponse.json({ error: 'Failed to reorder pins' }, { status: 500 })
  }
}
