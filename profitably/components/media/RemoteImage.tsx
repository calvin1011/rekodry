import Image, { type ImageProps } from 'next/image'

type RemoteImageProps = Omit<ImageProps, 'src' | 'alt' | 'unoptimized'> & {
  src: string | null | undefined
  alt: string
}

/**
 * User-supplied image URLs (Supabase, etc.) — use next/image with unoptimized so we do not
 * need to enumerate every possible remote hostname in next.config.
 */
export function RemoteImage({ src, alt, className, ...rest }: RemoteImageProps) {
  if (!src) return null
  return <Image src={src} alt={alt} className={className} unoptimized {...rest} />
}
