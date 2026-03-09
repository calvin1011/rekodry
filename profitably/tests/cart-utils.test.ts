import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  computeSubtotal,
  computeItemCount,
  addItemToCart,
  type CartItemLike,
} from '../lib/cart-utils'

const CART_SLIDE_OVER_PATH = join(__dirname, '../components/storefront/CartSlideOver.tsx')

const createItem = (overrides: Partial<CartItemLike> = {}): CartItemLike => ({
  product_id: 'p1',
  price: 10,
  quantity: 1,
  max_quantity: 10,
  ...overrides,
})

describe('computeSubtotal', () => {
  it('returns 0 for empty array', () => {
    expect(computeSubtotal([])).toBe(0)
  })

  it('returns price * quantity for one item', () => {
    expect(computeSubtotal([{ price: 10, quantity: 2 }])).toBe(20)
  })

  it('sums multiple items', () => {
    expect(
      computeSubtotal([
        { price: 5, quantity: 2 },
        { price: 10, quantity: 1 },
      ])
    ).toBe(20)
  })
})

describe('computeItemCount', () => {
  it('returns 0 for empty array', () => {
    expect(computeItemCount([])).toBe(0)
  })

  it('returns total quantity across items', () => {
    expect(
      computeItemCount([{ quantity: 2 }, { quantity: 3 }])
    ).toBe(5)
  })
})

describe('addItemToCart', () => {
  it('adds new item when cart is empty', () => {
    const item = createItem({ product_id: 'p1', quantity: 1 })
    expect(addItemToCart([], item)).toEqual([item])
  })

  it('adds new item when product_id is not in cart', () => {
    const existing = createItem({ product_id: 'p1', quantity: 1 })
    const newItem = createItem({ product_id: 'p2', quantity: 2 })
    expect(addItemToCart([existing], newItem)).toEqual([existing, newItem])
  })

  it('merges quantity when product already in cart', () => {
    const existing = createItem({ product_id: 'p1', quantity: 2, max_quantity: 10 })
    const added = createItem({ product_id: 'p1', quantity: 3, max_quantity: 10 })
    const result = addItemToCart([existing], added)
    expect(result).toHaveLength(1)
    expect(result[0].quantity).toBe(5)
  })

  it('caps quantity at max_quantity when merging', () => {
    const existing = createItem({ product_id: 'p1', quantity: 8, max_quantity: 10 })
    const added = createItem({ product_id: 'p1', quantity: 5, max_quantity: 10 })
    const result = addItemToCart([existing], added)
    expect(result).toHaveLength(1)
    expect(result[0].quantity).toBe(10)
  })
})

describe('Phase 1 Cart UI (CartSlideOver)', () => {
  it('uses solid panel (100% opacity) and cover-style overlay', () => {
    const source = readFileSync(CART_SLIDE_OVER_PATH, 'utf-8')
    expect(source).toContain('bg-slate-950/90')
    expect(source).toMatch(/bg-slate-950[^/]/)
  })
})
