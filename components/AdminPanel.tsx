'use client'

import { useState } from 'react'
import { Episode } from '@/lib/supabase'
import { Plus, Edit2, Trash2, Upload } from 'lucide-react'
import UploadEpisodeModal from './UploadEpisodeModal'
import EditEpisodeModal from './EditEpisodeModal'
import Link from 'next/link'

interface AdminPanelProps {
  initialEpisodes: Episode[]
}

export default function AdminPanel({ initialEpisodes }: AdminPanelProps) {
  const [episodes, setEpisodes] = useState(initialEpisodes)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null)
  const [backfilling, setBackfilling] = useState(false)
  const [backfillMsg, setBackfillMsg] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this episode?')) return

    try {
      const response = await fetch('/api/episodes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (response.ok) {
        setEpisodes(episodes.filter(ep => ep.id !== id))
      } else {
        alert('Failed to delete episode')
      }
    } catch (error) {
      console.error('Error deleting episode:', error)
      alert('Error deleting episode')
    }
  }

  const handleEpisodeAdded = (newEpisode: Episode) => {
    setEpisodes([newEpisode, ...episodes])
    setShowUploadModal(false)
  }

  const handleEpisodeUpdated = (updatedEpisode: Episode) => {
    setEpisodes(episodes.map(ep => ep.id === updatedEpisode.id ? updatedEpisode : ep))
    setEditingEpisode(null)
  }

  // Compute downsampled peaks using Web Audio API from a URL
  async function generatePeaksFromUrl(url: string, targetPeaks = 1200): Promise<{ peaks: number[]; duration: number }> {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch audio')
    const arrayBuffer = await res.arrayBuffer()
    const AudioCtx: any = (window as any).AudioContext || (window as any).webkitAudioContext
    const audioCtx = new AudioCtx()
    const audioBuffer: AudioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0))
    const duration = audioBuffer.duration
    const channelData = audioBuffer.getChannelData(0)
    const totalSamples = channelData.length
    const samplesPerPeak = Math.max(1, Math.floor(totalSamples / targetPeaks))
    const peaks: number[] = []
    for (let i = 0; i < totalSamples; i += samplesPerPeak) {
      let max = 0
      const end = Math.min(i + samplesPerPeak, totalSamples)
      for (let j = i; j < end; j++) {
        const v = Math.abs(channelData[j])
        if (v > max) max = v
      }
      peaks.push(max)
    }
    try { audioCtx.close() } catch {}
    return { peaks, duration }
  }

  const backfillPeaks = async () => {
    const targets = episodes.filter(ep => !ep.peaks || (Array.isArray(ep.peaks) && ep.peaks.length === 0))
    if (targets.length === 0) {
      setBackfillMsg('No episodes need backfilling.')
      setTimeout(() => setBackfillMsg(null), 3000)
      return
    }
    setBackfilling(true)
    setBackfillMsg('Generating waveform...')
    try {
      for (const ep of targets) {
        const { peaks, duration } = await generatePeaksFromUrl(ep.audio_url)
        const res = await fetch('/api/episodes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: ep.id,
            title: ep.title,
            description: ep.description,
            host: ep.host,
            category: ep.category,
            episode_number: (ep as any).episode_number ?? null,
            references: (ep as any).references ?? null,
            imageUrl: ep.image_url ?? null,
            peaks,
            duration,
          }),
        })
        if (res.ok) {
          const updated = await res.json()
          setEpisodes(prev => prev.map(e => e.id === updated.id ? updated : e))
        } else {
          console.warn('Failed to update episode with peaks', await res.text())
        }
      }
      setBackfillMsg('Waveform generated!')
      setTimeout(() => setBackfillMsg(null), 3000)
    } catch (e) {
      console.error(e)
      setBackfillMsg('Backfill failed')
      setTimeout(() => setBackfillMsg(null), 4000)
    } finally {
      setBackfilling(false)
    }
  }

  return (
    <>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">Manage your podcast episodes</p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            View Site
          </Link>
          <Link
            href="/admin/comments"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Manage Comments
          </Link>
          <button
            onClick={backfillPeaks}
            disabled={backfilling}
            className="px-6 py-3 border border-amber-400 text-amber-700 rounded-lg hover:bg-amber-50 transition disabled:opacity-50"
            title="Generate waveform peaks for episodes missing them"
          >
            {backfilling ? 'Generating…' : 'Generate Waveform'}
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            Upload Episode
          </button>
        </div>
      </div>
      {backfillMsg && (
        <div className="mb-4 text-sm text-gray-700">{backfillMsg}</div>
      )}

      {episodes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No episodes yet</h2>
          <p className="text-gray-600 mb-6">Get started by uploading your first episode</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Upload First Episode
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Episode</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Host</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Duration</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {episodes.map((episode) => (
                <tr key={episode.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {episode.image_url ? (
                        <img 
                          src={episode.image_url} 
                          alt={episode.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center text-2xl">
                          🎙️
                        </div>
                      )}
                      <div>
                        <Link
                          href={`/episode/${episode.id}`}
                          className="font-semibold text-blue-600 hover:underline"
                        >
                          {episode.title}
                        </Link>
                        {episode.description && (
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {episode.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{episode.host}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                      {episode.category || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {episode.duration > 0 ? `${Math.floor(episode.duration / 60)} min` : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingEpisode(episode)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                        aria-label="Edit episode"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(episode.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                        aria-label="Delete episode"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showUploadModal && (
        <UploadEpisodeModal
          onClose={() => setShowUploadModal(false)}
          onEpisodeAdded={handleEpisodeAdded}
        />
      )}

      {editingEpisode && (
        <EditEpisodeModal
          episode={editingEpisode}
          onClose={() => setEditingEpisode(null)}
          onEpisodeUpdated={handleEpisodeUpdated}
        />
      )}
    </>
  )
}
