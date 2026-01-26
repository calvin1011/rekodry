import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProductDetailClient from '@/components/storefront/ProductDetailClient'

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string; productSlug: string }
}) {
  const supabase = await createClient()

  const { data: store, error: storeError } = await supabase
    .from('store_settings')
    .select('*')
    .eq('store_slug', params.slug)
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
    .eq('slug', params.productSlug)
    .eq('is_published', true)
    .single()

  if (productError || !product) {
    notFound()
  }

  const { data: relatedProducts } = await supabase
    .from('products')
    .select(`
      *,
      items (
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
    .limit(4)

  return (
    <ProductDetailClient
      product={product}
      store={store}
      storeSlug={params.slug}
      relatedProducts={relatedProducts || []}
    />
  )
}