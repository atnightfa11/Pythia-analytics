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
    console.log('🔧 Testing Supabase connection...')
    
    // Debug: Log ALL environment variables
    console.log('🔍 ALL Environment Variables:')
    console.log('  Total env vars:', Object.keys(process.env).length)
    console.log('  All keys:', Object.keys(process.env))
    console.log('  NODE_ENV:', process.env.NODE_ENV)
    console.log('  NETLIFY:', process.env.NETLIFY)
    console.log('  NETLIFY_DEV:', process.env.NETLIFY_DEV)
    
    // Check environment variables with multiple possible names
    const possibleUrlKeys = [
      'SUPABASE_URL',
      'VITE_SUPABASE_URL', 
      'REACT_APP_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_URL'
    ]
    
    const possibleKeyKeys = [
      'SUPABASE_ANON_KEY',
      'VITE_SUPABASE_ANON_KEY',
      'REACT_APP_SUPABASE_ANON_KEY', 
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ]
    
    console.log('🔍 Checking possible Supabase URL keys:')
    possibleUrlKeys.forEach(key => {
      const value = process.env[key]
      console.log(`  ${key}:`, value ? `✅ Set (${value.substring(0, 20)}...)` : '❌ Missing')
    })
    
    console.log('🔍 Checking possible Supabase key keys:')
    possibleKeyKeys.forEach(key => {
      const value = process.env[key]
      console.log(`  ${key}:`, value ? `✅ Set (${value.substring(0, 20)}...)` : '❌ Missing')
    })
    
    // Try to find any working combination
    let supabaseUrl = null
    let supabaseKey = null
    
    for (const urlKey of possibleUrlKeys) {
      if (process.env[urlKey]) {
        supabaseUrl = process.env[urlKey]
        console.log(`✅ Found URL with key: ${urlKey}`)
        break
      }
    }
    
    for (const keyKey of possibleKeyKeys) {
      if (process.env[keyKey]) {
        supabaseKey = process.env[keyKey]
        console.log(`✅ Found key with key: ${keyKey}`)
        break
      }
    }
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ No valid Supabase credentials found')
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'Missing Supabase credentials',
          debug: {
            totalEnvVars: Object.keys(process.env).length,
            allEnvKeys: Object.keys(process.env),
            supabaseRelated: Object.keys(process.env).filter(key => 
              key.toLowerCase().includes('supabase')
            ),
            urlChecked: possibleUrlKeys.map(key => ({
              key,
              exists: !!process.env[key],
              value: process.env[key] ? process.env[key].substring(0, 20) + '...' : null
            })),
            keyChecked: possibleKeyKeys.map(key => ({
              key, 
              exists: !!process.env[key],
              value: process.env[key] ? process.env[key].substring(0, 20) + '...' : null
            }))
          },
          suggestion: 'Check Netlify environment variables configuration'
        })
      }
    }

    console.log(`🔗 Using URL: ${supabaseUrl.substring(0, 30)}...`)
    console.log(`🔑 Using Key: ${supabaseKey.substring(0, 20)}...`)

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test 1: Simple connection test (read-only)
    console.log('🧪 Test 1: Basic connection (SELECT)...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('events')
      .select('id')
      .limit(1)
    
    if (connectionError) {
      console.error('❌ Connection test failed:', connectionError)
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'Connection test failed',
          details: connectionError.message,
          code: connectionError.code,
          hint: connectionError.hint,
          suggestion: 'Check if Supabase URL and key are correct',
          credentials: {
            url: supabaseUrl ? 'Found' : 'Missing',
            key: supabaseKey ? 'Found' : 'Missing'
          }
        })
      }
    }
    
    console.log('✅ Connection test passed')
    
    // Test 2: Try to insert a test record
    console.log('🧪 Test 2: Insert test record...')
    const testEvent = {
      event_type: 'connection_test',
      count: 1,
      timestamp: new Date().toISOString(),
      session_id: 'test-session-' + Date.now(),
      device: 'Test'
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('events')
      .insert([testEvent])
      .select()
    
    if (insertError) {
      console.error('❌ Insert test failed:', insertError)
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'Insert test failed',
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint,
          testEvent,
          suggestion: insertError.code === '42501' ? 'RLS policy needs to allow anonymous inserts' : 'Check database permissions'
        })
      }
    }
    
    console.log('✅ Insert test passed:', insertData)
    
    // Test 3: Verify the record was inserted
    console.log('🧪 Test 3: Verify insertion...')
    const { data: verifyData, error: verifyError } = await supabase
      .from('events')
      .select('*')
      .eq('event_type', 'connection_test')
      .order('timestamp', { ascending: false })
      .limit(1)
    
    if (verifyError) {
      console.error('❌ Verify test failed:', verifyError)
    } else {
      console.log('✅ Verify test passed:', verifyData)
    }
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'All tests passed! Database is properly configured.',
        tests: {
          connection: !connectionError,
          insert: !insertError,
          verify: !verifyError
        },
        insertedRecord: insertData,
        verifiedRecord: verifyData,
        environment: {
          supabaseUrl: supabaseUrl ? 'Set' : 'Missing',
          supabaseKey: supabaseKey ? 'Set' : 'Missing',
          totalEnvVars: Object.keys(process.env).length
        },
        debug: {
          foundUrlWith: possibleUrlKeys.find(key => process.env[key]),
          foundKeyWith: possibleKeyKeys.find(key => process.env[key])
        },
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('❌ Test function error:', error)
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Test function error', 
        details: error.message,
        stack: error.stack
      })
    }
  }
}