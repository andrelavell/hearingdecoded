-- Create episode_slugs table for multiple custom slugs per episode
CREATE TABLE IF NOT EXISTS episode_slugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_episode_slugs_episode_id ON episode_slugs(episode_id);
CREATE INDEX IF NOT EXISTS idx_episode_slugs_slug ON episode_slugs(slug);

-- RLS
ALTER TABLE episode_slugs ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY IF NOT EXISTS "Public slugs are viewable by everyone"
  ON episode_slugs FOR SELECT
  USING (true);

-- Open write policies (match existing episodes policy; lock down later if needed)
CREATE POLICY IF NOT EXISTS "Anyone can insert slugs"
  ON episode_slugs FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Anyone can delete slugs"
  ON episode_slugs FOR DELETE
  USING (true);
