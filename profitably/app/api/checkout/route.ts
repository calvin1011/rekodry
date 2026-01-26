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
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { items, store_slug } = body

    console.log('=== CHECKOUT REQUEST ===')
    console.log('User:', user.email)
    console.log('Items:', JSON.stringify(items, null, 2))
    console.log('Store slug:', store_slug)

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 })
    }

    if (!store_slug) {
      return NextResponse.json({ error: 'Store slug required' }, { status: 400 })
    }

    const { data: store, error: storeError } = await supabase
      .from('store_settings')
      .select('*')
      .eq('store_slug', store_slug)
      .eq('is_active', true)
      .single()

    if (storeError || !store) {
      console.error('Store error:', storeError)
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    console.log('Store found:', store.store_name, 'Owner:', store.user_id)

    const productIds = items.map((item: { product_id: string }) => item.product_id)
    console.log('Looking for product IDs:', productIds)

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        items (
          id,
          name,
          quantity_on_hand
        )
      `)
      .in('id', productIds)
      .eq('user_id', store.user_id)
      .eq('is_published', true)

    console.log('Products query error:', productsError)
    console.log('Products found:', products?.length || 0)
    console.log('Products data:', JSON.stringify(products, null, 2))

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return NextResponse.json({ error: 'Failed to fetch products: ' + productsError.message }, { status: 500 })
    }

    if (!products || products.length === 0) {
      console.error('No products found for IDs:', productIds)
      return NextResponse.json({ error: 'No products found' }, { status: 404 })
    }

    const lineItems = []
    let subtotal = 0

    for (const cartItem of items) {
      const product = products.find((p) => p.id === cartItem.product_id)

      if (!product) {
        console.error(`Product not found: ${cartItem.product_id}`)
        return NextResponse.json({
          error: `Product not found: ${cartItem.product_id}`
        }, { status: 404 })
      }

      const itemData = Array.isArray(product.items) ? product.items[0] : product.items

      console.log('Checking stock:', {
        productId: product.id,
        title: product.title,
        itemData,
        requestedQty: cartItem.quantity
      })

      if (!itemData) {
        console.error('No item data for product:', product.title)
        return NextResponse.json({
          error: `No inventory data for ${product.title}`
        }, { status: 400 })
      }

      if (itemData.quantity_on_hand < cartItem.quantity) {
        console.error('Insufficient stock:', {
          title: product.title,
          available: itemData.quantity_on_hand,
          requested: cartItem.quantity
        })
        return NextResponse.json({
          error: `Insufficient stock for ${product.title}. Only ${itemData.quantity_on_hand} available.`
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

    console.log('Creating Stripe session...')
    console.log('Line items:', JSON.stringify(lineItems, null, 2))

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

    console.log('Stripe session created:', session.id)
    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('=== CHECKOUT ERROR ===')
    console.error(error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}