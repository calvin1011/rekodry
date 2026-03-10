'use client'

import { useCart } from '@/lib/cart-context'
import { cartSlideOverClasses as CN } from './CartSlideOver.classes'
import { CartSlideOverPanel } from './CartSlideOverPanel'

interface CartSlideOverProps {
  isOpen: boolean
  onClose: () => void
  storeSlug: string
}

const SLASH = String.fromCharCode(47)

export default function CartSlideOver({ isOpen, onClose, storeSlug }: CartSlideOverProps) {
  const { items, removeItem, updateQuantity, clearCart, subtotal } = useCart()
  const storePath = SLASH + 'store' + SLASH + storeSlug
  const checkoutPath = storePath + SLASH + 'checkout'

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden sm:inset-auto"
      style={{ height: '100dvh', maxHeight: '100dvh' } as React.CSSProperties}
    >
      <div
        className={CN.overlay}
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed inset-0 flex max-w-full sm:inset-y-0 sm:right-0 sm:left-auto sm:pl-16 pointer-events-none"
        style={{ height: '100dvh', maxHeight: '100dvh' } as React.CSSProperties}
      >
        <CartSlideOverPanel
          items={items}
          storePath={storePath}
          checkoutPath={checkoutPath}
          subtotal={subtotal}
          onClose={onClose}
          removeItem={removeItem}
          updateQuantity={updateQuantity}
          clearCart={clearCart}
        />
      </div>
    </div>
  )
}
