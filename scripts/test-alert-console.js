// Console Test Alert Injection for Pythia Analytics
// Copy and paste this entire script into your browser console to test alerts

// Quick test alert injection (200 events)
window.pythiaTestAlert = async (options = {}) => {
  const {
    eventCount = 200,
    deviceType = 'Desktop',
    country = 'US',
    eventType = 'pageview',
    delay = 500,
    batchSize = 50
  } = options

  console.log('🚨 Starting test alert injection...')
  console.log(`📊 Will create ${eventCount} ${eventType} events for ${deviceType}/${country} segment`)

  try {
    // Clear existing buffer
    window.pythiaBuffer.length = 0
    console.log('🧹 Cleared existing buffer')

    // Create events in batches
    const batches = Math.ceil(eventCount / batchSize)

    for (let i = 0; i < batches; i++) {
      const remainingEvents = eventCount - (i * batchSize)
      const currentBatchSize = Math.min(batchSize, remainingEvents)

      console.log(`📦 Processing batch ${i + 1}/${batches} (${currentBatchSize} events)`)

      for (let j = 0; j < currentBatchSize; j++) {
        const testEvent = {
          event_type: eventType,
          count: 1,
          timestamp: new Date().toISOString(),
          session_id: `test-spike-${deviceType}-${country}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          device: deviceType,
          country: country,
          city: 'Test City',
          region: 'Test Region',
          page: '/test-anomaly-page',
          referrer: 'https://test-anomaly-source.com',
          url: window.location.href
        }

        // Apply privacy noise
        const epsilon = window.pythiaStore?.getState?.()?.epsilon || 1.0
        testEvent.count = testEvent.count + (Math.random() * 2 - 1)
        testEvent.epsilon = epsilon

        window.pythiaBuffer.push(testEvent)
      }

      // Flush batch
      console.log(`🚀 Flushing batch ${i + 1}/${batches}`)
      await window.flushPythia()

      if (i < batches - 1 && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    console.log('✅ Test events injected successfully!')
    console.log(`📊 Created ${eventCount} events for segment: ${deviceType}/${country}`)
    console.log('⏰ Alert should trigger within 30-60 seconds')

    // Manual trigger option
    console.log('🔧 Manual trigger:')
    console.log('fetch("/.netlify/functions/alerter", {method: "POST"})')

    return {
      success: true,
      eventsCreated: eventCount,
      segment: `${deviceType}/${country}`,
      expectedAlertType: 'spike',
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    console.error('❌ Test alert injection failed:', error)
    return { success: false, error: error.message }
  }
}

// Quick spike test
window.pythiaQuickSpike = async () => {
  console.log('⚡ Running quick spike test...')
  return await window.pythiaTestAlert({ eventCount: 200, delay: 500, batchSize: 100 })
}

// Custom alert test
window.pythiaCustomAlert = async (eventCount, deviceType = 'Desktop', country = 'US') => {
  console.log(`🎯 Creating custom alert with ${eventCount} events for ${deviceType}/${country}`)
  return await window.pythiaTestAlert({
    eventCount: parseInt(eventCount),
    deviceType,
    country
  })
}

console.log('🎯 Alert test functions loaded!')
console.log('Available functions:')
console.log('  • pythiaQuickSpike() - Quick 200 event test')
console.log('  • pythiaTestAlert({eventCount: 500}) - Custom test')
console.log('  • pythiaCustomAlert(300, "Mobile", "CA") - Custom with device/country')
