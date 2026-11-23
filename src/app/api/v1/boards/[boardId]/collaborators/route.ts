import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params

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
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    const collaborators = [
      {
        id: `owner-${board.owner.id}`,
        userId: board.owner.id,
        username: board.owner.username,
        displayName: board.owner.displayName,
        avatarUrl: board.owner.avatarUrl,
        role: 'owner',
      },
      ...board.collaborators.map((c) => ({
        id: c.id,
        userId: c.user.id,
        username: c.user.username,
        displayName: c.user.displayName,
        avatarUrl: c.user.avatarUrl,
        role: c.role,
        invitedAt: c.invitedAt,
      })),
    ]

    return NextResponse.json({ collaborators })
  } catch (error) {
    console.error('Error fetching collaborators:', error)
    return NextResponse.json({ error: 'Failed to fetch collaborators' }, { status: 500 })
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
    const { username, role } = await req.json()

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    const assignedRole = role === 'viewer' ? 'viewer' : 'editor'

    const board = await prisma.board.findUnique({
      where: { id: boardId },
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    // Only board owner can invite
    if (board.userId !== user.id) {
      return NextResponse.json({ error: 'Only the board owner can invite collaborators' }, { status: 403 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetUser.id === board.userId) {
      return NextResponse.json({ error: 'Owner is already part of the board' }, { status: 400 })
    }

    // Check if already a collaborator
    const existing = await prisma.boardCollaborator.findUnique({
      where: {
        boardId_userId: {
          boardId,
          userId: targetUser.id,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'User is already a collaborator on this board' }, { status: 400 })
    }

    const created = await prisma.boardCollaborator.create({
      data: {
        boardId,
        userId: targetUser.id,
        role: assignedRole,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    })

    // Notify the invited user
    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        actorId: user.id,
        type: 'collaborator',
        message: `invited you to collaborate on board "${board.title}" as ${assignedRole}.`,
      },
    })

    return NextResponse.json(
      {
        message: `Invited @${targetUser.username} as ${assignedRole}`,
        collaborator: {
          id: created.id,
          userId: created.user.id,
          username: created.user.username,
          displayName: created.user.displayName,
          avatarUrl: created.user.avatarUrl,
          role: created.role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error adding collaborator:', error)
    return NextResponse.json({ error: 'Failed to add collaborator' }, { status: 500 })
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
    const targetUserId = searchParams.get('userId')

    if (!targetUserId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    // Owner can remove anyone; Collaborators can remove themselves (leave board)
    const isOwner = board.userId === user.id
    const isSelf = user.id === targetUserId

    if (!isOwner && !isSelf) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.boardCollaborator.delete({
      where: {
        boardId_userId: {
          boardId,
          userId: targetUserId,
        },
      },
    })

    return NextResponse.json({ message: 'Collaborator removed successfully' })
  } catch (error) {
    console.error('Error removing collaborator:', error)
    return NextResponse.json({ error: 'Failed to remove collaborator' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { boardId } = await params
    const { userId, role } = await req.json()

    if (!userId || !role || !['editor', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Valid userId and role ("editor" | "viewer") are required' }, { status: 400 })
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
    })

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    if (board.userId !== user.id) {
      return NextResponse.json({ error: 'Only the board owner can change collaborator roles' }, { status: 403 })
    }

    const updated = await prisma.boardCollaborator.update({
      where: {
        boardId_userId: {
          boardId,
          userId,
        },
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: `Updated @${updated.user.username}'s role to ${role}`,
      collaborator: {
        id: updated.id,
        userId: updated.user.id,
        username: updated.user.username,
        displayName: updated.user.displayName,
        avatarUrl: updated.user.avatarUrl,
        role: updated.role,
      },
    })
  } catch (error) {
    console.error('Error updating collaborator role:', error)
    return NextResponse.json({ error: 'Failed to update collaborator role' }, { status: 500 })
  }
}
