import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { stripe, formatAmountForStripe } from '@/lib/stripe'

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

    const body = await request.json()
    const { items, store_slug, shipping_address } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 })
    }

    if (!store_slug) {
      return NextResponse.json({ error: 'Store slug required' }, { status: 400 })
    }

    if (!shipping_address || !shipping_address.line1 || !shipping_address.city || !shipping_address.state || !shipping_address.postal_code || !shipping_address.country) {
      return NextResponse.json({ error: 'Complete shipping address required' }, { status: 400 })
    }

    const { data: store, error: storeError } = await supabase
      .from('store_settings')
      .select('*')
      .eq('store_slug', store_slug)
      .eq('is_active', true)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    const productIds = items.map((item: { product_id: string }) => item.product_id)

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        items (
          id,
          quantity_on_hand
        )
      `)
      .in('id', productIds)
      .eq('user_id', store.user_id)
      .eq('is_published', true)

    if (productsError || !products) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    const lineItems = []
    let subtotal = 0

    for (const cartItem of items) {
      const product = products.find((p) => p.id === cartItem.product_id)

      if (!product) {
        return NextResponse.json({ error: `Product ${cartItem.product_id} not found` }, { status: 404 })
      }

      const itemData = Array.isArray(product.items) ? product.items[0] : product.items

      if (!itemData || itemData.quantity_on_hand < cartItem.quantity) {
        return NextResponse.json({
          error: `Insufficient stock for ${product.title}`
        }, { status: 400 })
      }

      subtotal += product.price * cartItem.quantity

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.title,
            description: product.description || undefined,
          },
          unit_amount: formatAmountForStripe(product.price),
        },
        quantity: cartItem.quantity,
      })
    }

    const shippingCost = store.free_shipping_threshold && subtotal >= store.free_shipping_threshold
      ? 0
      : store.flat_shipping_rate

    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Shipping',
          },
          unit_amount: formatAmountForStripe(shippingCost),
        },
        quantity: 1,
      })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `${request.headers.get('origin')}/store/${store_slug}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/store/${store_slug}`,
      customer_email: user.email,
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
      metadata: {
        store_id: store.id,
        store_slug: store_slug,
        user_id: store.user_id,
        customer_id: user.id,
        items: JSON.stringify(items),
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}