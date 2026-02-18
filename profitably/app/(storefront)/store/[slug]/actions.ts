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

// Sign in or sign up with email: creates a customer if none exists (so wishlist etc. work before first order)
export async function loginWithEmail(storeSlug: string, prevState: any, formData: FormData) {
  const rawEmail = formData.get('email') as string
  const rawName = formData.get('full_name') as string | null
  const email = rawEmail?.trim().toLowerCase()
  const fullName = rawName?.trim() || null
  const redirectToRaw = formData.get('redirectTo') as string | null
  const redirectTo = redirectToRaw?.startsWith(`/store/${storeSlug}`)
    ? redirectToRaw
    : `/store/${storeSlug}/account`

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

  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id, email')
    .ilike('email', email)
    .single()

  let customer = existingCustomer

  if (!customer) {
    const { data: newCustomer, error: createErr } = await supabase
      .from('customers')
      .insert({
        email,
        full_name: fullName || email.split('@')[0],
        phone: null,
      })
      .select('id, email')
      .single()

    if (createErr || !newCustomer) {
      console.error('Error creating customer:', createErr)
      return { error: 'Could not create account. Please try again.' }
    }
    customer = newCustomer
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
  cookieStore.set('customer_id', customer.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 // 7 days
  })

  redirect(redirectTo)
}

export async function logout(storeSlug: string) {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
  cookieStore.delete('customer_id')
  redirect(`/store/${storeSlug}`)
}

// Get current session
export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) return null
  return verifyToken(token)
}