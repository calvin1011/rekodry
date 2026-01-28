'use client'

import { useState } from 'react'
import { useCart } from '@/lib/cart-context'
import { formatCurrency } from '@/lib/utils'
import ProductCard from './ProductCard'

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
}

export default function ProductDetailClient({
  product,
  store,
  storeSlug,
  relatedProducts,
}: ProductDetailClientProps) {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)

  const sortedImages = [...product.product_images].sort((a, b) => a.position - b.position)
  const itemData = Array.isArray(product.items) ? product.items[0] : product.items
  const isOutOfStock = !itemData || itemData.quantity_on_hand === 0
  const maxQuantity = itemData?.quantity_on_hand || 0

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {showSuccess && (
          <div className="fixed top-20 right-4 z-50 animate-slide-up">
            <div className="bg-profit-500/20 border border-profit-500/50 rounded-xl p-4 flex items-center gap-3 shadow-lg">
              <svg className="w-5 h-5 text-profit-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-profit-400 font-medium">Added to cart!</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-slate-800">
              {sortedImages.length > 0 ? (
                <img
                  src={sortedImages[selectedImage]?.image_url}
                  alt={sortedImages[selectedImage]?.alt_text || product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-24 h-24 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {sortedImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {sortedImages.map((img, index) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-smooth ${
                      selectedImage === index
                        ? 'border-profit-500'
                        : 'border-slate-700 hover:border-slate-600'
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

          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-100 mb-4">
              {product.title}
            </h1>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold gradient-text">
                {formatCurrency(product.price)}
              </span>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <span className="text-xl text-slate-500 line-through">
                  {formatCurrency(product.compare_at_price)}
                </span>
              )}
            </div>

            {product.description && (
              <div className="mb-6">
                <p className="text-slate-300 whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            <div className="glass-dark rounded-xl p-6 mb-6">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Availability</span>
                  <span className={isOutOfStock ? 'text-red-400 font-medium' : 'text-profit-400 font-medium'}>
                    {isOutOfStock ? 'Out of Stock' : `${itemData?.quantity_on_hand || 0} available`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Shipping</span>
                  <span className="text-slate-300">
                    {store.free_shipping_threshold && product.price >= store.free_shipping_threshold
                      ? 'Free shipping'
                      : formatCurrency(store.flat_shipping_rate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Processing Time</span>
                  <span className="text-slate-300">{store.processing_days} business days</span>
                </div>
              </div>
            </div>

            {!isOutOfStock && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700
                             hover:bg-slate-700 transition-smooth flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={maxQuantity}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-20 text-center px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl
                             text-slate-100
                             focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={quantity >= maxQuantity}
                    className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700
                             hover:bg-slate-700 transition-smooth flex items-center justify-center
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="w-full px-6 py-4 rounded-xl font-semibold text-lg
                       bg-gradient-profit text-white
                       shadow-lg shadow-profit-500/50
                       hover:shadow-glow-profit-lg hover:scale-[1.02]
                       active:scale-[0.98]
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-smooth"
            >
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>

            {store.return_policy && (
              <details className="mt-6 glass-dark rounded-xl p-4">
                <summary className="cursor-pointer text-sm font-medium text-slate-300">
                  Return Policy
                </summary>
                <p className="mt-3 text-sm text-slate-400 whitespace-pre-wrap">
                  {store.return_policy}
                </p>
              </details>
            )}

            {store.shipping_policy && (
              <details className="mt-3 glass-dark rounded-xl p-4">
                <summary className="cursor-pointer text-sm font-medium text-slate-300">
                  Shipping Policy
                </summary>
                <p className="mt-3 text-sm text-slate-400 whitespace-pre-wrap">
                  {store.shipping_policy}
                </p>
              </details>
            )}
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-100 mb-6">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((relatedProduct, index) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                  storeSlug={storeSlug}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}