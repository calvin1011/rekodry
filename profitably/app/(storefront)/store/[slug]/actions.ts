'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const COOKIE_NAME = 'customer_session'

function createToken(payload: any): string {
  return Buffer.from(JSON.stringify({
    ...payload,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  })).toString('base64')
}

function verifyToken(token: string): any | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString())
    if (Date.now() > payload.exp) return null
    return payload
  } catch {
    return null
  }
}

// Track a single order (guest access)
export async function trackOrder(storeSlug: string, prevState: any, formData: FormData) {
  const rawEmail = formData.get('email') as string
  const orderNumber = formData.get('orderNumber') as string
  const email = rawEmail?.trim().toLowerCase()

  if (!email || !orderNumber) {
    return { error: 'Please provide both email and order number' }
  }

  const supabase = createAdminClient()

  const { data: store } = await supabase
    .from('store_settings')
    .select('user_id')
    .eq('store_slug', storeSlug)
    .single()

  if (!store) return { error: 'Store not found' }

  const { data: order } = await supabase
    .from('orders')
    .select('id, customers!inner(email)')
    .eq('order_number', orderNumber)
    .ilike('customers.email', email)
    .eq('user_id', store.user_id)
    .single()

  if (!order) {
    return { error: 'Order not found. Please check your details.' }
  }

  // Create guest session token
  const token = createToken({
    orderId: order.id,
    type: 'guest'
  })

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 // 1 hour
  })

  redirect(`/store/${storeSlug}/orders/${order.id}`)
}

// Login with email (sends "magic link" OR just sets session)
export async function loginWithEmail(storeSlug: string, prevState: any, formData: FormData) {
  const rawEmail = formData.get('email') as string
  const email = rawEmail?.trim().toLowerCase()

  if (!email) {
    return { error: 'Email is required' }
  }

  const supabase = createAdminClient()

  const { data: store } = await supabase
    .from('store_settings')
    .select('user_id, store_name')
    .eq('store_slug', storeSlug)
    .single()

  if (!store) return { error: 'Store not found' }

  // Check if customer exists
  const { data: customer } = await supabase
    .from('customers')
    .select('id, email')
    .ilike('email', email)
    .single()

  if (!customer) {
    return { error: 'No account found with this email. Orders are automatically linked when you checkout.' }
  }

  const token = createToken({
    customerId: customer.id,
    email: customer.email,
    storeId: store.user_id,
    type: 'customer'
  })

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 // 7 days
  })

  redirect(`/store/${storeSlug}/account`)
}

export async function logout(storeSlug: string) {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
  redirect(`/store/${storeSlug}`)
}

// Get current session
export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) return null
  return verifyToken(token)
}