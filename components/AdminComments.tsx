"use client"

import { useEffect, useMemo, useState, FormEvent } from "react"
import type { Comment, Episode } from "@/lib/supabase"
import Link from "next/link"

interface AdminCommentsProps {
  initialEpisodes: Episode[]
}

export default function AdminComments({ initialEpisodes }: AdminCommentsProps) {
  const [episodes] = useState<Episode[]>(initialEpisodes || [])
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>(
    initialEpisodes?.[0]?.id || ""
  )

  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const selectedEpisode = useMemo(
    () => episodes.find((e) => e.id === selectedEpisodeId) || null,
    [episodes, selectedEpisodeId]
  )

  async function load() {
    if (!selectedEpisodeId) {
      setComments([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/comments?episodeId=${encodeURIComponent(selectedEpisodeId)}`)
      if (!res.ok) {
        let msg = `Failed to load comments (HTTP ${res.status})`
        try {
          const body = await res.json()
          if (body?.error) msg = body.error
        } catch {}
        throw new Error(msg)
      }
      const data: Comment[] = await res.json()
      setComments(data)
    } catch (e: any) {
      setError(e?.message || "Failed to load comments")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [selectedEpisodeId])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState<string>("")
  const [editContent, setEditContent] = useState<string>("")
  const [saving, setSaving] = useState<boolean>(false)

  function startEdit(c: Comment) {
    setEditingId(c.id)
    setEditName((c.name || "").trim())
    setEditContent(c.content)
  }
  function cancelEdit() {
    setEditingId(null)
    setEditName("")
    setEditContent("")
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault()
    if (!editingId) return
    const name = editName.trim()
    const content = editContent.trim()
    if (!content) return
    setSaving(true)
    try {
      const res = await fetch("/api/comments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, name, content }),
      })
      if (!res.ok) {
        let msg = `Failed to update comment (HTTP ${res.status})`
        try {
          const body = await res.json()
          if (body?.error) msg = body.error
        } catch {}
        throw new Error(msg)
      }
      const updated: Comment = await res.json()
      setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      cancelEdit()
    } catch (e: any) {
      alert(e?.message || "Failed to update comment")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this comment?")) return
    try {
      const res = await fetch("/api/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        let msg = `Failed to delete comment (HTTP ${res.status})`
        try {
          const body = await res.json()
          if (body?.error) msg = body.error
        } catch {}
        throw new Error(msg)
      }
      setComments((prev) => prev.filter((c) => c.id !== id))
    } catch (e: any) {
      alert(e?.message || "Failed to delete comment")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Comments</h1>
          <p className="text-gray-600 mt-1">Edit or delete comments by episode</p>
        </div>
        <Link
          href="/admin"
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
        >
          Back to Admin
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Episode</label>
        <select
          value={selectedEpisodeId}
          onChange={(e) => setSelectedEpisodeId(e.target.value)}
          className="w-full sm:w-1/2 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {episodes.map((ep) => (
            <option key={ep.id} value={ep.id}>
              {ep.title}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        {loading ? (
          <p className="text-gray-600">Loading…</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : comments.length === 0 ? (
          <p className="text-gray-600">No comments for this episode.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {comments.map((c) => (
              <li key={c.id} className="py-4">
                {editingId === c.id ? (
                  <form onSubmit={saveEdit} className="space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Name (optional)"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full sm:w-60 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        required
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={saving || editContent.trim().length === 0}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-60"
                      >
                        {saving ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-4 py-2 border border-gray-300 rounded-md"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <div className="text-sm text-gray-500">
                        {selectedEpisode ? selectedEpisode.title : c.episode_id}
                      </div>
                      <div className="font-medium text-gray-900">
                        {(c.name && c.name.trim()) || "Anonymous"}
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap break-words mt-1">{c.content}</p>
                      <div className="text-xs text-gray-400 mt-1">{new Date(c.created_at).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(c)}
                        className="px-3 py-2 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="px-3 py-2 text-red-600 border border-red-200 rounded-md hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
