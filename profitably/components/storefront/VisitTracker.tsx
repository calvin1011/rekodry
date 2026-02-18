'use client'

import { useEffect } from 'react'

interface VisitTrackerProps {
  storeSlug: string
}

export default function VisitTracker({ storeSlug }: VisitTrackerProps) {
  useEffect(() => {
    if (!storeSlug) return
    fetch('/api/store-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ store_slug: storeSlug }),
    }).catch(() => {
      // Silently ignore network/errors; do not track or log
    })
  }, [storeSlug])

  return null
}
