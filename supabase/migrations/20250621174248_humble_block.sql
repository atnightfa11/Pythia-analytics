/*
  # Create alerts table for persistent alert storage

  1. New Tables
    - `alerts`
      - `id` (text, primary key - unique alert identifier)
      - `type` (text, required - alert type: spike, drop, anomaly, info)
      - `title` (text, required - alert title)
      - `message` (text, required - alert description)
      - `timestamp` (timestamptz, required - when the alert condition occurred)
      - `severity` (text, required - low, medium, high)
      - `data` (jsonb, optional - additional alert metadata)
      - `acknowledged` (boolean, default false - whether alert has been acknowledged)
      - `created_at` (timestamptz, default now() - when alert was created)

  2. Security
    - Enable RLS on `alerts` table
    - Add policy for service role to manage alerts
    - Add policy for authenticated users to read alerts
    - Add policy for anonymous users to read alerts (for public dashboards)

  3. Indexes
    - Index on timestamp for efficient time-based queries
    - Index on type for efficient filtering
    - Index on severity for priority queries
    - Index on acknowledged for filtering active alerts
*/

-- Create the alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id text PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('spike', 'drop', 'anomaly', 'info')),
  title text NOT NULL,
  message text NOT NULL,
  timestamp timestamptz NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  data jsonb DEFAULT '{}',
  acknowledged boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow service role full access (for alert generation and management)
CREATE POLICY "Allow service role full access on alerts"
  ON alerts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 2: Allow authenticated users to read and acknowledge alerts
CREATE POLICY "Allow authenticated users to read alerts"
  ON alerts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to acknowledge alerts"
  ON alerts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (acknowledged = true);

-- Policy 3: Allow anonymous users to read alerts (for public dashboards)
CREATE POLICY "Allow anonymous read alerts"
  ON alerts
  FOR SELECT
  TO anon
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS alerts_timestamp_idx ON alerts (timestamp DESC);
CREATE INDEX IF NOT EXISTS alerts_type_idx ON alerts (type);
CREATE INDEX IF NOT EXISTS alerts_severity_idx ON alerts (severity);
CREATE INDEX IF NOT EXISTS alerts_acknowledged_idx ON alerts (acknowledged);
CREATE INDEX IF NOT EXISTS alerts_created_at_idx ON alerts (created_at DESC);

-- Insert some sample alerts for testing
INSERT INTO alerts (id, type, title, message, timestamp, severity, data) VALUES
  ('spike-' || extract(epoch from now()), 'spike', 'Traffic Spike Detected', '45% increase in visitors detected', now() - interval '2 hours', 'medium', '{"increase": 45, "threshold": 25}'),
  ('info-' || extract(epoch from now() - interval '6 hours'), 'info', 'System Healthy', 'All analytics systems operational', now() - interval '6 hours', 'low', '{"uptime": "99.9%"}'),
  ('anomaly-' || extract(epoch from now() - interval '12 hours'), 'anomaly', 'Unusual Pattern', 'Mobile traffic 23% higher than predicted', now() - interval '12 hours', 'low', '{"device": "mobile", "variance": 23}')
ON CONFLICT (id) DO NOTHING;