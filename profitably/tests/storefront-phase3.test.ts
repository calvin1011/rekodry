import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const STOREFRONT_HEADER_PATH = join(__dirname, '../components/storefront/StorefrontHeader.tsx')
const STOREFRONT_SIDEBAR_PATH = join(__dirname, '../components/storefront/StorefrontSidebar.tsx')

describe('Phase 3 Storefront (Mobile: hamburger left, store name center, no separate Menu bar)', () => {
  it('header has hamburger on the left on mobile (Open menu button with three-line icon)', () => {
    const source = readFileSync(STOREFRONT_HEADER_PATH, 'utf-8')
    expect(source).toMatch(/aria-label=["']Open menu["']/)
    expect(source).toContain('M4 6h16M4 12h16M4 18h16')
    expect(source).toMatch(/md:hidden.*grid|grid.*md:hidden/)
  })

  it('header centers store name on mobile (grid center column)', () => {
    const source = readFileSync(STOREFRONT_HEADER_PATH, 'utf-8')
    expect(source).toMatch(/grid-cols-3/)
    expect(source).toMatch(/justify-center|text-center/)
  })

  it('sidebar has no separate Menu bar (no sticky top-16 bar with "Menu" button)', () => {
    const source = readFileSync(STOREFRONT_SIDEBAR_PATH, 'utf-8')
    expect(source).not.toMatch(/sticky top-16.*\n.*Menu/)
    expect(source).not.toMatch(/>\s*Menu\s*<\/button>/)
  })
})
