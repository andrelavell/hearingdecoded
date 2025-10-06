import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: list comments by episode
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const episodeId = searchParams.get('episodeId')
    if (!episodeId) {
      return NextResponse.json({ error: 'Missing episodeId' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('comments')
      .select('id, episode_id, name, content, created_at')
      .eq('episode_id', episodeId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json({ error: error.message || 'Failed to fetch comments', details: error }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('GET /comments error:', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}

// POST: add a comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { episodeId, name, content } = body

    if (!episodeId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const finalName = typeof name === 'string' && name.trim() ? name.trim() : 'Anonymous'
    const finalContent = typeof content === 'string' ? content.trim() : ''
    if (!finalContent) {
      return NextResponse.json({ error: 'Comment content cannot be empty' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({ episode_id: episodeId, name: finalName, content: finalContent })
      .select()
      .single()

    if (error) {
      console.error('Error inserting comment:', error)
      return NextResponse.json({ error: error.message || 'Failed to add comment', details: error }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('POST /comments error:', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE: delete a comment by id
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (error) {
      console.error('Error deleting comment:', error)
      return NextResponse.json({ error: error.message || 'Failed to delete comment', details: error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /comments error:', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}
