import { NextRequest, NextResponse } from 'next/server'
// CHANGE THIS IMPORT: Point to ./utils instead of ../actions
import { verifyToken, signToken, COOKIE_NAME } from '../utils'

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL(`/store/${slug}/portal/login?error=Invalid token`, request.url))
  }

  const payload = verifyToken(token)

  if (!payload) {
    return NextResponse.redirect(new URL(`/store/${slug}/portal/login?error=Expired or invalid link`, request.url))
  }

  const sessionToken = signToken({
    ...payload,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000
  }, 7 * 24 * 60)

  const response = NextResponse.redirect(new URL(`/store/${slug}/portal/dashboard`, request.url))

  response.cookies.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60
  })

  return response
}