/*
  # Increase PostgREST max rows limit + Add forecast cache columns

  This migration:
  1. Increases the default PostgREST max_rows setting from 1000 to 10000
     to allow longer time range queries to return more than 1000 events.
     The issue was that the 28-day trend chart was getting cut off at July 15th because
     PostgREST's default 1000-row limit was being applied server-side, overriding
     any client-side .limit() calls.

  2. Adds events_count_at_generation and model_version columns to forecasts table
     for proper cache validation and versioning.
*/

-- Set PostgREST max_rows configuration to allow more rows per query
ALTER ROLE postgres SET "pgrst.db_max_rows" = '10000';

-- Add comment for documentation
COMMENT ON DATABASE postgres IS 'PostgREST max_rows increased to 10000 to support longer time range analytics queries';

-- Add cache validation columns to forecasts table
ALTER TABLE forecasts
ADD COLUMN IF NOT EXISTS events_count_at_generation bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS model_version varchar(50) DEFAULT '1.0';

-- Add comments for the new columns
COMMENT ON COLUMN forecasts.events_count_at_generation IS 'Total events count when forecast was generated for cache validation';
COMMENT ON COLUMN forecasts.model_version IS 'Version of the forecasting model used to generate this forecast'; 