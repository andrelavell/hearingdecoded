'use client'

import { useEffect, useState } from 'react'
import { Episode, Comment } from '@/lib/supabase'
import { X, Loader, Upload, Image as ImageIcon, Plus, Trash2 } from 'lucide-react'

interface EditEpisodeModalProps {
  episode: Episode
  onClose: () => void
  onEpisodeUpdated: (episode: Episode) => void
}

export default function EditEpisodeModal({ episode, onClose, onEpisodeUpdated }: EditEpisodeModalProps) {
  const [updating, setUpdating] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(episode.image_url || null)
  const [imageUrl, setImageUrl] = useState(episode.image_url || '')
  const [useImageUrl, setUseImageUrl] = useState(false)
  const [formData, setFormData] = useState({
    title: episode.title,
    description: episode.description || '',
    host: episode.host,
    category: episode.category || '',
    episode_number: (episode.episode_number ?? '').toString(),
    references: episode.references || '',
  })

  // Comments state
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [addingComment, setAddingComment] = useState(false)
  const [newComment, setNewComment] = useState({ name: '', content: '' })

  const loadComments = async () => {
    try {
      setCommentsLoading(true)
      const res = await fetch(`/api/comments?episodeId=${encodeURIComponent(episode.id)}`)
      if (!res.ok) throw new Error('Failed to load comments')
      const data = await res.json()
      setComments(data)
    } catch (e) {
      console.error(e)
    } finally {
      setCommentsLoading(false)
    }
  }

  useEffect(() => {
    loadComments()
  }, [episode.id])

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setUseImageUrl(false)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url)
    if (url) {
      setImagePreview(url)
      setImageFile(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)

    try {
      const apiFormData = new FormData()
      apiFormData.append('id', episode.id)
      apiFormData.append('title', formData.title)
      apiFormData.append('description', formData.description)
      apiFormData.append('host', formData.host)
      apiFormData.append('category', formData.category)
      // include even if empty string to allow clearing the number
      apiFormData.append('episode_number', formData.episode_number)
      apiFormData.append('references', formData.references)
      
      if (imageFile) {
        apiFormData.append('image', imageFile)
      } else if (useImageUrl && imageUrl) {
        apiFormData.append('imageUrl', imageUrl)
      }

      const response = await fetch('/api/episodes', {
        method: 'PUT',
        body: apiFormData,
      })

      if (!response.ok) {
        throw new Error('Failed to update episode')
      }

      const updatedEpisode = await response.json()
      onEpisodeUpdated(updatedEpisode)
    } catch (error) {
      console.error('Error updating episode:', error)
      alert('Error updating episode')
      setUpdating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Edit Episode</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded transition"
            disabled={updating}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Episode Image
            </label>
            
            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-4">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Upload or URL Toggle */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setUseImageUrl(false)}
                className={`flex-1 px-4 py-2 rounded-lg border transition ${
                  !useImageUrl 
                    ? 'bg-blue-50 border-blue-600 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                disabled={updating}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setUseImageUrl(true)}
                className={`flex-1 px-4 py-2 rounded-lg border transition ${
                  useImageUrl 
                    ? 'bg-blue-50 border-blue-600 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                disabled={updating}
              >
                <ImageIcon className="w-4 h-4 inline mr-2" />
                Use URL
              </button>
            </div>

            {/* Upload File Input */}
            {!useImageUrl && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                  id="image-upload"
                  disabled={updating}
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {imageFile ? imageFile.name : 'Click to upload image'}
                  </p>
                </label>
              </div>
            )}

            {/* URL Input */}
            {useImageUrl && (
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => handleImageUrlChange(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={updating}
              />
            )}
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
              required
              disabled={updating}
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
              disabled={updating}
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
              required
              disabled={updating}
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
              disabled={updating}
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
              disabled={updating}
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
              disabled={updating}
            />
            <p className="text-xs text-gray-500 mt-1">Add URLs or text references, one per line</p>
          </div>

          {/* Comments (Admin) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-900">Comments</label>
              <button
                type="button"
                onClick={loadComments}
                className="text-sm text-blue-600 hover:underline"
                disabled={commentsLoading}
              >
                Refresh
              </button>
            </div>

            {/* Add comment form */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={newComment.name}
                  onChange={(e) => setNewComment({ ...newComment, name: e.target.value })}
                  className="md:col-span-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={addingComment}
                />
                <input
                  type="text"
                  placeholder="Comment"
                  value={newComment.content}
                  onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
                  className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={addingComment}
                />
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={async () => {
                    if (!newComment.name.trim() || !newComment.content.trim()) return
                    try {
                      setAddingComment(true)
                      const res = await fetch('/api/comments', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          episodeId: episode.id,
                          name: newComment.name.trim(),
                          content: newComment.content.trim(),
                        }),
                      })
                      if (!res.ok) throw new Error('Failed to add comment')
                      const created = await res.json()
                      setComments((prev) => [created, ...prev])
                      setNewComment({ name: '', content: '' })
                    } catch (e) {
                      console.error(e)
                      alert('Error adding comment')
                    } finally {
                      setAddingComment(false)
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  disabled={addingComment}
                >
                  <Plus className="w-4 h-4" /> Add Comment
                </button>
              </div>
            </div>

            {/* Comments list */}
            <div className="space-y-3">
              {commentsLoading ? (
                <p className="text-gray-600">Loading comments…</p>
              ) : comments.length === 0 ? (
                <p className="text-gray-600">No comments yet.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-gray-500">{new Date(c.created_at).toLocaleString()}</div>
                      <div className="font-medium text-gray-900">{c.name}</div>
                      <div className="text-gray-800">{c.content}</div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm('Delete this comment?')) return
                        try {
                          const res = await fetch('/api/comments', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: c.id }),
                          })
                          if (!res.ok) throw new Error('Failed to delete comment')
                          setComments((prev) => prev.filter((x) => x.id !== c.id))
                        } catch (e) {
                          console.error(e)
                          alert('Error deleting comment')
                        }
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      aria-label="Delete comment"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              disabled={updating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
              disabled={updating}
            >
              {updating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
