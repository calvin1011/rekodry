import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OrdersClient from './OrdersClient'

export default async function OrdersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: orders, error: ordersError } = await supabase
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
          slug
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (ordersError) {
    console.error('Error fetching orders:', ordersError)
  }

  return <OrdersClient initialOrders={orders || []} />
}