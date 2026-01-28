'use client'

import { useState, useMemo } from 'react'
import ProductCard from './ProductCard'

type Item = {
  id: string
  name: string
  quantity_on_hand: number
}

type Product = {
  id: string
  title: string
  description: string | null
  slug: string
  price: number
  compare_at_price: number | null
  items: Item | Item[]
  product_images: {
    id: string
    image_url: string
    alt_text: string | null
    position: number
  }[]
}

interface ProductGridProps {
  products: Product[]
  storeSlug: string
}

export default function ProductGrid({ products, storeSlug }: ProductGridProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products
    }

    const query = searchQuery.toLowerCase().trim()
    return products.filter((product) => {
      const titleMatch = product.title.toLowerCase().includes(query)
      const descMatch = product.description?.toLowerCase().includes(query)
      return titleMatch || descMatch
    })
  }, [products, searchQuery])

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-8 max-w-xl mx-auto">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                     text-slate-100 placeholder-slate-500
                     focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                     transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-slate-400 mt-2 text-center">
            {filteredProducts.length === 0
              ? 'No products found'
              : `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''} found`}
          </p>
        )}
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-100 mb-3">
            {searchQuery ? 'No products found' : 'No products available'}
          </h3>
          <p className="text-slate-400">
            {searchQuery ? 'Try a different search term' : 'Check back soon for new items!'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-4 py-2 text-profit-400 hover:text-profit-300 transition-colors"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              storeSlug={storeSlug}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  )
}
