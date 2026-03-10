import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

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

    if (!order_id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, payment_status, stripe_payment_intent_id, stripe_refund_id, total')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Order is not in paid status; refund only allowed for paid orders.' },
        { status: 400 }
      )
    }

    if (order.stripe_refund_id) {
      return NextResponse.json({
        received: true,
        order_id: order.id,
        message: 'Refund already created for this order.',
      })
    }

    if (!order.stripe_payment_intent_id) {
      return NextResponse.json(
        { error: 'Order has no Stripe payment; cannot refund.' },
        { status: 400 }
      )
    }

    const amountCents = Math.round((order.total as number) * 100)

    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      amount: amountCents,
      reason: 'requested_by_customer',
    })

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'refund_pending',
        stripe_refund_id: refund.id,
      })
      .eq('id', order.id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating order after refund:', updateError)
      return NextResponse.json(
        { error: 'Refund created in Stripe but failed to update order; sync may be inconsistent.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      received: true,
      order_id: order.id,
      payment_status: 'refund_pending',
    })
  } catch (err) {
    console.error('Refund error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to create refund', message },
      { status: 500 }
    )
  }
}
