'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { resend } from '@/lib/resend'
// Import from the new utils file
import { signToken, verifyToken, COOKIE_NAME } from './utils'

export async function trackOrder(storeSlug: string, prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const orderNumber = formData.get('orderNumber') as string

  if (!email || !orderNumber) {
    return { error: 'Please provide both email and order number' }
  }

  const supabase = await createClient()

  const { data: store } = await supabase
    .from('store_settings')
    .select('id, user_id')
    .eq('store_slug', storeSlug)
    .single()

  if (!store) return { error: 'Store not found' }

  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, 
      order_number,
      customers!inner (email)
    `)
    .eq('order_number', orderNumber)
    .eq('customers.email', email)
    .eq('user_id', store.user_id)
    .single()

  if (!order) {
    return { error: 'Order not found. Please check your details.' }
  }

  const token = signToken({ orderId: order.id, accessType: 'single_order' }, 60)

  const cookieStore = await cookies()
  cookieStore.set(`${COOKIE_NAME}_guest`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60
  })

  return redirect(`/store/${storeSlug}/portal/orders/${order.id}`)
}

export async function sendLoginLink(storeSlug: string, prevState: any, formData: FormData) {
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Email is required' }
  }

  const supabase = await createClient()

  const { data: store } = await supabase
    .from('store_settings')
    .select('user_id, store_name')
    .eq('store_slug', storeSlug)
    .single()

  if (!store) return { error: 'Store not found' }

  const { data: customer } = await supabase
    .from('customers')
    .select('id, email')
    .eq('email', email)
    .single()

  if (customer) {
    const token = signToken({
      customerId: customer.id,
      email: customer.email,
      storeId: store.user_id,
      accessType: 'full_access'
    }, 30)

    // Fallback URL construction for email
    const headersList = await import('next/headers').then(mod => mod.headers())
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const magicLink = `${protocol}://${host}/store/${storeSlug}/portal/verify?token=${token}`

    if (resend) {
      try {
        await resend.emails.send({
          from: 'Profitably <noreply@resend.dev>',
          to: email,
          subject: `Login to ${store.store_name} Customer Portal`,
          html: `
            <div style="font-family: sans-serif; max-w-md; margin: 0 auto;">
              <h2>Login to ${store.store_name}</h2>
              <p>Click the link below to access your order history and account.</p>
              <a href="${magicLink}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                Access Customer Portal
              </a>
              <p style="color: #666; font-size: 14px;">This link expires in 30 minutes.</p>
            </div>
          `
        })
      } catch (e) {
        console.error('Failed to send email:', e)
        return { error: 'Failed to send login email. Please try again.' }
      }
    } else {
      console.log('Resend not configured. Magic Link:', magicLink)
    }
  }

  return { success: true, message: 'If an account exists, a login link has been sent.' }
}

export async function logout(storeSlug: string) {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
  cookieStore.delete(`${COOKIE_NAME}_guest`)
  redirect(`/store/${storeSlug}/portal/login`)
}

export async function getCustomerSession() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(COOKIE_NAME)?.value

  if (sessionToken) {
    const payload = verifyToken(sessionToken)
    if (payload && payload.accessType === 'full_access') {
      return payload
    }
  }
  return null
}

export async function getGuestSession() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(`${COOKIE_NAME}_guest`)?.value

  if (sessionToken) {
    const payload = verifyToken(sessionToken)
    if (payload && payload.accessType === 'single_order') {
      return payload
    }
  }
  return null
}