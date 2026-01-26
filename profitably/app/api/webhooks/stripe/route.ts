import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'
import Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {

      const session = event.data.object as any;

    try {
      const supabase = await createClient()

      const metadata = session.metadata
      if (!metadata || !metadata.user_id || !metadata.items) {
        console.error('Missing metadata in session')
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
      }

      const items = JSON.parse(metadata.items)
      const userId = metadata.user_id
      const customerEmail = session.customer_details?.email || session.customer_email
      const shippingAddress = session.shipping_details?.address

      let customerId = null

      if (customerEmail) {
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('email', customerEmail)
          .single()

        if (existingCustomer) {
          customerId = existingCustomer.id
        } else {
          const { data: newCustomer, error: customerError } = await supabase
            .from('customers')
            .insert({
              email: customerEmail,
              full_name: session.shipping_details?.name || 'Customer',
              phone: session.customer_details?.phone || null,
            })
            .select()
            .single()

          if (customerError) {
            console.error('Error creating customer:', customerError)
          } else {
            customerId = newCustomer.id
          }
        }
      }

      if (!customerId) {
        console.error('Failed to get or create customer')
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
      }

      let shippingAddressId = null

      if (shippingAddress) {
        const { data: address, error: addressError } = await supabase
          .from('customer_addresses')
          .insert({
            customer_id: customerId,
            type: 'shipping',
            address_line1: shippingAddress.line1 || '',
            address_line2: shippingAddress.line2 || null,
            city: shippingAddress.city || '',
            state: shippingAddress.state || '',
            postal_code: shippingAddress.postal_code || '',
            country: shippingAddress.country || 'US',
            is_default: true,
          })
          .select()
          .single()

        if (!addressError && address) {
          shippingAddressId = address.id
        }
      }

      const productIds = items.map((item: { product_id: string }) => item.product_id)

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          items (
            id,
            quantity_on_hand,
            quantity_sold
          )
        `)
        .in('id', productIds)

      if (productsError || !products) {
        console.error('Error fetching products:', productsError)
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
      }

      let subtotal = 0
      const orderItemsData = []

      for (const cartItem of items) {
        const product = products.find((p) => p.id === cartItem.product_id)
        if (!product) continue

        const itemSubtotal = product.price * cartItem.quantity
        subtotal += itemSubtotal

        orderItemsData.push({
          product,
          cartItem,
          itemSubtotal,
        })
      }

      const shippingCost = ((session.total_details?.amount_shipping || 0) / 100)
      const total = (session.amount_total || 0) / 100

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: userId,
          customer_id: customerId,
          subtotal,
          shipping_cost: shippingCost,
          tax: 0,
          discount: 0,
          total,
          status: 'paid',
          payment_status: 'paid',
          stripe_payment_intent_id: session.payment_intent as string,
          stripe_checkout_session_id: session.id,
          shipping_address_id: shippingAddressId,
          paid_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (orderError) {
        console.error('Error creating order:', orderError)
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
      }

      const orderItems = []
      const inventoryUpdates = []

      for (const { product, cartItem, itemSubtotal } of orderItemsData) {
        const itemData = Array.isArray(product.items) ? product.items[0] : product.items
        if (!itemData) continue

        orderItems.push({
          order_id: order.id,
          product_id: product.id,
          item_id: product.item_id,
          title: product.title,
          price: product.price,
          quantity: cartItem.quantity,
          subtotal: itemSubtotal,
          sku: product.sku,
        })

        inventoryUpdates.push({
          id: itemData.id,
          newOnHand: itemData.quantity_on_hand - cartItem.quantity,
          newSold: itemData.quantity_sold + cartItem.quantity,
        })
      }

      const { error: orderItemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (orderItemsError) {
        console.error('Error creating order items:', orderItemsError)
        return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 })
      }

      for (const update of inventoryUpdates) {
        const { error: inventoryError } = await supabase
          .from('items')
          .update({
            quantity_on_hand: update.newOnHand,
            quantity_sold: update.newSold,
          })
          .eq('id', update.id)

        if (inventoryError) {
          console.error('Error updating inventory:', inventoryError)
        }
      }

      const { error: customerUpdateError } = await supabase
        .from('customers')
        .update({
          total_orders: supabase.rpc('increment', { x: 1 }),
          total_spent: supabase.rpc('increment', { x: total }),
        })
        .eq('id', customerId)

      if (customerUpdateError) {
        console.error('Error updating customer stats:', customerUpdateError)
      }

      console.log('Order created successfully:', order.id)
      return NextResponse.json({ received: true, order_id: order.id })

    } catch (err) {
      console.error('Error processing webhook:', err)
      return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}