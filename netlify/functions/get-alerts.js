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
    console.log('🚨 Fetching alerts from database...')
    
    // Get query parameters
    const url = new URL(event.rawUrl || `https://example.com${event.path}`)
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const acknowledged = url.searchParams.get('acknowledged')
    const severity = url.searchParams.get('severity')
    const type = url.searchParams.get('type')

    console.log('📋 Query parameters:', { limit, acknowledged, severity, type })

    // Build query
    let query = supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply filters
    if (acknowledged !== null) {
      query = query.eq('acknowledged', acknowledged === 'true')
    }
    
    if (severity) {
      query = query.eq('severity', severity)
    }
    
    if (type) {
      query = query.eq('type', type)
    }

    const { data: alerts, error } = await query

    if (error) {
      console.error('❌ Error fetching alerts:', error)
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Failed to fetch alerts',
          details: error.message 
        })
      }
    }

    console.log(`✅ Found ${alerts?.length || 0} alerts`)

    // Calculate summary statistics
    const summary = {
      total: alerts?.length || 0,
      byType: {},
      bySeverity: {},
      acknowledged: 0,
      unacknowledged: 0
    }

    alerts?.forEach(alert => {
      // Count by type
      summary.byType[alert.type] = (summary.byType[alert.type] || 0) + 1
      
      // Count by severity
      summary.bySeverity[alert.severity] = (summary.bySeverity[alert.severity] || 0) + 1
      
      // Count acknowledged status
      if (alert.acknowledged) {
        summary.acknowledged++
      } else {
        summary.unacknowledged++
      }
    })

    // Format alerts for frontend consumption
    const formattedAlerts = alerts?.map(alert => ({
      id: alert.id,
      type: alert.type,
      title: alert.title,
      message: alert.message,
      timestamp: alert.timestamp,
      severity: alert.severity,
      data: alert.data || {},
      acknowledged: alert.acknowledged,
      created_at: alert.created_at
    })) || []

    console.log('📊 Alert summary:', summary)

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        alerts: formattedAlerts,
        summary,
        generatedAt: new Date().toISOString(),
        query: {
          limit,
          acknowledged,
          severity,
          type
        }
      })
    }

  } catch (error) {
    console.error('❌ Get alerts function error:', error)
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