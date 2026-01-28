import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { storeSlug, name, email, orderNumber, subject, message } = await request.json()

    if (!name || !email || !subject || !message || !storeSlug) {
      return NextResponse.json({ error: 'Please fill in all required fields' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get store owner's user_id
    const { data: store } = await supabase
      .from('store_settings')
      .select('user_id')
      .eq('store_slug', storeSlug)
      .single()

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Create customer message
    const { error } = await supabase
      .from('customer_messages')
      .insert({
        user_id: store.user_id,
        customer_name: name,
        customer_email: email,
        order_number: orderNumber || null,
        subject,
        message,
        status: 'new',
      })

    if (error) {
      console.error('Error creating customer message:', error)
      return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
