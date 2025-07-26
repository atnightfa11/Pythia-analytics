/*
  # Increase PostgREST max rows limit

  This migration increases the default PostgREST max_rows setting from 1000 to 10000
  to allow longer time range queries to return more than 1000 events.

  The issue was that the 28-day trend chart was getting cut off at July 15th because
  PostgREST's default 1000-row limit was being applied server-side, overriding 
  any client-side .limit() calls.
*/

-- Set PostgREST max_rows configuration to allow more rows per query
ALTER ROLE postgres SET "pgrst.db_max_rows" = '10000';

-- Add comment for documentation
COMMENT ON DATABASE postgres IS 'PostgREST max_rows increased to 10000 to support longer time range analytics queries'; 