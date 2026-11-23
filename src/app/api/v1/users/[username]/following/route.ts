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

    // Get users that targetUser follows
    const followings = await prisma.follow.findMany({
      where: { followerId: targetUser.id },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            about: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    let myFollowingSet = new Set<string>()
    if (currentUser) {
      const myFollows = await prisma.follow.findMany({
        where: { followerId: currentUser.id },
        select: { followingId: true },
      })
      myFollowingSet = new Set(myFollows.map((f) => f.followingId))
    }

    const users = followings.map((f) => ({
      ...f.following,
      isFollowing: myFollowingSet.has(f.following.id),
      isSelf: currentUser?.id === f.following.id,
    }))

    return NextResponse.json({ users, count: users.length })
  } catch (error) {
    console.error('Error fetching following:', error)
    return NextResponse.json({ error: 'Failed to fetch following' }, { status: 500 })
  }
}
