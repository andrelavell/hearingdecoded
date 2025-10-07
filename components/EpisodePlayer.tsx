'use client'

import { useEffect, useState } from 'react'
import { Episode } from '@/lib/supabase'
import AudioPlayer from './AudioPlayer'

interface Transcript {
  id: string
  episode_id: string
  start_time: number
  end_time: number
  text: string
}

interface EpisodePlayerProps {
  episode: Episode
  transcripts: Transcript[]
}

export default function EpisodePlayer({ episode, transcripts }: EpisodePlayerProps) {
  const [currentTime, setCurrentTime] = useState(0)

  // Live listening count (simulated)
  const MIN_LISTENERS = 581
  const MAX_LISTENERS = 728

  function hashCode(str: string) {
    let h = 0
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i)
      h |= 0
    }
    return Math.abs(h)
  }

  const initialCount = MIN_LISTENERS + (hashCode(episode.id) % (MAX_LISTENERS - MIN_LISTENERS + 1))
  const [liveCount, setLiveCount] = useState<number>(initialCount)

  useEffect(() => {
    // Reset count when episode changes
    setLiveCount(MIN_LISTENERS + (hashCode(episode.id) % (MAX_LISTENERS - MIN_LISTENERS + 1)))

    let current = MIN_LISTENERS + (hashCode(episode.id) % (MAX_LISTENERS - MIN_LISTENERS + 1))
    const interval = setInterval(() => {
      const delta = Math.floor(Math.random() * 7) - 3 // -3..+3
      current = Math.min(MAX_LISTENERS, Math.max(MIN_LISTENERS, current + delta))
      setLiveCount(current)
    }, 7000)

    return () => clearInterval(interval)
  }, [episode.id])

  const currentTranscript = transcripts.find(
    t => currentTime >= t.start_time && currentTime <= t.end_time
  )

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`
    }
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }

  // Make any embedded URLs within a reference line clickable and style them
  const linkifyReference = (line: string) => {
    const nodes: Array<string | JSX.Element> = []
    const regex = /(https?:\/\/[^\s)]+)(\)?)/gi
    let lastIndex = 0
    let match: RegExpExecArray | null
    let i = 0
    while ((match = regex.exec(line)) !== null) {
      const start = match.index
      if (start > lastIndex) nodes.push(line.slice(lastIndex, start))
      let url = match[1]
      try {
        if (url.startsWith('https://unitedhearing.org/top-hearing-aids/')) {
          const u = new URL(url)
          u.searchParams.set('utm_source', 'hearingdecoded')
          url = u.toString()
        }
      } catch {}
      nodes.push(
        <a
          key={`ref-link-${i++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-blue-600 hover:text-blue-700"
        >
          {match[1]}
        </a>
      )
      // Advance lastIndex past the matched URL and any trailing parenthesis captured
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < line.length) nodes.push(line.slice(lastIndex))
    return nodes
  }

  return (
    <div>
      {/* Episode Header */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
        <div className="flex flex-col md:flex-row md:min-h-[320px]">
          {/* Episode Image - No padding, fills height */}
          <div className="flex-shrink-0 md:w-80">
            {episode.image_url ? (
              <img 
                src={episode.image_url} 
                alt={episode.title}
                className="w-full h-64 md:h-full object-cover"
              />
            ) : (
              <div className="w-full h-64 md:h-full bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-9xl">🎙️</span>
              </div>
            )}
          </div>

          {/* Episode Info - Padding only here */}
          <div className="flex-1 p-6 md:p-10 flex flex-col justify-center bg-white">
            <div className="mb-4">
              {episode.category && (
                <span
                  className="inline-flex justify-start px-3 py-1 rounded-full font-medium text-white text-xs sm:text-sm shrink-0 mb-2"
                  style={{ backgroundColor: '#F97316' }}
                >
                  {episode.category}
                </span>
              )}
              
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                {typeof episode.episode_number === 'number' && (
                  <span className="text-sm font-medium text-gray-900">
                    Episode {String(episode.episode_number).padStart(3, '0')}
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <img src="/microphone-icon.svg" alt="Host" className="w-4 h-4" />
                  <span className="text-sm text-gray-900 font-medium">{episode.host}</span>
                </div>

                <span className="sm:ml-auto flex items-center gap-2 text-sm text-gray-700">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" aria-hidden="true"></span>
                  <span><span className="font-semibold text-gray-900">{liveCount}</span> listening</span>
                </span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3 leading-tight">
              {episode.title}
            </h1>

            {episode.description && (
              <p className="text-gray-600 mb-6 text-base leading-relaxed">
                {episode.description}
              </p>
            )}

            {/* Inline Audio Player */}
            <div className="mt-2">
              <AudioPlayer 
                audioUrl={episode.audio_url} 
                episodeId={episode.id}
                onTimeUpdate={setCurrentTime}
                peaks={episode.peaks ?? undefined}
                durationHint={episode.duration}
              />
            </div>
          </div>
        </div>
      </div>

      {/* References */}
      {episode.references && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">References</h3>
          <ol className="list-decimal list-outside ml-6 space-y-2 text-gray-600 text-base leading-relaxed">
            {episode.references
              .split('\n')
              .filter(ref => ref.trim())
              .map((reference, index) => {
                const raw = reference.trim()
                // Strip any leading "1. ", "2. ", etc. from provided text to avoid double numbering
                const text = raw.replace(/^\d+\.\s*/, '')
                return (
                  <li key={index} className="whitespace-pre-wrap break-words">
                    <span className="text-gray-600">{linkifyReference(text)}</span>
                  </li>
                )
              })}
          </ol>
        </div>
      )}

      {/* Transcription */}
      {transcripts.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Live Transcription</h2>
          
          {currentTranscript ? (
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <p className="text-gray-800 text-lg">{currentTranscript.text}</p>
            </div>
          ) : (
            <p className="text-gray-500 italic">Transcription will appear here as the audio plays...</p>
          )}

          {/* Full Transcript */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Full Transcript</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transcripts.map((transcript) => (
                <div 
                  key={transcript.id}
                  className={`p-3 rounded ${
                    currentTranscript?.id === transcript.id 
                      ? 'bg-blue-50 border-l-4 border-blue-600' 
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-gray-500 font-mono whitespace-nowrap">
                      {Math.floor(transcript.start_time / 60)}:{(Math.floor(transcript.start_time % 60)).toString().padStart(2, '0')}
                    </span>
                    <p className="text-gray-800">{transcript.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
