import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import SuccessClient from '@/components/storefront/SuccessClient'

export default async function CheckoutSuccessPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ session_id?: string }>
}) {
  const { slug } = await params
  const { session_id } = await searchParams
  const supabase = createAdminClient()

  const { data: store, error: storeError } = await supabase
    .from('store_settings')
    .select('store_name')
    .eq('store_slug', slug)
    .eq('is_active', true)
    .single()

  if (storeError || !store) {
    redirect(`/store/${slug}`)
  }

  if (!session_id) {
    redirect(`/store/${slug}`)
  }

  // Fetch order details by Stripe session ID
  const { data: orderData } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      total,
      subtotal,
      shipping_cost,
      status,
      created_at,
      order_items (
        id,
        title,
        price,
        quantity,
        subtotal
      ),
      customer_addresses!shipping_address_id (
        address_line1,
        address_line2,
        city,
        state,
        postal_code
      )
    `)
    .eq('stripe_checkout_session_id', session_id)
    .single()

  // Transform the data to match the expected format
  const order = orderData ? {
    ...orderData,
    customer_addresses: orderData.customer_addresses || null
  } : null

  return (
    <SuccessClient
      storeSlug={slug}
      storeName={store.store_name}
      sessionId={session_id}
      order={order as any}
    />
  )
}