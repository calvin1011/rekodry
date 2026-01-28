'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProductModal from './ProductModal'
import { formatCurrency } from '@/lib/utils'

interface Item {
  id: string
  name: string
  quantity_on_hand: number
  purchase_price: number
  category: string | null
}

interface ProductImage {
  id: string
  image_url: string
  alt_text: string | null
  position: number
}

interface Product {
  id: string
  item_id: string
  title: string
  description: string | null
  slug: string
  price: number
  compare_at_price: number | null
  sku: string | null
  weight_oz: number
  requires_shipping: boolean
  is_published: boolean
  published_at: string | null
  seo_title: string | null
  seo_description: string | null
  view_count: number
  created_at: string
  updated_at: string
  items: Item
  product_images: ProductImage[]
}

interface AvailableItem {
  id: string
  name: string
  quantity_on_hand: number
  purchase_price: number
  category: string | null
  sku: string | null
}

interface ProductsClientProps {
  initialProducts: Product[]
  availableItems: AvailableItem[]
}

export default function ProductsClient({ initialProducts, availableItems }: ProductsClientProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [productToEdit, setProductToEdit] = useState<Product | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all')
  const [showOutOfStock, setShowOutOfStock] = useState(false)

  const handleEdit = (product: Product) => {
    setProductToEdit(product)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to delete')

      router.refresh()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product')
    }
  }

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_published: !currentStatus }),
      })

      if (!res.ok) throw new Error('Failed to update publish status')

      router.refresh()
    } catch (error) {
      console.error('Error toggling publish status:', error)
      alert('Failed to update publish status')
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setProductToEdit(undefined)
  }

  const filteredProducts = initialProducts.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.items.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.items.category && product.items.category.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'published' && product.is_published) ||
      (filterStatus === 'draft' && !product.is_published)

    const matchesStock = showOutOfStock || product.items.quantity_on_hand > 0

    return matchesSearch && matchesStatus && matchesStock
  })

  const publishedCount = initialProducts.filter(p => p.is_published).length
  const draftCount = initialProducts.filter(p => !p.is_published).length

  return (
    <div className="min-h-screen bg-gradient-dark p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-slide-down">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="gradient-text">Products</span>
          </h1>
          <p className="text-slate-400">Create product listings from your inventory</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-slide-down" style={{ animationDelay: '0.1s' }}>
          <div className="flex-1 relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                       text-slate-100 placeholder-slate-500
                       focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                       transition-smooth"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'published' | 'draft')}
            className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                     text-slate-100
                     focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                     transition-smooth"
          >
            <option value="all">All Products</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>

          <label className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-700 text-slate-300 text-sm">
            <input
              type="checkbox"
              checked={showOutOfStock}
              onChange={(e) => setShowOutOfStock(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 text-profit-500 focus:ring-profit-500"
            />
            Show out of stock
          </label>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 rounded-xl font-semibold
                     bg-gradient-profit text-white
                     shadow-lg shadow-profit-500/50
                     hover:shadow-glow-profit-lg hover:scale-105
                     active:scale-95
                     transition-smooth inline-flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Product
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="glass-dark rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-slate-400 text-sm mb-1">Total Products</p>
            <p className="text-2xl font-bold text-slate-100">{initialProducts.length}</p>
          </div>

          <div className="glass-dark rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <p className="text-slate-400 text-sm mb-1">Published</p>
            <p className="text-2xl font-bold text-profit-400">{publishedCount}</p>
          </div>

          <div className="glass-dark rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <p className="text-slate-400 text-sm mb-1">Drafts</p>
            <p className="text-2xl font-bold text-slate-100">{draftCount}</p>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="glass-dark rounded-2xl p-12 text-center animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-3">
              {searchQuery ? 'No products found' : 'No products yet'}
            </h3>
            <p className="text-slate-400 mb-6">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Create your first product listing from your inventory'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-8 py-3 rounded-xl font-semibold
                         bg-gradient-profit text-white
                         shadow-lg shadow-profit-500/50
                         hover:shadow-glow-profit-lg hover:scale-105
                         active:scale-95
                         transition-smooth inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create First Product
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className="glass-dark rounded-xl p-6 relative group hover:shadow-glass-lg transition-smooth animate-slide-up"
                style={{ animationDelay: `${0.5 + index * 0.05}s` }}
              >
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(product)}
                    className="p-2 rounded-lg bg-slate-700/50 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-smooth"
                    title="Edit Product"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 rounded-lg bg-slate-700/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-smooth"
                    title="Delete Product"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {product.product_images.length > 0 && (
                  <div className="mb-4 rounded-lg overflow-hidden bg-slate-800">
                    <img
                      src={product.product_images[0].image_url}
                      alt={product.product_images[0].alt_text || product.title}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 pr-12">
                    <h3 className="text-lg font-semibold text-slate-100 mb-1 line-clamp-2">
                      {product.title}
                    </h3>
                    <p className="text-xs text-slate-500 mb-2">From: {product.items.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {product.is_published ? (
                        <span className="inline-block px-2 py-1 text-xs rounded-lg bg-profit-500/20 text-profit-400 border border-profit-500/30">
                          Published
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 text-xs rounded-lg bg-slate-700 text-slate-400">
                          Draft
                        </span>
                      )}
                      {product.items.category && (
                        <span className="inline-block px-2 py-1 text-xs rounded-lg bg-slate-800 text-slate-400">
                          {product.items.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Price</span>
                    <span className="text-slate-100 font-medium">{formatCurrency(product.price)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Stock</span>
                    <span className="text-slate-100 font-medium">{product.items.quantity_on_hand} units</span>
                  </div>
                  {product.compare_at_price && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Compare At</span>
                      <span className="text-slate-400 line-through">{formatCurrency(product.compare_at_price)}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <button
                    onClick={() => handleTogglePublish(product.id, product.is_published)}
                    className={`w-full px-4 py-2 rounded-xl font-medium transition-smooth ${
                      product.is_published
                        ? 'bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700'
                        : 'bg-gradient-profit text-white hover:shadow-glow-profit-lg'
                    }`}
                  >
                    {product.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        productToEdit={productToEdit}
        availableItems={availableItems}
      />
    </div>
  )
}