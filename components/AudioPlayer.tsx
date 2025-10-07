'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, RotateCcw, RotateCw } from 'lucide-react'
import WaveSurfer from 'wavesurfer.js'

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
  const waveformRef = useRef<HTMLDivElement>(null)
  const waveSurferRef = useRef<WaveSurfer | null>(null)
  const isDraggingRef = useRef(false)

  // Initialize WaveSurfer and bind events
  useEffect(() => {
    if (!waveformRef.current) return
    setIsLoading(true)
    setIsPlaying(false)
    setCurrentTime(0)

    // Destroy any existing instance first
    waveSurferRef.current?.destroy()

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      // Muted, clinical palette (slate)
      waveColor: '#64748b', // slate-500
      progressColor: '#0f172a', // slate-900
      cursorColor: '#475569', // slate-600
      cursorWidth: 1.5,
      height: 80,
      normalize: true,
      fillParent: true,
      interact: true,
      // Bar-style waveform for a more instrument-like feel
      barWidth: 2,
      barGap: 1,
      barRadius: 1,
    })

    waveSurferRef.current = ws
    ws.load(audioUrl)

    const onReady = () => {
      const d = ws.getDuration() || 0
      setDuration(d)
      setIsLoading(false)
    }

    const onTime = (t: number) => {
      setCurrentTime(t)
      onTimeUpdate?.(t)
    }

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onFinish = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      try {
        ws.setTime(0)
      } catch (_) {
        // no-op
      }
    }

    const onError = (e: unknown) => {
      console.error('WaveSurfer error:', e)
      setIsLoading(false)
    }

    ws.on('ready', onReady)
    ws.on('timeupdate', onTime)
    ws.on('play', onPlay)
    ws.on('pause', onPause)
    ws.on('finish', onFinish)
    ws.on('error', onError)

    // Smooth, real-time scrubbing via pointer events
    const el = waveformRef.current
    const onPointerDown = (e: PointerEvent) => {
      if (!el) return
      isDraggingRef.current = true
      el.setPointerCapture?.(e.pointerId)
      seekFromEvent(e)
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return
      seekFromEvent(e)
    }
    const onPointerUp = (e: PointerEvent) => {
      isDraggingRef.current = false
      el?.releasePointerCapture?.(e.pointerId)
    }
    const seekFromEvent = (e: PointerEvent) => {
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width)
      const p = rect.width ? x / rect.width : 0
      const dur = ws.getDuration() || 0
      const t = p * dur
      ws.setTime(t)
      setCurrentTime(t)
      onTimeUpdate?.(t)
    }

    el?.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    return () => {
      // Remove pointer listeners first to stop interactions
      el?.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)

      // Safely unbind and destroy the current WaveSurfer instance
      const inst = waveSurferRef.current
      if (inst) {
        try {
          inst.un('ready', onReady)
          inst.un('timeupdate', onTime)
          inst.un('play', onPlay)
          inst.un('pause', onPause)
          inst.un('finish', onFinish)
          inst.un('error', onError)
        } catch (_) {
          // no-op
        }
        try {
          inst.destroy()
        } catch (_) {
          // already destroyed or not initialised
        }
        waveSurferRef.current = null
      }
    }
  }, [audioUrl, onTimeUpdate])

  const togglePlay = async () => {
    const ws = waveSurferRef.current
    if (!ws) return
    try {
      if (isPlaying) {
        ws.pause()
      } else {
        await ws.play()
      }
    } catch (error) {
      console.error('Playback error:', error)
      setIsPlaying(false)
    }
  }

  const skipForward = () => {
    const ws = waveSurferRef.current
    if (!ws || isLoading) return
    const newTime = Math.min((ws.getCurrentTime() || 0) + 30, ws.getDuration() || 0)
    if (ws.getDuration()) {
      ws.setTime(newTime)
      setCurrentTime(newTime)
    }
  }

  const skipBackward = () => {
    const ws = waveSurferRef.current
    if (!ws) return
    const newTime = Math.max((ws.getCurrentTime() || 0) - 30, 0)
    ws.setTime(newTime)
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

  return (
    <div>
      {/* Waveform */}
      <div
        ref={waveformRef}
        className="w-full h-20 rounded-md mb-2 overflow-hidden"
        style={{
          touchAction: 'none',
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.92), rgba(255,255,255,0.92)), ' +
            'repeating-linear-gradient(to right, rgba(100,116,139,0.12) 0, rgba(100,116,139,0.12) 1px, transparent 1px, transparent 24px), ' +
            'repeating-linear-gradient(to bottom, rgba(100,116,139,0.08) 0, rgba(100,116,139,0.08) 1px, transparent 1px, transparent 24px)'
        }}
      />

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
    </div>
  )
}
