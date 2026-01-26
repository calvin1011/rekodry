import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ProductCard from '@/components/storefront/ProductCard'

export default async function StorePage({ params }: { params: { slug: string } }) {
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

  const { data: products, error: productsError } = await supabase
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
    .order('created_at', { ascending: false })

  if (productsError) {
    console.error('Error fetching products:', productsError)
  }

  const publishedProducts = (products || []).filter(
    (p) => p.items && p.items.quantity_on_hand > 0
  )

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

        {publishedProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-3">No products available</h3>
            <p className="text-slate-400">Check back soon for new items!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {publishedProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                storeSlug={params.slug}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}