import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const order_id = body?.order_id
    const resolution = typeof body?.resolution === 'string' ? body.resolution.trim().toLowerCase() : ''

    if (!order_id || !resolution) {
      return NextResponse.json(
        { error: 'Order ID and resolution are required' },
        { status: 400 }
      )
    }

    const validResolutions = ['damaged', 'restock']
    if (!validResolutions.includes(resolution)) {
      return NextResponse.json(
        { error: 'Invalid resolution; use "damaged" or "restock".' },
        { status: 400 }
      )
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, payment_status')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.payment_status !== 'refund_pending') {
      return NextResponse.json(
        { error: 'Order is not in refund_pending status.' },
        { status: 400 }
      )
    }

    if (resolution === 'restock') {
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('item_id, quantity')
        .eq('order_id', order_id)

      if (itemsError) {
        console.error('Error fetching order items:', itemsError)
        return NextResponse.json(
          { error: 'Failed to load order items' },
          { status: 500 }
        )
      }

      if (orderItems?.length) {
        for (const row of orderItems) {
          const itemId = row.item_id
          const qty = Number(row.quantity) || 0
          if (!itemId || qty <= 0) continue

          const { data: item, error: itemErr } = await supabase
            .from('items')
            .select('id, quantity_on_hand, quantity_sold')
            .eq('id', itemId)
            .single()

          if (itemErr || !item) continue

          const newOnHand = (Number(item.quantity_on_hand) || 0) + qty
          const newSold = Math.max(0, (Number(item.quantity_sold) || 0) - qty)

          await supabase
            .from('items')
            .update({
              quantity_on_hand: newOnHand,
              quantity_sold: newSold,
            })
            .eq('id', itemId)
        }

        const itemIds = (orderItems || []).map((r) => r.item_id).filter(Boolean)
        if (itemIds.length > 0) {
          await supabase
            .from('products')
            .update({ is_published: true, published_at: new Date().toISOString() })
            .in('item_id', itemIds)
            .eq('user_id', user.id)
            .eq('is_published', false)
        }
      }
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'refunded',
        refunded_at: new Date().toISOString(),
        refund_resolution: resolution,
      })
      .eq('id', order_id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating order after resolve:', updateError)
      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      received: true,
      order_id,
      payment_status: 'refunded',
      refund_resolution: resolution,
    })
  } catch (err) {
    console.error('Resolve refund error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
