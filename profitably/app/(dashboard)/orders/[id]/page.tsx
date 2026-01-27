import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import OrderDetailClient from './OrderDetailClient'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers (
        id,
        email,
        full_name,
        phone
      ),
      customer_addresses (
        id,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country
      ),
      order_items (
        id,
        title,
        price,
        quantity,
        subtotal,
        sku,
        products (
          id,
          slug,
          product_images (
            image_url,
            position
          )
        )
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !order) {
    notFound()
  }

  return <OrderDetailClient order={order} />
}