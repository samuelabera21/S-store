import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password, username, displayName } = await req.json()

    // Validations matching Pinterest rules
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Your password is too short! It must be at least 6 characters.' },
        { status: 400 }
      )
    }

    // Auto-generate or sanitize username
    const cleanUsername = (username || email.split('@')[0])
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 24)

    if (!cleanUsername) {
      return NextResponse.json({ error: 'Please enter a valid username' }, { status: 400 })
    }

    // Check existing email
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })
    if (existingEmail) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Try logging in.' },
        { status: 400 }
      )
    }

    // Check existing username
    const existingUser = await prisma.user.findUnique({
      where: { username: cleanUsername },
    })
    if (existingUser) {
      return NextResponse.json(
        { error: 'That username is taken. Please choose another.' },
        { status: 400 }
      )
    }

    // Hash password securely with NIST-recommended scrypt
    const passwordHash = hashPassword(password)

    // Create user and initial default board
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        username: cleanUsername,
        displayName: displayName || cleanUsername,
        passwordHash,
        avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
        boards: {
          create: {
            title: 'Quick Saves',
            description: 'Pins saved from your home feed',
            isPrivate: false,
          },
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
      },
    })

    const response = NextResponse.json(
      {
        message: 'Account created successfully',
        user: newUser,
      },
      { status: 201 }
    )

    // Set HTTP-only session cookie
    response.cookies.set('pinterest_session_user', newUser.username, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return response
  } catch (error) {
    console.error('Sign up error:', error)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}
