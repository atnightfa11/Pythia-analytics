import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

export const handler = async (event, context) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    }
  }

  try {
    console.log('🚨 Triggering test alert...')
    
    // Insert a fake spike event to trigger the alerter
    const testEvent = {
      event_type: 'test_spike',
      count: 1000, // Large number to trigger spike detection
      timestamp: new Date().toISOString(),
      session_id: 'test-session-' + Date.now(),
      device: 'Test'
    }

    console.log('📊 Inserting test spike event:', testEvent)
    
    const { data: insertedEvent, error: insertError } = await supabase
      .from('events')
      .insert([testEvent])
      .select()
      .single()

    if (insertError) {
      console.error('❌ Failed to insert test event:', insertError)
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'Failed to insert test event',
          details: insertError.message
        })
      }
    }

    console.log('✅ Test event inserted:', insertedEvent)

    // Wait a moment then trigger the alerter
    await new Promise(resolve => setTimeout(resolve, 1000))

    console.log('🚨 Calling alerter function...')
    const baseUrl = process.env.NETLIFY_URL || process.env.SITE_URL || 'https://getpythia.tech'
    const alerterUrl = `${baseUrl}/.netlify/functions/alerter`
    
    const alerterResponse = await fetch(alerterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    const alerterResult = await alerterResponse.json()
    
    console.log('📥 Alerter response:', alerterResult)

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'Test alert triggered successfully',
        testEvent: insertedEvent,
        alerterResponse: alerterResult,
        alerterStatus: alerterResponse.status,
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('❌ Trigger test alert error:', error)
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Failed to trigger test alert', 
        details: error.message,
        stack: error.stack
      })
    }
  }
}