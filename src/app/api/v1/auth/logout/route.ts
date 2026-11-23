import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' })

  // Clear cookie
  response.cookies.set('pinterest_session_user', 'guest', {
    path: '/',
    httpOnly: true,
    maxAge: 0,
  })

  return response
}
