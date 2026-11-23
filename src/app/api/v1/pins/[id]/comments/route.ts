import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch top-level comments and their nested replies
    const comments = await prisma.comment.findMany({
      where: { pinId: id, parentId: null },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
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

    const totalCount = await prisma.comment.count({ where: { pinId: id } })

    return NextResponse.json({
      count: totalCount,
      comments: comments.map((c) => ({
        id: c.id,
        text: c.text,
        createdAt: c.createdAt,
        user: c.user,
        replies: c.replies.map((r) => ({
          id: r.id,
          text: r.text,
          createdAt: r.createdAt,
          user: r.user,
        })),
      })),
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await params
    const { text, parentId } = await req.json()

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 })
    }

    // Verify parent comment if replying
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      })
      if (!parentComment || parentComment.pinId !== id) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 400 })
      }
    }

    const comment = await prisma.comment.create({
      data: {
        pinId: id,
        userId: user.id,
        parentId: parentId || null,
        text: text.trim(),
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

    // Create notification for target user
    const targetPin = await prisma.pin.findUnique({ where: { id } })
    if (targetPin && targetPin.userId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: targetPin.userId,
          actorId: user.id,
          type: 'comment',
          message: parentId
            ? `replied to a comment on your pin: "${text.trim().slice(0, 40)}"`
            : `commented on your pin: "${text.trim().slice(0, 40)}"`,
          pinId: id,
        },
      })
    }

    return NextResponse.json(
      {
        comment: {
          id: comment.id,
          text: comment.text,
          createdAt: comment.createdAt,
          user: comment.user,
          parentId: comment.parentId,
          replies: [],
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error posting comment:', error)
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 })
  }
}
