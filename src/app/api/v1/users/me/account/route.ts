import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getSessionUser, hashPassword, verifyPassword } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ account })
  } catch (error) {
    console.error('Error fetching account settings:', error)
    return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req)
    if (!sessionUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
    })

    if (!fullUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { email, currentPassword, newPassword } = await req.json()

    // 1. Email Update
    if (email && email.trim().toLowerCase() !== fullUser.email.toLowerCase()) {
      const sanitizedEmail = email.trim().toLowerCase()
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(sanitizedEmail)) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
      }

      const existing = await prisma.user.findUnique({
        where: { email: sanitizedEmail },
      })
      if (existing && existing.id !== fullUser.id) {
        return NextResponse.json({ error: 'Email address is already in use' }, { status: 400 })
      }

      await prisma.user.update({
        where: { id: fullUser.id },
        data: { email: sanitizedEmail },
      })
    }

    // 2. Password Update
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to set a new password' },
          { status: 400 }
        )
      }

      const isCurrentValid = verifyPassword(currentPassword, fullUser.passwordHash)
      if (!isCurrentValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }

      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters long' },
          { status: 400 }
        )
      }

      const newHash = hashPassword(newPassword)
      await prisma.user.update({
        where: { id: fullUser.id },
        data: { passwordHash: newHash },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Account updated successfully',
    })
  } catch (error) {
    console.error('Error updating account:', error)
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 })
  }
}
