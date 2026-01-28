import { redirect } from 'next/navigation'

export default async function TrackOrderPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  redirect(`/store/${slug}/account?tab=tracking`)
}