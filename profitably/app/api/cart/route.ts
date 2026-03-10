import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { CartItem } from '@/lib/cart-context'

const CART_KEY = 'customer_id'

function getCustomerId(cookieStore: Awaited<ReturnType<typeof cookies>>): string | null {
  return cookieStore.get(CART_KEY)?.value ?? null
}

/** GET /api/cart?store_slug=... — returns synced cart for logged-in customer, or empty + loggedIn: false */
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const customerId = getCustomerId(cookieStore)
    const { searchParams } = new URL(request.url)
    const storeSlug = searchParams.get('store_slug')?.trim()

    if (!storeSlug) {
      return NextResponse.json({ error: 'store_slug required' }, { status: 400 })
    }

    if (!customerId) {
      return NextResponse.json({ items: [], loggedIn: false })
    }

    const supabase = createAdminClient()

    const { data: store, error: storeError } = await supabase
      .from('store_settings')
      .select('user_id')
      .eq('store_slug', storeSlug)
      .eq('is_active', true)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ items: [], loggedIn: true })
    }

    const { data: rows, error: cartError } = await supabase
      .from('customer_cart')
      .select('product_id, quantity')
      .eq('customer_id', customerId)
      .eq('store_slug', storeSlug)

    if (cartError) {
      console.error('Cart fetch error:', cartError)
      return NextResponse.json({ items: [], loggedIn: true })
    }

    if (!rows?.length) {
      return NextResponse.json({ items: [], loggedIn: true })
    }

    const productIds = rows.map((r) => r.product_id)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        title,
        price,
        product_images ( image_url, position ),
        items ( quantity_on_hand )
      `)
      .in('id', productIds)
      .eq('user_id', store.user_id)
      .eq('is_published', true)

    if (productsError || !products?.length) {
      return NextResponse.json({ items: [], loggedIn: true })
    }

    const quantityByProductId = Object.fromEntries(
      rows.map((r) => [r.product_id, r.quantity])
    )

    const items: CartItem[] = products
      .filter((p) => quantityByProductId[p.id] != null)
      .map((p) => {
        const quantity = quantityByProductId[p.id] ?? 1
        const images = Array.isArray(p.product_images) ? p.product_images : [p.product_images]
        const sorted = images.filter(Boolean).sort((a: { position: number }, b: { position: number }) => a.position - b.position)
        const firstImage = sorted[0] as { image_url: string } | undefined
        const itemData = Array.isArray(p.items) ? p.items[0] : p.items
        const maxQuantity = (itemData as { quantity_on_hand?: number } | undefined)?.quantity_on_hand ?? 0
        return {
          product_id: p.id,
          title: p.title,
          price: p.price,
          quantity: Math.min(quantity, maxQuantity || quantity),
          image_url: firstImage?.image_url ?? '',
          max_quantity: maxQuantity,
        }
      })
      .filter((i) => i.max_quantity > 0)

    return NextResponse.json({ items, loggedIn: true })
  } catch (e) {
    console.error('Cart GET error:', e)
    return NextResponse.json({ items: [], loggedIn: false })
  }
}

/** POST /api/cart — body: { store_slug, items: [{ product_id, quantity }] }. Saves cart for logged-in customer. */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const customerId = getCustomerId(cookieStore)

    if (!customerId) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    const body = await request.json()
    const storeSlug = body?.store_slug?.trim()
    const rawItems = Array.isArray(body?.items) ? body.items : []

    if (!storeSlug) {
      return NextResponse.json({ error: 'store_slug required' }, { status: 400 })
    }

    const items = rawItems
      .filter((i: { product_id?: string; quantity?: number }) => i?.product_id && Number(i?.quantity) > 0)
      .map((i: { product_id: string; quantity: number }) => ({
        customer_id: customerId,
        store_slug: storeSlug,
        product_id: i.product_id,
        quantity: Math.max(1, Math.floor(Number(i.quantity))),
      }))

    const supabase = createAdminClient()

    const { error: deleteError } = await supabase
      .from('customer_cart')
      .delete()
      .eq('customer_id', customerId)
      .eq('store_slug', storeSlug)

    if (deleteError) {
      console.error('Cart delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to save cart' }, { status: 500 })
    }

    if (items.length > 0) {
      const { error: insertError } = await supabase
        .from('customer_cart')
        .insert(items)

      if (insertError) {
        console.error('Cart insert error:', insertError)
        return NextResponse.json({ error: 'Failed to save cart' }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Cart POST error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
