'use client'

import { useActionState, useState } from 'react'
import { submitContactForm } from './actions'

export default function ContactForm({ storeSlug }: { storeSlug: string }) {
  const [state, formAction] = useActionState(
    async (prevState: any, formData: FormData) => submitContactForm(storeSlug, prevState, formData),
    {}
  )
  const [isSubmitted, setIsSubmitted] = useState(false)

  if (isSubmitted || state?.success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-profit-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-profit-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">Message Sent!</h3>
        <p className="text-slate-400">
          Thank you for reaching out. We'll get back to you within 24 hours.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-sm">{state.error}</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg
                   text-slate-100 placeholder-slate-500
                   focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                   transition-all"
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg
                   text-slate-100 placeholder-slate-500
                   focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                   transition-all"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label htmlFor="orderNumber" className="block text-sm font-medium text-slate-300 mb-2">
          Order Number (optional)
        </label>
        <input
          type="text"
          id="orderNumber"
          name="orderNumber"
          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg
                   text-slate-100 placeholder-slate-500
                   focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                   transition-all"
          placeholder="ORD-1234567890-ABCDE"
        />
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-2">
          Subject *
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          required
          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg
                   text-slate-100 placeholder-slate-500
                   focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                   transition-all"
          placeholder="How can we help?"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">
          Message *
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg
                   text-slate-100 placeholder-slate-500
                   focus:outline-none focus:ring-2 focus:ring-profit-500 focus:border-transparent
                   transition-all resize-none"
          placeholder="Tell us more about your question or concern..."
        />
      </div>

      <button
        type="submit"
        className="w-full px-6 py-3 bg-gradient-profit text-white font-semibold rounded-xl
                 shadow-lg shadow-profit-500/30
                 hover:shadow-glow-profit-lg hover:scale-[1.02]
                 active:scale-[0.98]
                 transition-smooth"
      >
        Send Message
      </button>
    </form>
  )
}
