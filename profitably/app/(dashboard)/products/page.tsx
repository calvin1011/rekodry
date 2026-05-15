import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProductsClient from './ProductsClient'

export default async function ProductsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select(`
      *,
      items (
        id,
        name,
        quantity_on_hand,
        purchase_price,
        category
      ),
      product_images (
        id,
        image_url,
        alt_text,
        position
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: availableItems, error: itemsError } = await supabase
    .from('items')
    .select('id, name, quantity_on_hand, purchase_price, category, sku')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .gt('quantity_on_hand', 0)
    .order('name', { ascending: true })

  if (productsError) {
    console.error('Error fetching products:', productsError)
  }

  if (itemsError) {
    console.error('Error fetching items:', itemsError)
  }

  return (
    <ProductsClient
      initialProducts={products || []}
      availableItems={availableItems || []}
    />
  )
}