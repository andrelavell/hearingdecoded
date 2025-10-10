import { supabase } from '@/lib/supabase'
import type { Episode } from '@/lib/supabase'
import AdminComments from '@/components/AdminComments'

async function getEpisodes() {
  const { data, error } = await supabase
    .from('episodes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching episodes:', error)
    return []
  }

  return (data || []) as Episode[]
}

export const revalidate = 0

export default async function AdminCommentsPage() {
  const episodes = await getEpisodes()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <AdminComments initialEpisodes={episodes} />
      </div>
    </main>
  )
}
