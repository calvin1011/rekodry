'use client'

import { useCart } from '@/lib/cart-context'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface CartSlideOverProps {
  isOpen: boolean
  onClose: () => void
  storeSlug: string
}

export default function CartSlideOver({ isOpen, onClose, storeSlug }: CartSlideOverProps) {
  const { items, removeItem, updateQuantity, subtotal } = useCart()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden animate-fade-in">
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
          <div className="w-screen max-w-lg transform transition-transform">
            <div className="flex h-full flex-col bg-white dark:bg-slate-900 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <svg className="w-6 h-6 text-slate-700 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Your Cart</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
                  aria-label="Close cart"
                >
                  <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Cart Items - Scrollable */}
              <div className="flex-1 overflow-y-auto px-8 py-6">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-16">
                    <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                      <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-lg mb-4">Your cart is empty</p>
                    <button
                      onClick={onClose}
                      className="px-6 py-3 rounded-lg font-medium text-white bg-gradient-profit hover:shadow-lg hover:shadow-profit-500/30 transition-all"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div
                        key={item.product_id}
                        className="flex gap-4 p-4 rounded-xl bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200"
                      >
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <div className="relative">
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-24 h-24 object-cover rounded-xl bg-slate-100 dark:bg-slate-800"
                            />
                            <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center">
                              <span className="text-xs font-semibold text-white dark:text-slate-900">
                                {item.quantity}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 pr-4">
                              {item.title}
                            </h3>
                            <button
                              onClick={() => removeItem(item.product_id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                              aria-label="Remove item"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            {formatCurrency(item.price)}
                          </p>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5">
                              <button
                                onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                className="w-6 h-6 rounded-full hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100 w-6 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                disabled={item.quantity >= item.max_quantity}
                                className="w-6 h-6 rounded-full hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                aria-label="Increase quantity"
                              >
                                <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>
                            <div className="ml-auto">
                              <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                                {formatCurrency(item.price * item.quantity)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer with Totals & Checkout */}
              {items.length > 0 && (
                <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-800 px-8 py-6 bg-white dark:bg-slate-900">
                  {/* Summary */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                      <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t border-slate-200 dark:border-slate-700 pt-3">
                      <span className="text-slate-600 dark:text-slate-400">Shipping</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">Calculated at checkout</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t border-slate-200 dark:border-slate-700 pt-3">
                      <span className="text-lg font-bold text-slate-900 dark:text-slate-100">Total</span>
                      <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="space-y-3">
                    <Link
                      href={`/store/${storeSlug}/checkout`}
                      onClick={onClose}
                      className="block w-full px-6 py-4 rounded-xl font-semibold text-center
                               bg-gradient-profit text-white
                               shadow-lg shadow-profit-500/30
                               hover:shadow-xl hover:shadow-profit-500/40 hover:scale-[1.02]
                               active:scale-[0.98]
                               transition-all duration-200"
                    >
                      Proceed to Checkout
                    </Link>

                    <button
                      onClick={onClose}
                      className="w-full px-6 py-3.5 rounded-xl font-medium
                               bg-transparent text-slate-600 dark:text-slate-400 border-2 border-slate-300 dark:border-slate-700
                               hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600
                               transition-all duration-200"
                    >
                      Continue Shopping
                    </button>
                  </div>

                  {/* Additional Info */}
                  <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                    Free shipping on orders over $100 • Secure checkout
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}