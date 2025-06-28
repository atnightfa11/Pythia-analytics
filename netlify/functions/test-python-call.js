export const handler = async (event, context) => {
  try {
    console.log('🔍 Testing Python service call from Netlify...')
    
    const pythonServiceUrl = 'https://forecasting-service.fly.dev'
    const forecastEndpoint = `${pythonServiceUrl}/forecast/fresh`
    
    console.log('📡 Endpoint:', forecastEndpoint)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout
    
    const startTime = Date.now()
    
    const res = await fetch(forecastEndpoint, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Netlify-Function-Test',
        'Cache-Control': 'no-cache'
      }
    })
    
    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime
    
    console.log(`📡 Response: ${res.status} (${responseTime}ms)`)
    
    if (!res.ok) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          success: false,
          error: `HTTP ${res.status}: ${res.statusText}`,
          responseTime: `${responseTime}ms`,
          endpoint: forecastEndpoint
        })
      }
    }
    
    const forecastData = await res.json()
    console.log('✅ Success - MAPE:', forecastData.mape)
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        responseTime: `${responseTime}ms`,
        mape: forecastData.mape,
        forecast: forecastData.forecast,
        endpoint: forecastEndpoint,
        dataSize: JSON.stringify(forecastData).length
      })
    }

  } catch (err) {
    console.error('❌ Error:', err)
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: false,
        error: err.message,
        errorType: err.name,
        errorCode: err.code,
        stack: err.stack
      })
    }
  }
} 