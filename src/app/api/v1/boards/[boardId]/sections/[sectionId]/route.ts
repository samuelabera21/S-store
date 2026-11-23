import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string; sectionId: string }> }
) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { boardId, sectionId } = await params

    const board = await prisma.board.findUnique({
      where: { id: boardId },
    })

    if (!board || board.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Remove sectionId from all pins in this section first
    await prisma.boardPin.updateMany({
      where: { boardId, sectionId },
      data: { sectionId: null },
    })

    await prisma.boardSection.delete({
      where: { id: sectionId },
    })

    return NextResponse.json({ success: true, message: 'Section deleted' })
  } catch (error) {
    console.error('Error deleting section:', error)
    return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string; sectionId: string }> }
) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { boardId, sectionId } = await params
    const { title } = await req.json()

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
    })

    if (!board || board.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updated = await prisma.boardSection.update({
      where: { id: sectionId },
      data: { title: title.trim() },
    })

    return NextResponse.json({ section: updated })
  } catch (error) {
    console.error('Error updating section:', error)
    return NextResponse.json({ error: 'Failed to update section' }, { status: 500 })
  }
}
