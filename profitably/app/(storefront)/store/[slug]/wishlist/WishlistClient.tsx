'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { useCart } from '@/lib/cart-context'

interface WishlistItem {
  id: string
  created_at: string
  products: {
    id: string
    title: string
    slug: string
    price: number
    compare_at_price: number | null
    is_published: boolean
    user_id: string
    product_images: {
      image_url: string
      position: number
    }[]
    items: {
      quantity_on_hand: number
    } | {
      quantity_on_hand: number
    }[]
  }
}

interface WishlistClientProps {
  wishlistItems: WishlistItem[]
  storeSlug: string
  customerId: string
}

export default function WishlistClient({ wishlistItems: initialItems, storeSlug, customerId }: WishlistClientProps) {
  const [wishlistItems, setWishlistItems] = useState(initialItems)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const { addItem } = useCart()

  const handleRemove = async (wishlistId: string, productId: string) => {
    setRemovingId(wishlistId)
    try {
      const res = await fetch(`/api/wishlist?customerId=${customerId}&productId=${productId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setWishlistItems(prev => prev.filter(item => item.id !== wishlistId))
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error)
    } finally {
      setRemovingId(null)
    }
  }

  const handleAddToCart = (item: WishlistItem) => {
    const product = item.products
    const mainImage = product.product_images.find(img => img.position === 0) || product.product_images[0]
    const itemData = Array.isArray(product.items) ? product.items[0] : product.items
    const maxQuantity = itemData?.quantity_on_hand || 0
    
    addItem({
      product_id: product.id,
      title: product.title,
      price: product.price,
      quantity: 1,
      image_url: mainImage?.image_url || '',
      max_quantity: maxQuantity,
    })
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="glass-dark rounded-2xl p-12 text-center">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-3">Your wishlist is empty</h3>
        <p className="text-slate-400 mb-6">
          Save items you love by clicking the heart icon on products
        </p>
        <Link
          href={`/store/${storeSlug}`}
          className="inline-block px-6 py-3 bg-gradient-profit text-white font-semibold rounded-xl
                   hover:shadow-glow-profit-lg transition-smooth"
        >
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {wishlistItems.map((item) => {
        const product = item.products
        const mainImage = product.product_images.find(img => img.position === 0) || product.product_images[0]
        const itemData = Array.isArray(product.items) ? product.items[0] : product.items
        const isOutOfStock = !itemData || itemData.quantity_on_hand === 0
        const isUnavailable = !product.is_published

        return (
          <div
            key={item.id}
            className="glass-dark rounded-xl overflow-hidden group"
          >
            <Link href={`/store/${storeSlug}/products/${product.slug}`}>
              <div className="relative aspect-square bg-slate-800 overflow-hidden">
                {mainImage ? (
                  <img
                    src={mainImage.image_url}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {(isOutOfStock || isUnavailable) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="px-4 py-2 bg-slate-900 text-slate-100 font-semibold rounded-lg">
                      {isUnavailable ? 'No Longer Available' : 'Out of Stock'}
                    </span>
                  </div>
                )}
              </div>
            </Link>

            <div className="p-4">
              <Link href={`/store/${storeSlug}/products/${product.slug}`}>
                <h3 className="text-slate-100 font-semibold mb-2 line-clamp-2 group-hover:text-profit-400 transition-colors">
                  {product.title}
                </h3>
              </Link>

              <div className="flex flex-wrap items-baseline gap-2 mb-4">
                {product.compare_at_price && product.compare_at_price > product.price ? (
                  <>
                    <span className="text-slate-500 text-sm line-through">
                      {formatCurrency(product.compare_at_price)}
                    </span>
                    <span className="text-lg font-bold gradient-text">
                      Now {formatCurrency(product.price)}
                    </span>
                  </>
                ) : (
                  <span className="text-lg font-bold gradient-text">
                    {formatCurrency(product.price)}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleAddToCart(item)}
                  disabled={isOutOfStock || isUnavailable}
                  className="flex-1 px-4 py-2 bg-gradient-profit text-white font-medium rounded-lg
                           hover:shadow-glow-profit-lg transition-smooth
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => handleRemove(item.id, product.id)}
                  disabled={removingId === item.id}
                  className="px-3 py-2 bg-slate-700 hover:bg-red-500/20 text-slate-300 hover:text-red-400
                           rounded-lg transition-all disabled:opacity-50"
                  title="Remove from wishlist"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
