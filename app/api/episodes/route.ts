import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST: Create new episode
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const audio = formData.get('audio') as File
    const image = formData.get('image') as File | null
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const host = formData.get('host') as string
    const category = formData.get('category') as string
    const episodeNumberRaw = formData.get('episode_number') as string | null
    const references = formData.get('references') as string | null

    if (!audio || !title || !host) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Upload audio file
    const audioFileName = `${Date.now()}-${audio.name}`
    const { data: audioData, error: audioError } = await supabase.storage
      .from('episodes')
      .upload(`audio/${audioFileName}`, audio, {
        contentType: audio.type,
        upsert: false,
      })

    if (audioError) {
      console.error('Audio upload error:', audioError)
      return NextResponse.json(
        { error: 'Failed to upload audio file' },
        { status: 500 }
      )
    }

    const { data: audioUrlData } = supabase.storage
      .from('episodes')
      .getPublicUrl(`audio/${audioFileName}`)
    
    const audioUrl = audioUrlData.publicUrl

    // Upload image if provided
    let imageUrl = null
    if (image) {
      const imageFileName = `${Date.now()}-${image.name}`
      const { error: imageError } = await supabase.storage
        .from('episodes')
        .upload(`images/${imageFileName}`, image, {
          contentType: image.type,
          upsert: false,
        })

      if (!imageError) {
        const { data: imageUrlData } = supabase.storage
          .from('episodes')
          .getPublicUrl(`images/${imageFileName}`)
        imageUrl = imageUrlData.publicUrl
      }
    }

    // Get audio duration using Audio API (rough estimate)
    const duration = 0 // Will be set when audio loads in browser

    // Create episode record
    // Coerce episode_number
    const episode_number = episodeNumberRaw !== null && episodeNumberRaw !== ''
      ? Number(episodeNumberRaw)
      : null

    const { data: episode, error: dbError } = await supabase
      .from('episodes')
      .insert({
        title,
        description,
        host,
        category,
        audio_url: audioUrl,
        image_url: imageUrl,
        duration,
        episode_number,
        references,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to create episode record' },
        { status: 500 }
      )
    }

    return NextResponse.json(episode)
  } catch (error) {
    console.error('Error creating episode:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Update episode
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const id = formData.get('id') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const host = formData.get('host') as string
    const category = formData.get('category') as string
    const episodeNumberRaw = formData.get('episode_number') as string | null
    const references = formData.get('references') as string | null
    const image = formData.get('image') as File | null
    const imageUrl = formData.get('imageUrl') as string | null

    if (!id || !title || !host) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Handle image update
    let newImageUrl: string | null = null
    
    if (image) {
      // Upload new image file
      const imageFileName = `${Date.now()}-${image.name}`
      const { error: imageError } = await supabase.storage
        .from('episodes')
        .upload(`images/${imageFileName}`, image, {
          contentType: image.type,
          upsert: false,
        })

      if (!imageError) {
        const { data: imageUrlData } = supabase.storage
          .from('episodes')
          .getPublicUrl(`images/${imageFileName}`)
        newImageUrl = imageUrlData.publicUrl

        // Delete old image if exists
        const { data: oldEpisode } = await supabase
          .from('episodes')
          .select('image_url')
          .eq('id', id)
          .single()

        if (oldEpisode?.image_url) {
          const oldImagePath = oldEpisode.image_url.split('/episodes/')[1]
          if (oldImagePath) {
            await supabase.storage.from('episodes').remove([oldImagePath])
          }
        }
      }
    } else if (imageUrl) {
      // Use provided URL
      newImageUrl = imageUrl
    }

    // Build update object
    const updateData: any = {
      title,
      description,
      host,
      category,
      updated_at: new Date().toISOString(),
    }

    // Handle references field (it's a reserved keyword, so handle carefully)
    if (references !== null) {
      updateData.references = references
    }

    if (newImageUrl !== null) {
      updateData.image_url = newImageUrl
    }

    // Only update episode_number if provided in the form
    if (episodeNumberRaw !== null) {
      updateData.episode_number = episodeNumberRaw === '' ? null : Number(episodeNumberRaw)
    }

    const { data: episode, error } = await supabase
      .from('episodes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update episode' },
        { status: 500 }
      )
    }

    return NextResponse.json(episode)
  } catch (error) {
    console.error('Error updating episode:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete episode
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Missing episode ID' },
        { status: 400 }
      )
    }

    // Get episode to delete associated files
    const { data: episode } = await supabase
      .from('episodes')
      .select('audio_url, image_url')
      .eq('id', id)
      .single()

    // Delete episode record (transcripts will be deleted via CASCADE)
    const { error: dbError } = await supabase
      .from('episodes')
      .delete()
      .eq('id', id)

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to delete episode' },
        { status: 500 }
      )
    }

    // Delete associated files
    if (episode) {
      if (episode.audio_url) {
        const audioPath = episode.audio_url.split('/episodes/')[1]
        if (audioPath) {
          await supabase.storage.from('episodes').remove([audioPath])
        }
      }
      if (episode.image_url) {
        const imagePath = episode.image_url.split('/episodes/')[1]
        if (imagePath) {
          await supabase.storage.from('episodes').remove([imagePath])
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting episode:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
