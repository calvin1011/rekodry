import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const STORE_LAYOUT_PATH = join(__dirname, '../app/(storefront)/store/[slug]/layout.tsx')
const STOREFRONT_SIDEBAR_PATH = join(__dirname, '../components/storefront/StorefrontSidebar.tsx')

describe('Phase 2 Storefront (Account icon + sidebar)', () => {
  it('header has account icon link next to cart (href to account, aria-label)', () => {
    const source = readFileSync(STORE_LAYOUT_PATH, 'utf-8')
    expect(source).toContain('/account')
    expect(source).toMatch(/aria-label=["']Account["']/)
  })

  it('sidebar does not show misleading "Account" section label', () => {
    const source = readFileSync(STOREFRONT_SIDEBAR_PATH, 'utf-8')
    // The section header was: uppercase tracking-widest + "Account" in a div
    expect(source).not.toMatch(/>Account\s*<\/div>/)
  })
})
