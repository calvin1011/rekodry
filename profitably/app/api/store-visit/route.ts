import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 20
const VISIT_COOKIE_NAME = 'store_visit_sid'

// In-memory rate limit: key -> { count, resetAt }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return '127.0.0.1'
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry) return false
  if (now >= entry.resetAt) {
    rateLimitMap.delete(ip)
    return false
  }
  return entry.count >= RATE_LIMIT_MAX
}

function recordRateLimit(ip: string): void {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return
  }
  if (now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return
  }
  entry.count += 1
}

function hashVisitorKey(ip: string, cookieValue: string): string {
  return crypto.createHash('sha256').update(ip + cookieValue).digest('hex')
}

function getTodayUtc(): string {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  const day = String(now.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await request.json().catch(() => ({}))
    const store_slug = typeof body?.store_slug === 'string' ? body.store_slug.trim() : ''
    if (!store_slug || !SLUG_REGEX.test(store_slug)) {
      return NextResponse.json({ error: 'Invalid store' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: store, error: storeError } = await admin
      .from('store_settings')
      .select('store_slug')
      .eq('store_slug', store_slug)
      .eq('is_active', true)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    const cookieStore = await cookies()
    let visitSid = cookieStore.get(VISIT_COOKIE_NAME)?.value ?? ''
    if (!visitSid) {
      visitSid = crypto.randomBytes(16).toString('hex')
      cookieStore.set(VISIT_COOKIE_NAME, visitSid, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
      })
    }

    const visitorKeyHash = hashVisitorKey(ip, visitSid)
    const visitedDate = getTodayUtc()

    const { error: insertError } = await admin.from('store_visits').upsert(
      {
        store_slug,
        visitor_key_hash: visitorKeyHash,
        visited_date: visitedDate,
      },
      {
        onConflict: 'store_slug,visitor_key_hash,visited_date',
        ignoreDuplicates: true,
      }
    )

    if (insertError) {
      console.error('Store visit insert error:', insertError.message)
      return NextResponse.json({ error: 'Failed to record visit' }, { status: 500 })
    }

    recordRateLimit(ip)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('Store visit error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
