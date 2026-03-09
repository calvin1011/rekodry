'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import AddItemModal from './AddItemModal'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Item {
  id: string
  name: string
  description: string | null
  sku: string | null
  category: string | null
  purchase_price: number
  purchase_date: string
  purchase_location: string
  quantity_purchased: number
  quantity_on_hand: number
  quantity_sold: number
  image_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface InventoryClientProps {
  initialItems: Item[]
}

export default function InventoryClient({ initialItems }: InventoryClientProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [itemToEdit, setItemToEdit] = useState<Item | undefined>(undefined)

  // Phase 6: unique categories from items for filter dropdown
  const categories = Array.from(
    new Set(initialItems.map((i) => i.category?.trim()).filter((c): c is string => Boolean(c)))
  ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))

  const handleEdit = (item: Item) => {
    setItemToEdit(item)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const res = await fetch(`/api/items?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      router.refresh()
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Failed to delete item')
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setItemToEdit(undefined)
  }

  // filter items based on search and category
  const filteredItems = initialItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.purchase_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory =
      !categoryFilter ||
      (item.category?.trim() && item.category.trim().toLowerCase() === categoryFilter.toLowerCase())
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gradient-dark p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        <div className="mb-8 animate-slide-down">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="gradient-text">Inventory</span>
          </h1>
          <p className="text-slate-400">Manage your items and track stock levels</p>
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
              placeholder="Search items..."
              className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                       text-slate-100 placeholder-slate-500
                       focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                       transition-smooth"
            />
          </div>

          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                       text-slate-100 min-w-[10rem]
                       focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                       transition-smooth"
            >
              <option value="">All categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}

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
            Add Item
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

          <div className="glass-dark rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-slate-400 text-sm mb-1">Total Items</p>
            <p className="text-2xl font-bold text-slate-100">{initialItems.length}</p>
          </div>

          <div className="glass-dark rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <p className="text-slate-400 text-sm mb-1">Total Quantity</p>
            <p className="text-2xl font-bold text-slate-100">
              {initialItems.reduce((sum, item) => sum + item.quantity_on_hand, 0)}
            </p>
          </div>

          <div className="glass-dark rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <p className="text-slate-400 text-sm mb-1">Total Value</p>
            <p className="text-2xl font-bold gradient-text">
              {formatCurrency(
                initialItems.reduce((sum, item) => sum + (item.purchase_price * item.quantity_on_hand), 0)
              )}
            </p>
          </div>
        </div>

        {filteredItems.length === 0 ? (

          <div className="glass-dark rounded-2xl p-12 text-center animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-3">
              {searchQuery ? 'No items found' : 'No items yet'}
            </h3>
            <p className="text-slate-400 mb-6">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Add your first item to start tracking inventory'}
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
                Add First Item
              </button>
            )}
          </div>
        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="glass-dark rounded-xl p-6 relative group hover:shadow-glass-lg transition-smooth"
              >

                {/* Actions: Edit / Delete */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 rounded-lg bg-slate-700/50 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition-smooth"
                    title="Edit Item"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg bg-slate-700/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-smooth"
                    title="Delete Item"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 pr-12">
                    <h3 className="text-lg font-semibold text-slate-100 mb-1 line-clamp-2">
                      {item.name}
                    </h3>
                    {item.category && (
                      <span className="inline-block px-2 py-1 text-xs rounded-lg bg-slate-800 text-slate-400">
                        {item.category}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Purchase Price</span>
                    <span className="text-slate-100 font-medium">{formatCurrency(item.purchase_price)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Quantity</span>
                    <span className="text-slate-100 font-medium">
                      {item.quantity_on_hand} / {item.quantity_purchased}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Location</span>
                    <span className="text-slate-100 font-medium">{item.purchase_location}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Purchased</span>
                    <span className="text-slate-100 font-medium">{formatDate(item.purchase_date)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Total Value</span>
                    <span className="text-lg font-bold gradient-text">
                      {formatCurrency(item.purchase_price * item.quantity_on_hand)}
                    </span>
                  </div>
                </div>

                <AnimatePresence>
                  {item.quantity_on_hand === 0 && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="mt-3 px-3 py-1 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-xs text-center ring-2 ring-red-400"
                    >
                      SOLD OUT
                    </motion.div>
                  )}
                </AnimatePresence>
                {item.quantity_on_hand > 0 && item.quantity_on_hand <= 3 && (
                  <div className="mt-3 px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs text-center animate-pulse ring-2 ring-red-400">
                    Low Stock
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AddItemModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        itemToEdit={itemToEdit}
      />
    </div>
  )
}