/*
  # Add missing columns to forecasts table

  1. Changes
    - Add `future` column (jsonb) for storing time series forecast data
    - Add `metadata` column (jsonb) for storing algorithm info and other metadata

  2. Update sample data to include these columns
*/

-- Add the missing columns
ALTER TABLE forecasts 
ADD COLUMN IF NOT EXISTS future jsonb,
ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Update existing forecasts to have some basic metadata
UPDATE forecasts 
SET metadata = jsonb_build_object(
  'algorithm', 'legacy',
  'source', 'unknown',
  'tuning', CASE WHEN mape < 20 THEN 'optimized' ELSE 'default' END
)
WHERE metadata IS NULL;

-- Add a comment to document the new columns
COMMENT ON COLUMN forecasts.future IS 'JSON array of future forecast points with ds, yhat, yhat_lower, yhat_upper';
COMMENT ON COLUMN forecasts.metadata IS 'JSON object with algorithm, source, tuning, and other metadata'; 