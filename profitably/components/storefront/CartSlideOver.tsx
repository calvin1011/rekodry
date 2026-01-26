'use client'

import { useCart } from '@/lib/cart-context'
import { formatCurrency } from '@/lib/utils'

interface CartSlideOverProps {
  isOpen: boolean
  onClose: () => void
}

export default function CartSlideOver({ isOpen, onClose }: CartSlideOverProps) {
  const { items, removeItem, updateQuantity, subtotal } = useCart()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div className="w-screen max-w-md">
            <div className="flex h-full flex-col bg-slate-900 shadow-xl">
              <div className="flex items-center justify-between p-6 border-b border-slate-800">
                <h2 className="text-xl font-bold text-slate-100">Shopping Cart</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-slate-800 transition-smooth"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {items.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <p className="text-slate-400 mb-2">Your cart is empty</p>
                    <button
                      onClick={onClose}
                      className="text-profit-400 hover:text-profit-300 text-sm font-medium transition-colors"
                    >
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div
                        key={item.product_id}
                        className="flex gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700"
                      >
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-20 h-20 object-cover rounded-lg bg-slate-800"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-slate-100 mb-1 line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="text-sm text-slate-400 mb-2">
                            {formatCurrency(item.price)}
                          </p>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                              className="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-smooth"
                            >
                              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="text-sm text-slate-100 w-8 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                              disabled={item.quantity >= item.max_quantity}
                              className="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col items-end justify-between">
                          <button
                            onClick={() => removeItem(item.product_id)}
                            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          <p className="text-sm font-semibold text-slate-100">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <div className="border-t border-slate-800 p-6">
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Subtotal</span>
                      <span className="text-slate-100 font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Shipping</span>
                      <span className="text-slate-400 text-xs">Calculated at checkout</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-slate-700">
                      <span className="text-base font-semibold text-slate-100">Total</span>
                      <span className="text-lg font-bold gradient-text">{formatCurrency(subtotal)}</span>
                    </div>
                  </div>

                  <button
                    className="w-full px-6 py-3 rounded-xl font-semibold
                             bg-gradient-profit text-white
                             shadow-lg shadow-profit-500/50
                             hover:shadow-glow-profit-lg hover:scale-[1.02]
                             active:scale-[0.98]
                             transition-smooth"
                  >
                    Checkout
                  </button>

                  <button
                    onClick={onClose}
                    className="w-full mt-3 px-6 py-3 rounded-xl font-medium
                             bg-slate-800 text-slate-100 border border-slate-700
                             hover:bg-slate-700 hover:border-slate-600
                             transition-smooth"
                  >
                    Continue Shopping
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}