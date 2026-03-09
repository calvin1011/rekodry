import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const STORE_PAGE_PATH = join(__dirname, '../app/(storefront)/store/[slug]/page.tsx')
const PRODUCT_GRID_PATH = join(__dirname, '../components/storefront/ProductGrid.tsx')
const INVENTORY_CLIENT_PATH = join(__dirname, '../components/inventory/InventoryClient.tsx')

describe('Phase 6 Storefront (Category list from items + category filter on products)', () => {
  describe('Store page fetches item category and supports category filter', () => {
    it('selects items.category in the products query', () => {
      const source = readFileSync(STORE_PAGE_PATH, 'utf-8')
      expect(source).toMatch(/items!inner\s*\(\s*[\s\S]*?category/)
      expect(source).toMatch(/quantity_on_hand[\s\S]*?category|category[\s\S]*?quantity_on_hand/)
    })

    it('accepts searchParams with category', () => {
      const source = readFileSync(STORE_PAGE_PATH, 'utf-8')
      expect(source).toMatch(/searchParams[\s\S]*?category|category[\s\S]*?searchParams/)
      expect(source).toMatch(/categoryParam|selectedCategory/)
    })

    it('derives unique categories from products and filters by selected category', () => {
      const source = readFileSync(STORE_PAGE_PATH, 'utf-8')
      expect(source).toMatch(/categories\s*=\s*Array\.from|new Set/)
      expect(source).toMatch(/productsToShow|selectedCategory/)
      expect(source).toMatch(/categories=\{categories\}/)
      expect(source).toMatch(/selectedCategory=\{selectedCategory\}/)
    })
  })

  describe('ProductGrid category list and filter', () => {
    it('accepts categories and selectedCategory props', () => {
      const source = readFileSync(PRODUCT_GRID_PATH, 'utf-8')
      expect(source).toMatch(/categories\?:/);
      expect(source).toMatch(/selectedCategory\?:/)
    })

    it('renders category pills with All and per-category links', () => {
      const source = readFileSync(PRODUCT_GRID_PATH, 'utf-8')
      expect(source).toMatch(/categories\.length\s*>\s*0/)
      expect(source).toContain('All')
      expect(source).toMatch(/categories\.map\s*\(\s*\(?\s*cat\s*\)?\s*=>/)
      expect(source).toMatch(/\/store\/\$\{storeSlug\}\?category=/)
      expect(source).toMatch(/encodeURIComponent\s*\(\s*cat\s*\)/)
    })

    it('includes item category in search filter', () => {
      const source = readFileSync(PRODUCT_GRID_PATH, 'utf-8')
      expect(source).toMatch(/getItemCategory|\.category\s*\)?\s*\.toLowerCase\(\)\.includes\(query\)|categoryMatch/)
    })
  })

  describe('Inventory category filter (optional)', () => {
    it('derives unique categories from initialItems', () => {
      const source = readFileSync(INVENTORY_CLIENT_PATH, 'utf-8')
      expect(source).toMatch(/categories\s*=\s*Array\.from|new Set.*initialItems.*category/)
    })

    it('has category filter dropdown when categories exist', () => {
      const source = readFileSync(INVENTORY_CLIENT_PATH, 'utf-8')
      expect(source).toMatch(/categories\.length\s*>\s*0/)
      expect(source).toMatch(/categoryFilter|setCategoryFilter/)
      expect(source).toContain('All categories')
      expect(source).toMatch(/<select[\s\S]*?categoryFilter|categoryFilter[\s\S]*?<select/)
    })

    it('filters items by selected category and search', () => {
      const source = readFileSync(INVENTORY_CLIENT_PATH, 'utf-8')
      expect(source).toMatch(/matchesCategory|categoryFilter/)
      expect(source).toMatch(/matchesSearch/)
      expect(source).toMatch(/const filteredItems = initialItems\.filter/)
    })
  })
})
