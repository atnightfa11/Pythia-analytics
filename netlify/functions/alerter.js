import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL
const THRESHOLD = parseFloat(process.env.ALERT_THRESHOLD || '0.2') // 20%

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
    console.log('🚨 Alerter function triggered')
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

    // Get latest event to check for anomalies
    console.log('📊 Fetching latest event data...')
    
    const { data: latest, error: fetchErr } = await supabase
      .from('events')
      .select('timestamp, count, event_type')
      .order('timestamp', { ascending: false })
      .limit(1)

    if (fetchErr) {
      console.error('❌ Error fetching latest data:', fetchErr)
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Failed to fetch latest data',
          details: fetchErr.message,
          code: fetchErr.code,
          hint: fetchErr.hint
        })
      }
    }

    if (!latest || latest.length === 0) {
      console.log('📭 No data available - no alerting needed')
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          message: 'No data available',
          dataPoints: 0 
        })
      }
    }

    const latestEvent = latest[0]
    console.log('📋 Latest event data:', latestEvent)

    // Get forecast from forecast function
    console.log('🔮 Fetching forecast...')
    const baseUrl = process.env.NETLIFY_URL || process.env.SITE_URL || 'https://getpythia.tech'
    const forecastUrl = `${baseUrl}/.netlify/functions/get-forecast`
    console.log('📍 Forecast URL:', forecastUrl)
    
    const forecastResponse = await fetch(forecastUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(8000) // 8 second timeout
    })
    
    if (!forecastResponse.ok) {
      console.error('❌ Forecast API error:', forecastResponse.status, forecastResponse.statusText)
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Failed to fetch forecast',
          status: forecastResponse.status 
        })
      }
    }

    const forecastData = await forecastResponse.json()
    console.log('🔮 Forecast data:', forecastData)

    if (!forecastData.forecast || forecastData.forecast === 0) {
      console.log('⚠️ No valid forecast available')
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          message: 'No valid forecast available',
          forecast: forecastData 
        })
      }
    }

    const actual = latestEvent.count
    const forecast = forecastData.forecast
    const drop = (forecast - actual) / forecast

    console.log('📊 Alert calculation:')
    console.log('  Latest Event Count:', actual)
    console.log('  Daily Forecast:', forecast)
    console.log('  Drop percentage:', (drop * 100).toFixed(1) + '%')
    console.log('  Threshold:', (THRESHOLD * 100).toFixed(1) + '%')

    // Check if we should send an alert
    if (Math.abs(drop) > THRESHOLD) {
      const isSpike = drop < 0 // Negative drop means actual > forecast (spike)
      const alertType = isSpike ? 'spike' : 'drop'
      const emoji = isSpike ? '📈' : '📉'
      const direction = isSpike ? 'above' : 'below'
      const percentage = Math.abs(drop * 100).toFixed(0)

      // Format the timestamp properly
      const eventTime = new Date(latestEvent.timestamp)
      const formattedTime = eventTime.toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        timeZoneName: 'short'
      })

      // Create unique alert ID to prevent duplicates
      const today = new Date()
      const dateStr = today.toISOString().split('T')[0]
      const alertId = `${alertType}-${dateStr}-${percentage}`

      // Check if this alert already exists
      const { data: existingAlert } = await supabase
        .from('alerts')
        .select('id')
        .eq('id', alertId)
        .single()

      if (existingAlert) {
        console.log('⚠️ Alert already exists, skipping:', alertId)
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            alertExists: true,
            alertId,
            message: 'Alert already recorded'
          })
        }
      }

      // Insert alert into database
      const alertData = {
        id: alertId,
        type: alertType,
        title: `Daily Traffic ${alertType.toUpperCase()} Detected`,
        message: `${percentage}% ${direction} daily forecast (actual: ${actual}, forecast: ${forecast.toFixed(1)})`,
        timestamp: latestEvent.timestamp,
        severity: percentage > 50 ? 'high' : percentage > 25 ? 'medium' : 'low',
        data: {
          actual,
          forecast,
          dropPercentage: percentage,
          eventType: latestEvent.event_type,
          formattedTime,
          threshold: THRESHOLD * 100,
          latestEventCount: actual,
          eventTimestamp: latestEvent.timestamp
        }
      }

      console.log('💾 Inserting alert into database:', alertData)

      const { data: insertedAlert, error: insertError } = await supabase
        .from('alerts')
        .insert([alertData])
        .select()
        .single()

      if (insertError) {
        console.error('❌ Failed to insert alert:', insertError)
        return {
          statusCode: 500,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            error: 'Failed to save alert',
            details: insertError.message,
            code: insertError.code,
            hint: insertError.hint
          })
        }
      }

      console.log('✅ Alert saved to database:', insertedAlert)

      // Send Slack notification if configured
      if (SLACK_WEBHOOK) {
        const slackMessage = {
          text: `${emoji} Alert: Daily ${alertType.toUpperCase()} detected!`,
          blocks: [
            {
              type: "section",
                          text: {
              type: "mrkdwn",
              text: `*${emoji} Traffic ${alertType.toUpperCase()} Alert*\n\nLatest Event Count: *${actual}*\nDaily Forecast: *${forecast.toFixed(1)}*\nDifference: *${percentage}% ${direction} forecast*\n\nEvent Type: ${latestEvent.event_type}\nEvent Time: ${formattedTime}\nAlert ID: \`${alertId}\``
            }
            }
          ]
        }

        console.log('🚨 Sending Slack alert:', alertType)

        const slackResponse = await fetch(SLACK_WEBHOOK, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(slackMessage),
          signal: AbortSignal.timeout(5000) // 5 second timeout
        })

        if (slackResponse.ok) {
          console.log('✅ Slack alert sent successfully')
        } else {
          console.error('❌ Failed to send Slack alert:', slackResponse.status, slackResponse.statusText)
        }
      }

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          alertSent: true,
          alertSaved: true,
          alertId,
          alertType,
          actual,
          forecast,
          dropPercentage: percentage,
          formattedTime,
          slackSent: !!SLACK_WEBHOOK,
          eventData: {
            eventType: latestEvent.event_type,
            eventCount: actual,
            eventTime: latestEvent.timestamp
          },
          message: `${alertType} alert saved and ${SLACK_WEBHOOK ? 'sent to Slack' : 'Slack not configured'}`
        })
      }
    } else {
      console.log('✅ No alert needed - within threshold')
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          alertSent: false,
          actual,
          forecast,
          dropPercentage: (Math.abs(drop) * 100).toFixed(1),
          threshold: (THRESHOLD * 100).toFixed(1),
                  eventData: {
          eventType: latestEvent.event_type,
          eventCount: actual,
          eventTime: latestEvent.timestamp
        },
        message: 'No alert needed - within threshold'
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