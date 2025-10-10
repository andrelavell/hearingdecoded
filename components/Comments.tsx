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

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

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

  // Inline edit helpers
  const startEdit = (c: Comment) => {
    setEditingId(c.id)
    setEditingContent(c.content)
    setUpdateError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingContent('')
    setUpdating(false)
    setUpdateError(null)
  }

  const saveEdit = async () => {
    if (!editingId || !editingContent.trim()) return
    setUpdating(true)
    setUpdateError(null)
    try {
      const res = await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, content: editingContent.trim() }),
      })
      if (!res.ok) {
        let message = `Failed to update comment (HTTP ${res.status})`
        try {
          const body = await res.json()
          if (body?.error) message = body.error
        } catch {}
        throw new Error(message)
      }
      const updated: Comment = await res.json()
      setComments((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      cancelEdit()
    } catch (e: any) {
      setUpdateError(e.message || 'Failed to update comment')
    } finally {
      setUpdating(false)
    }
  }

  // Convert URLs/domains in plain text into clickable links
  function linkify(text: string) {
    const nodes: Array<string | JSX.Element> = []
    // Matches http(s), www., or bare domains like example.org/path
    const regex = /\b((?:https?:\/\/|www\.)[^\s]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^[\s]]*)?)/gi
    let lastIndex = 0
    let match: RegExpExecArray | null
    let i = 0
    while ((match = regex.exec(text)) !== null) {
      const start = match.index
      if (start > lastIndex) nodes.push(text.slice(lastIndex, start))

      // Extract match and trim trailing punctuation from the URL
      let raw = match[0]
      let trailing = ''
      while (/[.,!?;:)\]]$/.test(raw)) {
        trailing = raw.slice(-1) + trailing
        raw = raw.slice(0, -1)
      }
      const href = raw.startsWith('http') ? raw : `https://${raw}`

      nodes.push(
        <a
          key={`link-${i++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline break-words"
        >
          {raw}
        </a>
      )
      if (trailing) nodes.push(trailing)
      lastIndex = regex.lastIndex
    }
    if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
    return nodes
  }

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
              <div className="flex flex-wrap gap-3 sm:grid sm:grid-cols-[auto_1fr] sm:gap-4">
                <div className="flex items-center gap-3 shrink-0 sm:contents">
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
                  <div className="font-medium text-gray-900 sm:col-start-2 sm:self-center">{(c.name && c.name.trim()) ? c.name.trim() : 'Anonymous'}</div>
                </div>
                {editingId === c.id ? (
                  <div className="basis-full sm:col-start-2">
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={4}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {updateError && <p className="text-sm text-red-600 mt-2">{updateError}</p>}
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={updating || !editingContent.trim()}
                        className="inline-flex items-center rounded-md px-4 py-2 text-white hover:opacity-90 disabled:opacity-60"
                        style={{ backgroundColor: 'rgb(17 24 39 / var(--tw-text-opacity, 1))' }}
                      >
                        {updating ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={updating}
                        className="inline-flex items-center rounded-md px-3 py-2 text-gray-700 border border-gray-300 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-700 whitespace-pre-wrap break-words mt-1 basis-full sm:col-start-2 sm:mt-0">{linkify(c.content)}</p>
                    <div className="basis-full sm:col-start-2 mt-2">
                      <button
                        type="button"
                        onClick={() => startEdit(c)}
                        className="text-sm text-gray-600 underline hover:text-gray-800"
                      >
                        Edit
                      </button>
                    </div>
                  </>
                )}
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
            className="inline-flex items-center rounded-md px-4 py-2 text-white hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: 'rgb(17 24 39 / var(--tw-text-opacity, 1))' }}
          >
            {submitting ? 'Posting…' : 'Post Comment'}
          </button>
        </form>
      </div>
    </div>
  )
}
