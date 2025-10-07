'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const search = useSearchParams();
  const from = search?.get('from') || '/admin';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        setError(data?.error || 'Login failed');
        setLoading(false);
        return;
      }
      router.replace(from);
    } catch (err) {
      setError('Network error');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white shadow-md rounded px-6 py-8 space-y-4">
        <h1 className="text-xl font-semibold text-gray-800">Admin Login</h1>
        <label className="block">
          <span className="text-sm text-gray-700">Password</span>
          <input
            type="password"
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            required
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex justify-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
        <p className="text-xs text-gray-500">You will stay signed in for 30 days on this device.</p>
      </form>
    </div>
  );
}
