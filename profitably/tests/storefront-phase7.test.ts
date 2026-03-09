import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const PRODUCT_DETAIL_CLIENT_PATH = join(__dirname, '../components/storefront/ProductDetailClient.tsx')
const CART_SLIDE_OVER_PATH = join(__dirname, '../components/storefront/CartSlideOver.tsx')
const CHECKOUT_CLIENT_PATH = join(__dirname, '../components/storefront/CheckoutClient.tsx')
const WISHLIST_CLIENT_PATH = join(__dirname, '../app/(storefront)/store/[slug]/wishlist/WishlistClient.tsx')

describe('Phase 7 Storefront (Add to Cart / Buy button press feedback)', () => {
  describe('ProductDetailClient Add to Cart button', () => {
    it('uses motion.button for Add to Cart with whileTap scale', () => {
      const source = readFileSync(PRODUCT_DETAIL_CLIENT_PATH, 'utf-8')
      expect(source).toMatch(/motion\.button/)
      expect(source).toMatch(/whileTap=\{\{\s*scale:\s*0\.93\s*\}\}/)
    })

    it('uses spring transition for tactile feedback', () => {
      const source = readFileSync(PRODUCT_DETAIL_CLIENT_PATH, 'utf-8')
      expect(source).toMatch(/type:\s*['"]spring['"]/)
      expect(source).toMatch(/stiffness:\s*400|damping:\s*17/)
    })
  })

  describe('CartSlideOver Checkout button', () => {
    it('wraps Checkout link/button with motion and whileTap', () => {
      const source = readFileSync(CART_SLIDE_OVER_PATH, 'utf-8')
      expect(source).toMatch(/motion\.(div|button)/)
      expect(source).toMatch(/whileTap=\{\{\s*scale:\s*0\.93\s*\}\}/)
      expect(source).toMatch(/Checkout/)
    })

    it('uses spring transition for Checkout CTA', () => {
      const source = readFileSync(CART_SLIDE_OVER_PATH, 'utf-8')
      expect(source).toMatch(/type:\s*['"]spring['"]/)
    })
  })

  describe('CheckoutClient Place order / Pay button', () => {
    it('uses motion.button for submit with whileTap', () => {
      const source = readFileSync(CHECKOUT_CLIENT_PATH, 'utf-8')
      expect(source).toMatch(/motion\.button/)
      expect(source).toMatch(/whileTap=\{\{\s*scale:\s*0\.93\s*\}\}/)
      expect(source).toMatch(/type=["']submit["']/)
    })

    it('uses spring transition on submit button', () => {
      const source = readFileSync(CHECKOUT_CLIENT_PATH, 'utf-8')
      expect(source).toMatch(/type:\s*['"]spring['"]/)
    })
  })

  describe('WishlistClient Add to Cart button', () => {
    it('uses motion.button for Add to Cart with whileTap', () => {
      const source = readFileSync(WISHLIST_CLIENT_PATH, 'utf-8')
      expect(source).toMatch(/motion\.button/)
      expect(source).toMatch(/whileTap=\{\{\s*scale:\s*0\.93\s*\}\}/)
      expect(source).toContain('Add to Cart')
    })

    it('uses spring transition for Add to Cart press feedback', () => {
      const source = readFileSync(WISHLIST_CLIENT_PATH, 'utf-8')
      expect(source).toMatch(/type:\s*['"]spring['"]/)
      expect(source).toMatch(/stiffness:\s*400|damping:\s*17/)
    })
  })
})
