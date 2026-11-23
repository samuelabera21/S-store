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

    if (!user) {
      return NextResponse.json({ note: null })
    }

    const boardPin = await prisma.boardPin.findFirst({
      where: { pinId: id, userId: user.id },
      select: { note: true },
    })

    return NextResponse.json({ note: boardPin?.note || null })
  } catch (error) {
    console.error('Error fetching pin note:', error)
    return NextResponse.json({ error: 'Failed to fetch note' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getSessionUser(req)

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { note } = await req.json()

    // Find if user saved this pin
    const userBoardPins = await prisma.boardPin.findMany({
      where: { pinId: id, userId: user.id },
    })

    if (userBoardPins.length === 0) {
      return NextResponse.json(
        { error: 'You must save this pin to a board before adding a note to self' },
        { status: 400 }
      )
    }

    const trimmedNote = typeof note === 'string' ? note.trim().slice(0, 1000) : null

    // Update note across user's saves for this pin
    await prisma.boardPin.updateMany({
      where: { pinId: id, userId: user.id },
      data: { note: trimmedNote },
    })

    return NextResponse.json({
      success: true,
      note: trimmedNote,
      message: 'Note saved successfully',
    })
  } catch (error) {
    console.error('Error saving pin note:', error)
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getSessionUser(req)

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    await prisma.boardPin.updateMany({
      where: { pinId: id, userId: user.id },
      data: { note: null },
    })

    return NextResponse.json({
      success: true,
      note: null,
      message: 'Note deleted',
    })
  } catch (error) {
    console.error('Error deleting pin note:', error)
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }
}
