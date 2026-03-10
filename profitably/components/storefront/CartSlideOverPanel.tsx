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
  return (
    <div className="w-full h-[100dvh] max-h-[100dvh] min-h-0 sm:h-full sm:max-h-full sm:w-screen sm:max-w-md pointer-events-auto flex flex-col bg-slate-950 shadow-2xl border-l border-slate-800 animate-slide-up sm:animate-none overflow-hidden">
      <div className={CN.header}>
        <h2 className="text-lg sm:text-xl font-bold text-slate-100">
          Your Cart
          <span className="text-slate-400 font-normal ml-2">({items.length} {items.length === 1 ? 'item' : 'items'})</span>
        </h2>
        <button
          onClick={onClose}
          className="p-2 -mr-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors touch-manipulation"
          aria-label="Close cart"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-8 space-y-4 min-h-0">
            <div className={CN.emptyIcon}>
              <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-medium text-slate-100">Your cart is empty</h3>
              <p className="text-slate-400 text-sm">Add items to get started.</p>
            </div>
            <Link
              href={storePath}
              onClick={onClose}
              className="mt-4 px-6 py-3 rounded-xl text-sm font-medium text-white bg-profit-600 hover:bg-profit-500 transition-colors inline-block"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            <div
              className="flex-1 overflow-y-auto min-h-0 px-4 sm:px-6 py-4 overscroll-contain"
              style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
            >
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Cart items</p>
              <ul className={CN.list}>
                {items.map((item) => (
                  <li key={item.product_id} className={CN.listItem}>
                    <div className={CN.itemThumb}>
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
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-slate-400">{formatCurrency(item.price)} each</p>
                        <div className="flex items-center gap-3">
                          <div className={CN.qtyWrap}>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                              className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors disabled:opacity-30 touch-manipulation"
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-xs font-medium text-slate-100 border-x border-slate-800 py-1">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                              disabled={item.quantity >= item.max_quantity}
                              className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors disabled:opacity-30 touch-manipulation"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.product_id)}
                            className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors touch-manipulation"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex-shrink-0 border-t border-slate-800 p-4 sm:p-6 bg-slate-950 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-6">
              <div className="space-y-3 mb-4 sm:mb-6">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-200">{formatCurrency(subtotal)}</span>
                </div>
                <button
                  type="button"
                  onClick={clearCart}
                  className={CN.clearBtn}
                >
                  Clear Cart
                </button>
                <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                  <span className="text-base font-bold text-slate-100">Total</span>
                  <span className="text-xl font-bold text-slate-100">{formatCurrency(subtotal)}</span>
                </div>
                <p className="text-xs text-slate-500">Shipping & taxes at checkout.</p>
              </div>
              <div className="space-y-3">
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className="block w-full"
                >
                  <Link
                    href={checkoutPath}
                    onClick={onClose}
                    className={CN.checkoutBtn}
                  >
                    Checkout
                  </Link>
                </motion.div>
                <Link
                  href={storePath}
                  onClick={onClose}
                  className="block w-full py-3 rounded-xl font-medium text-center text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
