/*
  # Add acknowledged_at column to alerts table

  1. Changes
    - Add `acknowledged_at` column (timestamptz, nullable) to track when alerts were acknowledged
    - Add index on acknowledged_at for performance

  2. Purpose
    - Track when alerts were acknowledged by users
    - Support audit trail and analytics
*/

-- Add the acknowledged_at column
ALTER TABLE alerts
ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz;

-- Create index for performance
CREATE INDEX IF NOT EXISTS alerts_acknowledged_at_idx ON alerts (acknowledged_at);

-- Add comment for documentation
COMMENT ON COLUMN alerts.acknowledged_at IS 'Timestamp when alert was acknowledged by user';

-- Update existing acknowledged alerts to have acknowledged_at set
UPDATE alerts
SET acknowledged_at = created_at
WHERE acknowledged = true AND acknowledged_at IS NULL;
