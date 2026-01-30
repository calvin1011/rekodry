import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import WishlistClient from './WishlistClient'

export default async function WishlistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const cookieStore = await cookies()
  const customerId = cookieStore.get('customer_id')?.value

  if (!customerId) {
    redirect(`/store/${slug}/account?tab=wishlist`)
  }

  const adminClient = createAdminClient()

  // Verify store exists
  const { data: store } = await adminClient
    .from('store_settings')
    .select('id, store_name, user_id')
    .eq('store_slug', slug)
    .eq('is_active', true)
    .single()

  if (!store) {
    notFound()
  }

  // Get wishlist items for this customer, filtered to this store's products
  const { data: wishlistItems, error } = await adminClient
    .from('wishlists')
    .select(`
      id,
      created_at,
      products (
        id,
        title,
        slug,
        price,
        compare_at_price,
        is_published,
        user_id,
        product_images (
          image_url,
          position
        ),
        items (
          quantity_on_hand
        )
      )
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching wishlist:', error)
  }

  // Filter to only this store's products
  const storeWishlistItems = (wishlistItems || []).filter(
    (item) => item.products && (item.products as any).user_id === store.user_id
  )

  return (
    <div className="min-h-screen bg-gradient-dark py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Wishlist</h1>
          <p className="text-slate-400">
            {storeWishlistItems.length} item{storeWishlistItems.length !== 1 ? 's' : ''} saved
          </p>
        </div>

        <WishlistClient
          wishlistItems={storeWishlistItems as any}
          storeSlug={slug}
          customerId={customerId}
        />
      </div>
    </div>
  )
}
