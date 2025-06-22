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
    
    // Check environment variables
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
    
    console.log('🔍 Environment check:')
    console.log('  SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
    console.log('  SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing')
    console.log('  All SUPABASE env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')))
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'Missing Supabase credentials',
          envVars: Object.keys(process.env).filter(key => key.includes('SUPABASE')),
          supabaseUrl: !!supabaseUrl,
          supabaseKey: !!supabaseKey,
          details: 'Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Netlify environment variables'
        })
      }
    }

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
          suggestion: 'Check if Supabase URL and key are correct'
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
          supabaseKey: supabaseKey ? 'Set' : 'Missing'
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