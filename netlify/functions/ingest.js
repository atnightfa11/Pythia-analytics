import { createClient } from '@supabase/supabase-js'

export const handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    }
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  // Check for required environment variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

  console.log('🔍 Environment variables check:')
  console.log('  SUPABASE_URL:', supabaseUrl ? '✅ Present' : '❌ Missing')
  console.log('  SUPABASE_ANON_KEY:', supabaseKey ? '✅ Present' : '❌ Missing')

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Server configuration error',
        details: 'Supabase credentials not configured'
      }),
    }
  }

  // Create Supabase client with anon key (this will use the anon role)
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    console.log('📥 Ingest function called')
    console.log('📋 Request body:', event.body)
    
    // Parse the incoming batch of events
    let batch
    try {
      batch = JSON.parse(event.body)
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError.message 
        }),
      }
    }
    
    if (!Array.isArray(batch)) {
      console.error('❌ Expected array, got:', typeof batch)
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Expected array of events',
          received: typeof batch,
          data: batch
        }),
      }
    }

    console.log(`📊 Processing batch of ${batch.length} events`)

    // Prepare events for insertion - ensure all required fields are present
    const eventsToInsert = batch.map((evt, index) => {
      const processed = {
        event_type: String(evt.event_type || 'unknown'),
        count: Math.max(1, Math.round(Number(evt.count) || 1)), // Ensure positive integer
        timestamp: evt.timestamp || new Date().toISOString(),
      }
      console.log(`📝 Processed event ${index + 1}:`, processed)
      return processed
    }).filter(evt => evt.event_type !== 'unknown') // Remove invalid events

    if (eventsToInsert.length === 0) {
      console.log('⚠️ No valid events to insert')
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'No valid events provided',
          originalBatch: batch
        }),
      }
    }

    console.log('💾 Inserting events into Supabase...')
    console.log('🔑 Using anon key for insertion (should work with RLS policy)')
    
    // Insert events into Supabase using anon role
    const { data, error } = await supabase
      .from('events')
      .insert(eventsToInsert)
      .select()

    if (error) {
      console.error('❌ Supabase insertion error:', error)
      console.error('  Error code:', error.code)
      console.error('  Error message:', error.message)
      console.error('  Error details:', error.details)
      console.error('  Error hint:', error.hint)
      
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Database insertion failed', 
          details: error.message,
          code: error.code,
          hint: error.hint,
          eventsAttempted: eventsToInsert,
          suggestion: error.code === '42501' ? 'RLS policy may need to be updated to allow anonymous inserts' : 'Check database configuration'
        }),
      }
    }

    console.log(`✅ Successfully inserted ${eventsToInsert.length} events`)
    console.log('📊 Inserted data:', data)

    // Trigger alerter function after successful insertion
    try {
      console.log('🚨 Triggering alerter function...')
      // Use NETLIFY_URL (automatically provided) or fallback to SITE_URL (custom)
      const baseUrl = process.env.NETLIFY_URL || process.env.SITE_URL || 'https://cool-fox-2fba4f.netlify.app'
      const alerterUrl = `${baseUrl}/.netlify/functions/alerter`
      console.log('📍 Alerter URL:', alerterUrl)
      
      const alerterResponse = await fetch(alerterUrl)
      
      if (alerterResponse.ok) {
        console.log('✅ Alerter triggered successfully')
      } else {
        console.warn('⚠️ Alerter returned non-200 status:', alerterResponse.status)
      }
    } catch (alerterError) {
      console.error('❌ Failed to trigger alerter:', alerterError)
      // Don't fail the main request if alerter fails
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        success: true, 
        inserted: eventsToInsert.length,
        message: 'Events processed successfully',
        data: data
      }),
    }

  } catch (error) {
    console.error('❌ Function error:', error)
    console.error('  Error stack:', error.stack)
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        stack: error.stack
      }),
    }
  }
}