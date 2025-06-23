/*
  # Fix cohort retention analysis function

  1. Function Updates
    - Remove mutable search_path issue
    - Add proper security definer
    - Ensure stable function behavior

  2. Security
    - Set search_path explicitly
    - Use security definer for consistent execution
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS cohort_retention_analysis();

-- Create the cohort retention analysis function with proper security
CREATE OR REPLACE FUNCTION cohort_retention_analysis()
RETURNS TABLE (
  cohort_day DATE,
  day_offset INTEGER,
  sessions BIGINT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH first_day AS (
    SELECT 
      session_id, 
      MIN(DATE(timestamp)) AS cohort_day
    FROM pageviews
    WHERE session_id IS NOT NULL
    GROUP BY session_id
  ),
  retained AS (
    SELECT 
      f.cohort_day,
      EXTRACT(DAY FROM (DATE(p.timestamp) - f.cohort_day))::INTEGER AS day_offset,
      COUNT(DISTINCT p.session_id) AS sessions
    FROM first_day f
    JOIN pageviews p USING (session_id)
    WHERE EXTRACT(DAY FROM (DATE(p.timestamp) - f.cohort_day)) BETWEEN 0 AND 30
    GROUP BY f.cohort_day, EXTRACT(DAY FROM (DATE(p.timestamp) - f.cohort_day))
  )
  SELECT 
    r.cohort_day, 
    r.day_offset, 
    r.sessions
  FROM retained r
  ORDER BY r.cohort_day, r.day_offset;
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION cohort_retention_analysis() TO anon;
GRANT EXECUTE ON FUNCTION cohort_retention_analysis() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION cohort_retention_analysis() IS 'Analyzes user retention by cohort day and day offset, returns sessions count for each cohort/day combination';