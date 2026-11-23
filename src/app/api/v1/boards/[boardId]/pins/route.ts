import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

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
    const { pinId, sectionId } = await req.json()

    if (!pinId) {
      return NextResponse.json({ error: 'pinId is required' }, { status: 400 })
    }

    // Verify board exists and check permissions
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        collaborators: true,
      },
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    const isOwner = board.userId === user.id
    const userCollab = board.collaborators.find((c) => c.userId === user.id)
    const isEditor = userCollab?.role === 'editor'

    if (!isOwner && !isEditor) {
      if (userCollab?.role === 'viewer') {
        return NextResponse.json({ error: 'Forbidden: Viewers cannot add pins to this board' }, { status: 403 })
      }
      return NextResponse.json({ error: 'Forbidden: You do not have permission to add pins to this board' }, { status: 403 })
    }

    if (board.isArchived) {
      return NextResponse.json({ error: 'Cannot save to an archived board' }, { status: 400 })
    }

    // Verify pin exists
    const pin = await prisma.pin.findUnique({
      where: { id: pinId },
    })

    if (!pin) {
      return NextResponse.json({ error: 'Pin not found' }, { status: 404 })
    }

    // Save with idempotency
    const existing = await prisma.boardPin.findUnique({
      where: {
        board_pin_unique: {
          boardId,
          pinId,
        },
      },
    })

    if (existing) {
      if (sectionId && existing.sectionId !== sectionId) {
        await prisma.boardPin.update({
          where: { id: existing.id },
          data: { sectionId },
        })
        return NextResponse.json({
          status: 'updated_section',
          message: `Saved to section in ${board.title}`,
          boardPinId: existing.id,
          boardTitle: board.title,
        })
      }
      return NextResponse.json({
        status: 'already_saved',
        message: 'Pin is already in this board',
        boardPinId: existing.id,
        boardTitle: board.title,
      })
    }

    const boardPin = await prisma.boardPin.create({
      data: {
        boardId,
        pinId,
        userId: user.id,
        sectionId: sectionId || null,
      },
    })

    // Update board updated timestamp
    await prisma.board.update({
      where: { id: boardId },
      data: { updatedAt: new Date() },
    })

    if (pin.userId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: pin.userId,
          actorId: user.id,
          type: 'save',
          message: `saved your pin "${pin.title}".`,
          pinId: pin.id,
        },
      })
    }

    return NextResponse.json(
      {
        status: 'saved',
        message: `Saved to ${board.title}`,
        boardPinId: boardPin.id,
        boardTitle: board.title,
        boardId: board.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error saving pin to board:', error)
    return NextResponse.json({ error: 'Failed to save pin to board' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { boardId } = await params
    const { searchParams } = new URL(req.url)
    const pinId = searchParams.get('pinId')

    if (!pinId) {
      return NextResponse.json({ error: 'pinId is required' }, { status: 400 })
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        collaborators: true,
      },
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    const isOwner = board.userId === user.id
    const userCollab = board.collaborators.find((c) => c.userId === user.id)
    const isEditor = userCollab?.role === 'editor'

    if (!isOwner && !isEditor) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to remove pins from this board' }, { status: 403 })
    }

    await prisma.boardPin.deleteMany({
      where: {
        boardId,
        pinId,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error removing pin from board:', error)
    return NextResponse.json({ error: 'Failed to remove pin' }, { status: 500 })
  }
}
