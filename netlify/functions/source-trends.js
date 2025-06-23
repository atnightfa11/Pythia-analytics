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
    const from = params.from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const to = params.to || new Date().toISOString().slice(0, 10)
    
    console.log(`📅 Analyzing source trends from ${from} to ${to}`)

    // Fetch pageviews with source data
    const { data: pageviews, error } = await supabase
      .from('pageviews')
      .select('source, session_id, timestamp')
      .gte('timestamp', from)
      .lte('timestamp', to)
      .order('timestamp', { ascending: true })
      .limit(10000) // Limit to prevent memory issues

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

    console.log(`📋 Processing ${pageviews?.length || 0} pageviews`)

    if (!pageviews || pageviews.length === 0) {
      // Return mock data for demonstration
      const mockData = [
        { source: 'google', medium: 'organic', campaign: 'none', visitors: 1250, pageviews: 3200, percentage: '45.2' },
        { source: 'direct', medium: 'none', campaign: 'none', visitors: 890, pageviews: 1780, percentage: '32.1' },
        { source: 'facebook', medium: 'social', campaign: 'summer-2024', visitors: 340, pageviews: 850, percentage: '12.3' },
        { source: 'twitter', medium: 'social', campaign: 'none', visitors: 180, pageviews: 360, percentage: '6.5' },
        { source: 'linkedin', medium: 'social', campaign: 'b2b-outreach', visitors: 110, pageviews: 275, percentage: '3.9' }
      ]
      
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          success: true,
          data: mockData,
          summary: {
            totalPageviews: 6465,
            uniqueSessions: 2770,
            uniqueSources: 5,
            dateRange: { from, to },
            dataSource: 'mock'
          },
          generatedAt: new Date().toISOString()
        })
      }
    }

    // Process source data
    const sourceStats = {}
    const uniqueSessions = new Set()

    pageviews.forEach(pageview => {
      const source = pageview.source || {}
      
      // Create source key for grouping
      const sourceKey = source.utm_source || 'direct'
      const sourceMedium = source.utm_medium || 'none'
      const sourceCampaign = source.utm_campaign || 'none'
      
      const sourceId = `${sourceKey}|${sourceMedium}|${sourceCampaign}`
      
      if (!sourceStats[sourceId]) {
        sourceStats[sourceId] = {
          source: sourceKey,
          medium: sourceMedium,
          campaign: sourceCampaign,
          visitors: new Set(),
          pageviews: 0,
          fullSource: source
        }
      }
      
      sourceStats[sourceId].pageviews += 1
      if (pageview.session_id) {
        sourceStats[sourceId].visitors.add(pageview.session_id)
        uniqueSessions.add(pageview.session_id)
      }
    })

    // Convert to array and get top 10
    const topSources = Object.entries(sourceStats)
      .map(([sourceId, data]) => ({
        source: data.source,
        medium: data.medium,
        campaign: data.campaign,
        visitors: data.visitors.size,
        pageviews: data.pageviews,
        percentage: uniqueSessions.size > 0 ? ((data.visitors.size / uniqueSessions.size) * 100).toFixed(1) : '0',
        sourceObject: data.fullSource
      }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 10) // Top 10 sources

    console.log('✅ Source trends analysis complete')
    console.log(`📊 Found ${topSources.length} sources, ${uniqueSessions.size} unique sessions`)

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        data: topSources,
        summary: {
          totalPageviews: pageviews.length,
          uniqueSessions: uniqueSessions.size,
          uniqueSources: Object.keys(sourceStats).length,
          dateRange: { from, to }
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