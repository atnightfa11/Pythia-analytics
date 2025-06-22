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
    console.log('📊 Fetching events for dashboard...')
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
          details: 'SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables',
          available: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
        })
      }
    }
    
    // Create Supabase client inside the handler
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get query parameters
    const url = new URL(event.rawUrl || `https://example.com${event.path}`)
    const days = parseInt(url.searchParams.get('days') || '30')
    const eventType = url.searchParams.get('type')
    
    console.log(`📅 Fetching last ${days} days of data`)
    if (eventType) console.log(`🎯 Filtering by event type: ${eventType}`)

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000))

    // Build query
    let query = supabase
      .from('events')
      .select('timestamp, event_type, count, session_id, device')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: true })

    if (eventType) {
      query = query.eq('event_type', eventType)
    }

    const { data: events, error } = await query

    if (error) {
      console.error('❌ Supabase fetch error:', error)
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Database query failed',
          details: error.message,
          code: error.code,
          hint: error.hint
        })
      }
    }

    console.log(`📋 Found ${events?.length || 0} events`)

    // Aggregate data by day
    const dailyData = {}
    const eventTypeCounts = {}
    let totalEvents = 0
    let totalCount = 0

    events?.forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0]
      const count = Number(event.count) || 0
      
      // Daily aggregation
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          events: 0,
          count: 0,
          types: {}
        }
      }
      
      dailyData[date].events += 1
      dailyData[date].count += count
      dailyData[date].types[event.event_type] = (dailyData[date].types[event.event_type] || 0) + count

      // Event type aggregation
      eventTypeCounts[event.event_type] = (eventTypeCounts[event.event_type] || 0) + count
      
      totalEvents += 1
      totalCount += count
    })

    // Convert to array and sort by date
    const timeSeriesData = Object.values(dailyData).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Get recent events for real-time display
    const { data: recentEvents, error: recentError } = await supabase
      .from('events')
      .select('timestamp, event_type, count, session_id, device')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .order('timestamp', { ascending: false })
      .limit(100)

    // Aggregate recent events by hour for real-time chart
    const hourlyData = {}
    recentEvents?.forEach(event => {
      const hour = new Date(event.timestamp).toISOString().slice(0, 13) + ':00:00.000Z'
      if (!hourlyData[hour]) {
        hourlyData[hour] = { hour, events: 0, count: 0 }
      }
      hourlyData[hour].events += 1
      hourlyData[hour].count += Number(event.count) || 0
    })

    const realtimeData = Object.values(hourlyData)
      .sort((a, b) => new Date(a.hour).getTime() - new Date(b.hour).getTime())
      .slice(-24) // Last 24 hours

    console.log('✅ Data aggregation complete')
    console.log(`📊 Summary: ${totalEvents} events, ${totalCount} total count`)
    console.log(`📈 Time series points: ${timeSeriesData.length}`)
    console.log(`⏰ Real-time points: ${realtimeData.length}`)

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        summary: {
          totalEvents,
          totalCount,
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          },
          eventTypes: Object.keys(eventTypeCounts).length
        },
        timeSeries: timeSeriesData,
        realtime: realtimeData,
        eventTypeCounts,
        rawEvents: events?.slice(-50) || [], // Last 50 raw events for debugging
        generatedAt: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('❌ Get events function error:', error)
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