'use client'

import { useState } from 'react'
import { supabase, Episode } from '@/lib/supabase'
import { X, Upload, Loader } from 'lucide-react'

interface UploadEpisodeModalProps {
  onClose: () => void
  onEpisodeAdded: (episode: Episode) => void
}

export default function UploadEpisodeModal({ onClose, onEpisodeAdded }: UploadEpisodeModalProps) {
  const [uploading, setUploading] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [processingWaveform, setProcessingWaveform] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    host: '',
    category: '',
    episode_number: '',
    references: '',
  })
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!audioFile) {
      alert('Please select an audio file')
      return
    }

  // Compute downsampled peaks using Web Audio API
  async function generatePeaksFromFile(file: File, targetPeaks = 1200): Promise<{ peaks: number[]; duration: number }> {
    const arrayBuffer = await file.arrayBuffer()
    const AudioCtx: any = (window as any).AudioContext || (window as any).webkitAudioContext
    const audioCtx = new AudioCtx()
    // Some browsers require copying the buffer before decodeAudioData
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

    setUploading(true)

    try {
      // 1) Upload audio directly to Supabase Storage
      const audioFileName = `${Date.now()}-${audioFile.name}`
      const { error: audioErr } = await supabase.storage
        .from('episodes')
        .upload(`audio/${audioFileName}`, audioFile, {
          contentType: audioFile.type || 'audio/mpeg',
          upsert: false,
        })
      if (audioErr) {
        console.error('Audio upload failed:', audioErr)
        throw new Error('Audio upload failed')
      }
      const { data: audioUrlData } = supabase.storage
        .from('episodes')
        .getPublicUrl(`audio/${audioFileName}`)
      const audioUrl = audioUrlData.publicUrl

      // 2) Optional image upload
      let imageUrl: string | null = null
      if (imageFile) {
        const imageFileName = `${Date.now()}-${imageFile.name}`
        const { error: imgErr } = await supabase.storage
          .from('episodes')
          .upload(`images/${imageFileName}`, imageFile, {
            contentType: imageFile.type || 'image/*',
            upsert: false,
          })
        if (!imgErr) {
          const { data: imgUrlData } = supabase.storage
            .from('episodes')
            .getPublicUrl(`images/${imageFileName}`)
          imageUrl = imgUrlData.publicUrl
        } else {
          console.warn('Image upload failed, proceeding without image:', imgErr)
        }
      }

      // 3) Create episode via JSON POST (small payload)
      const response = await fetch('/api/episodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          host: formData.host,
          category: formData.category,
          episode_number: formData.episode_number,
          references: formData.references,
          audioUrl,
          imageUrl,
        }),
      })

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        console.error('Create episode failed:', text)
        throw new Error('Failed to upload episode')
      }

      const newEpisode = await response.json()

      // Start transcription in background
      setTranscribing(true)
      fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId: newEpisode.id, audioUrl: newEpisode.audio_url }),
      }).catch(err => console.error('Transcription error:', err))

      // Generate peaks client-side for instant waveform
      try {
        setProcessingWaveform(true)
        const { peaks, duration } = await generatePeaksFromFile(audioFile)

        // Persist peaks and duration to the episode
        const putRes = await fetch('/api/episodes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: newEpisode.id,
            title: formData.title,
            description: formData.description,
            host: formData.host,
            category: formData.category,
            episode_number: formData.episode_number,
            references: formData.references,
            imageUrl: newEpisode.image_url ?? null,
            peaks,
            duration,
          }),
        })

        if (putRes.ok) {
          const updated = await putRes.json()
          onEpisodeAdded(updated)
        } else {
          console.warn('Failed to update episode with peaks, proceeding without instant waveform')
          onEpisodeAdded(newEpisode)
        }
      } catch (err) {
        console.warn('Peaks generation failed:', err)
        onEpisodeAdded(newEpisode)
      } finally {
        setProcessingWaveform(false)
      }
    } catch (error) {
      console.error('Error uploading episode:', error)
      alert('Error uploading episode')
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Upload Episode</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded transition"
            disabled={uploading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Audio File */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Audio File (MP3) *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <input
                type="file"
                accept="audio/mp3,audio/mpeg"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                className="hidden"
                id="audio-upload"
                required
                disabled={uploading}
              />
              <label
                htmlFor="audio-upload"
                className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
              >
                {audioFile ? audioFile.name : 'Click to upload MP3'}
              </label>
            </div>
          </div>

          {/* Image File */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Episode Image (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="hidden"
                id="image-upload"
                disabled={uploading}
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
              >
                {imageFile ? imageFile.name : 'Click to upload image'}
              </label>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Episode Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Turning Obstacles Into Opportunities For Growth"
              required
              disabled={uploading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Episode description..."
              disabled={uploading}
            />
          </div>

          {/* Host */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Host Name *
            </label>
            <input
              type="text"
              value={formData.host}
              onChange={(e) => setFormData({ ...formData, host: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Sarah Johnson"
              required
              disabled={uploading}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Motivation"
              disabled={uploading}
            />
          </div>

          {/* Episode Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Episode Number (optional)
            </label>
            <input
              type="number"
              min={1}
              value={formData.episode_number}
              onChange={(e) => setFormData({ ...formData, episode_number: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1"
              disabled={uploading}
            />
          </div>

          {/* References */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              References
            </label>
            <textarea
              value={formData.references}
              onChange={(e) => setFormData({ ...formData, references: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Add links or references, one per line"
              disabled={uploading}
            />
            <p className="text-xs text-gray-500 mt-1">Add URLs or text references, one per line</p>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  {transcribing ? 'Transcribing...' : 'Uploading...'}
                </>
              ) : (
                'Upload Episode'
              )}
            </button>
          </div>

          {transcribing && (
            <p className="text-sm text-blue-600 text-center">
              Episode uploaded! Transcription is processing in the background...
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
