import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
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

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    console.log('✅ Acknowledge alert function called')
    
    let body
    try {
      body = JSON.parse(event.body)
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError.message 
        })
      }
    }

    const { alertId, acknowledged = true } = body

    if (!alertId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Missing alertId in request body' 
        })
      }
    }

    console.log(`📝 ${acknowledged ? 'Acknowledging' : 'Unacknowledging'} alert:`, alertId)

    // Update the alert's acknowledged status
    const { data: updatedAlert, error } = await supabase
      .from('alerts')
      .update({ 
        acknowledged,
        acknowledged_at: acknowledged ? new Date().toISOString() : null
      })
      .eq('id', alertId)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating alert:', error)
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Failed to update alert',
          details: error.message 
        })
      }
    }

    if (!updatedAlert) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Alert not found',
          alertId 
        })
      }
    }

    console.log('✅ Alert updated successfully:', updatedAlert)

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        alert: updatedAlert,
        message: `Alert ${acknowledged ? 'acknowledged' : 'unacknowledged'} successfully`
      })
    }

  } catch (error) {
    console.error('❌ Acknowledge alert function error:', error)
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      })
    }
  }
}