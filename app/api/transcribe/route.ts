import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export async function POST(request: NextRequest) {
  try {
    const { episodeId, audioUrl } = await request.json()

    if (!episodeId || !audioUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured')
      return NextResponse.json(
        { error: 'Transcription service not configured' },
        { status: 500 }
      )
    }

    // Download the audio file
    const audioResponse = await fetch(audioUrl)
    const audioBuffer = await audioResponse.arrayBuffer()
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' })
    
    // Create a File object for OpenAI
    const audioFile = new File([audioBlob], 'audio.mp3', { type: 'audio/mpeg' })

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    })

    // Process segments and save to database
    if (transcription.segments) {
      const transcriptRecords = transcription.segments.map((segment: any) => ({
        episode_id: episodeId,
        start_time: segment.start,
        end_time: segment.end,
        text: segment.text.trim(),
      }))

      const { error } = await supabase
        .from('transcripts')
        .insert(transcriptRecords)

      if (error) {
        console.error('Error saving transcripts:', error)
        return NextResponse.json(
          { error: 'Failed to save transcripts' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ 
      success: true,
      segmentCount: transcription.segments?.length || 0 
    })
  } catch (error: any) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { error: error?.message || 'Transcription failed' },
      { status: 500 }
    )
  }
}
