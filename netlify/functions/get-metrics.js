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
    console.log('📊 Fetching enhanced metrics with session, device, and geographic data...')
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
    
    // Create Supabase client inside the handler
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get query parameters
    const url = new URL(event.rawUrl || `https://example.com${event.path}`)
    const days = parseInt(url.searchParams.get('days') || '30')
    
    console.log(`📅 Fetching enhanced metrics for last ${days} days`)

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000))

    // Get all events for comprehensive analysis
    console.log('📊 Fetching all events for analysis...')
    const { data: allEvents, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: true })

    if (eventsError) {
      console.error('❌ Error fetching events:', eventsError)
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Failed to fetch events',
          details: eventsError.message,
          code: eventsError.code,
          hint: eventsError.hint
        })
      }
    }

    console.log(`📋 Analyzing ${allEvents?.length || 0} events`)

    // 📱 Get device data from pageviews table (where device field actually exists)
    console.log('📱 Fetching device data from pageviews...')
    const { data: pageviews, error: pageviewsError } = await supabase
      .from('pageviews')
      .select('device, session_id, timestamp')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())

    if (pageviewsError) {
      console.warn('⚠️ Error fetching pageviews for device data:', pageviewsError)
    }

    // Group events by session for bounce rate and time on site calculations
    const sessionData = {}
    const deviceStats = {}
    const conversionEvents = ['checkout', 'signup', 'purchase', 'subscribe', 'download', 'conversion']
    let totalConversions = 0
    
    allEvents?.forEach(event => {
      // Session analysis (events table doesn't have session_id, so limited analysis)
      const sessionId = event.session_id || `event-${event.id}`
      if (!sessionData[sessionId]) {
        sessionData[sessionId] = {
          events: [],
          device: null, // Will be populated from pageviews
          firstEvent: event.timestamp,
          lastEvent: event.timestamp
        }
      }
      sessionData[sessionId].events.push(event)
      sessionData[sessionId].lastEvent = event.timestamp

      // Conversion tracking
      if (conversionEvents.includes(event.event_type.toLowerCase())) {
        totalConversions += 1
      }
    })

    // 📱 Process device data from pageviews
    pageviews?.forEach(pageview => {
      if (pageview.device) {
        if (!deviceStats[pageview.device]) {
          deviceStats[pageview.device] = { sessions: new Set(), events: 0 }
        }
        if (pageview.session_id) {
          deviceStats[pageview.device].sessions.add(pageview.session_id)
        }
        deviceStats[pageview.device].events += 1

        // Update session data with device info
        if (pageview.session_id && sessionData[pageview.session_id]) {
          sessionData[pageview.session_id].device = pageview.device
        }
      }
    })

    const sessions = Object.values(sessionData)
    const totalSessions = sessions.length

    // Calculate bounce rate (sessions with only 1 event)
    const bouncedSessions = sessions.filter(session => session.events.length === 1).length
    const bounceRate = totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0

    // Calculate average time on site
    let totalSessionTime = 0
    let validSessions = 0
    
    sessions.forEach(session => {
      if (session.events.length > 1) {
        const sessionDuration = new Date(session.lastEvent).getTime() - new Date(session.firstEvent).getTime()
        if (sessionDuration > 0 && sessionDuration < 30 * 60 * 1000) { // Less than 30 minutes
          totalSessionTime += sessionDuration
          validSessions++
        }
      }
    })
    
    const avgTimeOnSite = validSessions > 0 ? totalSessionTime / validSessions / 1000 : 0 // Convert to seconds

    // Calculate conversion rate
    const conversionRate = totalSessions > 0 ? (totalConversions / totalSessions) * 100 : 0

    // Device breakdown with unique sessions (using count field expected by dashboard)
    const deviceBreakdown = Object.entries(deviceStats).map(([device, stats]) => ({
      device,
      count: stats.sessions.size, // Dashboard expects 'count' field
      sessions: stats.sessions.size,
      events: stats.events,
      percentage: totalSessions > 0 ? ((stats.sessions.size / totalSessions) * 100).toFixed(1) : '0'
    }))

    // Mock geographic data (in production, this would come from server-side IP geolocation)
    // We're simulating this to show the feature without compromising privacy
    const mockGeographicData = [
      { country: 'United States', sessions: Math.floor(totalSessions * 0.35), percentage: 35 },
      { country: 'United Kingdom', sessions: Math.floor(totalSessions * 0.20), percentage: 20 },
      { country: 'Canada', sessions: Math.floor(totalSessions * 0.15), percentage: 15 },
      { country: 'Germany', sessions: Math.floor(totalSessions * 0.12), percentage: 12 },
      { country: 'France', sessions: Math.floor(totalSessions * 0.10), percentage: 10 },
      { country: 'Other', sessions: Math.floor(totalSessions * 0.08), percentage: 8 },
    ]

    // Calculate trends (compare last 7 days to previous 7 days)
    const last7Days = new Date(endDate.getTime() - (7 * 24 * 60 * 60 * 1000))
    const prev7Days = new Date(endDate.getTime() - (14 * 24 * 60 * 60 * 1000))

    const recentEvents = allEvents?.filter(e => new Date(e.timestamp) >= last7Days) || []
    const previousEvents = allEvents?.filter(e => {
      const eventDate = new Date(e.timestamp)
      return eventDate >= prev7Days && eventDate < last7Days
    }) || []

    const recentSessions = new Set(recentEvents.map(e => e.session_id).filter(Boolean)).size
    const previousSessions = new Set(previousEvents.map(e => e.session_id).filter(Boolean)).size

    const sessionTrend = previousSessions > 0 
      ? ((recentSessions - previousSessions) / previousSessions) * 100 
      : 0

    console.log('✅ Enhanced metrics calculation complete')
    console.log(`📊 Summary: ${totalSessions} sessions, ${bounceRate.toFixed(1)}% bounce rate, ${avgTimeOnSite.toFixed(0)}s avg time`)

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        metrics: {
          totalSessions,
          totalEvents: allEvents?.length || 0,
          bounceRate: bounceRate.toFixed(1),
          avgTimeOnSite: avgTimeOnSite.toFixed(0),
          conversionRate: conversionRate.toFixed(1),
          totalConversions,
          sessionTrend: sessionTrend.toFixed(1)
        },
        deviceBreakdown,
        geographicData: mockGeographicData,
        conversions: {
          total: totalConversions,
          rate: conversionRate.toFixed(1),
          events: conversionEvents
        },
        summary: {
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          },
          sessionsAnalyzed: totalSessions,
          eventsAnalyzed: allEvents?.length || 0,
          devicesTracked: Object.keys(deviceStats).length
        },
        generatedAt: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('❌ Get enhanced metrics function error:', error)
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