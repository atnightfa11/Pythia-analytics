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
    console.log('📊 Fetching latest forecast from database...')
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
    
    // Get the most recent forecast
    const { data: latestForecast, error } = await supabase
      .from('forecasts')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('❌ Error fetching forecast:', error)
      
      // If no forecasts exist, trigger generation
      if (error.code === 'PGRST116') { // No rows returned
        console.log('🔄 No forecasts found, triggering generation...')
        
        // Call the forecast function to generate one
        const baseUrl = process.env.NETLIFY_URL || process.env.SITE_URL || 'https://getpythia.tech'
        const forecastUrl = `${baseUrl}/.netlify/functions/forecast`
        
        try {
          const response = await fetch(forecastUrl)
          if (response.ok) {
            const forecastData = await response.json()
            return {
              statusCode: 200,
              headers: { 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify(forecastData)
            }
          }
        } catch (fetchError) {
          console.error('❌ Failed to generate forecast:', fetchError)
        }
      }
      
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Failed to fetch forecast',
          details: error.message,
          code: error.code,
          hint: error.hint
        })
      }
    }

    if (!latestForecast) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'No forecasts available',
          message: 'No forecast data found in database'
        })
      }
    }

    console.log('✅ Latest forecast retrieved:', latestForecast)

    // Calculate age of forecast
    const forecastAge = Date.now() - new Date(latestForecast.generated_at).getTime()
    const ageInMinutes = Math.floor(forecastAge / 1000 / 60)
    const ageInHours = Math.floor(ageInMinutes / 60)

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        forecast: latestForecast.forecast,
        mape: latestForecast.mape,
        generatedAt: latestForecast.generated_at,
        age: {
          minutes: ageInMinutes,
          hours: ageInHours,
          isStale: ageInHours > 1 // Consider stale after 1 hour
        },
        id: latestForecast.id
      })
    }

  } catch (error) {
    console.error('❌ Get forecast function error:', error)
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