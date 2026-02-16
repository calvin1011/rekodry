import heic2any from 'heic2any'

const HEIC_TYPES = ['image/heic', 'image/heif']
const HEIC_EXT = /\.(heic|heif)$/i

function isHeic(file: File): boolean {
  const type = (file.type || '').toLowerCase()
  if (HEIC_TYPES.includes(type)) return true
  return HEIC_EXT.test(file.name)
}

/**
 * If the file is HEIC/HEIF (e.g. from iPhone), convert it to JPEG in the browser
 * so it can be uploaded to our API. Otherwise returns the file unchanged.
 */
export async function convertHeicToJpegIfNeeded(file: File): Promise<File> {
  if (!isHeic(file)) {
    return file
  }

  const result = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.92,
  })

  const blob = Array.isArray(result) ? result[0] : result
  const name = file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg')
  return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
}
