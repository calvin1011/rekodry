import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const HEIC_TYPES = ['image/heic', 'image/heif']
const HEIC_EXT = /\.(heic|heif)$/i

function isHeic(file: File): boolean {
  const type = (file.type || '').toLowerCase()
  if (HEIC_TYPES.includes(type)) return true
  return HEIC_EXT.test(file.name)
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    const extToType: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      heic: 'image/heic',
      heif: 'image/heif',
    }
    const contentType =
      ALLOWED_TYPES.includes(file.type) || HEIC_TYPES.includes(file.type)
        ? file.type
        : ext
          ? extToType[ext]
          : null
    if (!contentType) {
      return NextResponse.json(
        { error: 'File must be JPEG, PNG, WebP, or HEIC' },
        { status: 400 }
      )
    }

    let body: Blob | File
    let uploadContentType: string
    let fileExt: string

    if (isHeic(file)) {
      try {
        const mod = await import('heic-convert')
        const convert = mod.default ?? mod
        const inputBuffer = Buffer.from(await file.arrayBuffer())
        const outputBuffer = await (convert as (opts: { buffer: Buffer; format: 'JPEG' | 'PNG'; quality?: number }) => Promise<Buffer>)({
          buffer: inputBuffer,
          format: 'JPEG',
          quality: 0.92,
        })
        body = new Blob([new Uint8Array(outputBuffer)], { type: 'image/jpeg' })
        uploadContentType = 'image/jpeg'
        fileExt = 'jpg'
      } catch (err) {
        console.error('HEIC conversion failed:', err)
        return NextResponse.json(
          { error: 'Could not convert HEIC image. Try saving as JPG first.' },
          { status: 400 }
        )
      }
    } else {
      body = file
      uploadContentType =
        ALLOWED_TYPES.includes(file.type) ? file.type : extToType[ext!] || 'image/jpeg'
      fileExt = ext || 'jpg'
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, body, {
        contentType: uploadContentType,
        upsert: false,
      })

    if (error) {
      console.error('Error uploading file:', error)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('product-images').getPublicUrl(data.path)

    return NextResponse.json({
      url: publicUrl,
      path: data.path,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json({ error: 'No path provided' }, { status: 400 })
    }

    if (!path.startsWith(`${user.id}/`)) {
      return NextResponse.json({ error: 'Unauthorized to delete this file' }, { status: 403 })
    }

    const { error } = await supabase.storage.from('product-images').remove([path])

    if (error) {
      console.error('Error deleting file:', error)
      return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
    }

    return NextResponse.json({ message: 'File deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}