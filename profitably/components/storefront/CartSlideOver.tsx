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
  const { items, removeItem, updateQuantity, clearCart, subtotal } = useCart()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        {/* Backdrop - darker and blurrier for better focus */}
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
          onClick={onClose}
        />

        <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-16 pointer-events-none">
          <div className="w-screen max-w-md pointer-events-auto transform transition-transform animate-slide-up sm:animate-none">

            {/* Glass effect container matching your global theme */}
            <div className="flex h-full flex-col bg-slate-950/95 backdrop-blur-xl shadow-2xl border-l border-slate-800">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/70">
                <h2 className="text-xl font-bold text-slate-100">
                  Your Cart <span className="text-sm font-normal text-slate-400 ml-2">({items.length})</span>
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Cart Items - Clean List View (No more clashing cards) */}
              <div className="flex-1 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                    <div className="w-20 h-20 rounded-2xl bg-slate-800/60 flex items-center justify-center">
                      <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-medium text-slate-100">Your cart is empty</h3>
                      <p className="text-slate-400 text-sm">Looks like you haven't added anything yet.</p>
                    </div>

                    <Link
                      href={`/store/${storeSlug}`}
                      onClick={onClose}
                      className="mt-4 px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 transition-colors inline-block"
                    >
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-800/60">
                    {items.map((item) => (
                      <li key={item.product_id} className="flex gap-5 p-6 hover:bg-slate-900/40 transition-colors">
                        <div className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-slate-800 bg-slate-900/70">
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="text-sm font-medium text-slate-100 line-clamp-2 leading-relaxed">
                              {item.title}
                            </h3>
                            <p className="text-sm font-semibold text-slate-100 whitespace-nowrap ml-2">
                              {formatCurrency(item.price * item.quantity)}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <p className="text-xs text-slate-400">
                              {formatCurrency(item.price)} each
                            </p>

                            <div className="flex items-center gap-4">
                              <div className="flex items-center h-8 rounded-lg border border-slate-700 bg-slate-900/70 overflow-hidden">
                                <button
                                  onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                  className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors disabled:opacity-30"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center text-xs font-medium text-slate-100 border-x border-slate-800 py-1">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                  disabled={item.quantity >= item.max_quantity}
                                  className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors disabled:opacity-30"
                                >
                                  +
                                </button>
                              </div>

                              <button
                                onClick={() => removeItem(item.product_id)}
                                className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="flex-shrink-0 border-t border-slate-800 p-6 bg-slate-950/80 backdrop-blur-md">
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm text-slate-400">
                      <span>Subtotal</span>
                      <span className="font-medium text-slate-200">{formatCurrency(subtotal)}</span>
                    </div>
                    <button
                      onClick={clearCart}
                      className="w-full text-sm font-medium text-red-400 hover:text-red-300
                               hover:bg-red-500/10 rounded-lg py-2 transition-colors"
                    >
                      Clear Cart
                    </button>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                      <span className="text-base font-bold text-slate-100">Total</span>
                      <span className="text-xl font-bold text-slate-100">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                    <p className="text-xs text-center text-slate-500 pt-2">
                      Shipping and taxes calculated at checkout.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Link
                      href={`/store/${storeSlug}/checkout`}
                      onClick={onClose}
                      className="block w-full py-4 rounded-xl font-bold text-center text-white
                               bg-gradient-profit shadow-lg shadow-profit-500/25
                               hover:shadow-profit-500/40 hover:scale-[1.01] active:scale-[0.99]
                               transition-all duration-200"
                    >
                      Checkout
                    </Link>

                    <Link
                      href={`/store/${storeSlug}`}
                      onClick={onClose}
                      className="block w-full py-3 rounded-xl font-medium text-center
                               text-slate-300
                               hover:bg-slate-800
                               transition-colors"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}