'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useCart } from '@/lib/cart-context'

interface OrderQuickActionsProps {
  storeSlug: string
  orderNumber: string
  storeName?: string | null
  businessEmail?: string | null
  businessPhone?: string | null
  items: {
    product_id: string
    title: string
    price: number
    quantity: number
    products?: {
      product_images?: { image_url: string | null }[]
      items?: { quantity_on_hand: number | null }[] | { quantity_on_hand: number | null }
    } | null
  }[]
}

export default function OrderQuickActions({
  storeSlug,
  orderNumber,
  storeName,
  businessEmail,
  businessPhone,
}: OrderQuickActionsProps) {
  const { addItem } = useCart()
  const subject = encodeURIComponent(`Order ${orderNumber} support`)
  const mailto = businessEmail ? `mailto:${businessEmail}?subject=${subject}` : null
  const tel = businessPhone ? `tel:${businessPhone}` : null
  const hasItems = items.length > 0

  const reorderItems = useMemo(() => {
    return items.map((item) => {
      const images = item.products?.product_images || []
      const mainImage = images[0]?.image_url || ''
      const productItems = item.products?.items
      const quantityOnHand = Array.isArray(productItems)
        ? productItems[0]?.quantity_on_hand
        : productItems?.quantity_on_hand

      return {
        product_id: item.product_id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        image_url: mainImage,
        max_quantity: quantityOnHand ?? item.quantity,
      }
    })
  }, [items])

  const handleReorder = () => {
    reorderItems.forEach((item) => addItem(item))
  }

  return (
    <div className="glass-dark rounded-xl border border-slate-800 p-5 sm:p-6 mb-8 shadow-lg">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Quick Actions</h2>
          <p className="text-sm text-slate-400">
            Need help with this order? Reach out or grab a receipt anytime.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleReorder}
            disabled={!hasItems}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-profit-600 text-white hover:bg-profit-500 transition-colors
                     disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Re-order Items
          </button>

          {mailto && (
            <a
              href={mailto}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Contact {storeName || 'Store'}
            </a>
          )}

          {tel && (
            <a
              href={tel}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Call Store
            </a>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Download Receipt
          </button>
        </div>
      </div>
    </div>
  )
}
