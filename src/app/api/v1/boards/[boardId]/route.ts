import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params
    const currentUser = await getSessionUser(req)

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        sections: {
          include: {
            _count: {
              select: { boardPins: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        boardPins: {
          orderBy: [{ position: 'asc' }, { savedAt: 'desc' }],
          include: {
            pin: {
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
            },
          },
        },
      },
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    const isOwner = currentUser?.id === board.userId

    // Protect private boards from non-owners
    if (board.isPrivate && !isOwner) {
      return NextResponse.json({ error: 'This board is private' }, { status: 403 })
    }

    const pins = board.boardPins.map((bp) => {
      const pin = bp.pin
      return {
        id: pin.id,
        title: pin.title,
        description: pin.description,
        imageUrl: pin.imageUrl,
        imageWidth: pin.imageWidth ?? 800,
        imageHeight: pin.imageHeight ?? 1000,
        sourceLink: pin.sourceLink,
        creator: pin.creator,
        isSaved: pin.boardPins.length > 0,
        savedToBoards: pin.boardPins.map((b) => b.board),
        savedAt: bp.savedAt,
        sectionId: bp.sectionId,
        position: bp.position,
        mediaUrls: pin.mediaUrls || [],
      }
    })

    return NextResponse.json({
      board: {
        id: board.id,
        title: board.title,
        description: board.description,
        isPrivate: board.isPrivate,
        isArchived: board.isArchived,
        coverImageUrl: board.coverImageUrl,
        pinCount: pins.length,
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
        owner: board.owner,
        isOwner,
        sections: board.sections.map((s) => ({
          id: s.id,
          title: s.title,
          pinCount: s._count.boardPins,
          createdAt: s.createdAt,
        })),
      },
      pins,
    })
  } catch (error) {
    console.error('Error fetching board detail:', error)
    return NextResponse.json({ error: 'Failed to fetch board' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params
    const user = await getSessionUser(req)

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    if (board.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { title, description, isPrivate, isArchived, coverImageUrl } = await req.json()

    const updated = await prisma.board.update({
      where: { id: boardId },
      data: {
        title: title ? title.trim() : board.title,
        description: description !== undefined ? description?.trim() : board.description,
        isPrivate: isPrivate !== undefined ? Boolean(isPrivate) : board.isPrivate,
        isArchived: isArchived !== undefined ? Boolean(isArchived) : board.isArchived,
        coverImageUrl: coverImageUrl !== undefined ? (coverImageUrl ? coverImageUrl.trim() : null) : board.coverImageUrl,
      },
    })

    return NextResponse.json({ status: 'success', board: updated })
  } catch (error) {
    console.error('Error updating board:', error)
    return NextResponse.json({ error: 'Failed to update board' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params
    const user = await getSessionUser(req)

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    if (board.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.board.delete({
      where: { id: boardId },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting board:', error)
    return NextResponse.json({ error: 'Failed to delete board' }, { status: 500 })
  }
}
