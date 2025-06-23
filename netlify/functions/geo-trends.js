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
    console.log('🌍 Fetching geographic trends...')
    
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
    
    console.log('🔍 Fetching pageviews with country data...')

    // Fetch pageviews with country data
    const { data: pageviews, error } = await supabase
      .from('pageviews')
      .select('country, session_id, timestamp')
      .not('country', 'is', null)
      .order('timestamp', { ascending: false })
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

    console.log(`📋 Processing ${pageviews?.length || 0} pageviews with country data`)

    if (!pageviews || pageviews.length === 0) {
      // Return mock data if no real data exists
      const mockData = [
        { country: 'US', visitors: 1250, percentage: 35.0 },
        { country: 'GB', visitors: 714, percentage: 20.0 },
        { country: 'CA', visitors: 536, percentage: 15.0 },
        { country: 'DE', visitors: 429, percentage: 12.0 },
        { country: 'FR', visitors: 357, percentage: 10.0 },
        { country: 'AU', visitors: 286, percentage: 8.0 }
      ]
      
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          success: true,
          data: mockData,
          summary: {
            totalPageviews: 3572,
            uniqueCountries: 6,
            dataSource: 'mock'
          },
          generatedAt: new Date().toISOString()
        })
      }
    }

    // Process geographic data
    const countryStats = {}
    const uniqueSessions = new Set()

    pageviews.forEach(pageview => {
      const country = pageview.country
      if (!country) return
      
      if (!countryStats[country]) {
        countryStats[country] = {
          visitors: new Set(),
          pageviews: 0
        }
      }
      
      countryStats[country].pageviews += 1
      if (pageview.session_id) {
        countryStats[country].visitors.add(pageview.session_id)
        uniqueSessions.add(pageview.session_id)
      }
    })

    // Convert to array and get top countries
    const topCountries = Object.entries(countryStats)
      .map(([country, data]) => ({
        country,
        visitors: data.visitors.size,
        pageviews: data.pageviews,
        percentage: uniqueSessions.size > 0 ? ((data.visitors.size / uniqueSessions.size) * 100) : 0
      }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 50) // Top 50 countries for heatmap

    console.log('✅ Geographic trends analysis complete')
    console.log(`🌍 Found ${topCountries.length} countries, ${uniqueSessions.size} unique sessions`)

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        data: topCountries,
        summary: {
          totalPageviews: pageviews.length,
          uniqueSessions: uniqueSessions.size,
          uniqueCountries: Object.keys(countryStats).length
        },
        generatedAt: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('❌ Geographic trends function error:', error)
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