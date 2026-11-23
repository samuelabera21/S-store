import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        about: true,
        website: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ profile: fullUser })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { displayName, about, website, avatarUrl, username } = await req.json()

    // Validate username if changed
    let newUsername = user.username
    if (username && username.trim().toLowerCase() !== user.username.toLowerCase()) {
      const sanitized = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24)
      if (!sanitized) {
        return NextResponse.json({ error: 'Invalid username format' }, { status: 400 })
      }

      const existing = await prisma.user.findUnique({
        where: { username: sanitized },
      })
      if (existing && existing.id !== user.id) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 400 })
      }
      newUsername = sanitized
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: displayName !== undefined ? displayName.trim() || null : undefined,
        about: about !== undefined ? about.trim() || null : undefined,
        website: website !== undefined ? website.trim() || null : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl.trim() || null : undefined,
        username: newUsername,
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        about: true,
        website: true,
      },
    })

    const response = NextResponse.json({
      message: 'Profile updated successfully',
      profile: updated,
    })

    // Update cookie if username changed
    if (newUsername !== user.username) {
      response.cookies.set('pinterest_session_user', newUsername, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      })
    }

    return response
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
