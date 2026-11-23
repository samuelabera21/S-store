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

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        about: true,
        website: true,
        createdAt: true,
        _count: {
          select: {
            createdPins: true,
            boards: true,
            followers: true,
            following: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isOwner = currentUser?.id === user.id

    const isFollowing = currentUser && !isOwner
      ? (await prisma.follow.count({
          where: { followerId: currentUser.id, followingId: user.id },
        })) > 0
      : false

    // Fetch user's boards (hide private & archived boards if viewer is not the owner)
    const boards = await prisma.board.findMany({
      where: {
        userId: user.id,
        ...(isOwner ? {} : { isPrivate: false, isArchived: false }),
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { boardPins: true },
        },
        boardPins: {
          take: 3,
          orderBy: { savedAt: 'desc' },
          include: {
            pin: {
              select: { imageUrl: true },
            },
          },
        },
      },
    })

    // Fetch user's created pins
    const createdPins = await prisma.pin.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
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
    })

    const formattedBoards = boards.map((b) => {
      const pinThumbs = b.boardPins.map((bp) => bp.pin.imageUrl)
      const thumbnails = b.coverImageUrl
        ? [b.coverImageUrl, ...pinThumbs.filter((u) => u !== b.coverImageUrl)]
        : pinThumbs

      return {
        id: b.id,
        title: b.title,
        description: b.description,
        isPrivate: b.isPrivate,
        isArchived: b.isArchived,
        coverImageUrl: b.coverImageUrl,
        pinCount: b._count.boardPins,
        thumbnails,
        updatedAt: b.updatedAt,
      }
    })

    const formattedPins = createdPins.map((pin) => ({
      id: pin.id,
      title: pin.title,
      description: pin.description,
      imageUrl: pin.imageUrl,
      imageWidth: pin.imageWidth ?? 800,
      imageHeight: pin.imageHeight ?? 1000,
      sourceLink: pin.sourceLink,
      creator: pin.creator,
      isSaved: pin.boardPins.length > 0,
      savedToBoards: pin.boardPins.map((bp) => bp.board),
      createdAt: pin.createdAt,
    }))

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        about: user.about,
        website: user.website,
        pinCount: user._count.createdPins,
        boardCount: user._count.boards,
        followersCount: user._count.followers,
        followingCount: user._count.following,
        isFollowing,
        isOwner,
      },
      boards: formattedBoards,
      createdPins: formattedPins,
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
  }
}
