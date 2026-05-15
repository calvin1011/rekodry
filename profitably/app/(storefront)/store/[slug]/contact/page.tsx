import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ContactForm from './ContactForm'

export default async function ContactPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: store } = await supabase
    .from('store_settings')
    .select('store_name, business_email, business_phone')
    .eq('store_slug', slug)
    .eq('is_active', true)
    .single()

  if (!store) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-dark py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-100 mb-3">Contact Us</h1>
          <p className="text-slate-400">
            Have a question or concern? We&apos;re here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="glass-dark rounded-xl p-6 border border-slate-800 text-center">
            <div className="w-12 h-12 bg-profit-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-profit-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-100 mb-2">Email</h3>
            <a
              href={`mailto:${store.business_email}`}
              className="text-slate-400 text-sm hover:text-profit-400 transition-colors"
            >
              {store.business_email}
            </a>
          </div>

          <div className="glass-dark rounded-xl p-6 border border-slate-800 text-center">
            <div className="w-12 h-12 bg-profit-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-profit-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-100 mb-2">Phone</h3>
            <a
              href={`tel:${store.business_phone}`}
              className="text-slate-400 text-sm hover:text-profit-400 transition-colors"
            >
              {store.business_phone}
            </a>
          </div>

          <div className="glass-dark rounded-xl p-6 border border-slate-800 text-center">
            <div className="w-12 h-12 bg-profit-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-profit-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-100 mb-2">Response Time</h3>
            <p className="text-slate-400 text-sm">Within 24 hours</p>
          </div>
        </div>

        <div className="glass-dark rounded-2xl p-8 border border-slate-800">
          <h2 className="text-xl font-bold text-slate-100 mb-6">Send us a message</h2>
          <ContactForm storeSlug={slug} />
        </div>
      </div>
    </div>
  )
}
