import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { title, description, isPrivate, initialPinId } = await req.json()

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Board title is required' }, { status: 400 })
    }

    // Atomic transaction: Create board and optionally attach initial pin
    const result = await prisma.$transaction(async (tx) => {
      const board = await tx.board.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          isPrivate: Boolean(isPrivate),
          userId: user.id,
        },
      })

      if (initialPinId) {
        await tx.boardPin.create({
          data: {
            boardId: board.id,
            pinId: initialPinId,
            userId: user.id,
          },
        })
      }

      return board
    })

    return NextResponse.json(
      {
        status: 'success',
        board: {
          id: result.id,
          title: result.title,
          isPrivate: result.isPrivate,
          hasInitialPin: Boolean(initialPinId),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating board:', error)
    return NextResponse.json({ error: 'Failed to create board' }, { status: 500 })
  }
}
