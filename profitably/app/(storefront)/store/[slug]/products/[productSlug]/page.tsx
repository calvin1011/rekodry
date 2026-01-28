import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProductDetailClient from '@/components/storefront/ProductDetailClient'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>
}) {
  const { slug, productSlug } = await params
  const supabase = await createClient()

  const { data: store, error: storeError } = await supabase
    .from('store_settings')
    .select('*')
    .eq('store_slug', slug)
    .eq('is_active', true)
    .single()

  if (storeError || !store) {
    notFound()
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .select(`
      *,
      items (
        id,
        name,
        quantity_on_hand,
        category
      ),
      product_images (
        id,
        image_url,
        alt_text,
        position
      )
    `)
    .eq('user_id', store.user_id)
    .eq('slug', productSlug)
    .eq('is_published', true)
    .single()

  if (productError || !product) {
    notFound()
  }

  const { data: relatedProductsRaw } = await supabase
    .from('products')
    .select(`
      *,
      items!inner (
        id,
        name,
        quantity_on_hand
      ),
      product_images (
        id,
        image_url,
        alt_text,
        position
      )
    `)
    .eq('user_id', store.user_id)
    .eq('is_published', true)
    .neq('id', product.id)
    .gt('items.quantity_on_hand', 0)
    .limit(4)

  // Filter out products without slugs or with zero stock
  const relatedProducts = (relatedProductsRaw || []).filter((p) => {
    const itemData = Array.isArray(p.items) ? p.items[0] : p.items
    return p.slug && itemData && itemData.quantity_on_hand > 0
  })

  return (
    <ProductDetailClient
      product={product}
      store={store}
      storeSlug={slug}
      relatedProducts={relatedProducts || []}
    />
  )
}