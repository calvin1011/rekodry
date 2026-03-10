import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createShipmentAndGetRates, isShippoConfigured } from '@/lib/shippo'

/**
 * POST /api/orders/shipping/rates
 * Body: { order_id: string, weight_lb?: number, length_in?: number, width_in?: number, height_in?: number }
 * Returns Shippo rates for the order. Requires Shippo to be configured (SHIPPO_API_KEY).
 */
export async function POST(request: Request) {
  try {
    if (!isShippoConfigured()) {
      return NextResponse.json(
        { error: 'Shipping labels are not configured. Set SHIPPO_API_KEY in your environment.' },
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
    const weightLb = typeof body?.weight_lb === 'number' ? body.weight_lb : 1
    const lengthIn = typeof body?.length_in === 'number' ? body.length_in : 10
    const widthIn = typeof body?.width_in === 'number' ? body.width_in : 8
    const heightIn = typeof body?.height_in === 'number' ? body.height_in : 6

    if (!orderId) {
      return NextResponse.json({ error: 'order_id is required' }, { status: 400 })
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        customer_addresses (
          address_line1,
          address_line2,
          city,
          state,
          postal_code,
          country
        ),
        customers (full_name)
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const addr = (order as any).customer_addresses
    if (!addr?.address_line1 || !addr?.city || !addr?.state || !addr?.postal_code) {
      return NextResponse.json(
        { error: 'Order is missing a valid shipping address' },
        { status: 400 }
      )
    }

    const { data: store, error: storeError } = await supabase
      .from('store_settings')
      .select('business_name, ships_from_city, ships_from_state, ships_from_zip')
      .eq('user_id', user.id)
      .single()

    if (storeError || !store) {
      return NextResponse.json(
        { error: 'Store settings not found. Configure your store and shipping-from address.' },
        { status: 400 }
      )
    }

    const fromZip = (store as any).ships_from_zip?.trim() || ''
    const fromCity = (store as any).ships_from_city?.trim() || ''
    const fromState = (store as any).ships_from_state?.trim() || ''
    if (!fromZip || !fromCity || !fromState) {
      return NextResponse.json(
        { error: 'Store shipping-from address is incomplete. Set city, state, and ZIP in Store Settings.' },
        { status: 400 }
      )
    }

    const addressFrom = {
      name: (store as any).business_name || 'Store',
      street1: 'Local Address',
      city: fromCity,
      state: fromState,
      zip: fromZip,
      country: 'US',
    }

    const customerName = (order as any).customers?.full_name || 'Customer'
    const addressTo = {
      name: customerName,
      street1: addr.address_line1,
      street2: addr.address_line2 || undefined,
      city: addr.city,
      state: addr.state,
      zip: addr.postal_code,
      country: addr.country || 'US',
    }

    const parcels = [
      {
        length: String(lengthIn),
        width: String(widthIn),
        height: String(heightIn),
        distance_unit: 'in' as const,
        weight: String(weightLb),
        mass_unit: 'lb' as const,
      },
    ]

    const { shipment, error } = await createShipmentAndGetRates({
      addressFrom,
      addressTo,
      parcels,
    })

    if (error || !shipment) {
      return NextResponse.json(
        { error: error || 'Failed to get shipping rates' },
        { status: 400 }
      )
    }

    const rates = (shipment.rates || []).map((r: any) => ({
      object_id: r.object_id,
      amount: r.amount,
      currency: r.currency,
      provider: r.provider,
      servicelevel: r.servicelevel,
      estimated_days: r.estimated_days,
      tracking_url: r.tracking_url,
    }))

    return NextResponse.json({ rates, shipment_id: shipment.object_id })
  } catch (err) {
    console.error('Shipping rates error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
