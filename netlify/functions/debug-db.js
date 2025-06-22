import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

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
    console.log('🔍 Debug: Checking database contents...')
    console.log('🔍 Environment check:')
    console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing')
    console.log('  VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing')
    console.log('  SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
    console.log('  VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
    
    // Check if we have the required environment variables
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials')
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Missing Supabase credentials',
          details: 'SUPABASE_URL and SUPABASE_ANON_KEY (or VITE_ prefixed versions) must be set',
          available: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
        })
      }
    }
    
    // Get all events (limited to 50 for safety)
    const { data: allEvents, error: allError } = await supabase
      .from('events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50)

    if (allError) {
      console.error('❌ Error fetching all events:', allError)
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Database query failed',
          details: allError.message,
          code: allError.code,
          hint: allError.hint
        })
      }
    }

    // Get count by event type
    const { data: eventTypes, error: typesError } = await supabase
      .from('events')
      .select('event_type, count')
      .order('timestamp', { ascending: false })
      .limit(100)

    const typeStats = {}
    if (eventTypes && !typesError) {
      eventTypes.forEach(event => {
        if (!typeStats[event.event_type]) {
          typeStats[event.event_type] = { count: 0, total: 0 }
        }
        typeStats[event.event_type].count += 1
        typeStats[event.event_type].total += Number(event.count) || 0
      })
    }

    console.log('📊 Database debug results:')
    console.log('  Total events:', allEvents?.length || 0)
    console.log('  Event types:', typeStats)
    console.log('  Recent events:', allEvents?.slice(0, 5))

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        totalEvents: allEvents?.length || 0,
        eventTypeStats: typeStats,
        recentEvents: allEvents?.slice(0, 10) || [],
        allEvents: allEvents || [],
        timestamp: new Date().toISOString(),
        environment: {
          supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
          supabaseKey: supabaseKey ? 'Set' : 'Missing'
        }
      })
    }

  } catch (error) {
    console.error('❌ Debug function error:', error)
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