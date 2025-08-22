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
    console.log('🔍 Environment Debug Information')

    // Check critical environment variables
    const criticalEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_ANON_KEY',
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'NETLIFY',
      'AWS_LAMBDA_FUNCTION_NAME',
      'NODE_ENV',
      'NETLIFY_DEV',
      'PYTHON_SERVICE_URL',
      'SITE_URL',
      'SLACK_WEBHOOK_URL',
      'ALERT_THRESHOLD',
      'NETLIFY_ALERT_POLL_MS'
    ]

    const envStatus = {}
    const missingVars = []
    const presentVars = []

    criticalEnvVars.forEach(varName => {
      const value = process.env[varName]
      const isSet = value && value !== '' && value !== 'your_' + varName.toLowerCase().replace('_', '_')

      envStatus[varName] = {
        isSet,
        value: isSet ? (varName.includes('KEY') || varName.includes('URL') ? value.substring(0, 20) + '...' : value) : 'NOT SET',
        length: value ? value.length : 0
      }

      if (isSet) {
        presentVars.push(varName)
      } else {
        missingVars.push(varName)
      }
    })

    // Test Supabase connection
    let supabaseConnection = 'NOT TESTED'
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey)
        const { data, error } = await supabase.from('events').select('count').limit(1)
        supabaseConnection = error ? `ERROR: ${error.message}` : 'SUCCESS'
      } else {
        supabaseConnection = 'MISSING CREDENTIALS'
      }
    } catch (err) {
      supabaseConnection = `TEST FAILED: ${err.message}`
    }

    // Test Python service connection
    let pythonServiceConnection = 'NOT TESTED'
    try {
      const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'https://forecasting-service.fly.dev'
      const response = await fetch(`${pythonServiceUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })
      pythonServiceConnection = response.ok ? 'SUCCESS' : `ERROR: ${response.status}`
    } catch (err) {
      pythonServiceConnection = `TEST FAILED: ${err.message}`
    }

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        isNetlify: process.env.NETLIFY === 'true',
        isLambda: !!process.env.AWS_LAMBDA_FUNCTION_NAME,
        isDev: process.env.NODE_ENV === 'development' || process.env.NETLIFY_DEV === 'true'
      },
      environmentVariables: {
        totalChecked: criticalEnvVars.length,
        present: presentVars.length,
        missing: missingVars.length,
        criticalMissing: missingVars.filter(v => ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY'].includes(v)),
        details: envStatus
      },
      connections: {
        supabase: supabaseConnection,
        pythonService: pythonServiceConnection
      },
      recommendations: []
    }

    // Add recommendations
    if (debugInfo.environmentVariables.criticalMissing.length > 0) {
      debugInfo.recommendations.push(`❌ CRITICAL: Missing ${debugInfo.environmentVariables.criticalMissing.join(', ')}`)
      debugInfo.recommendations.push('   Set these in Netlify Dashboard → Site Configuration → Environment Variables')
    }

    if (supabaseConnection !== 'SUCCESS') {
      debugInfo.recommendations.push('❌ Supabase connection failed - check credentials')
    }

    if (pythonServiceConnection !== 'SUCCESS') {
      debugInfo.recommendations.push('⚠️ Python service connection failed - forecast will use local mock data')
    }

    if (debugInfo.environmentVariables.present.length === debugInfo.environmentVariables.totalChecked) {
      debugInfo.recommendations.push('✅ All environment variables appear to be set correctly')
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(debugInfo, null, 2)
    }

  } catch (error) {
    console.error('❌ Debug function error:', error)
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'Debug function failed',
        details: error.message,
        stack: error.stack
      })
    }
  }
}
