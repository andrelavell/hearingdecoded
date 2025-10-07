import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Episode } from '@/lib/supabase'

async function getEpisodes() {
  const { data, error } = await supabase
    .from('episodes')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching episodes:', error)
    return []
  }
  
  return data as Episode[]
}

export const revalidate = 0 // Disable cache for now

export default async function Home() {
  const episodes = await getEpisodes()

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Hearing Decoded</h1>
          <p className="text-xl text-gray-600">Listen to our latest episodes</p>
        </div>

        {episodes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No episodes yet. Upload some in the admin panel!</p>
            <Link 
              href="/admin" 
              className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Go to Admin
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {episodes.map((episode) => (
              <Link 
                key={episode.id} 
                href={`/episode/${episode.id}`}
                className="block"
              >
                <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow overflow-hidden flex flex-col md:flex-row">
                  {/* Episode Image - No padding, fills height */}
                  <div className="flex-shrink-0">
                    {episode.image_url ? (
                      <img 
                        src={episode.image_url} 
                        alt={episode.title}
                        className="w-full md:w-72 h-64 object-cover"
                      />
                    ) : (
                      <div className="w-full md:w-72 h-64 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-white text-7xl">🎙️</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Episode Content - Padding only here */}
                  <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-3">
                      {typeof episode.episode_number === 'number' && (
                        <span className="text-sm font-medium text-gray-900">
                          Episode {String(episode.episode_number).padStart(3, '0')}
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <img src="/microphone-icon.svg" alt="Host" className="w-4 h-4" />
                        <span className="text-sm text-gray-700 font-medium">{episode.host}</span>
                      </div>
                      {episode.category && (
                        <span
                          className="text-sm px-3 py-1 rounded-full font-medium text-white"
                          style={{ backgroundColor: '#F97316' }}
                        >
                          {episode.category}
                        </span>
                      )}
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 leading-snug">
                      {episode.title}
                    </h2>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900">▶</span>
                        <span className="text-gray-900 font-medium">Listen now</span>
                      </div>
                      {episode.duration > 0 && (
                        <span className="flex items-center gap-2 text-gray-700">
                          <span className="text-orange-500">🕐</span>
                          <span className="text-sm">{Math.floor(episode.duration / 60)} min</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
