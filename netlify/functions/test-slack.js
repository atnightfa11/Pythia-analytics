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
    console.log('🧪 Testing Slack webhook integration...')
    
    // Check environment variables
    const slackWebhook = process.env.SLACK_WEBHOOK_URL
    const alertThreshold = process.env.ALERT_THRESHOLD || '0.25'
    
    console.log('🔍 Environment check:')
    console.log('  SLACK_WEBHOOK_URL:', slackWebhook ? '✅ Set' : '❌ Missing')
    console.log('  ALERT_THRESHOLD:', alertThreshold)
    console.log('  All env vars:', Object.keys(process.env).filter(key => 
      key.includes('SLACK') || key.includes('WEBHOOK')
    ))
    
    if (!slackWebhook) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'SLACK_WEBHOOK_URL not configured',
          message: 'Please set SLACK_WEBHOOK_URL in your Netlify environment variables',
          availableEnvVars: Object.keys(process.env).filter(key => 
            key.toLowerCase().includes('slack')
          )
        })
      }
    }

    // Test message
    const testMessage = {
      text: `🧪 Test Alert from Pythia Analytics`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*🧪 Test Alert from Pythia Analytics*\n\nThis is a test message to verify Slack integration is working.\n\nTimestamp: ${new Date().toISOString()}\nThreshold: ${alertThreshold}%\nStatus: ✅ Integration Active`
          }
        }
      ]
    }

    console.log('📤 Sending test message to Slack...')
    console.log('🔗 Webhook URL:', slackWebhook.substring(0, 50) + '...')
    
    const response = await fetch(slackWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage)
    })

    const responseText = await response.text()
    
    console.log('📥 Slack response status:', response.status)
    console.log('📥 Slack response:', responseText)

    if (response.ok) {
      console.log('✅ Slack test message sent successfully!')
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          success: true,
          message: 'Slack test message sent successfully!',
          slackResponse: responseText,
          webhook: slackWebhook.substring(0, 50) + '...',
          timestamp: new Date().toISOString()
        })
      }
    } else {
      console.error('❌ Slack webhook failed:', response.status, responseText)
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          error: 'Slack webhook failed',
          status: response.status,
          response: responseText,
          webhook: slackWebhook.substring(0, 50) + '...',
          suggestion: response.status === 404 ? 'Check if webhook URL is correct' : 
                     response.status === 403 ? 'Check webhook permissions' :
                     'Check webhook configuration'
        })
      }
    }

  } catch (error) {
    console.error('❌ Test Slack function error:', error)
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Test failed', 
        details: error.message,
        stack: error.stack
      })
    }
  }
}