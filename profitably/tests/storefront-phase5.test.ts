import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const SUCCESS_CLIENT_PATH = join(__dirname, '../components/storefront/SuccessClient.tsx')

describe('Phase 5 Storefront (Prominent checkout-finishing modal/overlay on success page)', () => {
  it('renders a fixed overlay for the success modal (inset-0, z-50)', () => {
    const source = readFileSync(SUCCESS_CLIENT_PATH, 'utf-8')
    expect(source).toMatch(/fixed\s+inset-0/)
    expect(source).toMatch(/z-50/)
  })

  it('shows prominent "Order complete!" / checkout complete messaging in the modal', () => {
    const source = readFileSync(SUCCESS_CLIENT_PATH, 'utf-8')
    expect(source).toContain('Order complete!')
    expect(source).toMatch(/checkout.*complete|complete.*checkout/i)
  })

  it('uses a backdrop for the modal (backdrop-blur or overlay)', () => {
    const source = readFileSync(SUCCESS_CLIENT_PATH, 'utf-8')
    expect(source).toMatch(/backdrop-blur|bg-black\/|backdrop/)
  })

  it('provides a dismiss control (button to close modal and view order details)', () => {
    const source = readFileSync(SUCCESS_CLIENT_PATH, 'utf-8')
    expect(source).toMatch(/setShowSuccessModal\s*\(\s*false\s*\)/)
    expect(source).toMatch(/View order details/)
  })

  it('marks the modal as a dialog for accessibility (role="dialog", aria-modal)', () => {
    const source = readFileSync(SUCCESS_CLIENT_PATH, 'utf-8')
    expect(source).toMatch(/role=["']dialog["']/)
    expect(source).toMatch(/aria-modal=["']true["']/)
  })
})
