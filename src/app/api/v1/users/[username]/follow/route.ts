import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const currentUser = await getSessionUser(req)

    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const followersCount = await prisma.follow.count({
      where: { followingId: targetUser.id },
    })

    const followingCount = await prisma.follow.count({
      where: { followerId: targetUser.id },
    })

    const isFollowing = currentUser
      ? (await prisma.follow.count({
          where: {
            followerId: currentUser.id,
            followingId: targetUser.id,
          },
        })) > 0
      : false

    return NextResponse.json({
      followersCount,
      followingCount,
      isFollowing,
    })
  } catch (error) {
    console.error('Error fetching follow status:', error)
    return NextResponse.json({ error: 'Failed to fetch follow stats' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { username } = await params

    const targetUser = await prisma.user.findUnique({
      where: { username },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetUser.id === user.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: targetUser.id,
        },
      },
      create: {
        followerId: user.id,
        followingId: targetUser.id,
      },
      update: {},
    })

    const followersCount = await prisma.follow.count({
      where: { followingId: targetUser.id },
    })

    if (targetUser.id !== user.id) {
      await prisma.notification.create({
        data: {
          userId: targetUser.id,
          actorId: user.id,
          type: 'follow',
          message: 'started following you.',
        },
      })
    }

    return NextResponse.json(
      { status: 'followed', isFollowing: true, followersCount },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error following user:', error)
    return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { username } = await params

    const targetUser = await prisma.user.findUnique({
      where: { username },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await prisma.follow.deleteMany({
      where: {
        followerId: user.id,
        followingId: targetUser.id,
      },
    })

    const followersCount = await prisma.follow.count({
      where: { followingId: targetUser.id },
    })

    if (targetUser.id !== user.id) {
      await prisma.notification.create({
        data: {
          userId: targetUser.id,
          actorId: user.id,
          type: 'follow',
          message: 'started following you.',
        },
      })
    }

    return NextResponse.json({ status: 'unfollowed', isFollowing: false, followersCount })
  } catch (error) {
    console.error('Error unfollowing user:', error)
    return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 })
  }
}
