-- Add precomputed waveform peaks to episodes for instant waveform rendering
ALTER TABLE episodes
ADD COLUMN IF NOT EXISTS peaks JSONB;
