'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import ProductCard from './ProductCard'

type Item = {
  id: string
  name: string
  quantity_on_hand: number
  category?: string | null
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
  averageRating?: number
  totalReviews?: number
}

interface ProductGridProps {
  products: Product[]
  storeSlug: string
  customerId?: string | null
  categories?: string[]
  selectedCategory?: string | null
  initialSearchQuery?: string
}

type SortOption = 'newest' | 'price-low' | 'price-high' | 'rating' | 'name'
type ViewMode = 'grid' | 'list'

function getItemCategory(product: Product): string | null {
  const item = Array.isArray(product.items) ? product.items[0] : product.items
  return (item as Item)?.category?.trim() || null
}

export default function ProductGrid({ products, storeSlug, customerId, categories = [], selectedCategory = null, initialSearchQuery = '' }: ProductGridProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showFilters, setShowFilters] = useState(false)

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products]
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter((product) => {
        const titleMatch = product.title.toLowerCase().includes(query)
        const descMatch = product.description?.toLowerCase().includes(query)
        const categoryMatch = getItemCategory(product)?.toLowerCase().includes(query)
        return titleMatch || descMatch || categoryMatch === true
      })
    }
    
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        result.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
        break
      case 'name':
        result.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'newest':
      default:
        break
    }
    
    return result
  }, [products, searchQuery, sortBy])

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'name', label: 'Name: A to Z' },
  ]

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-4">
        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mr-2">Categories:</span>
            <Link
              href={`/store/${storeSlug}`}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                selectedCategory == null
                  ? 'bg-profit-500/20 text-profit-400 border border-profit-500/40 shadow-sm'
                  : 'bg-slate-800/40 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50 hover:text-slate-300'
              }`}
            >
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/store/${storeSlug}?category=${encodeURIComponent(cat)}`}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  selectedCategory != null && selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-profit-500/20 text-profit-400 border border-profit-500/40 shadow-sm'
                    : 'bg-slate-800/40 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50 hover:text-slate-300'
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>
        )}

        {/* Results Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900/50 border border-slate-800/50 rounded-xl">
          <div className="flex items-center gap-3">
            {/* Results Count */}
            <p className="text-sm text-slate-400">
              <span className="font-semibold text-slate-200">{filteredAndSortedProducts.length}</span>
              {' '}product{filteredAndSortedProducts.length !== 1 ? 's' : ''}
              {selectedCategory && (
                <span className="text-slate-500"> in <span className="text-profit-400">{selectedCategory}</span></span>
              )}
              {searchQuery && (
                <span className="text-slate-500">
                  {' '}
                  for &quot;<span className="text-slate-300">{searchQuery}</span>&quot;
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-xs text-slate-500 hidden sm:inline">Sort by:</label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-1.5 text-sm bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-200
                         focus:outline-none focus:ring-2 focus:ring-profit-500/50 focus:border-profit-500/50
                         transition-all cursor-pointer"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* View Toggle */}
            <div className="hidden sm:flex items-center p-1 bg-slate-800/40 border border-slate-700/50 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-slate-700 text-profit-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                aria-label="Grid view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'list' 
                    ? 'bg-slate-700 text-profit-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                aria-label="List view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Mobile Filter Toggle */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden p-2 bg-slate-800/40 border border-slate-700/50 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
              aria-label="Toggle filters"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Inline Search */}
        {searchQuery && (
          <div className="flex items-center gap-2 p-3 bg-profit-500/10 border border-profit-500/20 rounded-xl">
            <svg className="w-4 h-4 text-profit-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-sm text-slate-300">
              Showing results for &quot;<span className="font-medium text-profit-400">{searchQuery}</span>&quot;
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className="ml-auto text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Product Grid */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-100 mb-3">
            {searchQuery ? 'No products found' : 'No products available'}
          </h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            {searchQuery 
              ? 'We couldn\'t find any products matching your search. Try different keywords or browse all products.'
              : 'Check back soon for new items!'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-profit-500/20 border border-profit-500/30 text-profit-400 rounded-xl 
                         hover:bg-profit-500/30 transition-colors font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            : "flex flex-col gap-4"
        }>
          {filteredAndSortedProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              storeSlug={storeSlug}
              index={index}
              customerId={customerId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
