import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function HelpPage({
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

  const faqs = [
    {
      category: 'Orders & Shipping',
      questions: [
        {
          q: 'How do I track my order?',
          a: 'Once your order ships, you\'ll receive an email with tracking information. You can also visit the "My Orders" section in your account to view your order status and tracking details.',
        },
        {
          q: 'How long does shipping take?',
          a: 'Orders are typically processed within 2 business days. Standard shipping takes 3-7 business days after processing. Delivery times may vary during peak seasons.',
        },
        {
          q: 'Do you ship internationally?',
          a: 'Currently, we only ship within the United States. We apologize for any inconvenience.',
        },
        {
          q: 'Can I change my shipping address after ordering?',
          a: 'Please contact us immediately after placing your order if you need to change your address. Once the package has shipped, we cannot modify the delivery address.',
        },
      ],
    },
    {
      category: 'Returns & Refunds',
      questions: [
        {
          q: 'What is your return policy?',
          a: 'We offer a 30-day money back guarantee. Items must be in their original condition, unused, and with all tags attached. Contact us with your order number to initiate a return.',
        },
        {
          q: 'How long do refunds take?',
          a: 'Once we receive and inspect your return, refunds are processed within 3-5 business days. It may take an additional 5-10 days for the refund to appear on your statement.',
        },
        {
          q: 'What if I receive a damaged item?',
          a: 'Contact us immediately with photos of the damage. We\'ll arrange for a replacement or full refund at no cost to you, including return shipping.',
        },
      ],
    },
    {
      category: 'Payment & Security',
      questions: [
        {
          q: 'What payment methods do you accept?',
          a: 'We accept all major credit cards (Visa, Mastercard, American Express), as well as Apple Pay, Google Pay, Cash App, Klarna, and Amazon Pay through our secure Stripe checkout.',
        },
        {
          q: 'Is my payment information secure?',
          a: 'Yes! All payments are processed securely through Stripe, a PCI-compliant payment processor. We never store your full credit card details on our servers.',
        },
      ],
    },
    {
      category: 'Account & Orders',
      questions: [
        {
          q: 'Do I need an account to place an order?',
          a: 'No, you can checkout as a guest. However, you\'ll need to provide the email you used at checkout to view your order history in "My Orders".',
        },
        {
          q: 'How do I view my past orders?',
          a: 'Go to "My Orders" in the sidebar and enter the email address you used when placing your order. All orders associated with that email will appear.',
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-dark py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <Link
          href={`/store/${slug}`}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Store
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-100 mb-3">Help & FAQ</h1>
          <p className="text-slate-400">
            Find answers to common questions about orders, shipping, and returns.
          </p>
        </div>

        <div className="space-y-8">
          {faqs.map((section) => (
            <div key={section.category} className="glass-dark rounded-2xl p-6 border border-slate-800">
              <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-profit-500/10 flex items-center justify-center">
                  {section.category === 'Orders & Shipping' && (
                    <svg className="w-4 h-4 text-profit-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  )}
                  {section.category === 'Returns & Refunds' && (
                    <svg className="w-4 h-4 text-profit-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                    </svg>
                  )}
                  {section.category === 'Payment & Security' && (
                    <svg className="w-4 h-4 text-profit-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  )}
                  {section.category === 'Account & Orders' && (
                    <svg className="w-4 h-4 text-profit-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </span>
                {section.category}
              </h2>

              <div className="space-y-4">
                {section.questions.map((faq, index) => (
                  <details key={index} className="group">
                    <summary className="flex items-center justify-between cursor-pointer p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                      <span className="text-slate-200 font-medium pr-4">{faq.q}</span>
                      <svg
                        className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="px-4 pb-4 pt-2">
                      <p className="text-slate-400 leading-relaxed">{faq.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 glass-dark rounded-2xl p-8 border border-slate-800 text-center">
          <h2 className="text-xl font-bold text-slate-100 mb-3">Still have questions?</h2>
          <p className="text-slate-400 mb-6">
            We're here to help! Reach out to us and we'll get back to you within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/store/${slug}/contact`}
              className="px-6 py-3 bg-profit-600 hover:bg-profit-500 text-white rounded-xl font-medium transition-colors"
            >
              Contact Us
            </Link>
            {store.business_email && (
              <a
                href={`mailto:${store.business_email}`}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-xl font-medium transition-colors"
              >
                Email: {store.business_email}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
