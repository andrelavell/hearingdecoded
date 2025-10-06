'use client'

import { useEffect, useState, FormEvent } from 'react'
import type { Comment } from '@/lib/supabase'

interface CommentsProps {
  episodeId: string
}

export default function Comments({ episodeId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/comments?episodeId=${encodeURIComponent(episodeId)}`)
      if (!res.ok) {
        let message = `Failed to load comments (HTTP ${res.status})`
        try {
          const body = await res.json()
          if (body?.error) message = body.error
        } catch {}
        throw new Error(message)
      }
      const data = await res.json()
      setComments(data)
    } catch (e: any) {
      setError(e.message || 'Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  // Form state for adding a comment
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !content.trim()) return
    setFormError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeId,
          name: name.trim(),
          content: content.trim(),
        }),
      })
      if (!res.ok) {
        try {
          const body = await res.json()
          throw new Error(body?.error || `Failed to post comment (HTTP ${res.status})`)
        } catch {
          throw new Error(`Failed to post comment (HTTP ${res.status})`)
        }
      }
      const newComment: Comment = await res.json()
      setComments((prev) => [newComment, ...prev])
      setName('')
      setContent('')
    } catch (e: any) {
      setFormError(e.message || 'Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => { load() }, [episodeId])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <p className="text-gray-600">Loading comments…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Comments</h3>
      {comments.length === 0 ? (
        <p className="text-gray-600">No comments yet.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                {(() => {
                  const displayName = (c.name && c.name.trim()) ? c.name.trim() : 'Anonymous'
                  const initial = displayName.charAt(0).toUpperCase()
                  return (
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-white font-semibold"
                      style={{ backgroundColor: 'rgb(17 24 39 / var(--tw-text-opacity, 1))' }}
                    >
                      {initial}
                    </div>
                  )
                })()}
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{(c.name && c.name.trim()) ? c.name.trim() : 'Anonymous'}</div>
                  <p className="text-gray-700 whitespace-pre-wrap mt-1">{c.content}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 border-t border-gray-200 pt-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">Leave a comment</h4>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="commenter-name" className="block text-sm font-medium text-gray-700 mb-1">
              Name (optional)
            </label>
            <input
              id="commenter-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="comment-content" className="block text-sm font-medium text-gray-700 mb-1">
              Comment
            </label>
            <textarea
              id="comment-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Share your thoughts..."
            />
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {submitting ? 'Posting…' : 'Post Comment'}
          </button>
        </form>
      </div>
    </div>
  )
}
