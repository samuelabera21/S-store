import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getSessionUser(req)

    const count = await prisma.reaction.count({
      where: { pinId: id },
    })

    const hasReacted = user
      ? (await prisma.reaction.count({
          where: { pinId: id, userId: user.id },
        })) > 0
      : false

    return NextResponse.json({
      count,
      hasReacted,
    })
  } catch (error) {
    console.error('Error fetching reactions:', error)
    return NextResponse.json({ error: 'Failed to fetch reactions' }, { status: 500 })
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

    const existing = await prisma.reaction.findUnique({
      where: {
        pinId_userId_type: {
          pinId: id,
          userId: user.id,
          type: 'heart',
        },
      },
    })

    if (existing) {
      // Toggle off
      await prisma.reaction.delete({
        where: { id: existing.id },
      })
      const count = await prisma.reaction.count({ where: { pinId: id } })
      return NextResponse.json({ status: 'removed', hasReacted: false, count })
    } else {
      // Toggle on
      await prisma.reaction.create({
        data: {
          pinId: id,
          userId: user.id,
          type: 'heart',
        },
      })
      const count = await prisma.reaction.count({ where: { pinId: id } })
      return NextResponse.json({ status: 'added', hasReacted: true, count }, { status: 201 })
    }
  } catch (error) {
    console.error('Error toggling reaction:', error)
    return NextResponse.json({ error: 'Failed to toggle reaction' }, { status: 500 })
  }
}
