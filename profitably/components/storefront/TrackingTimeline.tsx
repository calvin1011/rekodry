'use client'

import { useEffect, useState } from 'react'

interface Checkpoint {
  created_at: string
  checkpoint_time: string
  description: string
  location?: string
  tag?: string
  subtag_message?: string
}

interface TrackingData {
  tag: string
  subtag?: string
  subtag_message?: string
  slug: string
  tracking_number: string
  checkpoints: Checkpoint[]
  expected_delivery?: string
  last_updated_at?: string
}

interface TrackingTimelineProps {
  trackingNumber: string
  trackingCarrier?: string | null
  trackingUrl?: string | null
}

const TAG_LABELS: Record<string, string> = {
  Pending: 'Label created',
  InfoReceived: 'Info received',
  InTransit: 'In transit',
  OutForDelivery: 'Out for delivery',
  Delivered: 'Delivered',
  AvailableForPickup: 'Available for pickup',
  Exception: 'Exception',
  AttemptFail: 'Delivery attempted',
  Expired: 'Expired',
}

function formatCheckpointTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function TrackingTimeline({
  trackingNumber,
  trackingCarrier,
  trackingUrl,
}: TrackingTimelineProps) {
  const [data, setData] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ tracking_number: trackingNumber })
    if (trackingCarrier?.trim()) params.set('carrier', trackingCarrier.trim())

    fetch(`/api/tracking?${params.toString()}`)
      .then((res) => {
        if (!res.ok) return res.json().then((b) => Promise.reject(b?.error || res.statusText))
        return res.json()
      })
      .then((body) => {
        if (cancelled) return
        if (body.tracking) setData(body.tracking)
        else setError('Tracking data is not available yet.')
      })
      .catch((err) => {
        if (cancelled) return
        setError(typeof err === 'string' ? err : err?.message || 'Unable to load tracking')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [trackingNumber, trackingCarrier])

  const tagLabel = data?.tag ? (TAG_LABELS[data.tag] ?? data.tag.replace(/([A-Z])/g, ' $1').trim()) : null
  const checkpoints = (data?.checkpoints ?? []).slice().sort((a, b) => {
    const t1 = a.checkpoint_time || a.created_at
    const t2 = b.checkpoint_time || b.created_at
    return new Date(t2).getTime() - new Date(t1).getTime()
  })

  return (
    <div className="mt-4">
      {loading && (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
          <svg
            className="animate-spin h-5 w-5 text-profit-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading tracking status…
        </div>
      )}

      {error && !loading && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm p-4">
          {error}
          {trackingUrl && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-profit-400 hover:text-profit-300"
            >
              Track on carrier website →
            </a>
          )}
        </div>
      )}

      {data && !loading && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-slate-700/80 text-slate-200 text-sm font-medium capitalize">
              {tagLabel ?? data.tag}
            </span>
            {data.expected_delivery && (
              <span className="text-slate-400 text-sm">
                Est. delivery: {formatCheckpointTime(data.expected_delivery)}
              </span>
            )}
          </div>

          {checkpoints.length > 0 ? (
            <ul className="relative border-l-2 border-slate-700 pl-6 space-y-5">
              {checkpoints.map((cp, i) => (
                <li key={i} className="relative">
                  <span
                    className="absolute -left-[29px] top-1.5 w-3 h-3 rounded-full bg-profit-500 border-2 border-slate-900"
                    aria-hidden
                  />
                  <div>
                    <p className="text-slate-200 text-sm font-medium">{cp.description}</p>
                    {cp.location && (
                      <p className="text-slate-500 text-xs mt-0.5">{cp.location}</p>
                    )}
                    <p className="text-slate-500 text-xs mt-1">
                      {formatCheckpointTime(cp.checkpoint_time || cp.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm">No scan history yet. Updates usually appear within 24 hours.</p>
          )}

          {trackingUrl && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-profit-400 hover:text-profit-300 text-sm"
            >
              Track on carrier website
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      )}
    </div>
  )
}
