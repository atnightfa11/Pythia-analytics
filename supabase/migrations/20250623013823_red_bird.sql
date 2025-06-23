/*
  # Create pageviews table for UTM source tracking

  1. New Tables
    - `pageviews`
      - `id` (uuid, primary key, auto-generated)
      - `timestamp` (timestamptz, defaults to now())
      - `url` (text, the page URL)
      - `source` (jsonb, UTM parameters as JSON object)
      - `session_id` (text, session identifier)
      - `device` (text, device type)
      - `referrer` (text, optional referrer URL)

  2. Security
    - Enable RLS on `pageviews` table
    - Add policies for anonymous and authenticated access

  3. Indexes
    - Index on timestamp for time-based queries
    - Index on source for UTM filtering
    - Index on session_id for session analysis
*/

-- Create the pageviews table
CREATE TABLE IF NOT EXISTS pageviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  url text NOT NULL,
  source jsonb DEFAULT '{}',
  session_id text,
  device text,
  referrer text
);

-- Enable Row Level Security
ALTER TABLE pageviews ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow anonymous users to INSERT pageviews (for analytics collection)
CREATE POLICY "Allow anonymous insert pageviews"
  ON pageviews
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy 2: Allow authenticated users to read all pageviews
CREATE POLICY "Allow authenticated read pageviews"
  ON pageviews
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 3: Allow service role full access
CREATE POLICY "Allow service role full access on pageviews"
  ON pageviews
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 4: Allow anonymous users to read aggregated data
CREATE POLICY "Allow anonymous read pageviews"
  ON pageviews
  FOR SELECT
  TO anon
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS pageviews_timestamp_idx ON pageviews (timestamp DESC);
CREATE INDEX IF NOT EXISTS pageviews_source_idx ON pageviews USING GIN (source);
CREATE INDEX IF NOT EXISTS pageviews_session_id_idx ON pageviews (session_id);
CREATE INDEX IF NOT EXISTS pageviews_device_idx ON pageviews (device);

-- Insert some sample pageviews with UTM data for testing
INSERT INTO pageviews (url, source, session_id, device, timestamp) VALUES
  ('/landing', '{"utm_source": "google", "utm_medium": "cpc", "utm_campaign": "brand"}', gen_random_uuid()::text, 'Desktop', now() - interval '1 hour'),
  ('/pricing', '{"utm_source": "facebook", "utm_medium": "social", "utm_campaign": "retargeting"}', gen_random_uuid()::text, 'Mobile', now() - interval '2 hours'),
  ('/features', '{"utm_source": "twitter", "utm_medium": "social", "utm_campaign": "launch"}', gen_random_uuid()::text, 'Desktop', now() - interval '3 hours'),
  ('/signup', '{"utm_source": "email", "utm_medium": "newsletter", "utm_campaign": "weekly"}', gen_random_uuid()::text, 'Tablet', now() - interval '4 hours'),
  ('/dashboard', '{"utm_source": "direct", "utm_medium": "none", "utm_campaign": "none"}', gen_random_uuid()::text, 'Desktop', now() - interval '5 hours')
ON CONFLICT DO NOTHING;