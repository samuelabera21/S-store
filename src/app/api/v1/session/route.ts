import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  return NextResponse.json({
    authenticated: !!user,
    user: user ?? null,
  })
}

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json()

    const response = NextResponse.json({
      status: 'success',
      activeUsername: username,
    })

    if (username === 'guest') {
      response.cookies.set('pinterest_session_user', 'guest', { path: '/' })
    } else {
      response.cookies.set('pinterest_session_user', username, { path: '/' })
    }

    return response
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
