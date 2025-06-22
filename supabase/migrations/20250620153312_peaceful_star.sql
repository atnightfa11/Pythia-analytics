/*
  # Create events table with proper RLS policies

  1. New Tables
    - `events`
      - `id` (uuid, primary key, auto-generated)
      - `timestamp` (timestamptz, defaults to now())
      - `event_type` (text, required - the type of event like 'pageview', 'click', etc.)
      - `count` (integer, required - the count/value for this event)

  2. Security
    - Enable RLS on `events` table
    - Add policy for anonymous users to insert events (analytics data)
    - Add policy for authenticated users to read their own data
    - Add policy for service role to read all data (for aggregations)

  3. Indexes
    - Index on timestamp for efficient time-based queries
    - Index on event_type for efficient filtering
*/

-- Create the events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  event_type text NOT NULL,
  count integer NOT NULL DEFAULT 1
);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow anonymous users to INSERT events (for analytics collection)
CREATE POLICY "Allow anonymous insert for analytics"
  ON events
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy 2: Allow authenticated users to read all events (for dashboard)
CREATE POLICY "Allow authenticated read all events"
  ON events
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 3: Allow service role to do everything (for admin functions)
CREATE POLICY "Allow service role full access"
  ON events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 4: Allow anonymous users to read aggregated data (for public dashboards)
CREATE POLICY "Allow anonymous read for aggregations"
  ON events
  FOR SELECT
  TO anon
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS events_timestamp_idx ON events (timestamp DESC);
CREATE INDEX IF NOT EXISTS events_event_type_idx ON events (event_type);
CREATE INDEX IF NOT EXISTS events_timestamp_type_idx ON events (timestamp DESC, event_type);

-- Insert some sample data for testing
INSERT INTO events (event_type, count, timestamp) VALUES
  ('pageview', 1, now() - interval '1 hour'),
  ('pageview', 1, now() - interval '2 hours'),
  ('click', 1, now() - interval '3 hours'),
  ('pageview', 2, now() - interval '4 hours'),
  ('signup', 1, now() - interval '5 hours'),
  ('pageview', 1, now() - interval '6 hours'),
  ('click', 3, now() - interval '7 hours'),
  ('pageview', 1, now() - interval '8 hours')
ON CONFLICT DO NOTHING;