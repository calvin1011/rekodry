/**
 * Shippo API client for creating shipping labels.
 * Docs: https://docs.goshippo.com/shippoapi/public-api/overview
 *
 * Environment variable: SHIPPO_API_KEY (or SHIPPO_TOKEN)
 * Get your token at https://goshippo.com/ (API settings). Use test token for development.
 */

const SHIPPO_API_BASE = 'https://api.goshippo.com'

function getShippoToken(): string | null {
  return process.env.SHIPPO_API_KEY ?? process.env.SHIPPO_TOKEN ?? null
}

function shippoFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getShippoToken()
  if (!token) {
    return Promise.reject(new Error('Shippo is not configured: set SHIPPO_API_KEY in your environment'))
  }
  const url = `${SHIPPO_API_BASE}${path}`
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `ShippoToken ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

export interface ShippoAddressInput {
  name: string
  street1: string
  street2?: string | null
  city: string
  state: string
  zip: string
  country: string
  phone?: string | null
}

export interface ShippoParcelInput {
  length: string // inches
  width: string
  height: string
  distance_unit: 'in' | 'cm'
  weight: string // lbs or kg
  mass_unit: 'lb' | 'kg'
}

export interface ShippoRate {
  object_id: string
  amount: string
  currency: string
  provider: string
  servicelevel: { name: string; token: string }
  estimated_days: number | null
  duration_terms: string | null
  tracking_url?: string | null
}

export interface ShippoShipmentResponse {
  object_id: string
  status: string
  rates: ShippoRate[]
  address_from: { name?: string; street1?: string; city?: string; state?: string; zip?: string; country?: string }
  address_to: { name?: string; street1?: string; city?: string; state?: string; zip?: string; country?: string }
}

export interface ShippoTransactionResponse {
  object_id: string
  status: string
  tracking_number: string | null
  label_url: string | null
  tracking_url_provider: string | null
  rate: { provider?: string; servicelevel?: { name?: string } }
}

/**
 * Create a shipment and get available rates.
 * Uses inline address_from, address_to, and parcels (no need to create address/parcel objects first).
 */
export async function createShipmentAndGetRates(params: {
  addressFrom: ShippoAddressInput
  addressTo: ShippoAddressInput
  parcels: ShippoParcelInput[]
}): Promise<{ shipment?: ShippoShipmentResponse; error?: string }> {
  const body = {
    address_from: {
      name: params.addressFrom.name,
      street1: params.addressFrom.street1,
      ...(params.addressFrom.street2 && { street2: params.addressFrom.street2 }),
      city: params.addressFrom.city,
      state: params.addressFrom.state,
      zip: params.addressFrom.zip,
      country: params.addressFrom.country,
      ...(params.addressFrom.phone && { phone: params.addressFrom.phone }),
    },
    address_to: {
      name: params.addressTo.name,
      street1: params.addressTo.street1,
      ...(params.addressTo.street2 && { street2: params.addressTo.street2 }),
      city: params.addressTo.city,
      state: params.addressTo.state,
      zip: params.addressTo.zip,
      country: params.addressTo.country,
      ...(params.addressTo.phone && { phone: params.addressTo.phone }),
    },
    parcels: params.parcels.map((p) => ({
      length: p.length,
      width: p.width,
      height: p.height,
      distance_unit: p.distance_unit,
      weight: p.weight,
      mass_unit: p.mass_unit,
    })),
    async: false,
  }

  const res = await shippoFetch('/shipments/', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = typeof data?.message === 'string' ? data.message : data?.detail ?? 'Failed to create shipment'
    return { error: msg }
  }

  return { shipment: data as ShippoShipmentResponse }
}

/**
 * Purchase a label by rate object_id. Returns label_url and tracking_number.
 */
export async function purchaseLabel(params: {
  rateObjectId: string
  labelFileType?: 'PDF' | 'PNG'
}): Promise<{ transaction?: ShippoTransactionResponse; error?: string }> {
  const body = {
    rate: params.rateObjectId,
    label_file_type: params.labelFileType ?? 'PDF',
    async: false,
  }

  const res = await shippoFetch('/transactions/', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = typeof data?.message === 'string' ? data.message : data?.detail ?? 'Failed to purchase label'
    return { error: msg }
  }

  if (data?.status === 'ERROR' || data?.status === 'REFUNDED') {
    return {
      transaction: data as ShippoTransactionResponse,
      error: (data as { messages?: string[] })?.messages?.join(', ') ?? 'Label purchase failed',
    }
  }

  return { transaction: data as ShippoTransactionResponse }
}

export function isShippoConfigured(): boolean {
  return !!getShippoToken()
}
