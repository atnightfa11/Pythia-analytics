import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL
const THRESHOLD = parseFloat(process.env.ALERT_THRESHOLD || '0.2') // 20%
const POLL_INTERVAL_MS = parseInt(process.env.NETLIFY_ALERT_POLL_MS || '30000') // Default 30s
const DEDUPE_WINDOW_MINUTES = 15 // Don't repeat same alert within 15 minutes
const JITTER_MAX_MS = 10000 // ±10s jitter

// Global variables for Supabase Realtime subscription
let realtimeSubscription = null
let isProcessingAlert = false
let lastAlertTimes = new Map() // Track last alert time per segment

// Initialize Supabase Realtime subscription for faster triggers
function initializeRealtimeSubscription() {
  try {
    console.log('🔄 Initializing Supabase Realtime subscription...')

    realtimeSubscription = supabase
      .channel('noisy_aggregates_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
          filter: 'event_type=eq.pageview'
        },
        (payload) => {
          console.log('📡 Realtime event received:', payload)
          // Trigger alert check with slight delay to allow aggregates to settle
          setTimeout(() => checkAlertsRealtime(payload.new), 2000)
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status)
      })

    console.log('✅ Supabase Realtime subscription initialized')
  } catch (error) {
    console.error('❌ Failed to initialize Realtime subscription:', error)
  }
}

// Enhanced alert checking with privacy compliance (noisy aggregates only)
async function checkAlertsRealtime(eventData) {
  if (isProcessingAlert) {
    console.log('⚠️ Alert processing already in progress, skipping...')
    return
  }

  try {
    isProcessingAlert = true
    console.log('🔍 Checking alerts via Realtime trigger...')

    // Use noisy aggregates instead of raw events for privacy
    await checkAlertsFromAggregates()

  } catch (error) {
    console.error('❌ Realtime alert check failed:', error)
  } finally {
    isProcessingAlert = false
  }
}

// Check alerts using noisy aggregates (privacy-compliant)
async function checkAlertsFromAggregates() {
  try {
    // Get noisy daily aggregates for the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: aggregates, error: aggError } = await supabase
      .from('events')
      .select(`
        timestamp,
        count,
        event_type,
        device_type,
        country,
        city,
        region
      `)
      .gte('timestamp', sevenDaysAgo)
      .order('timestamp', { ascending: false })
      .limit(1000) // Get recent data for analysis

    if (aggError) throw aggError

    if (!aggregates || aggregates.length === 0) {
      console.log('📭 No aggregate data available')
      return
    }

    // Group by day and segment for privacy-compliant analysis
    const dailyAggregates = new Map()

    aggregates.forEach(event => {
      const day = new Date(event.timestamp).toISOString().split('T')[0]
      const segment = `${event.device_type || 'unknown'}-${event.country || 'unknown'}`

      const key = `${day}-${segment}`
      if (!dailyAggregates.has(key)) {
        dailyAggregates.set(key, {
          day,
          segment,
          totalCount: 0,
          eventCount: 0,
          timestamp: event.timestamp
        })
      }

      const agg = dailyAggregates.get(key)
      agg.totalCount += event.count || 0
      agg.eventCount += 1
    })

    // Get latest forecast for comparison
    const baseUrl = process.env.NETLIFY_URL || process.env.SITE_URL || 'https://getpythia.tech'
    const forecastUrl = `${baseUrl}/.netlify/functions/forecast`

    const forecastResponse = await fetch(forecastUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(8000)
    })

    if (!forecastResponse.ok) {
      throw new Error(`Forecast API error: ${forecastResponse.status}`)
    }

    const forecastData = await forecastResponse.json()

    if (!forecastData.forecast || forecastData.forecast === 0) {
      console.log('⚠️ No valid forecast available')
      return
    }

    // Check each segment for anomalies
    for (const [key, agg] of dailyAggregates) {
      await checkSegmentForAlert(agg, forecastData.forecast)
    }

  } catch (error) {
    console.error('❌ Aggregate alert checking failed:', error)
    throw error
  }
}

// Check individual segment for alerts with deduplication
async function checkSegmentForAlert(agg, forecast) {
  const segmentKey = `${agg.segment}-${agg.day}`
  const now = Date.now()
  const lastAlertTime = lastAlertTimes.get(segmentKey)
  const timeSinceLastAlert = lastAlertTime ? (now - lastAlertTime) / (1000 * 60) : Infinity

  // Skip if we alerted for this segment recently
  if (timeSinceLastAlert < DEDUPE_WINDOW_MINUTES) {
    console.log(`⏰ Skipping alert for ${segmentKey} - last alert ${Math.round(timeSinceLastAlert)}min ago`)
    return
  }

  const actual = agg.totalCount
  const drop = (forecast - actual) / forecast

  console.log(`📊 Segment check: ${segmentKey}`)
  console.log(`  Actual: ${actual}, Forecast: ${forecast}, Drop: ${(drop * 100).toFixed(1)}%`)

  // Check if we should send an alert
  if (Math.abs(drop) > THRESHOLD) {
    const isSpike = drop < 0 // Negative drop means actual > forecast (spike)
    const alertType = isSpike ? 'spike' : 'drop'
    const percentage = Math.abs(drop * 100).toFixed(0)

    // Create unique alert ID for this segment
    const alertId = `${alertType}-${segmentKey}-${percentage}-${Date.now()}`

    console.log(`🚨 ${alertType.toUpperCase()} detected for ${segmentKey}: ${percentage}%`)

    // Update last alert time
    lastAlertTimes.set(segmentKey, now)

    // Send alert (implement alert sending logic here)
    await sendAlert({
      id: alertId,
      type: alertType,
      segment: agg.segment,
      day: agg.day,
      actual,
      forecast,
      percentage,
      timestamp: agg.timestamp
    })
  }
}

// Send alert to database and Slack
async function sendAlert(alertData) {
  try {
    const { id, type, segment, day, actual, forecast, percentage, timestamp } = alertData

    // Check if this alert already exists (additional deduplication)
    const { data: existingAlert } = await supabase
      .from('alerts')
      .select('id')
      .eq('id', id)
      .single()

    if (existingAlert) {
      console.log('⚠️ Alert already exists, skipping:', id)
      return
    }

    // Format the timestamp
    const eventTime = new Date(timestamp)
    const formattedTime = eventTime.toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      timeZoneName: 'short'
    })

    // Insert alert into database
    const alertRecord = {
      id,
      type,
      title: `Traffic ${type.toUpperCase()}: ${segment}`,
      message: `${percentage}% ${type === 'spike' ? 'above' : 'below'} forecast (actual: ${actual}, forecast: ${forecast.toFixed(1)})`,
      timestamp,
      severity: percentage > 50 ? 'high' : percentage > 25 ? 'medium' : 'low',
      data: {
        actual,
        forecast,
        percentage,
        segment,
        day,
        formattedTime,
        threshold: THRESHOLD * 100
      }
    }

    const { data: insertedAlert, error: insertError } = await supabase
      .from('alerts')
      .insert([alertRecord])
      .select()
      .single()

    if (insertError) throw insertError

    console.log('✅ Alert saved to database:', id)

    // Send Slack notification if configured
    if (SLACK_WEBHOOK) {
      await sendSlackAlert(alertRecord)
    }

  } catch (error) {
    console.error('❌ Failed to send alert:', error)
  }
}

// Send Slack alert
async function sendSlackAlert(alert) {
  const emoji = alert.type === 'spike' ? '📈' : '📉'

  const slackMessage = {
    text: `${emoji} Alert: Traffic ${alert.type.toUpperCase()} detected!`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${emoji} Traffic ${alert.type.toUpperCase()} Alert*\n\nSegment: *${alert.data.segment}*\nDay: *${alert.data.day}*\nActual: *${alert.data.actual}*\nForecast: *${alert.data.forecast.toFixed(1)}*\nDifference: *${alert.data.percentage}% ${alert.type === 'spike' ? 'above' : 'below'} forecast*\n\nTime: ${alert.data.formattedTime}\nAlert ID: \`${alert.id}\``
        }
      }
    ]
  }

  const slackResponse = await fetch(SLACK_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(slackMessage),
    signal: AbortSignal.timeout(5000)
  })

  if (slackResponse.ok) {
    console.log('✅ Slack alert sent successfully')
  } else {
    console.error('❌ Failed to send Slack alert:', slackResponse.status, slackResponse.statusText)
  }
}

export const handler = async (event, context) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    }
  }

  try {
    const isScheduled = event.headers?.['x-schedule'] || event.queryStringParameters?.scheduled === 'true'
    console.log(`🚨 Alerter function triggered${isScheduled ? ' (scheduled)' : ' (manual)'}`)

    // Initialize Supabase Realtime subscription on first run
    if (!realtimeSubscription) {
      initializeRealtimeSubscription()
    }
    console.log('🔍 Environment check:')
    console.log('  SLACK_WEBHOOK_URL:', SLACK_WEBHOOK ? '✅ Set' : '❌ Missing')
    console.log('  ALERT_THRESHOLD:', THRESHOLD)
    console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing')
    console.log('  VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing')

    // Check if we have the required environment variables
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
    
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

    // Use new privacy-compliant alert checking
    console.log('🔒 Starting privacy-compliant alert checking...')

    try {
      // Check alerts using noisy aggregates (privacy-compliant)
      await checkAlertsFromAggregates()

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          message: 'Alert checking completed successfully',
          realtimeEnabled: !!realtimeSubscription,
          deduplicationWindow: DEDUPE_WINDOW_MINUTES,
          threshold: THRESHOLD * 100,
          segmentsTracked: lastAlertTimes.size
        })
      }
    } catch (alertError) {
      console.error('❌ Alert checking failed:', alertError)
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'Alert checking failed',
          details: alertError.message
        })
      }
    }

  } catch (error) {
    console.error('❌ Alerter function error:', error)
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