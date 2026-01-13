'use client'

import { useState } from 'react'
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // filter items based on search
  const filteredItems = initialItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.purchase_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
  )

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
              <div
                key={item.id}
                className="glass-dark rounded-xl p-6 hover:shadow-glass-lg transition-smooth animate-slide-up"
                style={{ animationDelay: `${0.5 + index * 0.05}s` }}
              >

                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-100 mb-1 line-clamp-2">
                      {item.name}
                    </h3>
                    {item.category && (
                      <span className="inline-block px-2 py-1 text-xs rounded-lg bg-slate-800 text-slate-400">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-profit-500/20 flex items-center justify-center ml-3">
                    <svg className="w-6 h-6 text-profit-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
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

                {item.quantity_on_hand === 0 && (
                  <div className="mt-3 px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-xs text-center">
                    Out of Stock
                  </div>
                )}
                {item.quantity_on_hand > 0 && item.quantity_on_hand <= 2 && (
                  <div className="mt-3 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/50 text-amber-400 text-xs text-center">
                    Low Stock
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <AddItemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}