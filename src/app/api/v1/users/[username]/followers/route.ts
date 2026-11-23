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

    // Get followers of targetUser
    const followers = await prisma.follow.findMany({
      where: { followingId: targetUser.id },
      include: {
        follower: {
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

    // Determine which followers the current session user also follows
    let myFollowingSet = new Set<string>()
    if (currentUser) {
      const myFollows = await prisma.follow.findMany({
        where: { followerId: currentUser.id },
        select: { followingId: true },
      })
      myFollowingSet = new Set(myFollows.map((f) => f.followingId))
    }

    const users = followers.map((f) => ({
      ...f.follower,
      isFollowing: myFollowingSet.has(f.follower.id),
      isSelf: currentUser?.id === f.follower.id,
    }))

    return NextResponse.json({ users, count: users.length })
  } catch (error) {
    console.error('Error fetching followers:', error)
    return NextResponse.json({ error: 'Failed to fetch followers' }, { status: 500 })
  }
}
