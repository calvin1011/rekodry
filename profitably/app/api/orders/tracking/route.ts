import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { resend } from '@/lib/resend'
import { getShippingNotificationEmailHtml } from '@/lib/email-templates'

interface Customer {
  email: string
  full_name: string
}

interface OrderWithCustomer {
  id: string
  user_id: string
  order_number: string
  fulfillment_status: string | null
  tracking_number: string | null
  customers: Customer
}

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
    const { order_id, tracking_number, tracking_carrier, tracking_url } = body

    if (!order_id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        order_number,
        fulfillment_status,
        tracking_number,
        customers (
          email,
          full_name
        )
      `)
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const typedOrder = order as unknown as OrderWithCustomer

    const updateData: {
      tracking_number: string | null
      tracking_carrier: string | null
      tracking_url: string | null
      fulfillment_status?: string
      shipped_at?: string
    } = {
      tracking_number: tracking_number || null,
      tracking_carrier: tracking_carrier || null,
      tracking_url: tracking_url || null,
    }

    const shouldSendEmail = tracking_number && !typedOrder.tracking_number

    if (tracking_number && (!typedOrder.fulfillment_status || typedOrder.fulfillment_status === 'pending')) {
      updateData.fulfillment_status = 'shipped'
      updateData.shipped_at = new Date().toISOString()
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating tracking:', updateError)
      return NextResponse.json(
        { error: 'Failed to update tracking information' },
        { status: 500 }
      )
    }

    if (shouldSendEmail && tracking_carrier && resend) {
      const { data: storeSettings } = await supabase
        .from('store_settings')
        .select('store_name')
        .eq('user_id', user.id)
        .single()

      try {
        await resend.emails.send({
          from: 'Rekodry <tracking@rekodry.com',
          to: typedOrder.customers.email,
          subject: `Your Order Has Shipped - ${typedOrder.order_number}`,
          html: getShippingNotificationEmailHtml({
            orderNumber: typedOrder.order_number,
            customerName: typedOrder.customers.full_name,
            trackingNumber: tracking_number,
            trackingCarrier: tracking_carrier,
            trackingUrl: tracking_url || undefined,
            storeName: storeSettings?.store_name || 'Store',
          }),
        })

        console.log('Shipping notification email sent successfully')
      } catch (emailError) {
        console.error('Error sending shipping notification email:', emailError)
      }
    } else if (!resend) {
      console.log('Resend not configured - skipping email notification')
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