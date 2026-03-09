import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      order_id,
      address_id,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country,
    } = body

    if (!order_id || !address_id || !address_line1 || !city || !state || !postal_code || !country) {
      return NextResponse.json(
        { error: 'Order ID, address ID, and full address (line1, city, state, postal code, country) are required' },
        { status: 400 }
      )
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, shipping_address_id')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.shipping_address_id !== address_id) {
      return NextResponse.json(
        { error: 'Address does not belong to this order' },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from('customer_addresses')
      .update({
        address_line1: String(address_line1).trim(),
        address_line2: address_line2 ? String(address_line2).trim() : null,
        city: String(city).trim(),
        state: String(state).trim(),
        postal_code: String(postal_code).trim(),
        country: String(country).trim(),
      })
      .eq('id', address_id)

    if (updateError) {
      console.error('Error updating shipping address:', updateError)
      return NextResponse.json(
        { error: 'Failed to update shipping address' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
