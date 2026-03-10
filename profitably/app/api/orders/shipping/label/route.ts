import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { purchaseLabel, isEasyPostConfigured } from '@/lib/easypost'
import { resend, resendTrackingFromEmail } from '@/lib/resend'
import { getShippingNotificationEmailHtml } from '@/lib/email-templates'

/**
 * POST /api/orders/shipping/label
 * Body: { order_id: string, rate_object_id: string, shipment_id: string }
 * Purchases an EasyPost label for the selected rate, updates the order with tracking, and sends shipping email.
 */
export async function POST(request: Request) {
  try {
    if (!isEasyPostConfigured()) {
      return NextResponse.json(
        { error: 'Shipping labels are not configured. Set EASYPOST_API_KEY in your environment.' },
        { status: 503 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const orderId = body?.order_id
    const rateObjectId = body?.rate_object_id
    const shipmentId = body?.shipment_id

    if (!orderId || !rateObjectId || !shipmentId) {
      return NextResponse.json(
        { error: 'order_id, rate_object_id, and shipment_id are required' },
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
        customers ( email, full_name )
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const raw = order as unknown as {
      order_number: string
      fulfillment_status: string | null
      tracking_number: string | null
      customers: { email: string; full_name: string } | { email: string; full_name: string }[]
    }
    const customer = Array.isArray(raw.customers) ? raw.customers[0] : raw.customers

    const { transaction, error } = await purchaseLabel({
      shipmentId,
      rateId: rateObjectId,
      labelFileType: 'PDF',
    })

    if (error || !transaction) {
      return NextResponse.json(
        { error: error || 'Failed to purchase label' },
        { status: 400 }
      )
    }

    const trackingNumber = transaction.tracking_number ?? null
    const labelUrl = transaction.label_url ?? null
    const trackingUrlProvider = transaction.tracking_url_provider ?? null
    const carrier = transaction.rate?.provider ?? 'Carrier'

    const updateData: {
      tracking_number: string | null
      tracking_carrier: string | null
      tracking_url: string | null
      fulfillment_status: string
      shipped_at: string
    } = {
      tracking_number: trackingNumber,
      tracking_carrier: carrier,
      tracking_url: trackingUrlProvider,
      fulfillment_status: 'shipped',
      shipped_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order after label purchase:', updateError)
      return NextResponse.json(
        { error: 'Label purchased but order update failed', label_url: labelUrl },
        { status: 500 }
      )
    }

    const shouldSendEmail = trackingNumber && !raw.tracking_number
    if (shouldSendEmail && resend && customer) {
      const { data: storeSettings } = await supabase
        .from('store_settings')
        .select('store_name,business_email')
        .eq('user_id', user.id)
        .single()

      try {
        await resend.emails.send({
          from: resendTrackingFromEmail,
          to: customer.email,
          replyTo: storeSettings?.business_email || undefined,
          subject: `Your Order Has Shipped - ${raw.order_number}`,
          html: getShippingNotificationEmailHtml({
            orderNumber: raw.order_number,
            customerName: customer.full_name,
            trackingNumber,
            trackingCarrier: carrier,
            trackingUrl: trackingUrlProvider || undefined,
            storeName: storeSettings?.store_name || 'Store',
          }),
        })
      } catch (emailErr) {
        console.error('Shipping notification email error:', emailErr)
      }
    }

    return NextResponse.json({
      label_url: labelUrl,
      tracking_number: trackingNumber,
      tracking_url: trackingUrlProvider,
      carrier,
    })
  } catch (err) {
    console.error('Shipping label error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
