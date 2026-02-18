import { NextResponse } from 'next/server'
import { getTracking } from '@/lib/aftership'

/**
 * GET /api/tracking?tracking_number=XXX&carrier=YYY
 * Returns AfterShip tracking status and checkpoints for the storefront.
 * carrier is optional (e.g. USPS, UPS); if omitted, AfterShip will try to detect.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const trackingNumber = searchParams.get('tracking_number')
  const carrier = searchParams.get('carrier') || null

  if (!trackingNumber?.trim()) {
    return NextResponse.json(
      { error: 'tracking_number is required' },
      { status: 400 }
    )
  }

  const result = await getTracking(trackingNumber.trim(), carrier)

  if (result.error && !result.tracking) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    )
  }

  return NextResponse.json({
    tracking: result.tracking
      ? {
          tag: result.tracking.tag,
          subtag: result.tracking.subtag,
          subtag_message: result.tracking.subtag_message,
          slug: result.tracking.slug,
          tracking_number: result.tracking.tracking_number,
          checkpoints: result.tracking.checkpoints ?? [],
          expected_delivery: result.tracking.expected_delivery,
          last_updated_at: result.tracking.last_updated_at,
        }
      : null,
  })
}
