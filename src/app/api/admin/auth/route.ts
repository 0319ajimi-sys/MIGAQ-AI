import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ADMIN_COOKIE = 'migaq_admin'
const MAX_AGE = 60 * 60 * 8 // 8 hours

export async function POST(request: Request) {
  const { password } = await request.json()

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'パスワードが正しくありません' }, { status: 401 })
  }

  const secret = process.env.ADMIN_SECRET ?? 'fallback-secret'
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: MAX_AGE,
    path: '/',
  })

  return NextResponse.json({ success: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE)
  return NextResponse.json({ success: true })
}
