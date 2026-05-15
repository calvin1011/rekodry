'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { formatCurrency } from '@/lib/utils'
import { useCart } from '@/lib/cart-context'
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
  const router = useRouter()
  const { addItem } = useCart()
  const [isHovered, setIsHovered] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  
  const mainImage = product.product_images.find((img) => img.position === 0) || product.product_images[0]
  const secondImage = product.product_images.find((img) => img.position === 1)
  const itemData = Array.isArray(product.items) ? product.items[0] : product.items
  const isOutOfStock = !itemData || itemData.quantity_on_hand === 0
  const isLowStock = itemData && itemData.quantity_on_hand > 0 && itemData.quantity_on_hand <= 3
  const maxQuantity = itemData?.quantity_on_hand ?? 0
  
  const discountPercent = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : 0

  const cartItem = {
    product_id: product.id,
    title: product.title,
    price: product.price,
    quantity: 1,
    image_url: mainImage?.image_url ?? '',
    max_quantity: maxQuantity,
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isOutOfStock) return
    addItem(cartItem)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isOutOfStock) return
    addItem(cartItem)
    router.push(`/store/${storeSlug}/checkout`)
  }

  return (
    <Link
      href={`/store/${storeSlug}/products/${product.slug}`}
      className="group relative flex flex-col bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden 
                 hover:border-slate-700/80 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1
                 transition-all duration-300 animate-slide-up"
      style={{ animationDelay: `${index * 0.04}s` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] bg-slate-800/50 overflow-hidden">
        {/* Main Image */}
        {mainImage ? (
          <motion.img
            src={mainImage.image_url}
            alt={mainImage.alt_text || product.title}
            className="w-full h-full object-cover"
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
            <svg className="w-16 h-16 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Secondary Image on Hover */}
        {secondImage && (
          <motion.img
            src={secondImage.image_url}
            alt={secondImage.alt_text || `${product.title} - alternate view`}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top Left Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {discountPercent > 0 && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold rounded-lg shadow-lg"
            >
              <span>-{discountPercent}%</span>
            </motion.div>
          )}
          {product.averageRating && product.averageRating >= 4.5 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/90 text-amber-950 text-xs font-semibold rounded-lg">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>Top Rated</span>
            </div>
          )}
        </div>

        {/* Top Right - Wishlist */}
        <div className="absolute top-3 right-3 z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isHovered || isLowStock ? 1 : 0, scale: isHovered || isLowStock ? 1 : 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <WishlistButton
              productId={product.id}
              customerId={customerId || null}
              size="sm"
            />
          </motion.div>
        </div>

        {/* Low Stock Badge */}
        {isLowStock && !isOutOfStock && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-500/90 text-white text-xs font-semibold rounded-lg shadow-lg">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            Only {itemData?.quantity_on_hand} left
          </div>
        )}

        {/* Sold Out Overlay */}
        <AnimatePresence>
          {isOutOfStock && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] flex items-center justify-center"
            >
              <div className="px-5 py-2.5 bg-slate-900/90 border border-slate-700 text-slate-200 font-semibold rounded-xl">
                Sold Out
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Add Button - Shows on Hover */}
        {!isOutOfStock && (
          <motion.div 
            className="absolute bottom-3 right-3 z-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.button
              type="button"
              onClick={handleAddToCart}
              whileTap={{ scale: 0.9 }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium shadow-lg transition-colors ${
                addedToCart 
                  ? 'bg-profit-500 text-white' 
                  : 'bg-white/95 text-slate-900 hover:bg-white'
              }`}
            >
              {addedToCart ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Added
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Quick Add
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        {/* Title */}
        <h3 className="text-slate-100 font-medium text-sm leading-snug mb-2 line-clamp-2 group-hover:text-profit-400 transition-colors">
          {product.title}
        </h3>

        {/* Rating */}
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

        {/* Price Section */}
        <div className="mt-auto pt-2">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-xl font-bold text-slate-100">
              {formatCurrency(product.price)}
            </span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-sm text-slate-500 line-through">
                {formatCurrency(product.compare_at_price)}
              </span>
            )}
          </div>
          
          {/* Shipping Info */}
          {!isOutOfStock && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
              <svg className="w-3.5 h-3.5 text-profit-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span>Fast shipping available</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!isOutOfStock && (
          <div
            className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.button
              type="button"
              onClick={handleAddToCart}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className={`relative flex-shrink-0 p-2.5 rounded-xl border transition-all ${
                addedToCart
                  ? 'border-profit-500 bg-profit-500/20 text-profit-400'
                  : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:border-slate-600 hover:text-white'
              }`}
              aria-label="Add to cart"
            >
              {addedToCart ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              )}
            </motion.button>
            <motion.button
              type="button"
              onClick={handleBuyNow}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-profit-600 to-profit-500 
                         hover:from-profit-500 hover:to-profit-400 shadow-lg shadow-profit-500/20 hover:shadow-profit-500/30 transition-all"
            >
              Buy Now
            </motion.button>
          </div>
        )}
      </div>
    </Link>
  )
}