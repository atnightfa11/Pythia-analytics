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
    console.log('👥 Fetching live visitors...')
    
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
          liveVisitors: 0
        })
      }
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get query parameters
    const url = new URL(event.rawUrl || `https://example.com${event.path}`)
    const minutesAgo = parseInt(url.searchParams.get('minutes') || '5') // Default 5 minutes
    
    console.log(`⏰ Checking for visitors active in last ${minutesAgo} minutes`)

    // Calculate time window for "live" visitors
    const now = new Date()
    const liveThreshold = new Date(now.getTime() - (minutesAgo * 60 * 1000))

    // Query recent events to find active session_ids
    const { data: recentEvents, error } = await supabase
      .from('events')
      .select('session_id, timestamp, event_type')
      .gte('timestamp', liveThreshold.toISOString())
      .not('session_id', 'is', null) // Only events with session_ids
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('❌ Supabase query error:', error)
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Database query failed',
          details: error.message,
          liveVisitors: 0
        })
      }
    }

    // Count unique session_ids (unique visitors)
    const uniqueSessions = new Set()
    recentEvents?.forEach(event => {
      if (event.session_id && event.session_id !== 'inject-day-0') { // Exclude synthetic data
        uniqueSessions.add(event.session_id)
      }
    })

    const liveVisitors = uniqueSessions.size
    
    console.log(`✅ Live visitors found: ${liveVisitors}`)
    console.log(`📊 Recent events: ${recentEvents?.length || 0}`)
    console.log(`🕐 Time window: ${liveThreshold.toISOString()} to ${now.toISOString()}`)

    // Also get some metadata for debugging
    const sessionBreakdown = {}
    recentEvents?.forEach(event => {
      if (event.session_id && event.session_id !== 'inject-day-0') {
        if (!sessionBreakdown[event.session_id]) {
          sessionBreakdown[event.session_id] = {
            events: 0,
            lastActivity: event.timestamp,
            eventTypes: new Set()
          }
        }
        sessionBreakdown[event.session_id].events += 1
        sessionBreakdown[event.session_id].eventTypes.add(event.event_type)
        
        // Keep the most recent timestamp
        if (new Date(event.timestamp) > new Date(sessionBreakdown[event.session_id].lastActivity)) {
          sessionBreakdown[event.session_id].lastActivity = event.timestamp
        }
      }
    })

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        liveVisitors,
        timeWindow: {
          minutes: minutesAgo,
          from: liveThreshold.toISOString(),
          to: now.toISOString()
        },
        metadata: {
          totalRecentEvents: recentEvents?.length || 0,
          uniqueSessionsFound: uniqueSessions.size,
          sessionDetails: Object.keys(sessionBreakdown).length <= 10 ? sessionBreakdown : null // Only include details if not too many
        },
        generatedAt: now.toISOString()
      })
    }

  } catch (error) {
    console.error('❌ Get live visitors function error:', error)
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        liveVisitors: 0
      })
    }
  }
} 