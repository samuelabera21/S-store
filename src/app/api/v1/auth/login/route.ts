import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { emailOrUsername, password } = await req.json()

    if (!emailOrUsername || !password) {
      return NextResponse.json(
        { error: 'Please provide both email/username and password' },
        { status: 400 }
      )
    }

    const trimmed = emailOrUsername.trim().toLowerCase()

    // Find user by either email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: trimmed }, { username: trimmed }],
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "The email or username you entered doesn't belong to any account." },
        { status: 401 }
      )
    }

    // Verify hashed password
    const isValid = verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: "The password you entered is incorrect. Please try again." },
        { status: 401 }
      )
    }

    const response = NextResponse.json({
      message: 'Logged in successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    })

    // Set session cookie
    response.cookies.set('pinterest_session_user', user.username, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Failed to log in' }, { status: 500 })
  }
}
