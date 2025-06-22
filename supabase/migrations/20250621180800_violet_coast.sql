/*
  # Add session and device tracking to events table

  1. Schema Changes
    - Add `session_id` column (text, nullable for backward compatibility)
    - Add `device` column (text, nullable for backward compatibility)

  2. Indexes
    - Add index on session_id for efficient session-based queries
    - Add index on device for device breakdown queries
    - Add composite index for session + device analytics

  3. Sample Data
    - Update existing events with sample session and device data
*/

-- Add new columns to events table
DO $$
BEGIN
  -- Add session_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE events ADD COLUMN session_id text;
  END IF;

  -- Add device column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'device'
  ) THEN
    ALTER TABLE events ADD COLUMN device text;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS events_session_id_idx ON events (session_id);
CREATE INDEX IF NOT EXISTS events_device_idx ON events (device);
CREATE INDEX IF NOT EXISTS events_session_device_idx ON events (session_id, device);

-- Backfill existing events with sample session and device data
UPDATE events 
SET 
  session_id = CASE 
    WHEN session_id IS NULL THEN 'legacy-session-' || extract(epoch from timestamp)::text
    ELSE session_id
  END,
  device = CASE 
    WHEN device IS NULL THEN 
      CASE (random() * 3)::int
        WHEN 0 THEN 'Desktop'
        WHEN 1 THEN 'Mobile'
        ELSE 'Tablet'
      END
    ELSE device
  END
WHERE session_id IS NULL OR device IS NULL;

-- Insert some sample events with session and device data for testing
INSERT INTO events (event_type, count, timestamp, session_id, device) VALUES
  ('pageview', 1, now() - interval '30 minutes', gen_random_uuid()::text, 'Desktop'),
  ('pageview', 1, now() - interval '25 minutes', gen_random_uuid()::text, 'Mobile'),
  ('click', 1, now() - interval '20 minutes', gen_random_uuid()::text, 'Desktop'),
  ('pageview', 2, now() - interval '15 minutes', gen_random_uuid()::text, 'Tablet'),
  ('signup', 1, now() - interval '10 minutes', gen_random_uuid()::text, 'Mobile'),
  ('pageview', 1, now() - interval '5 minutes', gen_random_uuid()::text, 'Desktop')
ON CONFLICT DO NOTHING;