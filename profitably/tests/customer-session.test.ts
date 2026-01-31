import { describe, expect, it } from 'vitest'
import { resolveCustomerSession } from '../lib/customer-session'

const createToken = (payload: Record<string, unknown>) =>
  Buffer.from(JSON.stringify(payload)).toString('base64')

describe('resolveCustomerSession', () => {
  it('returns customer session when cookie exists', async () => {
    const result = await resolveCustomerSession({
      customerIdCookie: 'customer-123',
      sessionToken: null,
    })
    expect(result).toEqual({ sessionType: 'customer', customerId: 'customer-123' })
  })

  it('returns none when guest resolver fails to resolve', async () => {
    const token = createToken({
      type: 'guest',
      orderId: 'order-1',
      exp: Date.now() + 1000,
    })

    const result = await resolveCustomerSession({
      customerIdCookie: null,
      sessionToken: token,
      resolvers: {
        getOrderCustomerId: async () => null,
      },
    })

    expect(result).toEqual({ sessionType: 'none', customerId: null })
  })

  it('returns customer session when email lookup resolves', async () => {
    const token = createToken({
      type: 'customer',
      email: 'test@example.com',
      exp: Date.now() + 1000,
    })

    const result = await resolveCustomerSession({
      customerIdCookie: null,
      sessionToken: token,
      resolvers: {
        getCustomerIdByEmail: async () => 'customer-999',
      },
    })

    expect(result).toEqual({ sessionType: 'customer', customerId: 'customer-999' })
  })
})
