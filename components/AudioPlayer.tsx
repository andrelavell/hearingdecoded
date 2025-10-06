'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, RotateCcw, RotateCw } from 'lucide-react'

interface AudioPlayerProps {
  audioUrl: string
  episodeId: string
  onTimeUpdate?: (currentTime: number) => void
}

export default function AudioPlayer({ audioUrl, episodeId, onTimeUpdate }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Initialize audio and set up event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      const time = audio.currentTime
      setCurrentTime(time)
      onTimeUpdate?.(time)
    }

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration)
        setIsLoading(false)
      }
    }

    const handleDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration)
        setIsLoading(false)
      }
    }

    const handleCanPlay = () => {
      setIsLoading(false)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      audio.currentTime = 0
      setCurrentTime(0)
    }

    const handleError = () => {
      console.error('Audio loading error')
      setIsLoading(false)
    }

    // Add event listeners
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    // Load the audio
    audio.load()

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [audioUrl, onTimeUpdate])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
      } else {
        await audio.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error('Playback error:', error)
      setIsPlaying(false)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio || isLoading) return

    const newTime = parseFloat(e.target.value)
    if (!isNaN(newTime)) {
      audio.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const skipForward = () => {
    const audio = audioRef.current
    if (!audio || isLoading) return

    const newTime = Math.min(audio.currentTime + 30, audio.duration || 0)
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const skipBackward = () => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = Math.max(audio.currentTime - 30, 0)
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) {
      return '0:00'
    }
    
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatTimeRemaining = (current: number, total: number): string => {
    if (!total || isNaN(total) || !isFinite(total) || isLoading) {
      return 'Loading...'
    }
    
    const remaining = Math.max(0, total - current)
    const mins = Math.floor(remaining / 60)
    const secs = Math.floor(remaining % 60)
    
    if (mins === 0 && secs === 0) {
      return '0s left'
    }
    
    return `${mins}m ${secs}s left`
  }

  const getProgressPercentage = (): number => {
    if (!duration || duration === 0) return 0
    return (currentTime / duration) * 100
  }

  return (
    <div>
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        preload="metadata"
      />
      
      {/* Progress Bar */}
      <div>
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          disabled={isLoading}
          className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #f97316 ${getProgressPercentage()}%, #e5e7eb ${getProgressPercentage()}%)`
          }}
        />
      </div>

      {/* Time Display */}
      <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
        <span className="font-medium">{formatTime(currentTime)}</span>
        <span className="font-medium">– {formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={skipBackward}
          disabled={isLoading}
          className="relative flex items-center justify-center w-14 h-14 hover:opacity-70 transition disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Skip backward 30 seconds"
        >
          <RotateCcw className="w-14 h-14 text-gray-700 absolute" strokeWidth={1} />
          <span className="text-xs font-bold text-gray-700 relative z-10">30</span>
        </button>
        
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className="flex items-center justify-center w-16 h-16 rounded-full transition shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'rgb(17 24 39/var(--tw-text-opacity,1))' }}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-7 h-7 text-white" fill="white" />
          ) : (
            <Play className="w-7 h-7 text-white ml-0.5" fill="white" />
          )}
        </button>
        
        <button
          onClick={skipForward}
          disabled={isLoading}
          className="relative flex items-center justify-center w-14 h-14 hover:opacity-70 transition disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Skip forward 30 seconds"
        >
          <RotateCw className="w-14 h-14 text-gray-700 absolute" strokeWidth={1} />
          <span className="text-xs font-bold text-gray-700 relative z-10">30</span>
        </button>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #f97316;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #f97316;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .slider:disabled::-webkit-slider-thumb {
          cursor: not-allowed;
        }
        
        .slider:disabled::-moz-range-thumb {
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}
