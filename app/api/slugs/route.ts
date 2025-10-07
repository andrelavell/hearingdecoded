import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: list slugs for an episode or resolve slug -> episode
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const episodeId = searchParams.get('episodeId')
    const slug = searchParams.get('slug')

    if (episodeId) {
      const { data, error } = await supabase
        .from('episode_slugs')
        .select('*')
        .eq('episode_id', episodeId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return NextResponse.json(data)
    }

    if (slug) {
      const { data, error } = await supabase
        .from('episode_slugs')
        .select('episode_id')
        .eq('slug', slug)
        .maybeSingle()

      if (error) throw error
      if (!data) return NextResponse.json({ episode_id: null }, { status: 404 })
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Provide episodeId or slug' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching slugs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// POST: add a slug to an episode
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const episodeId = body.episodeId as string
    const rawSlug = (body.slug as string) || ''

    if (!episodeId || !rawSlug.trim()) {
      return NextResponse.json({ error: 'episodeId and slug are required' }, { status: 400 })
    }

    const slug = slugify(rawSlug)
    if (!slug) {
      return NextResponse.json({ error: 'Slug is empty after normalization' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('episode_slugs')
      .insert({ episode_id: episodeId, slug })
      .select()
      .single()

    if (error) {
      const msg = (error as any)?.message || ''
      if (msg.toLowerCase().includes('duplicate key')) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error adding slug:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: remove a slug (by id or by (episodeId, slug))
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const id = (body.id ?? null) as string | null
    const episodeId = (body.episodeId ?? null) as string | null
    const slug = (body.slug ?? null) as string | null

    if (!id && !(episodeId && slug)) {
      return NextResponse.json({ error: 'Provide id or (episodeId and slug)' }, { status: 400 })
    }

    let query = supabase.from('episode_slugs').delete()
    if (id) {
      query = query.eq('id', id)
    } else if (episodeId && slug) {
      query = query.eq('episode_id', episodeId).eq('slug', slug)
    }

    const { error } = await query
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting slug:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
