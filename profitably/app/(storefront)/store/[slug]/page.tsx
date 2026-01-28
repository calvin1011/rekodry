import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProductGrid from '@/components/storefront/ProductGrid'

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: store, error: storeError } = await supabase
    .from('store_settings')
    .select('*')
    .eq('store_slug', slug)
    .eq('is_active', true)
    .single()

  if (storeError || !store) {
    console.error('Store error:', storeError)
    notFound()
  }

  console.log('Store found:', store.store_name, 'User ID:', store.user_id)

  const { data: products, error: productsError } = await supabase
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
    .gt('items.quantity_on_hand', 0)
    .order('created_at', { ascending: false })

  if (productsError) {
    console.error('Products error:', productsError)
  }

  console.log('Products found:', products?.length || 0)
  console.log('Products data:', products)

  const publishedProducts = (products || []).filter((product) => {
    const itemData = Array.isArray(product.items) ? product.items[0] : product.items
    return (
      product.is_published === true &&
      product.slug &&
      itemData &&
      itemData.quantity_on_hand > 0
    )
  })

  console.log('Published products after filter:', publishedProducts.length)

  return (
    <div className="min-h-screen bg-gradient-dark">
      {store.banner_url && (
        <div className="w-full h-48 md:h-64 overflow-hidden">
          <img
            src={store.banner_url}
            alt={store.store_name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">All Products</span>
          </h1>
          {store.store_description && (
            <p className="text-slate-400 max-w-2xl mx-auto">
              {store.store_description}
            </p>
          )}
        </div>

        <ProductGrid products={publishedProducts as any} storeSlug={slug} />
      </div>
    </div>
  )
}