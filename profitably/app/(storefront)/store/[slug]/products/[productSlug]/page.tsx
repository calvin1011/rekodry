import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import ProductDetailClient from '@/components/storefront/ProductDetailClient'

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>
}) {
  const { slug, productSlug } = await params
  const supabase = await createClient()
  const adminClient = createAdminClient()
  
  // Get customer session
  const cookieStore = await cookies()
  const customerIdCookie = cookieStore.get('customer_id')?.value || null
  const sessionToken = cookieStore.get('customer_session')?.value || null
  let sessionType: 'customer' | 'guest' | 'none' = customerIdCookie ? 'customer' : 'none'
  let derivedCustomerId: string | null = customerIdCookie

  if (!customerIdCookie && sessionToken) {
    try {
      const payload = JSON.parse(Buffer.from(sessionToken, 'base64').toString())
      if (payload?.exp && Date.now() < payload.exp && payload?.type === 'guest') {
        sessionType = 'guest'
        if (payload?.orderId) {
          const { data: order } = await adminClient
            .from('orders')
            .select('customer_id')
            .eq('id', payload.orderId)
            .single()
          derivedCustomerId = order?.customer_id || null
        }
      } else if (payload?.exp && Date.now() < payload.exp && payload?.type === 'customer') {
        sessionType = 'customer'
        if (payload?.customerId) {
          derivedCustomerId = payload.customerId
        } else if (payload?.email) {
          const { data: customer } = await adminClient
            .from('customers')
            .select('id')
            .ilike('email', payload.email)
            .single()
          derivedCustomerId = customer?.id || null
        }
      }
    } catch {
      sessionType = 'none'
    }
  }

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

  // Fetch average rating for this product
  const { data: reviews } = await adminClient
    .from('reviews')
    .select('rating')
    .eq('product_id', product.id)
    .eq('is_approved', true)

  let averageRating = 0
  let totalReviews = 0
  if (reviews && reviews.length > 0) {
    totalReviews = reviews.length
    averageRating = Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
  }

  return (
    <ProductDetailClient
      product={product}
      store={store}
      storeSlug={slug}
      relatedProducts={relatedProducts || []}
      customerId={derivedCustomerId}
      sessionType={sessionType}
      averageRating={averageRating}
      totalReviews={totalReviews}
    />
  )
}