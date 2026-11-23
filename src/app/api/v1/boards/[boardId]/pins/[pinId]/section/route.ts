import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string; pinId: string }> }
) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { boardId, pinId } = await params
    const { sectionId } = await req.json()

    const board = await prisma.board.findUnique({
      where: { id: boardId },
    })

    if (!board || board.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify section if provided
    if (sectionId) {
      const section = await prisma.boardSection.findUnique({
        where: { id: sectionId },
      })
      if (!section || section.boardId !== boardId) {
        return NextResponse.json({ error: 'Section does not exist on this board' }, { status: 400 })
      }
    }

    const updated = await prisma.boardPin.update({
      where: {
        board_pin_unique: {
          boardId,
          pinId,
        },
      },
      data: {
        sectionId: sectionId || null,
      },
    })

    return NextResponse.json({ success: true, boardPin: updated })
  } catch (error) {
    console.error('Error assigning pin to section:', error)
    return NextResponse.json({ error: 'Failed to assign section' }, { status: 500 })
  }
}
