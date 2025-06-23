import { createClient } from '@supabase/supabase-js'

export const handler = async (event, context) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    }
  }

  try {
    console.log('📊 Fetching cohort retention analysis...')
    
    // Check environment variables
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials')
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Missing Supabase credentials',
          details: 'SUPABASE_URL and SUPABASE_ANON_KEY must be set'
        })
      }
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    console.log('🔍 Executing cohort retention SQL query...')
    
    // Execute the cohort retention analysis SQL
    const { data: cohortData, error } = await supabase.rpc('cohort_retention_analysis')
    
    if (error) {
      console.error('❌ Error executing cohort query:', error)
      
      // If the function doesn't exist, execute the raw SQL
      console.log('🔄 Trying raw SQL query...')
      
      const { data: rawData, error: rawError } = await supabase
        .from('pageviews')
        .select(`
          session_id,
          timestamp,
          DATE(timestamp) as date
        `)
        .order('timestamp', { ascending: true })
      
      if (rawError) {
        console.error('❌ Raw query failed:', rawError)
        return {
          statusCode: 500,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ 
            error: 'Failed to fetch pageview data',
            details: rawError.message
          })
        }
      }
      
      // Process data in JavaScript since SQL function might not exist
      console.log('⚙️ Processing cohort data in JavaScript...')
      
      const cohortAnalysis = processCohortData(rawData)
      
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          success: true,
          data: cohortAnalysis,
          processedBy: 'javascript',
          totalSessions: new Set(rawData.map(r => r.session_id)).size,
          generatedAt: new Date().toISOString()
        })
      }
    }

    console.log(`✅ Cohort analysis complete: ${cohortData?.length || 0} data points`)

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        data: cohortData || [],
        processedBy: 'sql',
        generatedAt: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('❌ Cohort analysis function error:', error)
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        stack: error.stack
      })
    }
  }
}

// JavaScript implementation of cohort analysis
function processCohortData(pageviews) {
  console.log('📊 Processing cohort data for', pageviews.length, 'pageviews')
  
  // Group by session to find first day (cohort day)
  const sessionFirstDay = {}
  pageviews.forEach(pv => {
    if (!sessionFirstDay[pv.session_id] || pv.date < sessionFirstDay[pv.session_id]) {
      sessionFirstDay[pv.session_id] = pv.date
    }
  })
  
  console.log('👥 Found', Object.keys(sessionFirstDay).length, 'unique sessions')
  
  // Calculate retention data
  const retentionData = {}
  
  pageviews.forEach(pv => {
    const cohortDay = sessionFirstDay[pv.session_id]
    if (!cohortDay) return
    
    const cohortDate = new Date(cohortDay)
    const visitDate = new Date(pv.date)
    const dayOffset = Math.floor((visitDate - cohortDate) / (1000 * 60 * 60 * 24))
    
    // Only include data for first 30 days
    if (dayOffset < 0 || dayOffset > 30) return
    
    const key = `${cohortDay}_${dayOffset}`
    if (!retentionData[key]) {
      retentionData[key] = {
        cohort_day: cohortDay,
        day_offset: dayOffset,
        sessions: new Set()
      }
    }
    
    retentionData[key].sessions.add(pv.session_id)
  })
  
  // Convert to final format
  const result = Object.values(retentionData).map(item => ({
    cohort_day: item.cohort_day,
    day_offset: item.day_offset,
    sessions: item.sessions.size
  }))
  
  console.log('📈 Generated', result.length, 'cohort data points')
  
  return result.sort((a, b) => {
    if (a.cohort_day !== b.cohort_day) {
      return a.cohort_day.localeCompare(b.cohort_day)
    }
    return a.day_offset - b.day_offset
  })
}