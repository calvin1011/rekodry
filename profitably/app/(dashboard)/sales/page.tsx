import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SalesClient from '@/app/(dashboard)/sales/SalesClient'

export default async function SalesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // fetch sales from database with item details
  const { data: sales, error: salesError } = await supabase
    .from('sales')
    .select(`
      *,
      items (
        id,
        name,
        purchase_price,
        category,
        image_url
      )
    `)
    .eq('user_id', user.id)
    .order('sale_date', { ascending: false })

  // fetch items for the sale modal
  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('id, name, purchase_price, quantity_on_hand, category')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .gt('quantity_on_hand', 0)
    .order('name', { ascending: true })

  if (salesError) {
    console.error('Error fetching sales:', salesError)
  }

  if (itemsError) {
    console.error('Error fetching items:', itemsError)
  }

  return <SalesClient initialSales={sales || []} items={items || []} />
}