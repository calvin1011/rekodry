export type SessionType = 'customer' | 'guest' | 'none'

type SessionPayload =
  | { exp?: number; type?: 'guest'; orderId?: string }
  | { exp?: number; type?: 'customer'; customerId?: string; email?: string }

type SessionResolvers = {
  getOrderCustomerId?: (orderId: string) => Promise<string | null>
  getCustomerIdByEmail?: (email: string) => Promise<string | null>
}

type ResolveSessionParams = {
  customerIdCookie: string | null
  sessionToken: string | null
  resolvers?: SessionResolvers
}

export async function resolveCustomerSession({
  customerIdCookie,
  sessionToken,
  resolvers,
}: ResolveSessionParams): Promise<{ sessionType: SessionType; customerId: string | null }> {
  if (customerIdCookie) {
    return { sessionType: 'customer', customerId: customerIdCookie }
  }

  if (!sessionToken) {
    return { sessionType: 'none', customerId: null }
  }

  try {
    const payload = JSON.parse(
      Buffer.from(sessionToken, 'base64').toString()
    ) as SessionPayload

    if (!payload?.exp || Date.now() >= payload.exp) {
      return { sessionType: 'none', customerId: null }
    }

    if (payload.type === 'guest') {
      if (!payload.orderId || !resolvers?.getOrderCustomerId) {
        return { sessionType: 'none', customerId: null }
      }
      const customerId = await resolvers.getOrderCustomerId(payload.orderId)
      if (!customerId) {
        return { sessionType: 'none', customerId: null }
      }
      return { sessionType: 'guest', customerId }
    }

    if (payload.type === 'customer') {
      if (payload.customerId) {
        return { sessionType: 'customer', customerId: payload.customerId }
      }
      if (payload.email && resolvers?.getCustomerIdByEmail) {
        const customerId = await resolvers.getCustomerIdByEmail(payload.email)
        if (!customerId) {
          return { sessionType: 'none', customerId: null }
        }
        return { sessionType: 'customer', customerId }
      }
    }
  } catch {
    return { sessionType: 'none', customerId: null }
  }

  return { sessionType: 'none', customerId: null }
}
