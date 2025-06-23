/*
  # Cohort Retention Analysis Function

  1. Function
    - `cohort_retention_analysis()` - Calculates cohort retention data
    
  2. Purpose
    - Analyzes user retention patterns by cohort (first visit date)
    - Returns retention data for visualization in heatmap
    
  3. Output
    - cohort_day: Date of first visit for the cohort
    - day_offset: Days since first visit (0-30)
    - sessions: Number of unique sessions that returned on that day
*/

-- Create the cohort retention analysis function
CREATE OR REPLACE FUNCTION cohort_retention_analysis()
RETURNS TABLE (
  cohort_day DATE,
  day_offset INTEGER,
  sessions BIGINT
) AS $$
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
$$ LANGUAGE plpgsql;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION cohort_retention_analysis() TO anon;
GRANT EXECUTE ON FUNCTION cohort_retention_analysis() TO authenticated;