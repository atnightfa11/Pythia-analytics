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
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
    
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
    
    // Get query parameters
    const params = event.queryStringParameters || {}
    const days = parseInt(params.days || '30')
    
    console.log(`🔍 Executing cohort retention analysis for ${days} days...`)
    
    // Try to use the SQL function first
    try {
      const { data: cohortData, error } = await supabase.rpc('cohort_retention_analysis')
      
      if (!error && cohortData) {
        console.log(`✅ Cohort analysis complete: ${cohortData.length} data points`)
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            success: true,
            data: cohortData,
            processedBy: 'sql',
            generatedAt: new Date().toISOString()
          })
        }
      }
    } catch (sqlError) {
      console.warn('⚠️ SQL function failed, falling back to JavaScript processing:', sqlError)
    }
    
    // Fallback to JavaScript processing
    console.log('🔄 Processing cohort data with JavaScript...')
    
    const { data: rawData, error: rawError } = await supabase
      .from('pageviews')
      .select('session_id, timestamp')
      .not('session_id', 'is', null)
      .order('timestamp', { ascending: true })
      .limit(5000) // Limit to prevent memory issues
    
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
    
    const cohortAnalysis = processCohortData(rawData, days)
    
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
function processCohortData(pageviews, maxDays = 30) {
  console.log('📊 Processing cohort data for', pageviews.length, 'pageviews')
  
  // Group by session to find first day (cohort day)
  const sessionFirstDay = {}
  pageviews.forEach(pv => {
    const date = new Date(pv.timestamp).toISOString().split('T')[0]
    if (!sessionFirstDay[pv.session_id] || date < sessionFirstDay[pv.session_id]) {
      sessionFirstDay[pv.session_id] = date
    }
  })
  
  console.log('👥 Found', Object.keys(sessionFirstDay).length, 'unique sessions')
  
  // Calculate retention data
  const retentionData = {}
  
  pageviews.forEach(pv => {
    const cohortDay = sessionFirstDay[pv.session_id]
    if (!cohortDay) return
    
    const cohortDate = new Date(cohortDay)
    const visitDate = new Date(pv.timestamp)
    const dayOffset = Math.floor((visitDate - cohortDate) / (1000 * 60 * 60 * 24))
    
    // Only include data for specified days range
    if (dayOffset < 0 || dayOffset > maxDays) return
    
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