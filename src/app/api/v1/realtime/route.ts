import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const username = req.cookies.get('session_user')?.value
  if (!username) {
    return new Response('Unauthorized', { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  })

  if (!user) {
    return new Response('User not found', { status: 404 })
  }

  const encoder = new TextEncoder()
  let isClosed = false

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection handshake
      controller.enqueue(encoder.encode(`event: connected\ndata: {"status":"connected","userId":"${user.id}"}\n\n`))

      let lastCheckedTime = new Date()

      // Heartbeat & Poll loop for real-time events
      const interval = setInterval(async () => {
        if (isClosed) {
          clearInterval(interval)
          return
        }

        try {
          // Check for unread notifications created since last check
          const newNotifications = await prisma.notification.findMany({
            where: {
              userId: user.id,
              createdAt: { gt: lastCheckedTime },
            },
            include: {
              actor: {
                select: { id: true, username: true, displayName: true, avatarUrl: true },
              },
            },
          })

          if (newNotifications.length > 0) {
            for (const notif of newNotifications) {
              controller.enqueue(
                encoder.encode(`event: notification\ndata: ${JSON.stringify(notif)}\n\n`)
              )
            }
          }

          // Check for new incoming direct messages
          const newMessages = await prisma.message.findMany({
            where: {
              createdAt: { gt: lastCheckedTime },
              senderId: { not: user.id },
              conversation: {
                participants: {
                  some: { userId: user.id },
                },
              },
            },
            include: {
              sender: {
                select: { id: true, username: true, displayName: true, avatarUrl: true },
              },
            },
          })

          if (newMessages.length > 0) {
            for (const msg of newMessages) {
              controller.enqueue(
                encoder.encode(`event: message\ndata: ${JSON.stringify(msg)}\n\n`)
              )
            }
          }

          lastCheckedTime = new Date()

          // Send heartbeat ping to keep connection alive
          controller.enqueue(encoder.encode(`: ping\n\n`))
        } catch {
          // Keep stream resilient
        }
      }, 3000)

      req.signal.addEventListener('abort', () => {
        isClosed = true
        clearInterval(interval)
        try {
          controller.close()
        } catch {}
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
