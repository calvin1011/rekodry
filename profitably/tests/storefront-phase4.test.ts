import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const STOREFRONT_HEADER_PATH = join(__dirname, '../components/storefront/StorefrontHeader.tsx')

describe('Phase 4 Storefront (Larger, front-and-center logo; green accent)', () => {
  it('uses responsive logo sizing on desktop (taller than mobile)', () => {
    const source = readFileSync(STOREFRONT_HEADER_PATH, 'utf-8')
    expect(source).toMatch(/h-11.*object-contain|object-contain.*h-11/)
    expect(source).toContain('RemoteImage')
  })

  it('uses next/image RemoteImage for store logo when logo_url is present', () => {
    const source = readFileSync(STOREFRONT_HEADER_PATH, 'utf-8')
    expect(source).toContain('store.logo_url ?')
    expect(source).toMatch(/isScrolled \? ['\"]h-8['\"] : ['\"]h-10['\"]/)
  })

  it('keeps green accent (profit color for focus or hover)', () => {
    const source = readFileSync(STOREFRONT_HEADER_PATH, 'utf-8')
    expect(source).toMatch(/ring-profit-500|text-profit-400|profit-500|profit-400/)
  })

  it('uses logo as visual focus on desktop (link wraps logo and name with green hover)', () => {
    const source = readFileSync(STOREFRONT_HEADER_PATH, 'utf-8')
    expect(source).toMatch(/hover:text-profit-400/)
  })
})
