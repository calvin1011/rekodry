import { createHmac, timingSafeEqual } from 'node:crypto'

export const COOKIE_NAME = 'store_customer_session'
const SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'default-secret-key-change-me'

// Helper Functions for Token Signing

export function signToken(payload: object, expiresInMinutes: number = 15): string {
  const data = JSON.stringify({
    ...payload,
    exp: Date.now() + expiresInMinutes * 60 * 1000,
  })
  const signature = createHmac('sha256', SECRET_KEY).update(data).digest('hex')
  return `${Buffer.from(data).toString('base64')}.${signature}`
}

export function verifyToken(token: string): any | null {
  try {
    const [encodedData, signature] = token.split('.')
    if (!encodedData || !signature) return null

    const dataStr = Buffer.from(encodedData, 'base64').toString()
    const expectedSignature = createHmac('sha256', SECRET_KEY).update(dataStr).digest('hex')

    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null
    }

    const payload = JSON.parse(dataStr)
    if (Date.now() > payload.exp) return null

    return payload
  } catch (error) {
    return null
  }
}