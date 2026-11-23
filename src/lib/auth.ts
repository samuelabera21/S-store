import { NextRequest } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/db'

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':')
    if (!salt || !key) return false
    const keyBuffer = Buffer.from(key, 'hex')
    const derivedKey = crypto.scryptSync(password, salt, 64)
    return crypto.timingSafeEqual(keyBuffer, derivedKey)
  } catch {
    return false
  }
}

export async function getSessionUser(req: NextRequest) {
  const sessionCookie = req.cookies.get('pinterest_session_user')?.value

  if (!sessionCookie || sessionCookie === 'guest') {
    return null
  }

  // Find user by username
  const user = await prisma.user.findUnique({
    where: { username: sessionCookie },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      email: true,
    },
  })

  return user
}
