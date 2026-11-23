import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        participants: {
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
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
            sharedPin: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const formatted = conversations.map((c) => {
      const myParticipant = c.participants.find((p) => p.userId === user.id)
      const otherParticipants = c.participants.filter((p) => p.userId !== user.id)
      const lastMessage = c.messages[0] || null
      const hasUnread = lastMessage
        ? new Date(lastMessage.createdAt) > new Date(myParticipant?.lastReadAt || 0) &&
          lastMessage.senderId !== user.id
        : false

      return {
        id: c.id,
        updatedAt: c.updatedAt,
        otherUser: otherParticipants[0]?.user || null,
        participants: c.participants.map((p) => p.user),
        lastMessage,
        hasUnread,
      }
    })

    return NextResponse.json({ conversations: formatted })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { recipientUsername, recipientId, initialMessage, sharedPinId } = body

    let targetUserId = recipientId

    if (!targetUserId && recipientUsername) {
      const targetUser = await prisma.user.findUnique({
        where: { username: recipientUsername },
        select: { id: true },
      })
      if (!targetUser) {
        return NextResponse.json({ error: 'Recipient user not found' }, { status: 404 })
      }
      targetUserId = targetUser.id
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'Recipient is required' }, { status: 400 })
    }

    if (targetUserId === user.id) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 })
    }

    // Check if a direct 1-on-1 conversation already exists
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: user.id } } },
          { participants: { some: { userId: targetUserId } } },
        ],
      },
      include: {
        participants: {
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

    let conversation = existing

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participants: {
            create: [
              { userId: user.id },
              { userId: targetUserId },
            ],
          },
        },
        include: {
          participants: {
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
    }

    // If an initial message or pin was provided, send it
    let message = null
    if (initialMessage || sharedPinId) {
      message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: user.id,
          text: initialMessage || 'Shared a pin',
          sharedPinId: sharedPinId || null,
        },
        include: {
          sharedPin: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
            },
          },
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      })

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      })

      // Create notification for recipient
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          actorId: user.id,
          type: 'message',
          message: `${user.displayName || user.username} sent you a message`,
          pinId: sharedPinId || null,
        },
      })
    }

    return NextResponse.json({ conversation, message }, { status: 201 })
  } catch (error) {
    console.error('Error starting conversation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
