import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Episode {
  id: string
  title: string
  description: string
  host: string
  category: string
  audio_url: string
  image_url: string
  duration: number
  episode_number?: number | null
  references?: string | null
  peaks?: number[] | null
  created_at: string
  updated_at: string
}

export interface Transcript {
  id: string
  episode_id: string
  start_time: number
  end_time: number
  text: string
}

export interface Comment {
  id: string
  episode_id: string
  name: string
  content: string
  created_at: string
}
