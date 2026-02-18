'use client'

import { useState, useEffect } from 'react'

const SESSION_KEY = 'rekodry_product_request_prompted'
/** Delay (ms) before showing the dialog so visitors can browse first */
const SHOW_DELAY_MS = 18_000

type FormState = { error?: string; success?: boolean }

export default function ProductRequestDialog({ storeSlug }: { storeSlug: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, setState] = useState<FormState>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [productName, setProductName] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const prompted = sessionStorage.getItem(SESSION_KEY)
    if (prompted) return
    const timer = setTimeout(() => setIsOpen(true), SHOW_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  function dismiss() {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, '1')
    }
    setIsOpen(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = productName.trim()
    if (!trimmed) {
      setState({ error: 'Please enter a product name' })
      return
    }

    setIsSubmitting(true)
    setState({})

    try {
      const response = await fetch('/api/customer-product-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeSlug,
          productName: trimmed,
          notes: notes.trim() || undefined,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(SESSION_KEY, '1')
        }
        setState({ success: true })
        setTimeout(() => {
          setIsOpen(false)
          setProductName('')
          setNotes('')
          setState({})
        }, 1500)
      } else {
        setState({ error: result.error || 'Failed to submit. Please try again.' })
      }
    } catch {
      setState({ error: 'Failed to submit. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-request-title"
        className="relative w-full max-w-md rounded-xl bg-slate-900 border border-slate-700 shadow-xl shadow-black/50"
      >
        <div className="p-6">
          <h2
            id="product-request-title"
            className="text-lg font-bold text-slate-100 mb-2"
          >
            Is there anything we don&apos;t have you would recommend us to add to our inventory?
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            Share your suggestions below. We&apos;d love to hear from you!
          </p>

          {state?.success ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-profit-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-profit-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-profit-400 font-medium">Thanks for your suggestion!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {state?.error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{state.error}</p>
                </div>
              )}

              <div>
                <label htmlFor="product-name" className="block text-sm font-medium text-slate-300 mb-1">
                  Product name *
                </label>
                <input
                  type="text"
                  id="product-name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg
                           text-slate-100 placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                           transition-all"
                  placeholder="e.g. Organic Coffee"
                />
              </div>

              <div>
                <label htmlFor="product-notes" className="block text-sm font-medium text-slate-300 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  id="product-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg
                           text-slate-100 placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                           transition-all resize-none"
                  placeholder="Any additional details..."
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={dismiss}
                  className="flex-1 px-4 py-2.5 rounded-lg text-slate-300 bg-slate-800
                           hover:bg-slate-700 hover:text-slate-100 transition-smooth"
                >
                  No thanks
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-gradient-profit text-white font-semibold rounded-lg
                           shadow-lg shadow-profit-500/30
                           hover:shadow-glow-profit-lg
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-smooth"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
