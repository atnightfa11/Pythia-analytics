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
        body: JSON.stringify({ error: allError.message })
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
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('❌ Debug function error:', error)
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      })
    }
  }
}