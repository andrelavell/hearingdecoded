-- Drop existing tables if they exist
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS transcripts CASCADE;
DROP TABLE IF EXISTS episodes CASCADE;

-- Create episodes table
CREATE TABLE episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  host TEXT NOT NULL,
  category TEXT,
  audio_url TEXT NOT NULL,
  image_url TEXT,
  duration INTEGER NOT NULL DEFAULT 0,
  episode_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transcripts table
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  start_time DECIMAL NOT NULL,
  end_time DECIMAL NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_transcripts_episode_id ON transcripts(episode_id);
CREATE INDEX idx_transcripts_time ON transcripts(episode_id, start_time);
CREATE INDEX idx_comments_episode_id ON comments(episode_id);


-- Enable Row Level Security
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public episodes are viewable by everyone" 
  ON episodes FOR SELECT 
  USING (true);

CREATE POLICY "Public transcripts are viewable by everyone" 
  ON transcripts FOR SELECT 
  USING (true);

CREATE POLICY "Public comments are viewable by everyone" 
  ON comments FOR SELECT 
  USING (true);

-- Create policies for admin access (for now, allow all inserts/updates/deletes)
-- You can add authentication later
CREATE POLICY "Anyone can insert episodes" 
  ON episodes FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update episodes" 
  ON episodes FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can delete episodes" 
  ON episodes FOR DELETE 
  USING (true);

CREATE POLICY "Anyone can insert transcripts" 
  ON transcripts FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can insert comments" 
  ON comments FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update comments" 
  ON comments FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can delete comments" 
  ON comments FOR DELETE 
  USING (true);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('episodes', 'episodes', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Public episode files are accessible" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'episodes');

CREATE POLICY "Anyone can upload episode files" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'episodes');

CREATE POLICY "Anyone can update episode files" 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'episodes');

CREATE POLICY "Anyone can delete episode files" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'episodes');
