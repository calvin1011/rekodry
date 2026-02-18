'use client'

import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import WishlistButton from './WishlistButton'
import StarRating from './StarRating'

interface ProductImage {
  id: string
  image_url: string
  alt_text: string | null
  position: number
}

interface Item {
  id: string
  name: string
  quantity_on_hand: number
}

interface Product {
  id: string
  title: string
  slug: string
  price: number
  compare_at_price: number | null
  items: Item | Item[]
  product_images: ProductImage[]
  averageRating?: number
  totalReviews?: number
}

interface ProductCardProps {
  product: Product
  storeSlug: string
  index: number
  customerId?: string | null
}

export default function ProductCard({ product, storeSlug, index, customerId }: ProductCardProps) {
  const mainImage = product.product_images.find((img) => img.position === 0) || product.product_images[0]
  const itemData = Array.isArray(product.items) ? product.items[0] : product.items
  const isOutOfStock = !itemData || itemData.quantity_on_hand === 0
  const isLowStock = itemData && itemData.quantity_on_hand > 0 && itemData.quantity_on_hand <= 5

  return (
    <Link
      href={`/store/${storeSlug}/products/${product.slug}`}
      className="group glass-dark rounded-xl overflow-hidden hover:shadow-glass-lg transition-smooth animate-slide-up"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="relative aspect-square bg-slate-800 overflow-hidden">
        {mainImage ? (
          <img
            src={mainImage.image_url}
            alt={mainImage.alt_text || product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="px-4 py-2 bg-slate-900 text-slate-100 font-semibold rounded-lg">
              Out of Stock
            </span>
          </div>
        )}

        {isLowStock && !isOutOfStock && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-amber-500 text-white text-xs font-semibold rounded">
            Only {itemData?.quantity_on_hand} left
          </div>
        )}

        {/* Wishlist Button */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {!isLowStock && (
            <WishlistButton
              productId={product.id}
              customerId={customerId || null}
              size="sm"
            />
          )}
        </div>

        {product.compare_at_price && product.compare_at_price > product.price && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500 text-white text-xs font-semibold rounded shadow-lg">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Sale
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-slate-100 font-semibold mb-2 line-clamp-2 group-hover:text-profit-400 transition-colors">
          {product.title}
        </h3>

        {/* Star Rating */}
        {product.averageRating !== undefined && product.averageRating > 0 && (
          <div className="mb-2">
            <StarRating
              rating={product.averageRating}
              size="sm"
              showNumber
              totalReviews={product.totalReviews}
            />
          </div>
        )}

        <div className="flex flex-wrap items-baseline gap-2">
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

        {!isOutOfStock && (
          <div className="mt-3 text-xs text-slate-400">
            {itemData?.quantity_on_hand} available
          </div>
        )}
      </div>
    </Link>
  )
}