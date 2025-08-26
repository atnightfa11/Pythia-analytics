/*
  # Add country column to events table

  1. Changes
    - Add `country` column (text) to events table for timezone-based country detection
    - Add index on country for performance

  2. Privacy Notes
    - Country detection uses browser timezone (client-side only)
    - No IP addresses or server-side geolocation
    - Country codes are approximate (timezone mapping)
    - Data is still subject to differential privacy noise

  3. Purpose
    - Provide geographic insights for marketing analytics
    - Enable country-level segmentation and trends
*/

-- Add the country column
ALTER TABLE events
ADD COLUMN IF NOT EXISTS country text DEFAULT 'Unknown';

-- Add index for performance on geographic queries
CREATE INDEX IF NOT EXISTS events_country_idx ON events (country);
CREATE INDEX IF NOT EXISTS events_country_timestamp_idx ON events (country, timestamp DESC);

-- Add comment for documentation
COMMENT ON COLUMN events.country IS 'Approximate country code detected from browser timezone (privacy-preserving)';
