/**
 * AfterShip Tracking API helpers.
 * Docs: https://aftership.com/docs/tracking
 */

const AFTERSHIP_API_BASE = 'https://api.aftership.com/tracking/2025-07'

/** Map common carrier names (as sellers might type) to AfterShip courier slugs */
export const CARRIER_TO_SLUG: Record<string, string> = {
  usps: 'usps',
  USPS: 'usps',
  ups: 'ups',
  UPS: 'ups',
  fedex: 'fedex',
  FedEx: 'fedex',
  Fedex: 'fedex',
  dhl: 'dhl',
  DHL: 'dhl',
  ontrac: 'ontrac',
  OnTrac: 'ontrac',
  lasership: 'lasership',
  LaserShip: 'lasership',
}

/** Normalize carrier to AfterShip slug (lowercase, trim). Returns null if unknown. */
export function carrierToSlug(carrier: string | null | undefined): string | null {
  if (!carrier?.trim()) return null
  const trimmed = carrier.trim()
  return CARRIER_TO_SLUG[trimmed] ?? trimmed.toLowerCase().replace(/\s+/g, '-')
}

export interface AfterShipCheckpoint {
  created_at: string
  description: string
  location?: string
  checkpoint_time: string
  tag?: string
  subtag_message?: string
}

export interface AfterShipTrackingResponse {
  id: string
  tracking_number: string
  slug: string
  tag: string
  subtag?: string
  subtag_message?: string
  checkpoints: AfterShipCheckpoint[]
  expected_delivery?: string
  tracked_count: number
  active: boolean
  unique_token?: string
  last_updated_at?: string
  delivery_type?: string
  origin_raw_location?: string
  destination_raw_location?: string
}

export interface GetTrackingResult {
  tracking: AfterShipTrackingResponse | null
  error?: string
}

/**
 * Get tracking info from AfterShip. If the tracking doesn't exist in AfterShip,
 * creates it first (so they can fetch from carrier), then returns the tracking.
 * Requires AFTERSHIP_API_KEY in env.
 */
export async function getTracking(
  trackingNumber: string,
  carrierSlug: string | null
): Promise<GetTrackingResult> {
  const apiKey = process.env.AFTERSHIP_API_KEY
  if (!apiKey) {
    return { tracking: null, error: 'AfterShip is not configured' }
  }

  const slug = carrierSlug ? carrierToSlug(carrierSlug) ?? carrierSlug.toLowerCase().replace(/\s+/g, '-') : null
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'as-api-key': apiKey,
  }

  // If we have a slug, try to get existing tracking first
  if (slug) {
    const getRes = await fetch(
      `${AFTERSHIP_API_BASE}/trackings/${encodeURIComponent(slug)}/${encodeURIComponent(trackingNumber)}`,
      { headers }
    )
    if (getRes.ok) {
      const json = await getRes.json()
      const tracking = json?.data?.tracking ?? json?.tracking
      if (tracking) return { tracking }
    }
    // 404 or other: we'll create below (only if we have slug)
  }

  // Create tracking so AfterShip can fetch from carrier (idempotent-ish: may return existing)
  const createBody: { tracking_number: string; slug?: string } = {
    tracking_number: trackingNumber.trim(),
  }
  if (slug) createBody.slug = slug

  const createRes = await fetch(`${AFTERSHIP_API_BASE}/trackings`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ tracking: createBody }),
  })

  if (!createRes.ok) {
    const errBody = await createRes.text()
    let error = 'Failed to fetch tracking'
    try {
      const errJson = JSON.parse(errBody)
      error = errJson?.meta?.message || errJson?.message || error
    } catch {
      error = errBody.slice(0, 200) || error
    }
    return { tracking: null, error }
  }

  const createJson = await createRes.json()
  const created = createJson?.data?.tracking ?? createJson?.tracking
  if (created) return { tracking: created }

  // If create succeeded but no slug (detect), get by id
  const id = createJson?.data?.tracking?.id
  if (id) {
    const getByIdRes = await fetch(`${AFTERSHIP_API_BASE}/trackings/${id}`, { headers })
    if (getByIdRes.ok) {
      const getJson = await getByIdRes.json()
      const t = getJson?.data?.tracking ?? getJson?.tracking
      if (t) return { tracking: t }
    }
  }

  return { tracking: null, error: 'Tracking created but data not available yet. Try again in a moment.' }
}
