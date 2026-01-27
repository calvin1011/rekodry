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
    const { order_id, fulfillment_status } = body

    if (!order_id || !fulfillment_status) {
      return NextResponse.json(
        { error: 'Order ID and fulfillment status are required' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'shipped', 'delivered', 'fulfilled']
    if (!validStatuses.includes(fulfillment_status)) {
      return NextResponse.json(
        { error: 'Invalid fulfillment status' },
        { status: 400 }
      )
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const updateData: {
      fulfillment_status: string
      shipped_at?: string
      delivered_at?: string
    } = {
      fulfillment_status,
    }

    if (fulfillment_status === 'shipped' || fulfillment_status === 'delivered' || fulfillment_status === 'fulfilled') {
      updateData.shipped_at = new Date().toISOString()
    }

    if (fulfillment_status === 'delivered' || fulfillment_status === 'fulfilled') {
      updateData.delivered_at = new Date().toISOString()
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating order status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 500 }
      )
    }

    return NextResponse.json({ order: updatedOrder })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}