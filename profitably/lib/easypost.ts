/**
 * EasyPost API client for creating shipping labels and tracking.
 * Docs: https://docs.easypost.com/docs/shipments
 *
 * Environment variable: EASYPOST_API_KEY
 * Get your key at https://www.easypost.com/ (Account → API Keys). Use test key for development.
 */

const EASYPOST_API_BASE = 'https://api.easypost.com/v2'

function getEasyPostApiKey(): string | null {
  return process.env.EASYPOST_API_KEY ?? null
}

function easypostFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const apiKey = getEasyPostApiKey()
  if (!apiKey) {
    return Promise.reject(new Error('EasyPost is not configured: set EASYPOST_API_KEY in your environment'))
  }
  const url = `${EASYPOST_API_BASE}${path}`
  const auth = Buffer.from(`${apiKey}:`).toString('base64')
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

export interface EasyPostAddressInput {
  name: string
  street1: string
  street2?: string | null
  city: string
  state: string
  zip: string
  country: string
  phone?: string | null
}

export interface EasyPostParcelInput {
  length: string // inches
  width: string
  height: string
  distance_unit: 'in' | 'cm'
  weight: string // lbs (we convert to oz for EasyPost)
  mass_unit: 'lb' | 'kg'
}

export interface EasyPostRate {
  object_id: string
  amount: string
  currency: string
  provider: string
  servicelevel: { name: string }
  estimated_days: number | null
  tracking_url?: string | null
}

export interface EasyPostShipmentResponse {
  id: string
  rates: EasyPostRate[]
}

export interface EasyPostTransactionResponse {
  id: string
  tracking_number: string | null
  label_url: string | null
  tracking_url_provider: string | null
  rate?: { provider?: string; servicelevel?: { name?: string } }
}

/**
 * Create a shipment and get available rates.
 * Uses inline to_address, from_address, and parcel.
 */
export async function createShipmentAndGetRates(params: {
  addressFrom: EasyPostAddressInput
  addressTo: EasyPostAddressInput
  parcels: EasyPostParcelInput[]
}): Promise<{ shipment?: EasyPostShipmentResponse; error?: string }> {
  const parcel = params.parcels[0]
  if (!parcel) {
    return { error: 'At least one parcel is required' }
  }
  const weightOz =
    parcel.mass_unit === 'lb'
      ? Math.max(1, Math.round(parseFloat(parcel.weight) * 16))
      : Math.max(1, Math.round(parseFloat(parcel.weight) * 35.274))

  const body = {
    shipment: {
      from_address: {
        name: params.addressFrom.name,
        street1: params.addressFrom.street1,
        ...(params.addressFrom.street2 && { street2: params.addressFrom.street2 }),
        city: params.addressFrom.city,
        state: params.addressFrom.state,
        zip: params.addressFrom.zip,
        country: params.addressFrom.country,
        ...(params.addressFrom.phone && { phone: params.addressFrom.phone }),
      },
      to_address: {
        name: params.addressTo.name,
        street1: params.addressTo.street1,
        ...(params.addressTo.street2 && { street2: params.addressTo.street2 }),
        city: params.addressTo.city,
        state: params.addressTo.state,
        zip: params.addressTo.zip,
        country: params.addressTo.country,
        ...(params.addressTo.phone && { phone: params.addressTo.phone }),
      },
      parcel: {
        length: parseFloat(parcel.length) || 10,
        width: parseFloat(parcel.width) || 8,
        height: parseFloat(parcel.height) || 6,
        weight: weightOz,
      },
    },
  }

  const res = await easypostFetch('/shipments', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg =
      (data?.error?.message ?? data?.error ?? (typeof data?.message === 'string' ? data.message : null)) ||
      'Failed to create shipment'
    return { error: typeof msg === 'string' ? msg : JSON.stringify(msg) }
  }

  const rates = (data.rates ?? []).map((r: { id: string; rate: string; currency: string; carrier: string; service: string; delivery_days?: number; est_delivery_days?: number }) => ({
    object_id: r.id,
    amount: String(r.rate),
    currency: r.currency ?? 'USD',
    provider: r.carrier ?? '',
    servicelevel: { name: r.service ?? '' },
    estimated_days: r.est_delivery_days ?? r.delivery_days ?? null,
    tracking_url: null,
  }))

  return {
    shipment: {
      id: data.id,
      rates,
    },
  }
}

/**
 * Purchase a label by shipment id and rate id. Returns label_url, tracking_code, and carrier.
 */
export async function purchaseLabel(params: {
  shipmentId: string
  rateId: string
  labelFileType?: 'PDF' | 'PNG'
}): Promise<{ transaction?: EasyPostTransactionResponse; error?: string }> {
  const res = await easypostFetch(`/shipments/${params.shipmentId}/buy`, {
    method: 'POST',
    body: JSON.stringify({
      rate: { id: params.rateId },
      ...(params.labelFileType === 'PDF' && { label_format: 'pdf' }),
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg =
      (data?.error?.message ?? data?.error ?? (typeof data?.message === 'string' ? data.message : null)) ||
      'Failed to purchase label'
    return { error: typeof msg === 'string' ? msg : JSON.stringify(msg) }
  }

  const labelUrl = data.postage_label?.label_pdf_url ?? data.postage_label?.label_url ?? null
  const trackingUrl = data.tracker?.public_url ?? null
  const selectedRate = data.selected_rate

  return {
    transaction: {
      id: data.id,
      tracking_number: data.tracking_code ?? null,
      label_url: labelUrl,
      tracking_url_provider: trackingUrl,
      rate: selectedRate
        ? { provider: selectedRate.carrier, servicelevel: { name: selectedRate.service } }
        : undefined,
    },
  }
}

export function isEasyPostConfigured(): boolean {
  return !!getEasyPostApiKey()
}

/** Map EasyPost tracker status to AfterShip-style tag for storefront timeline */
const EASYPOST_STATUS_TO_TAG: Record<string, string> = {
  pre_transit: 'Pending',
  in_transit: 'InTransit',
  out_for_delivery: 'OutForDelivery',
  delivered: 'Delivered',
  available_for_pickup: 'AvailableForPickup',
  return_to_sender: 'Exception',
  failure: 'Exception',
  error: 'Exception',
  cancelled: 'Expired',
  unknown: 'Pending',
}

/** Normalize carrier for EasyPost (e.g. "usps" -> "USPS"). Pass through if already standard. */
function normalizeCarrierForEasyPost(carrier: string | null | undefined): string | null {
  if (!carrier?.trim()) return null
  const c = carrier.trim()
  const upper = c.toUpperCase()
  if (upper === 'USPS' || upper === 'UPS' || upper === 'FEDEX' || upper === 'DHL') return upper
  return c
}

export interface EasyPostTrackingResponse {
  tag: string
  subtag?: string
  subtag_message?: string
  slug: string
  tracking_number: string
  checkpoints: Array<{
    created_at: string
    checkpoint_time: string
    description: string
    location?: string
    tag?: string
    subtag_message?: string
  }>
  expected_delivery?: string
  last_updated_at?: string
}

export interface GetTrackingResult {
  tracking: EasyPostTrackingResponse | null
  error?: string
}

/**
 * Get tracking info via EasyPost (create tracker if needed, then return status + checkpoints).
 * Response shape matches what the storefront /api/tracking and TrackingTimeline expect.
 */
export async function getTracking(
  trackingNumber: string,
  carrier: string | null
): Promise<GetTrackingResult> {
  const apiKey = getEasyPostApiKey()
  if (!apiKey) {
    return { tracking: null, error: 'EasyPost is not configured' }
  }

  const body: { tracker: { tracking_code: string; carrier?: string } } = {
    tracker: { tracking_code: trackingNumber.trim() },
  }
  const normalizedCarrier = normalizeCarrierForEasyPost(carrier)
  if (normalizedCarrier) body.tracker.carrier = normalizedCarrier

  const res = await easypostFetch('/trackers', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg =
      (data?.error?.message ?? data?.error ?? (typeof data?.message === 'string' ? data.message : null)) ||
      'Failed to fetch tracking'
    return { tracking: null, error: typeof msg === 'string' ? msg : JSON.stringify(msg) }
  }

  const status = data.status ?? 'unknown'
  const tag = EASYPOST_STATUS_TO_TAG[status] ?? 'Pending'
  const slug = (data.carrier ?? '').toLowerCase().replace(/\s+/g, '-') || 'unknown'
  const checkpoints = (data.tracking_details ?? []).map(
    (d: { message?: string; datetime?: string; status_detail?: string; tracking_location?: { city?: string; state?: string; zip?: string; country?: string } }) => {
      const loc = d.tracking_location
      const location =
        loc && (loc.city || loc.state || loc.zip)
          ? [loc.city, loc.state, loc.zip].filter(Boolean).join(', ')
          : undefined
      return {
        created_at: d.datetime ?? '',
        checkpoint_time: d.datetime ?? '',
        description: d.message ?? 'Status update',
        location,
        tag: d.status_detail,
        subtag_message: d.status_detail,
      }
    }
  )

  const tracking: EasyPostTrackingResponse = {
    tag,
    subtag_message: data.status_detail ?? undefined,
    slug,
    tracking_number: data.tracking_code ?? trackingNumber.trim(),
    checkpoints,
    expected_delivery: data.est_delivery_date ?? undefined,
    last_updated_at: data.updated_at ?? undefined,
  }

  return { tracking }
}
