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
    console.log('📊 Fetching metrics with session and device data...')
    
    // Get query parameters
    const url = new URL(event.rawUrl || `https://example.com${event.path}`)
    const days = parseInt(url.searchParams.get('days') || '30')
    
    console.log(`📅 Fetching metrics for last ${days} days`)

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000))

    // Get unique visitor count (distinct session_ids)
    console.log('👥 Counting unique visitors...')
    const { data: visitorData, error: visitorError } = await supabase
      .from('events')
      .select('session_id')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .not('session_id', 'is', null)

    if (visitorError) {
      console.error('❌ Error fetching visitor data:', visitorError)
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Failed to fetch visitor data',
          details: visitorError.message 
        })
      }
    }

    // Count unique sessions
    const uniqueSessions = new Set(visitorData?.map(row => row.session_id) || [])
    const totalVisitors = uniqueSessions.size

    console.log(`👥 Found ${totalVisitors} unique visitors`)

    // Get device breakdown
    console.log('📱 Analyzing device breakdown...')
    const { data: deviceData, error: deviceError } = await supabase
      .from('events')
      .select('device, session_id')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .not('device', 'is', null)
      .not('session_id', 'is', null)

    if (deviceError) {
      console.error('❌ Error fetching device data:', deviceError)
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Failed to fetch device data',
          details: deviceError.message 
        })
      }
    }

    // Calculate device stats by unique sessions
    const deviceSessions = {}
    deviceData?.forEach(row => {
      if (!deviceSessions[row.device]) {
        deviceSessions[row.device] = new Set()
      }
      deviceSessions[row.device].add(row.session_id)
    })

    const deviceStats = Object.entries(deviceSessions).map(([device, sessions]) => ({
      device,
      visitors: sessions.size,
      percentage: totalVisitors > 0 ? ((sessions.size / totalVisitors) * 100).toFixed(1) : '0'
    }))

    console.log('📱 Device breakdown:', deviceStats)

    // Get total events and pageviews
    console.log('📈 Calculating event metrics...')
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('event_type, count')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())

    if (eventError) {
      console.error('❌ Error fetching event data:', eventError)
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Failed to fetch event data',
          details: eventError.message 
        })
      }
    }

    const totalEvents = eventData?.length || 0
    const totalPageviews = eventData?.filter(e => e.event_type === 'pageview').length || 0
    const totalCount = eventData?.reduce((sum, e) => sum + (Number(e.count) || 0), 0) || 0

    // Get session trends (compare last 7 days to previous 7 days)
    console.log('📊 Calculating trends...')
    const last7Days = new Date(endDate.getTime() - (7 * 24 * 60 * 60 * 1000))
    const prev7Days = new Date(endDate.getTime() - (14 * 24 * 60 * 60 * 1000))

    const { data: recentSessions, error: recentError } = await supabase
      .from('events')
      .select('session_id')
      .gte('timestamp', last7Days.toISOString())
      .lte('timestamp', endDate.toISOString())
      .not('session_id', 'is', null)

    const { data: previousSessions, error: previousError } = await supabase
      .from('events')
      .select('session_id')
      .gte('timestamp', prev7Days.toISOString())
      .lt('timestamp', last7Days.toISOString())
      .not('session_id', 'is', null)

    const recentUniqueVisitors = new Set(recentSessions?.map(row => row.session_id) || []).size
    const previousUniqueVisitors = new Set(previousSessions?.map(row => row.session_id) || []).size

    const visitorTrend = previousUniqueVisitors > 0 
      ? ((recentUniqueVisitors - previousUniqueVisitors) / previousUniqueVisitors) * 100 
      : 0

    console.log(`📈 Visitor trend: ${visitorTrend.toFixed(1)}% (${recentUniqueVisitors} vs ${previousUniqueVisitors})`)

    // Get top event types
    const eventTypeCounts = {}
    eventData?.forEach(event => {
      eventTypeCounts[event.event_type] = (eventTypeCounts[event.event_type] || 0) + 1
    })

    console.log('✅ Metrics calculation complete')

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        metrics: {
          totalVisitors,
          totalPageviews,
          totalEvents,
          totalCount,
          visitorTrend: visitorTrend.toFixed(1),
          conversionRate: totalVisitors > 0 ? ((eventTypeCounts.signup || 0) / totalVisitors * 100).toFixed(1) : '0'
        },
        deviceStats,
        eventTypeCounts,
        summary: {
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          },
          uniqueSessions: totalVisitors,
          totalEvents,
          devicesTracked: deviceStats.length
        },
        generatedAt: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('❌ Get metrics function error:', error)
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