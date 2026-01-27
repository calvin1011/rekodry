import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY

if (!apiKey) {
  console.warn('Warning: RESEND_API_KEY is not set. Email notifications will be disabled.')
}

export const resend = apiKey ? new Resend(apiKey) : null