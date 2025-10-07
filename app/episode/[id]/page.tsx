import { supabase } from '@/lib/supabase'
import { Episode } from '@/lib/supabase'
import EpisodePlayer from '@/components/EpisodePlayer'
import Link from 'next/link'
import Comments from '@/components/Comments'
import type { Metadata } from 'next'
import MetaPixel from '@/components/MetaPixel'
import Script from 'next/script'

// Try to resolve an episode by direct id first; if not found, resolve by slug
async function getEpisodeByIdOrSlug(idOrSlug: string): Promise<{ episode: Episode | null; resolvedId: string | null }> {
  // Attempt by id
  const byId = await supabase
    .from('episodes')
    .select('*')
    .eq('id', idOrSlug)
    .maybeSingle()

  if (byId.data) {
    return { episode: byId.data as Episode, resolvedId: (byId.data as Episode).id }
  }

  // If not found by id, try to resolve via slug lookup
  const slugRes = await supabase
    .from('episode_slugs')
    .select('episode_id')
    .eq('slug', idOrSlug)
    .maybeSingle()

  if (!slugRes.data || !slugRes.data.episode_id) {
    if (byId.error) {
      console.error('Error fetching episode by id:', byId.error)
    }
    return { episode: null, resolvedId: null }
  }

  const epRes = await supabase
    .from('episodes')
    .select('*')
    .eq('id', slugRes.data.episode_id)
    .single()

  if (epRes.error) {
    console.error('Error fetching episode by slug:', epRes.error)
    return { episode: null, resolvedId: null }
  }

  return { episode: epRes.data as Episode, resolvedId: slugRes.data.episode_id as string }
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
  const { episode } = await getEpisodeByIdOrSlug(params.id)
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

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const canonical = new URL(`/episode/${episode.id}`, baseUrl).toString()
  const imageUrl = episode.image_url
  const epNum = typeof (episode as any).episode_number === 'number'
    ? String((episode as any).episode_number).padStart(3, '0')
    : null
  const host = episode.host?.trim()
  const formattedTitle = `${epNum ? `Episode ${epNum}: ` : ''}${episode.title}${host ? ` (By ${host})` : ''}`

  return {
    title: formattedTitle,
    description: episode.description,
    alternates: { canonical },
    openGraph: {
      title: formattedTitle,
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
      title: formattedTitle,
      description: episode.description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  }
}

export default async function EpisodePage({ params }: { params: { id: string } }) {
  const { episode, resolvedId } = await getEpisodeByIdOrSlug(params.id)
  const transcripts = episode ? await getTranscripts(episode.id) : []

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

  // Build full share URL for this episode for ShareThis buttons
  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/episode/${episode.id}`
  const epNum = typeof (episode as any).episode_number === 'number'
    ? String((episode as any).episode_number).padStart(3, '0')
    : null
  const shareTitle = `${epNum ? `Episode ${epNum}: ` : ''}${episode.title}${episode.host ? ` (By ${episode.host})` : ''}`

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Meta Pixel PageView for episode pages */}
      <MetaPixel />
      {/* Load ShareThis only on episode pages to ensure correct URL */}
      <Script
        id={`sharethis-${episode.id}`}
        src="https://platform-api.sharethis.com/js/sharethis.js#property=68e456bc9ac1bf93b5eb1f57&product=inline-share-buttons"
        strategy="afterInteractive"
      />
      <div className="max-w-6xl mx-auto px-6 py-12">
        <EpisodePlayer episode={episode} transcripts={transcripts} />

        {/* ShareThis BEGIN: Inline Share Buttons */}
        <div className="mt-6">
          <div
            className="sharethis-inline-share-buttons"
            data-url={shareUrl}
            data-title={shareTitle}
            data-description={episode.description || undefined}
            data-image={episode.image_url || undefined}
          ></div>
        </div>
        {/* ShareThis END */}

        <div className="mt-8">
          <Comments episodeId={episode.id} />
        </div>
      </div>
    </main>
  )
}
