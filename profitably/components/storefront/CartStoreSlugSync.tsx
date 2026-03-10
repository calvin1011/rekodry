'use client'

import { useEffect } from 'react'
import { useCart } from '@/lib/cart-context'

/** Call setStoreSlug when we're on a store page so cart loads/saves for this store. */
export default function CartStoreSlugSync({ storeSlug }: { storeSlug: string }) {
  const { setStoreSlug } = useCart()

  useEffect(() => {
    setStoreSlug(storeSlug)
    return () => setStoreSlug(null)
  }, [storeSlug, setStoreSlug])

  return null
}
