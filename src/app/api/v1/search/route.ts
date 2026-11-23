import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

const TOPIC_EXPANSIONS: Record<string, string[]> = {
  chair: ['Modern', 'Wood', 'Living Room', 'Dining', 'Vintage', 'Minimalist', 'Aesthetic'],
  cocktail: ['Mocktail', 'Rosemary', 'Citrus', 'Garnish', 'Summer Drink', 'Glassware', 'Recipe'],
  interior: ['Minimalism', 'Japandi', 'Lighting', 'Living Room', 'Bedroom', 'Warm Tones', 'Architecture'],
  art: ['Contemporary', 'Gallery Wall', 'Abstract', 'Framed Prints', 'Typography', 'Oil Painting'],
  recipe: ['Easy Dinner', 'Dessert', 'Healthy', 'Baking', 'Comfort Food', 'Brunch'],
  wood: ['Oak', 'Mid-Century', 'Joinery', 'Coffee Table', 'Craftsmanship', 'Rustic'],
  scandinavian: ['Stockholm', 'Nordic Home', 'Light Oak', 'Ceramics', 'Linen', 'Hygge'],
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getSessionUser(req)
    const { searchParams } = new URL(req.url)
    const query = (searchParams.get('q') || '').trim()
    const type = searchParams.get('type') || 'all'

    if (!query) {
      return NextResponse.json({
        pins: [],
        boards: [],
        people: [],
        guidedTags: ['Home Decor', 'Minimalism', 'Cocktails', 'Architecture', 'Art', 'Typography'],
      })
    }

    // 1. Find matching Pins
    let matchingPins: any[] = []
    if (type === 'all' || type === 'pins') {
      const pins = await prisma.pin.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 30,
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

      matchingPins = pins.map((p) => {
        const userBoards = (p.boardPins || []).map((bp) => bp.board)
        return {
          id: p.id,
          title: p.title,
          description: p.description,
          imageUrl: p.imageUrl,
          imageWidth: p.imageWidth ?? 800,
          imageHeight: p.imageHeight ?? 1000,
          sourceLink: p.sourceLink,
          creator: p.creator,
          isSaved: userBoards.length > 0,
          savedToBoards: userBoards,
          createdAt: p.createdAt,
        }
      })
    }

    // 2. Find matching Boards
    let matchingBoards: any[] = []
    if (type === 'all' || type === 'boards') {
      const boards = await prisma.board.findMany({
        where: {
          AND: [
            {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            },
            currentUser ? { OR: [{ isPrivate: false }, { userId: currentUser.id }] } : { isPrivate: false },
          ],
        },
        take: 15,
        orderBy: { updatedAt: 'desc' },
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
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

      matchingBoards = boards.map((b) => {
        const pinThumbs = b.boardPins.map((bp) => bp.pin.imageUrl)
        const thumbnails = b.coverImageUrl
          ? [b.coverImageUrl, ...pinThumbs.filter((u) => u !== b.coverImageUrl)]
          : pinThumbs

        return {
          id: b.id,
          title: b.title,
          description: b.description,
          pinCount: b._count.boardPins,
          thumbnails,
          owner: b.owner,
          isPrivate: b.isPrivate,
        }
      })
    }

    // 3. Find matching People / Creators
    let matchingPeople: any[] = []
    if (type === 'all' || type === 'people') {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { displayName: { contains: query, mode: 'insensitive' } },
            { about: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 15,
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          about: true,
          _count: {
            select: {
              followers: true,
              createdPins: true,
            },
          },
        },
      })

      // Check following status if signed in
      const followedUserIds = currentUser
        ? new Set(
            (
              await prisma.follow.findMany({
                where: { followerId: currentUser.id },
                select: { followingId: true },
              })
            ).map((f) => f.followingId)
          )
        : new Set()

      matchingPeople = users.map((u) => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        about: u.about,
        followersCount: u._count.followers,
        pinsCount: u._count.createdPins,
        isFollowing: followedUserIds.has(u.id),
      }))
    }

    // 4. Generate guided search tags
    const lowerQ = query.toLowerCase()
    let guidedTags: string[] = []
    for (const [key, tags] of Object.entries(TOPIC_EXPANSIONS)) {
      if (lowerQ.includes(key) || key.includes(lowerQ)) {
        guidedTags = tags
        break
      }
    }
    if (guidedTags.length === 0) {
      guidedTags = ['Modern', 'Aesthetic', 'Ideas', 'Design', 'Minimalist', 'Inspiration']
    }

    return NextResponse.json({
      query,
      type,
      pins: matchingPins,
      boards: matchingBoards,
      people: matchingPeople,
      guidedTags,
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Failed to perform search' }, { status: 500 })
  }
}
