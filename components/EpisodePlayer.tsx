'use client'

import { useState } from 'react'
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
            <div className="flex items-center gap-3 mb-4">
              {typeof episode.episode_number === 'number' && (
                <span className="text-sm font-medium text-gray-900">
                  Episode {String(episode.episode_number).padStart(2, '0')}
                </span>
              )}
              <div className="flex items-center gap-2">
                <img src="/microphone-icon.svg" alt="Host" className="w-4 h-4" />
                <span className="text-sm text-gray-900 font-medium">{episode.host}</span>
              </div>
              {episode.category && (
                <span
                  className="text-sm px-3 py-1 rounded-full font-medium text-white"
                  style={{ backgroundColor: '#F97316' }}
                >
                  {episode.category}
                </span>
              )}
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-3 leading-tight">
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
              />
            </div>
          </div>
        </div>
      </div>

      {/* References */}
      {episode.references && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">References</h2>
          <div className="space-y-2">
            {episode.references.split('\n').filter(ref => ref.trim()).map((reference, index) => {
              const isUrl = reference.trim().match(/^https?:\/\//i)
              return (
                <div key={index} className="flex items-start gap-3">
                  <span className="text-orange-500 mt-1">•</span>
                  {isUrl ? (
                    <a 
                      href={reference.trim()} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {reference.trim()}
                    </a>
                  ) : (
                    <span className="text-gray-800">{reference.trim()}</span>
                  )}
                </div>
              )
            })}
          </div>
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
