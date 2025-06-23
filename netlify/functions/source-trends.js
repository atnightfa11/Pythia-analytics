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
    console.log('📊 Fetching source trends...')
    
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
    
    // Get query parameters
    const url = new URL(event.rawUrl || `https://example.com${event.path}`)
    const fromParam = url.searchParams.get('from')
    const days = parseInt(url.searchParams.get('days') || '30')
    
    // Calculate date range
    let startDate
    if (fromParam) {
      startDate = new Date(fromParam)
    } else {
      startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000))
    }
    const endDate = new Date()
    
    console.log(`📅 Analyzing source trends from ${startDate.toISOString()} to ${endDate.toISOString()}`)

    // Fetch pageviews with source data
    const { data: pageviews, error } = await supabase
      .from('pageviews')
      .select('timestamp, source, session_id, device')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: true })

    if (error) {
      console.error('❌ Error fetching pageviews:', error)
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Failed to fetch pageviews',
          details: error.message,
          code: error.code,
          hint: error.hint
        })
      }
    }

    console.log(`📋 Analyzing ${pageviews?.length || 0} pageviews`)

    if (!pageviews || pageviews.length === 0) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          success: true,
          dailyTrends: [],
          topSources: [],
          summary: {
            totalPageviews: 0,
            uniqueSessions: 0,
            dateRange: {
              start: startDate.toISOString(),
              end: endDate.toISOString()
            }
          },
          generatedAt: new Date().toISOString()
        })
      }
    }

    // Group pageviews by day and source
    const dailySourceData = {}
    const sourceStats = {}
    const uniqueSessions = new Set()

    pageviews.forEach(pageview => {
      const date = new Date(pageview.timestamp).toISOString().split('T')[0]
      const source = pageview.source || {}
      
      // Create source key for grouping
      const sourceKey = source.utm_source || 'direct'
      const sourceMedium = source.utm_medium || 'none'
      const sourceCampaign = source.utm_campaign || 'none'
      
      const sourceObject = {
        source: sourceKey,
        medium: sourceMedium,
        campaign: sourceCampaign,
        full: source
      }
      
      const sourceId = `${sourceKey}|${sourceMedium}|${sourceCampaign}`
      
      // Daily aggregation
      if (!dailySourceData[date]) {
        dailySourceData[date] = {}
      }
      if (!dailySourceData[date][sourceId]) {
        dailySourceData[date][sourceId] = {
          ...sourceObject,
          visitors: new Set(),
          pageviews: 0
        }
      }
      
      dailySourceData[date][sourceId].pageviews += 1
      if (pageview.session_id) {
        dailySourceData[date][sourceId].visitors.add(pageview.session_id)
        uniqueSessions.add(pageview.session_id)
      }
      
      // Overall source stats
      if (!sourceStats[sourceId]) {
        sourceStats[sourceId] = {
          ...sourceObject,
          visitors: new Set(),
          pageviews: 0
        }
      }
      sourceStats[sourceId].pageviews += 1
      if (pageview.session_id) {
        sourceStats[sourceId].visitors.add(pageview.session_id)
      }
    })

    // Convert daily data to array format
    const dailyTrends = Object.entries(dailySourceData).map(([date, sources]) => {
      const sourcesArray = Object.entries(sources).map(([sourceId, data]) => ({
        source: data.source,
        medium: data.medium,
        campaign: data.campaign,
        visitors: data.visitors.size,
        pageviews: data.pageviews,
        sourceObject: data.full
      }))
      
      // Sort by visitors and take top 5
      sourcesArray.sort((a, b) => b.visitors - a.visitors)
      
      return {
        date,
        sources: sourcesArray.slice(0, 5), // Top 5 sources per day
        totalVisitors: sourcesArray.reduce((sum, s) => sum + s.visitors, 0),
        totalPageviews: sourcesArray.reduce((sum, s) => sum + s.pageviews, 0)
      }
    })

    // Sort daily trends by date
    dailyTrends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Calculate top sources overall
    const topSources = Object.entries(sourceStats)
      .map(([sourceId, data]) => ({
        source: data.source,
        medium: data.medium,
        campaign: data.campaign,
        visitors: data.visitors.size,
        pageviews: data.pageviews,
        sourceObject: data.full,
        percentage: uniqueSessions.size > 0 ? ((data.visitors.size / uniqueSessions.size) * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 5) // Top 5 sources overall

    console.log('✅ Source trends analysis complete')
    console.log(`📊 Found ${topSources.length} unique sources, ${uniqueSessions.size} unique sessions`)

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        dailyTrends,
        topSources,
        summary: {
          totalPageviews: pageviews.length,
          uniqueSessions: uniqueSessions.size,
          uniqueSources: Object.keys(sourceStats).length,
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          },
          daysAnalyzed: dailyTrends.length
        },
        generatedAt: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('❌ Source trends function error:', error)
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