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

  try {
    console.log('📥 Ingest function called')
    console.log('📋 Request body:', event.body)
    
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

    // Helper function to extract UTM parameters from URL or query object
    const extractUTMParams = (evt) => {
      const utmParams = {}
      
      // Check if event has URL with UTM parameters
      if (evt.url) {
        try {
          const url = new URL(evt.url, 'https://example.com') // Base URL for relative URLs
          const searchParams = url.searchParams
          
          // Extract UTM parameters
          if (searchParams.get('utm_source')) utmParams.utm_source = searchParams.get('utm_source')
          if (searchParams.get('utm_medium')) utmParams.utm_medium = searchParams.get('utm_medium')
          if (searchParams.get('utm_campaign')) utmParams.utm_campaign = searchParams.get('utm_campaign')
          if (searchParams.get('utm_term')) utmParams.utm_term = searchParams.get('utm_term')
          if (searchParams.get('utm_content')) utmParams.utm_content = searchParams.get('utm_content')
        } catch (urlError) {
          console.warn('⚠️ Failed to parse URL for UTM params:', evt.url, urlError.message)
        }
      }
      
      // Check if event has direct UTM parameters
      if (evt.utm_source) utmParams.utm_source = evt.utm_source
      if (evt.utm_medium) utmParams.utm_medium = evt.utm_medium
      if (evt.utm_campaign) utmParams.utm_campaign = evt.utm_campaign
      if (evt.utm_term) utmParams.utm_term = evt.utm_term
      if (evt.utm_content) utmParams.utm_content = evt.utm_content
      
      return Object.keys(utmParams).length > 0 ? utmParams : null
    }

    // Enhanced event processing with UTM tracking
    const eventsToInsert = []
    const pageviewsToInsert = []
    
    batch.forEach((evt, index) => {
      const processed = {
        event_type: String(evt.event_type || 'unknown'),
        count: Math.max(1, Math.round(Number(evt.count) || 1)), // Ensure positive integer
        timestamp: evt.timestamp || new Date().toISOString(),
        session_id: evt.session_id || null,
        device: evt.device || null
      }
      
      // Only add valid events
      if (processed.event_type !== 'unknown') {
        eventsToInsert.push(processed)
        
        // Check if this is a pageview event with UTM parameters
        const utmParams = extractUTMParams(evt)
        if (evt.event_type === 'pageview' || utmParams) {
          const pageviewData = {
            url: evt.url || evt.page || '/',
            source: utmParams || {},
            session_id: evt.session_id || null,
            device: evt.device || null,
            referrer: evt.referrer || null,
            timestamp: evt.timestamp || new Date().toISOString()
          }
          
          pageviewsToInsert.push(pageviewData)
          console.log(`📄 Pageview with UTM data:`, pageviewData)
        }
      }
      
      console.log(`📝 Processed event ${index + 1}:`, processed)
    })

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
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .insert(eventsToInsert)
      .select()

    if (eventsError) {
      console.error('❌ Supabase events insertion error:', eventsError)
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Database insertion failed', 
          details: eventsError.message,
          code: eventsError.code,
          hint: eventsError.hint,
          eventsAttempted: eventsToInsert,
          suggestion: eventsError.code === '42501' ? 'RLS policy may need to be updated to allow anonymous inserts' : 'Check database configuration'
        }),
      }
    }

    console.log(`✅ Successfully inserted ${eventsToInsert.length} events`)

    // Insert pageviews if any
    let pageviewsData = null
    if (pageviewsToInsert.length > 0) {
      console.log(`📄 Inserting ${pageviewsToInsert.length} pageviews with UTM data...`)
      
      const { data: pagesData, error: pagesError } = await supabase
        .from('pageviews')
        .insert(pageviewsToInsert)
        .select()

      if (pagesError) {
        console.error('❌ Supabase pageviews insertion error:', pagesError)
        // Don't fail the whole request if pageviews fail
      } else {
        pageviewsData = pagesData
        console.log(`✅ Successfully inserted ${pageviewsToInsert.length} pageviews`)
      }
    }

    // Trigger alerter function after successful insertion (non-blocking)
    try {
      console.log('🚨 Triggering alerter function...')
      // Use the configured site URL
      const baseUrl = process.env.NETLIFY_URL || process.env.SITE_URL || 'https://getpythia.tech'
      const alerterUrl = `${baseUrl}/.netlify/functions/alerter`
      console.log('📍 Alerter URL:', alerterUrl)
      
      // Remove await to make this non-blocking
      fetch(alerterUrl).then(alerterResponse => {
        if (alerterResponse.ok) {
          console.log('✅ Alerter triggered successfully')
        } else {
          console.warn('⚠️ Alerter returned non-200 status:', alerterResponse.status)
        }
      }).catch(alerterError => {
        console.error('❌ Failed to trigger alerter:', alerterError)
      })
      
      console.log('🚀 Alerter call initiated (non-blocking)')
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
        inserted: {
          events: eventsToInsert.length,
          pageviews: pageviewsToInsert.length
        },
        message: 'Events and pageviews processed successfully',
        data: {
          events: eventsData,
          pageviews: pageviewsData
        }
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