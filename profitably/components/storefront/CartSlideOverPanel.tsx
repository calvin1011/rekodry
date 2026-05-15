'use client'

import { motion } from 'framer-motion'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { cartSlideOverClasses as CN } from './CartSlideOver.classes'

type CartItem = {
  product_id: string
  title: string
  image_url: string
  price: number
  quantity: number
  max_quantity: number
}

interface CartSlideOverPanelProps {
  items: CartItem[]
  storePath: string
  checkoutPath: string
  subtotal: number
  onClose: () => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, qty: number) => void
  clearCart: () => void
}

const FREE_SHIPPING_THRESHOLD = 50

export function CartSlideOverPanel({
  items,
  storePath,
  checkoutPath,
  subtotal,
  onClose,
  removeItem,
  updateQuantity,
  clearCart,
}: CartSlideOverPanelProps) {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  const hasFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD

  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] min-h-0 sm:h-full sm:max-h-full sm:w-screen sm:max-w-md pointer-events-auto flex flex-col bg-slate-950 shadow-2xl border-l border-slate-800 animate-slide-up sm:animate-none overflow-hidden">
      {/* Header */}
      <div className={CN.header}>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-100">
            Shopping Cart
          </h2>
          <p className="text-sm text-slate-400">{totalItems} {totalItems === 1 ? 'item' : 'items'}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 -mr-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors touch-manipulation"
          aria-label="Close cart"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-8 space-y-5 min-h-0">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
              <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-100">Your cart is empty</h3>
              <p className="text-slate-400 text-sm max-w-xs mx-auto">Looks like you haven't added anything to your cart yet.</p>
            </div>
            <Link
              href={storePath}
              onClick={onClose}
              className="mt-2 px-8 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-profit-600 to-profit-500 hover:from-profit-500 hover:to-profit-400 shadow-lg shadow-profit-500/20 transition-all"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            {/* Free Shipping Progress */}
            <div className="flex-shrink-0 px-4 sm:px-6 py-3 bg-slate-900/50 border-b border-slate-800/50">
              {hasFreeShipping ? (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 rounded-full bg-profit-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-profit-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-profit-400 font-medium">You've unlocked FREE shipping!</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">
                      Add <span className="font-semibold text-profit-400">{formatCurrency(amountToFreeShipping)}</span> for free shipping
                    </span>
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-profit-500 to-profit-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${freeShippingProgress}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Items List */}
            <div
              className="flex-1 overflow-y-auto min-h-0 px-4 sm:px-6 py-4 overscroll-contain"
              style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
            >
              <ul className="space-y-4">
                {items.map((item, index) => (
                  <motion.li
                    key={item.product_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex gap-4 p-3 bg-slate-900/40 border border-slate-800/50 rounded-xl hover:bg-slate-900/60 transition-colors"
                  >
                    <div className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-slate-700/50 bg-slate-800">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="text-sm font-medium text-slate-100 line-clamp-2 leading-snug">
                          {item.title}
                        </h3>
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center border border-slate-700/50 rounded-lg overflow-hidden bg-slate-800/50">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors touch-manipulation"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="w-8 text-center text-sm font-medium text-slate-100">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            disabled={item.quantity >= item.max_quantity}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => removeItem(item.product_id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors touch-manipulation"
                            aria-label="Remove item"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          <p className="text-sm font-semibold text-slate-100">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-slate-800 p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6">
              {/* Summary */}
              <div className="space-y-2 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Subtotal ({totalItems} items)</span>
                  <span className="font-medium text-slate-200">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Shipping</span>
                  <span className={hasFreeShipping ? 'text-profit-400 font-medium' : 'text-slate-200'}>
                    {hasFreeShipping ? 'FREE' : 'Calculated at checkout'}
                  </span>
                </div>
                <div className="h-px bg-slate-800 my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-slate-100">Estimated Total</span>
                  <span className="text-xl font-bold text-slate-100">{formatCurrency(subtotal)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Link
                    href={checkoutPath}
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-center text-white bg-gradient-to-r from-profit-600 to-profit-500 shadow-lg shadow-profit-500/25 hover:shadow-profit-500/40 hover:from-profit-500 hover:to-profit-400 active:scale-[0.99] transition-all duration-200 touch-manipulation"
                  >
                    Proceed to Checkout
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </motion.div>
                <div className="flex items-center justify-between">
                  <Link
                    href={storePath}
                    onClick={onClose}
                    className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Continue Shopping
                  </Link>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-sm font-medium text-slate-500 hover:text-red-400 transition-colors"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-800/50">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Secure</span>
                </div>
                <div className="w-px h-3 bg-slate-700" />
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Protected</span>
                </div>
                <div className="w-px h-3 bg-slate-700" />
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span>Stripe</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
