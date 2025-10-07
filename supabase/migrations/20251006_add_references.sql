-- Add references field to episodes table
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS references TEXT;
