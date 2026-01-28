import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function TermsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: store } = await supabase
    .from('store_settings')
    .select('store_name, terms_of_service, business_email')
    .eq('store_slug', slug)
    .eq('is_active', true)
    .single()

  if (!store) {
    notFound()
  }

  const defaultTerms = `
Acceptance of Terms

By accessing and using ${store.store_name}, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.

Use of Service

Eligibility: You must be at least 18 years old to make purchases on our site.

Account Security: If you create an account, you are responsible for maintaining the confidentiality of your account information.

Prohibited Activities: You may not use our service to:
- Violate any laws or regulations
- Infringe on intellectual property rights
- Transmit harmful or malicious code
- Attempt unauthorized access to our systems
- Engage in fraudulent activities

Product Information

Accuracy: We strive to provide accurate product descriptions, images, and pricing. However, we do not warrant that product descriptions or other content is accurate, complete, or error-free.

Pricing: All prices are in USD. We reserve the right to change prices at any time without notice.

Availability: Products are subject to availability. We reserve the right to limit quantities and discontinue products.

Orders and Payment

Order Acceptance: Your order is an offer to purchase products. We reserve the right to accept or decline any order.

Payment: Payment is processed securely through Stripe. By providing payment information, you represent that you are authorized to use the payment method.

Order Cancellation: We reserve the right to cancel orders due to pricing errors, product unavailability, or suspected fraud.

Intellectual Property

All content on this site, including text, graphics, logos, and images, is the property of ${store.store_name} or its content suppliers and is protected by copyright and trademark laws.

Limitation of Liability

${store.store_name} shall not be liable for any indirect, incidental, special, or consequential damages resulting from:
- Use or inability to use our products or services
- Unauthorized access to your data
- Errors or omissions in any content
- Any other matter relating to the service

Indemnification

You agree to indemnify and hold ${store.store_name} harmless from any claims, damages, or expenses arising from your use of our service or violation of these terms.

Privacy

Your privacy is important to us. We collect and use your information as described in our Privacy Policy. By using our service, you consent to our data practices.

Modifications

We reserve the right to modify these terms at any time. Continued use of our service after changes constitutes acceptance of the modified terms.

Governing Law

These terms are governed by the laws of the United States. Any disputes will be resolved in the appropriate courts.

Severability

If any provision of these terms is found to be unenforceable, the remaining provisions will remain in full effect.

Contact Information

For questions about these terms, please contact us at ${store.business_email || 'calvinssendawula@gmail.com'}.

Last Updated: ${new Date().toLocaleDateString()}
  `.trim()

  const termsContent = store.terms_of_service || defaultTerms

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

        <div className="glass-dark rounded-2xl p-8 border border-slate-800">
          <h1 className="text-3xl font-bold text-slate-100 mb-6">Terms of Service</h1>
          <div className="prose prose-invert prose-slate max-w-none">
            <div className="text-slate-300 space-y-4 whitespace-pre-wrap leading-relaxed">
              {termsContent}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
