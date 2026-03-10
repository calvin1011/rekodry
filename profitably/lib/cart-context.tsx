'use client'

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react'
import { addItemToCart, computeSubtotal, computeItemCount } from './cart-utils'

export interface CartItem {
  product_id: string
  title: string
  price: number
  quantity: number
  image_url: string
  max_quantity: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (product_id: string) => void
  updateQuantity: (product_id: string, quantity: number) => void
  clearCart: () => void
  replaceItems: (items: CartItem[]) => void
  setStoreSlug: (slug: string | null) => void
  storeSlug: string | null
  total: number
  subtotal: number
  itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const STORAGE_PREFIX = 'cart_'
const SAVE_DEBOUNCE_MS = 800

function storageKey(storeSlug: string | null): string {
  return storeSlug ? `${STORAGE_PREFIX}${storeSlug}` : 'cart'
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [storeSlug, setStoreSlugState] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const customerLoggedInRef = useRef(false)
  const justHydratedRef = useRef(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setStoreSlug = useCallback((slug: string | null) => {
    setStoreSlugState(slug)
  }, [])

  // Initial load from localStorage (backward compat: single 'cart' key when no store set yet)
  useEffect(() => {
    setMounted(true)
    const key = storageKey(null)
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as CartItem[]
        if (Array.isArray(parsed)) setItems(parsed)
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error)
      }
    }
  }, [])

  // When store slug is set: load from localStorage for this store (fallback to legacy 'cart'), then fetch server cart and use as source of truth if logged in
  useEffect(() => {
    if (!mounted || !storeSlug) return

    const key = storageKey(storeSlug)
    let saved = localStorage.getItem(key)
    if (!saved) saved = localStorage.getItem('cart') // legacy key for first-time after deploy
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as CartItem[]
        if (Array.isArray(parsed)) setItems(parsed)
      } catch {
        // ignore
      }
    }

    let cancelled = false
    fetch(`/api/cart?store_slug=${encodeURIComponent(storeSlug)}`)
      .then((res) => res.json())
      .then((data: { items?: CartItem[]; loggedIn?: boolean }) => {
        if (cancelled) return
        const loggedIn = !!data.loggedIn
        customerLoggedInRef.current = loggedIn
        if (loggedIn && Array.isArray(data.items)) {
          justHydratedRef.current = true
          setItems(data.items)
        }
      })
      .catch(() => {
        if (!cancelled) customerLoggedInRef.current = false
      })

    return () => {
      cancelled = true
    }
  }, [mounted, storeSlug])

  // Persist to localStorage whenever items change
  useEffect(() => {
    if (!mounted) return
    const key = storageKey(storeSlug)
    localStorage.setItem(key, JSON.stringify(items))
  }, [items, mounted, storeSlug])

  // When items change and user is logged in, debounced save to server
  useEffect(() => {
    if (!storeSlug || !customerLoggedInRef.current) return
    if (justHydratedRef.current) {
      justHydratedRef.current = false
      return
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null
      const payload = {
        store_slug: storeSlug,
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      }
      fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {})
    }, SAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [items, storeSlug])

  const replaceItems = useCallback((next: CartItem[]) => {
    setItems(Array.isArray(next) ? next : [])
  }, [])

  const addItem = useCallback((item: CartItem) => {
    setItems((current) => addItemToCart(current, item))
  }, [])

  const removeItem = useCallback((product_id: string) => {
    setItems((current) => current.filter((i) => i.product_id !== product_id))
  }, [])

  const updateQuantity = useCallback((product_id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(product_id)
      return
    }
    setItems((current) =>
      current.map((i) => {
        if (i.product_id === product_id) {
          return { ...i, quantity: Math.min(quantity, i.max_quantity) }
        }
        return i
      })
    )
  }, [removeItem])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const subtotal = computeSubtotal(items)
  const total = subtotal
  const itemCount = computeItemCount(items)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        replaceItems,
        setStoreSlug,
        storeSlug,
        total,
        subtotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}