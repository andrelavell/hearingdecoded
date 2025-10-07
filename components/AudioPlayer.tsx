'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, RotateCcw, RotateCw } from 'lucide-react'
import type WaveSurferType from 'wavesurfer.js'

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
  const waveSurferRef = useRef<WaveSurferType | null>(null)
  const isDraggingRef = useRef(false)

  // Initialize WaveSurfer and bind events
  useEffect(() => {
    if (!waveformRef.current) return
    setIsLoading(true)
    setIsPlaying(false)
    setCurrentTime(0)

    // Destroy any existing instance first
    waveSurferRef.current?.destroy()

    let cancelled = false
    let onReady: (() => void) | undefined
    let onTime: ((t: number) => void) | undefined
    let onPlay: (() => void) | undefined
    let onPause: (() => void) | undefined
    let onFinish: (() => void) | undefined
    let onError: ((e: unknown) => void) | undefined

    let onPointerDown: ((e: PointerEvent) => void) | undefined
    let onPointerMove: ((e: PointerEvent) => void) | undefined
    let onPointerUp: ((e: PointerEvent) => void) | undefined
    let seekFromEvent: ((e: PointerEvent) => void) | undefined

    const el = waveformRef.current

    const init = async () => {
      const { default: WaveSurfer } = await import('wavesurfer.js')
      if (cancelled || !el) return

      const ws = WaveSurfer.create({
        container: el,
        // Muted, clinical palette (slate)
        waveColor: '#64748b', // slate-500
        progressColor: '#0f172a', // slate-900
        cursorColor: '#475569', // slate-600
        cursorWidth: 1.5,
        height: 80,
        fillParent: true,
        interact: true,
        // Bar-style waveform for a more instrument-like feel
        barWidth: 2,
        barGap: 1,
        barRadius: 1,
      })

      waveSurferRef.current = ws
      ws.load(audioUrl)

      onReady = () => {
        const d = ws.getDuration() || 0
        setDuration(d)
        setIsLoading(false)
      }

      onTime = (t: number) => {
        setCurrentTime(t)
        onTimeUpdate?.(t)
      }

      onPlay = () => setIsPlaying(true)
      onPause = () => setIsPlaying(false)
      onFinish = () => {
        setIsPlaying(false)
        setCurrentTime(0)
        try {
          ws.setTime(0)
        } catch {}
      }
      onError = (e: unknown) => {
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
      seekFromEvent = (e: PointerEvent) => {
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
      onPointerDown = (e: PointerEvent) => {
        if (!el) return
        isDraggingRef.current = true
        el.setPointerCapture?.(e.pointerId)
        seekFromEvent?.(e)
      }
      onPointerMove = (e: PointerEvent) => {
        if (!isDraggingRef.current) return
        seekFromEvent?.(e)
      }
      onPointerUp = (e: PointerEvent) => {
        isDraggingRef.current = false
        el?.releasePointerCapture?.(e.pointerId)
      }

      el.addEventListener('pointerdown', onPointerDown)
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
    }

    init()

    return () => {
      cancelled = true
      // Remove pointer listeners first to stop interactions
      if (el && onPointerDown) el.removeEventListener('pointerdown', onPointerDown)
      if (onPointerMove) window.removeEventListener('pointermove', onPointerMove)
      if (onPointerUp) window.removeEventListener('pointerup', onPointerUp)

      // Safely unbind and destroy the current WaveSurfer instance
      const inst = waveSurferRef.current
      if (inst) {
        try {
          if (onReady) inst.un('ready', onReady)
          if (onTime) inst.un('timeupdate', onTime)
          if (onPlay) inst.un('play', onPlay)
          if (onPause) inst.un('pause', onPause)
          if (onFinish) inst.un('finish', onFinish)
          if (onError) inst.un('error', onError)
        } catch {}
        try {
          inst.destroy()
        } catch {}
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
      <div className="relative">
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
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <div className="flex items-center gap-2 text-gray-700">
              <span className="inline-block h-4 w-4 rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin" />
              <span className="font-medium">Loading episode…</span>
            </div>
          </div>
        )}
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
    </div>
  )
}
