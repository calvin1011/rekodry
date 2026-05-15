'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/lib/cart-context'
import { formatCurrency } from '@/lib/utils'
import ProductCard from './ProductCard'
import ReviewsSection from './ReviewsSection'
import StarRating from './StarRating'
import WishlistButton from './WishlistButton'

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
  category: string | null
}

interface Product {
  id: string
  title: string
  slug: string
  description: string | null
  price: number
  compare_at_price: number | null
  weight_oz: number
  items: Item | Item[]
  product_images: ProductImage[]
}

interface StoreSettings {
  store_name: string
  flat_shipping_rate: number
  free_shipping_threshold: number | null
  processing_days: number
  return_policy: string | null
  shipping_policy: string | null
  terms_of_service: string | null
}

interface ProductDetailClientProps {
  product: Product
  store: StoreSettings
  storeSlug: string
  relatedProducts: Product[]
  customerId?: string | null
  sessionType?: 'customer' | 'guest' | 'none'
  averageRating?: number
  totalReviews?: number
}

export default function ProductDetailClient({
  product,
  store,
  storeSlug,
  relatedProducts,
  customerId,
  sessionType = 'none',
  averageRating = 0,
  totalReviews = 0,
}: ProductDetailClientProps) {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const [showMobileCTA, setShowMobileCTA] = useState(false)
  const imageRef = useRef<HTMLDivElement>(null)
  const buyButtonRef = useRef<HTMLButtonElement>(null)

  const sortedImages = [...product.product_images].sort((a, b) => a.position - b.position)
  const itemData = Array.isArray(product.items) ? product.items[0] : product.items
  const isOutOfStock = !itemData || itemData.quantity_on_hand === 0
  const isLowStock = itemData && itemData.quantity_on_hand > 0 && itemData.quantity_on_hand <= 5
  const maxQuantity = itemData?.quantity_on_hand || 0
  const category = itemData?.category || null
  
  const discountPercent = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : 0

  useEffect(() => {
    const handleScroll = () => {
      if (buyButtonRef.current) {
        const rect = buyButtonRef.current.getBoundingClientRect()
        setShowMobileCTA(rect.bottom < 0)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return
    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPosition({ x, y })
  }

  const handleAddToCart = () => {
    if (isOutOfStock) return

    const mainImage = sortedImages[0]?.image_url || ''

    addItem({
      product_id: product.id,
      title: product.title,
      price: product.price,
      quantity,
      image_url: mainImage,
      max_quantity: maxQuantity,
    })

    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-4 z-50"
          >
            <div className="bg-profit-500/20 backdrop-blur-sm border border-profit-500/50 rounded-xl p-4 flex items-center gap-3 shadow-xl">
              <div className="w-8 h-8 rounded-full bg-profit-500/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-profit-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-profit-400 font-medium">Added to cart!</p>
                <p className="text-xs text-slate-400">{quantity} item{quantity > 1 ? 's' : ''} added</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Breadcrumbs */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link href={`/store/${storeSlug}`} className="text-slate-400 hover:text-profit-400 transition-colors">
                {store.store_name}
              </Link>
            </li>
            <li className="text-slate-600">/</li>
            {category && (
              <>
                <li>
                  <Link 
                    href={`/store/${storeSlug}?category=${encodeURIComponent(category)}`} 
                    className="text-slate-400 hover:text-profit-400 transition-colors"
                  >
                    {category}
                  </Link>
                </li>
                <li className="text-slate-600">/</li>
              </>
            )}
            <li className="text-slate-200 truncate max-w-[200px]">{product.title}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image with Zoom */}
            <div 
              ref={imageRef}
              className="relative aspect-square rounded-2xl overflow-hidden bg-slate-800/50 border border-slate-700/50 cursor-zoom-in"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              {sortedImages.length > 0 ? (
                <>
                  <img
                    src={sortedImages[selectedImage]?.image_url}
                    alt={sortedImages[selectedImage]?.alt_text || product.title}
                    className={`w-full h-full object-cover transition-transform duration-200 ${
                      isZoomed ? 'scale-150' : 'scale-100'
                    }`}
                    style={isZoomed ? {
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                    } : undefined}
                  />
                  {/* Zoom indicator */}
                  <div className={`absolute bottom-4 right-4 px-3 py-1.5 bg-slate-900/80 backdrop-blur-sm rounded-lg text-xs text-slate-300 flex items-center gap-1.5 transition-opacity ${isZoomed ? 'opacity-0' : 'opacity-100'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                    Hover to zoom
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-24 h-24 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* Badges overlay */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {discountPercent > 0 && (
                  <span className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-bold rounded-lg shadow-lg">
                    -{discountPercent}% OFF
                  </span>
                )}
                {isLowStock && !isOutOfStock && (
                  <span className="px-3 py-1.5 bg-orange-500/90 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    Only {maxQuantity} left
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Strip */}
            {sortedImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {sortedImages.map((img, index) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(index)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden transition-all ${
                      selectedImage === index
                        ? 'ring-2 ring-profit-500 ring-offset-2 ring-offset-slate-950'
                        : 'ring-1 ring-slate-700 hover:ring-slate-500 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.image_url}
                      alt={img.alt_text || `${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-100 leading-tight">
                {product.title}
              </h1>
              <WishlistButton
                productId={product.id}
                customerId={customerId || null}
                size="lg"
              />
            </div>

            {/* Rating */}
            {averageRating > 0 && (
              <div className="flex items-center gap-3 mb-4">
                <StarRating rating={averageRating} size="md" showNumber totalReviews={totalReviews} />
                <span className="text-xs text-slate-500">|</span>
                <a href="#reviews" className="text-sm text-profit-400 hover:text-profit-300 transition-colors">
                  See all reviews
                </a>
              </div>
            )}

            {/* Price */}
            <div className="flex flex-wrap items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-slate-100">
                {formatCurrency(product.price)}
              </span>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <>
                  <span className="text-xl text-slate-500 line-through">
                    {formatCurrency(product.compare_at_price)}
                  </span>
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-sm font-semibold rounded">
                    Save {formatCurrency(product.compare_at_price - product.price)}
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="flex flex-col items-center gap-1.5 p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl">
                <svg className="w-5 h-5 text-profit-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <span className="text-xs text-slate-400 text-center">Fast Shipping</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl">
                <svg className="w-5 h-5 text-profit-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-xs text-slate-400 text-center">Secure Checkout</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl">
                <svg className="w-5 h-5 text-profit-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-xs text-slate-400 text-center">Easy Returns</span>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 mb-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Availability</span>
                  <span className={`text-sm font-medium ${isOutOfStock ? 'text-red-400' : 'text-profit-400'}`}>
                    {isOutOfStock ? 'Out of Stock' : `${maxQuantity} in stock`}
                  </span>
                </div>
                <div className="h-px bg-slate-700/50" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Shipping</span>
                  <span className="text-sm text-slate-200 font-medium">
                    {store.free_shipping_threshold && product.price >= store.free_shipping_threshold ? (
                      <span className="text-profit-400">FREE Shipping</span>
                    ) : (
                      formatCurrency(store.flat_shipping_rate)
                    )}
                  </span>
                </div>
                <div className="h-px bg-slate-700/50" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Processing</span>
                  <span className="text-sm text-slate-200">{store.processing_days} business day{store.processing_days > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* Quantity & Add to Cart */}
            {!isOutOfStock && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-slate-300">Quantity:</label>
                  <div className="flex items-center">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-l-xl bg-slate-800 border border-slate-700 border-r-0
                               hover:bg-slate-700 transition-colors flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={maxQuantity}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-16 text-center py-2.5 bg-slate-800 border-y border-slate-700 text-slate-100 text-sm
                               focus:outline-none focus:ring-0"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                      disabled={quantity >= maxQuantity}
                      className="w-10 h-10 rounded-r-xl bg-slate-800 border border-slate-700 border-l-0
                               hover:bg-slate-700 transition-colors flex items-center justify-center
                               disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>

                <motion.button
                  ref={buyButtonRef}
                  type="button"
                  onClick={handleAddToCart}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-xl font-semibold text-lg
                           bg-gradient-to-r from-profit-600 to-profit-500 text-white
                           shadow-lg shadow-profit-500/30
                           hover:shadow-xl hover:shadow-profit-500/40 hover:from-profit-500 hover:to-profit-400
                           active:scale-[0.98] transition-all"
                >
                  Add to Cart — {formatCurrency(product.price * quantity)}
                </motion.button>
              </div>
            )}

            {isOutOfStock && (
              <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl text-center">
                <p className="text-slate-400">This item is currently out of stock</p>
              </div>
            )}

            {/* Policies Accordion */}
            <div className="mt-6 space-y-2">
              {store.return_policy && (
                <details className="group bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between p-4 cursor-pointer text-sm font-medium text-slate-200 hover:text-white transition-colors">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Return Policy
                    </div>
                    <svg className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-4 pb-4">
                    <p className="text-sm text-slate-400 whitespace-pre-wrap">{store.return_policy}</p>
                  </div>
                </details>
              )}

              {store.shipping_policy && (
                <details className="group bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between p-4 cursor-pointer text-sm font-medium text-slate-200 hover:text-white transition-colors">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      Shipping Policy
                    </div>
                    <svg className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-4 pb-4">
                    <p className="text-sm text-slate-400 whitespace-pre-wrap">{store.shipping_policy}</p>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div id="reviews">
          <ReviewsSection
            productId={product.id}
            customerId={customerId || null}
            storeName={store.store_name}
            storeSlug={storeSlug}
            sessionType={sessionType}
          />
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-100">You May Also Like</h2>
              <Link 
                href={`/store/${storeSlug}`}
                className="text-sm text-profit-400 hover:text-profit-300 transition-colors"
              >
                View all products →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {relatedProducts.slice(0, 4).map((relatedProduct, index) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                  storeSlug={storeSlug}
                  index={index}
                  customerId={customerId}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Mobile CTA */}
      <AnimatePresence>
        {showMobileCTA && !isOutOfStock && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-slate-950/95 backdrop-blur-md border-t border-slate-800"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <div className="flex items-center gap-3 max-w-lg mx-auto">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-100 truncate">{product.title}</p>
                <p className="text-lg font-bold text-profit-400">{formatCurrency(product.price)}</p>
              </div>
              <motion.button
                type="button"
                onClick={handleAddToCart}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-profit-600 to-profit-500 text-white font-semibold rounded-xl shadow-lg"
              >
                Add to Cart
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}