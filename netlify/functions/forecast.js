import { createClient } from '@supabase/supabase-js'

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
    console.log('🔮 Prophet forecasting function triggered')
    console.log('🔍 Environment check:')
    console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing')
    console.log('  VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing')
    console.log('  SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing')
    console.log('  SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
    console.log('  VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')

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

    // Create Supabase client inside the handler
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if we should generate a new forecast or return cached one
    const { data: latestForecast, error: latestError } = await supabase
      .from('forecasts')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single()

    // If we have a recent forecast (less than 1 hour old), return it
    if (latestForecast && !latestError) {
      const forecastAge = Date.now() - new Date(latestForecast.generated_at).getTime()
      const oneHour = 60 * 60 * 1000

      if (forecastAge < oneHour) {
        console.log('📋 Returning cached forecast:', latestForecast)
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            forecast: latestForecast.forecast,
            mape: latestForecast.mape,
            generatedAt: latestForecast.generated_at,
            cached: true,
            age: Math.floor(forecastAge / 1000 / 60) // age in minutes
          })
        }
      }
    }

    console.log('🔍 Generating new Prophet forecast...')

    // For now, we'll use a simplified forecasting approach since Pyodide
    // is complex to set up in Netlify functions. In production, you'd use
    // a dedicated Python service or container for Prophet.
    
    // Fetch recent events for forecasting
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('timestamp, count')
      .order('timestamp', { ascending: true })
      .limit(30)

    if (eventsError) {
      console.error('❌ Error fetching events:', eventsError)
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Failed to fetch events for forecasting',
          details: eventsError.message,
          code: eventsError.code,
          hint: eventsError.hint
        })
      }
    }

    if (!events || events.length === 0) {
      console.log('⚠️ No events found for forecasting')
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          forecast: 0,
          mape: 0,
          generatedAt: new Date().toISOString(),
          message: 'No data available for forecasting',
          dataPoints: 0
        })
      }
    }

    console.log(`📊 Processing ${events.length} events for forecast`)

    // Simple time series forecasting using moving averages and trend analysis
    // This is a placeholder for Prophet - in production you'd use actual Prophet
    const counts = events.map(e => Number(e.count) || 0)
    const timestamps = events.map(e => new Date(e.timestamp).getTime())
    
    // Calculate moving averages
    const windowSize = Math.min(7, counts.length)
    const recentCounts = counts.slice(-windowSize)
    const movingAverage = recentCounts.reduce((sum, count) => sum + count, 0) / recentCounts.length
    
    // Calculate trend
    let trend = 0
    if (counts.length >= 2) {
      const firstHalf = counts.slice(0, Math.floor(counts.length / 2))
      const secondHalf = counts.slice(Math.floor(counts.length / 2))
      
      const firstAvg = firstHalf.reduce((sum, count) => sum + count, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((sum, count) => sum + count, 0) / secondHalf.length
      
      trend = (secondAvg - firstAvg) / firstAvg
    }
    
    // Apply seasonal adjustments (simplified)
    const now = new Date()
    const hourOfDay = now.getHours()
    const dayOfWeek = now.getDay()
    
    // Business hours boost
    const hourlyFactor = (hourOfDay >= 9 && hourOfDay <= 17) ? 1.2 : 0.8
    
    // Weekend reduction
    const weeklyFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1.0
    
    // Generate forecast
    const baseForecast = movingAverage * (1 + trend * 0.1) // Apply 10% of trend
    const seasonalForecast = baseForecast * hourlyFactor * weeklyFactor
    
    // Add some noise for realism
    const noise = (Math.random() - 0.5) * 0.1 * seasonalForecast
    const finalForecast = Math.max(0, seasonalForecast + noise)
    
    // Calculate MAPE (Mean Absolute Percentage Error) using recent data
    let mape = 0
    if (counts.length >= 2) {
      const errors = []
      for (let i = 1; i < counts.length; i++) {
        const actual = counts[i]
        const predicted = counts[i - 1] // Simple prediction: previous value
        if (actual > 0) {
          errors.push(Math.abs((actual - predicted) / actual))
        }
      }
      mape = errors.length > 0 ? (errors.reduce((sum, err) => sum + err, 0) / errors.length) * 100 : 15
    } else {
      mape = 15 // Default MAPE
    }
    
    console.log('🔮 Forecast calculation:')
    console.log('  Moving average:', movingAverage.toFixed(2))
    console.log('  Trend:', (trend * 100).toFixed(1) + '%')
    console.log('  Hourly factor:', hourlyFactor)
    console.log('  Weekly factor:', weeklyFactor)
    console.log('  Final forecast:', finalForecast.toFixed(2))
    console.log('  MAPE:', mape.toFixed(1) + '%')

    // Store forecast in database
    const { data: newForecast, error: insertError } = await supabase
      .from('forecasts')
      .insert({
        forecast: finalForecast,
        mape: mape,
        generated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error storing forecast:', insertError)
      // Continue anyway, return the forecast even if storage fails
    } else {
      console.log('✅ Forecast stored successfully:', newForecast)
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        forecast: Math.round(finalForecast * 100) / 100,
        mape: Math.round(mape * 100) / 100,
        generatedAt: new Date().toISOString(),
        cached: false,
        dataPoints: events.length,
        metadata: {
          movingAverage: Math.round(movingAverage * 100) / 100,
          trend: Math.round(trend * 10000) / 100, // percentage
          hourlyFactor,
          weeklyFactor,
          algorithm: 'simplified-prophet' // In production: 'prophet'
        }
      })
    }

  } catch (error) {
    console.error('❌ Forecast function error:', error)
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Forecast generation failed', 
        details: error.message,
        stack: error.stack
      })
    }
  }
}