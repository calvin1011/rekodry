import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY
export const resendFromEmail =
  process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
export const resendTrackingFromEmail =
  process.env.RESEND_TRACKING_FROM_EMAIL || resendFromEmail

if (!apiKey) {
  console.warn('Warning: RESEND_API_KEY is not set. Email notifications will be disabled.')
}

export const resend = apiKey ? new Resend(apiKey) : null