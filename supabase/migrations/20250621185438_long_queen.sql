/*
  # Create forecasts table for Prophet predictions

  1. New Tables
    - `forecasts`
      - `id` (uuid, primary key, auto-generated)
      - `forecast` (double precision, the predicted value)
      - `mape` (double precision, mean absolute percentage error)
      - `generated_at` (timestamptz, when forecast was generated)

  2. Security
    - Enable RLS on `forecasts` table
    - Add policies for service role and authenticated users

  3. Indexes
    - Index on generated_at for efficient time-based queries
*/

-- Create the forecasts table
CREATE TABLE IF NOT EXISTS forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast double precision NOT NULL,
  mape double precision,
  generated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow service role full access (for forecast generation)
CREATE POLICY "Allow service role full access on forecasts"
  ON forecasts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 2: Allow authenticated users to read forecasts
CREATE POLICY "Allow authenticated users to read forecasts"
  ON forecasts
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 3: Allow anonymous users to read forecasts (for public dashboards)
CREATE POLICY "Allow anonymous read forecasts"
  ON forecasts
  FOR SELECT
  TO anon
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS forecasts_generated_at_idx ON forecasts (generated_at DESC);

-- Insert a sample forecast for testing
INSERT INTO forecasts (forecast, mape, generated_at) VALUES
  (125.5, 8.2, now() - interval '1 hour')
ON CONFLICT DO NOTHING;