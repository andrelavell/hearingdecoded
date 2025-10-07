import { supabase } from '@/lib/supabase'
import { Episode } from '@/lib/supabase'
import EpisodePlayer from '@/components/EpisodePlayer'
import Link from 'next/link'
import Comments from '@/components/Comments'
import type { Metadata } from 'next'

async function getEpisode(id: string) {
  const { data, error } = await supabase
    .from('episodes')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching episode:', error)
    return null
  }
  
  return data as Episode
}

async function getTranscripts(episodeId: string) {
  const { data, error } = await supabase
    .from('transcripts')
    .select('*')
    .eq('episode_id', episodeId)
    .order('start_time', { ascending: true })
  
  if (error) {
    console.error('Error fetching transcripts:', error)
    return []
  }
  
  return data
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const episode = await getEpisode(params.id)
  if (!episode) {
    return {
      title: 'Episode not found | Hearing Decoded',
      description: 'This episode could not be found.',
      openGraph: {
        title: 'Episode not found | Hearing Decoded',
        description: 'This episode could not be found.',
        type: 'article',
        siteName: 'Hearing Decoded',
      },
      twitter: {
        card: 'summary',
        title: 'Episode not found | Hearing Decoded',
        description: 'This episode could not be found.',
      },
    }
  }

  const canonical = `/episode/${episode.id}`
  const imageUrl = episode.image_url

  return {
    title: episode.title,
    description: episode.description,
    alternates: { canonical },
    openGraph: {
      title: episode.title,
      description: episode.description,
      type: 'article',
      siteName: 'Hearing Decoded',
      url: canonical,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: episode.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: episode.title,
      description: episode.description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  }
}

export default async function EpisodePage({ params }: { params: { id: string } }) {
  const episode = await getEpisode(params.id)
  const transcripts = await getTranscripts(params.id)

  if (!episode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Episode not found</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to episodes
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <EpisodePlayer episode={episode} transcripts={transcripts} />

        {/* ShareThis BEGIN: Inline Share Buttons */}
        <div className="mt-6">
          <div className="sharethis-inline-share-buttons"></div>
        </div>
        {/* ShareThis END */}

        <div className="mt-8">
          <Comments episodeId={episode.id} />
        </div>
      </div>
    </main>
  )
}
