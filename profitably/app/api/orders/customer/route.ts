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
    const { order_id, customer_id, full_name, phone } = body

    if (!order_id || !customer_id) {
      return NextResponse.json(
        { error: 'Order ID and customer ID are required' },
        { status: 400 }
      )
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, customer_id')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.customer_id !== customer_id) {
      return NextResponse.json(
        { error: 'Customer does not belong to this order' },
        { status: 400 }
      )
    }

    const updatePayload: { full_name?: string; phone?: string | null } = {}
    if (full_name !== undefined) {
      updatePayload.full_name = String(full_name).trim() || null
    }
    if (phone !== undefined) {
      updatePayload.phone = phone === null || phone === '' ? null : String(phone).trim()
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: 'Provide at least full_name or phone to update' },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from('customers')
      .update(updatePayload)
      .eq('id', customer_id)

    if (updateError) {
      console.error('Error updating customer:', updateError)
      return NextResponse.json(
        { error: 'Failed to update customer' },
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
