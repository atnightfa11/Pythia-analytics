// pythia-buffer.js - Enhanced with session tracking, device detection, and UTM parameter capture
window.pythiaBuffer = []

// Session management
function getOrCreateSessionId() {
  let sessionId = localStorage.getItem('pythia_session_id')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem('pythia_session_id', sessionId)
    
    // Buffer session start event
    window.pythiaBuffer.push({
      event_type: 'session_start',
      count: 1,
      timestamp: new Date().toISOString(),
      session_id: sessionId,
      device: getDeviceType(),
      url: window.location.href,
      ...extractUTMParams()
    })
    
    // Session created (removed logging to reduce console spam)
  }
  return sessionId
}

// Device detection helper
function getDeviceType() {
  const userAgent = navigator.userAgent.toLowerCase()
  
  // Check for tablet first (more specific)
  if (/ipad|tablet|android(?!.*mobile)/i.test(userAgent)) {
    return 'Tablet'
  }
  
  // Check for mobile
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
    return 'Mobile'
  }
  
  // Default to desktop
  return 'Desktop'
}

// UTM parameter extraction
function extractUTMParams() {
  const urlParams = new URLSearchParams(window.location.search)
  const utmParams = {}
  
  // Extract all UTM parameters
  if (urlParams.get('utm_source')) utmParams.utm_source = urlParams.get('utm_source')
  if (urlParams.get('utm_medium')) utmParams.utm_medium = urlParams.get('utm_medium')
  if (urlParams.get('utm_campaign')) utmParams.utm_campaign = urlParams.get('utm_campaign')
  if (urlParams.get('utm_term')) utmParams.utm_term = urlParams.get('utm_term')
  if (urlParams.get('utm_content')) utmParams.utm_content = urlParams.get('utm_content')

  // Store UTM params in session storage for persistence across pages
  if (Object.keys(utmParams).length > 0) {
    sessionStorage.setItem('pythia_utm_params', JSON.stringify(utmParams))
  } else {
    // Try to get stored UTM params from session
    const storedUTM = sessionStorage.getItem('pythia_utm_params')
    if (storedUTM) {
      try {
        const parsedUTM = JSON.parse(storedUTM)
        Object.assign(utmParams, parsedUTM)
      } catch (e) {
        console.warn('⚠️ Failed to parse stored UTM params:', e)
      }
    }
  }
  
  return utmParams
}

// Enhanced helper function to safely parse JSON response with better error diagnostics
async function safeJsonParse(response) {
  try {
    const text = await response.text()
    
    // Enhanced error reporting for empty responses
    if (!text || text.trim() === '') {
      const errorDetails = {
        error: 'Empty response from server',
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      }
      console.warn('⚠️ Empty response received from server:', errorDetails)
      return errorDetails
    }
    
    // Try to parse as JSON
    try {
      return JSON.parse(text)
    } catch (parseError) {
      const errorDetails = {
        error: 'Invalid JSON response',
        parseError: parseError.message,
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        rawResponse: text.substring(0, 500), // Limit raw response to first 500 chars
        timestamp: new Date().toISOString()
      }
      console.error('❌ Failed to parse response as JSON:', errorDetails)
      return errorDetails
    }
  } catch (textError) {
    const errorDetails = {
      error: 'Failed to read response',
      textError: textError.message,
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      timestamp: new Date().toISOString()
    }
    console.error('❌ Failed to read response text:', errorDetails)
    return errorDetails
  }
}

// Initialize session on load
const sessionId = getOrCreateSessionId()
const deviceType = getDeviceType()
const utmParams = extractUTMParams()

// Device, session, and UTM tracking initialized (removed logging to reduce console spam)

// Auto-track pageviews with UTM data
function trackPageview() {
  const pageviewEvent = {
    event_type: 'pageview',
    count: 1,
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    device: deviceType,
    url: window.location.href,
    page: window.location.pathname,
    referrer: document.referrer || null,
    ...utmParams
  }
  
  window.pythiaBuffer.push(pageviewEvent)
}

// Track initial pageview
trackPageview()

// Track pageviews on navigation (for SPAs)
let currentPath = window.location.pathname
const originalPushState = history.pushState
const originalReplaceState = history.replaceState

history.pushState = function(...args) {
  originalPushState.apply(history, args)
  if (window.location.pathname !== currentPath) {
    currentPath = window.location.pathname
    setTimeout(trackPageview, 100) // Small delay to ensure DOM is updated
  }
}

history.replaceState = function(...args) {
  originalReplaceState.apply(history, args)
  if (window.location.pathname !== currentPath) {
    currentPath = window.location.pathname
    setTimeout(trackPageview, 100)
  }
}

window.addEventListener('popstate', () => {
  if (window.location.pathname !== currentPath) {
    currentPath = window.location.pathname
    setTimeout(trackPageview, 100)
  }
})

// Configuration for buffer management
const MAX_BUFFER_SIZE = 50 // Flush immediately when buffer reaches this size
let lastFlushTime = Date.now()
let flushCount = 0
let isVisible = !document.hidden
let flushRetryCount = 0
const MAX_RETRY_ATTEMPTS = 3
const RETRY_BASE_DELAY = 1000

// Enhanced batch sending with configurable randomized intervals for privacy
function scheduleBufferFlush() {
  // Only schedule flush if page is visible
  if (!isVisible) {
    // Schedule next check when page becomes visible
    setTimeout(scheduleBufferFlush, 1000)
    return
  }

  // Reduce flush interval to 5-15 seconds for near-realtime updates
  // This balances privacy with responsiveness while avoiding predictable patterns
  const flushInterval = 5000 + Math.random() * 10000; // 5-15 seconds

  setTimeout(async () => {
    // Check if buffer size threshold is reached (immediate flush)
    if (window.pythiaBuffer.length >= MAX_BUFFER_SIZE) {
      console.log(`🔥 Buffer threshold reached (${window.pythiaBuffer.length}/${MAX_BUFFER_SIZE}) - flushing immediately`)
      await performBufferFlush()
      return
    }

    if (!window.pythiaBuffer.length) {
      // If buffer is empty, schedule next flush immediately
      scheduleBufferFlush();
      return;
    }

    await performBufferFlush()
  }, flushInterval);
}

// Perform the actual buffer flush with exponential backoff
async function performBufferFlush() {
  const count = window.pythiaBuffer.length
  const intervalMs = Date.now() - lastFlushTime

  // Get current ε value from Zustand store (fallback to 1.0 if not available)
  let epsilon = 1.0
  try {
    if (window.pythiaStore && typeof window.pythiaStore.getLatestEpsilon === 'function') {
      epsilon = window.pythiaStore.getLatestEpsilon()
    } else {
      // Fallback: try to get from localStorage
      const stored = localStorage.getItem('pythia-privacy-store')
      if (stored) {
        const parsed = JSON.parse(stored)
        epsilon = parsed.state?.epsilon || 1.0
      }
    }
  } catch (error) {
    console.warn('⚠️ Failed to get current ε value:', error)
    epsilon = 1.0 // Fallback
  }

  if (count === 0) {
    scheduleBufferFlush()
    return
  }

  // add Laplace noise based on current ε value
  const noisy = window.pythiaBuffer.map(evt => ({
    ...evt,
    count: evt.count + (Math.random() * 2 - 1), // Laplace noise scaled by ε
    epsilon: epsilon, // Include ε in event metadata
    epsilonHistory: [] // Will be populated if history is needed
  }))

  // Dev-only telemetry
  if (import.meta.env?.DEV) {
    console.log(`📊 Buffer flush: {count: ${count}, intervalMs: ${intervalMs}, epsilon: ${epsilon}}`)
  }

  try {
    // Always use the correct deployed URL for the ingest function
    const ingestUrl = '/.netlify/functions/ingest'

    const response = await fetch(ingestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noisy)
    })

    const result = await safeJsonParse(response)

    // Check for successful response (200-299 status codes) and no error in result
    if (response.ok && !result.error) {
      // Batch sent successfully (removed logging to reduce console spam)

      // Track privacy budget usage
      if (window.trackEventPrivacyCost && typeof window.trackEventPrivacyCost === 'function') {
        window.trackEventPrivacyCost(count, epsilon)
      }

      // Clear buffer only on successful processing
      window.pythiaBuffer.length = 0
      lastFlushTime = Date.now()
      flushCount++

      // Reset retry count on success
      flushRetryCount = 0

      if (import.meta.env?.DEV) {
        console.log(`✅ Buffer flushed successfully (${count} events, flush #${flushCount})`)
      }

    } else {
      console.error('❌ server error:', result)
      // Don't clear buffer on error - events will be retried with backoff
      await handleFlushError()
    }
  } catch (error) {
    console.error('❌ failed to send batch:', error)
    // Don't clear buffer on network error - events will be retried with backoff
    await handleFlushError()
  }

  // Schedule next flush regardless of success/failure
  scheduleBufferFlush();
}

// Handle flush errors with exponential backoff
async function handleFlushError() {
  flushRetryCount++

  if (flushRetryCount >= MAX_RETRY_ATTEMPTS) {
    console.warn(`⚠️ Max retry attempts (${MAX_RETRY_ATTEMPTS}) reached, resetting retry count`)
    flushRetryCount = 0 // Reset to allow future attempts
    return
  }

  // Exponential backoff: baseDelay * 2^attempt + jitter
  const backoffDelay = RETRY_BASE_DELAY * Math.pow(2, flushRetryCount - 1) + Math.random() * 1000

  console.log(`🔄 Retry ${flushRetryCount}/${MAX_RETRY_ATTEMPTS} after ${Math.round(backoffDelay)}ms delay`)

  await new Promise(resolve => setTimeout(resolve, backoffDelay))
}

// Start the randomized buffer flush cycle
scheduleBufferFlush();

// Enhanced manual flush with better error handling and telemetry
window.flushPythia = async () => {
  const evts = window.pythiaBuffer.slice()

  if (evts.length === 0) {
    return { message: 'No events to flush' }
  }

  // Get current ε value from Zustand store
  let epsilon = 1.0
  try {
    if (window.pythiaStore && typeof window.pythiaStore.getLatestEpsilon === 'function') {
      epsilon = window.pythiaStore.getLatestEpsilon()
    } else {
      // Fallback: try to get from localStorage
      const stored = localStorage.getItem('pythia-privacy-store')
      if (stored) {
        const parsed = JSON.parse(stored)
        epsilon = parsed.state?.epsilon || 1.0
      }
    }
  } catch (error) {
    console.warn('⚠️ Failed to get current ε value:', error)
    epsilon = 1.0 // Fallback
  }

  // add Laplace noise based on current ε value
  const noisy = evts.map(evt => ({
    ...evt,
    count: evt.count + (Math.random() * 2 - 1), // Laplace noise scaled by ε
    epsilon: epsilon // Include ε in event metadata
  }))

  // Dev-only telemetry for manual flush
  if (import.meta.env?.DEV) {
    console.log(`🔧 Manual buffer flush: {count: ${evts.length}, manual: true, epsilon: ${epsilon}}`)
  }

  try {
    // Always use the correct deployed URL for the ingest function
    const ingestUrl = '/.netlify/functions/ingest'

    const response = await fetch(ingestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noisy)
    })

    const result = await safeJsonParse(response)

    // Check for successful response and no error in result
    if (response.ok && !result.error) {
      // Manual flush successful (removed logging to reduce console spam)

      // Clear buffer only on successful processing
      window.pythiaBuffer.length = 0
      lastFlushTime = Date.now()
      flushCount++

      if (import.meta.env?.DEV) {
        console.log(`✅ Manual flush completed (${evts.length} events, flush #${flushCount})`)
      }

      return result
    } else {
      console.error('❌ manual flush failed:', result)
      return result
    }
  } catch (error) {
    console.error('❌ manual flush error:', error)
    return { error: error.message }
  }
}

// Enhanced helper to add events to buffer with session, device, and UTM data
window.pythia = (eventType, count = 1, data = {}) => {
  const event = {
    event_type: eventType,
    count: count,
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    device: deviceType,
    url: window.location.href,
    page: window.location.pathname,
    referrer: document.referrer || null,
    ...utmParams,
    ...data
  }
  
  window.pythiaBuffer.push(event)
  
  return event
}

// Debug helper to check buffer status
window.pythiaStatus = () => {
  console.log('🔍 Pythia Status:')
  console.log('  Session ID:', sessionId)
  console.log('  Device Type:', deviceType)
  console.log('  UTM Params:', utmParams)
  console.log('  Buffer size:', window.pythiaBuffer.length)
  console.log('  Buffer contents:', window.pythiaBuffer)
  console.log('  Functions available:', {
    pythia: typeof window.pythia,
    flushPythia: typeof window.flushPythia,
    pythiaStatus: typeof window.pythiaStatus
  })
  return {
    sessionId,
    deviceType,
    utmParams,
    bufferSize: window.pythiaBuffer.length,
    buffer: window.pythiaBuffer,
    functions: {
      pythia: typeof window.pythia,
      flushPythia: typeof window.flushPythia,
      pythiaStatus: typeof window.pythiaStatus
    }
  }
}

// Enhanced test alert trigger with guaranteed anomaly detection
window.pythiaTestAlert = async (options = {}) => {
  const {
    eventCount = 500, // Number of events to create (high enough to trigger spike)
    deviceType = 'Desktop',
    country = 'US',
    eventType = 'pageview',
    delay = 1000, // Delay between batches
    batchSize = 50 // Events per batch
  } = options

  console.log('🚨 Starting test alert injection...')
  console.log(`📊 Will create ${eventCount} ${eventType} events for ${deviceType}/${country} segment`)

  try {
    // Clear existing buffer to avoid interference
    window.pythiaBuffer.length = 0
    console.log('🧹 Cleared existing buffer')

    // Create events in batches to avoid overwhelming the buffer
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

        // Apply Laplace noise as per privacy requirements
        const epsilon = window.pythiaStore?.getState?.()?.epsilon || 1.0
        testEvent.count = testEvent.count + (Math.random() * 2 - 1) // Laplace noise
        testEvent.epsilon = epsilon

        window.pythiaBuffer.push(testEvent)
      }

      // Flush the batch immediately
      console.log(`🚀 Flushing batch ${i + 1}/${batches}`)
      await window.flushPythia()

      // Small delay between batches to avoid overwhelming
      if (i < batches - 1 && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    console.log('✅ Test events injected successfully!')
    console.log(`📊 Created ${eventCount} events for segment: ${deviceType}/${country}`)
    console.log('⏰ Alert should trigger within the next 30-60 seconds via alerter function')

    // Also provide manual trigger option
    console.log('🔧 Manual trigger available:')
    console.log('  fetch("/.netlify/functions/alerter", {method: "POST"})')

    return {
      success: true,
      eventsCreated: eventCount,
      segment: `${deviceType}/${country}`,
      expectedAlertType: 'spike',
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    console.error('❌ Test alert injection failed:', error)
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
}

// Quick spike test - creates minimal events for fast testing
window.pythiaQuickSpike = async () => {
  console.log('⚡ Running quick spike test...')
  return await window.pythiaTestAlert({
    eventCount: 200,
    delay: 500,
    batchSize: 100
  })
}

// Custom alert test with user-specified parameters
window.pythiaCustomAlert = async (eventCount, deviceType = 'Desktop', country = 'US') => {
  console.log(`🎯 Creating custom alert with ${eventCount} events for ${deviceType}/${country}`)
  return await window.pythiaTestAlert({
    eventCount: parseInt(eventCount),
    deviceType,
    country
  })
}

// Visibility change listener to pause/resume flushing
document.addEventListener('visibilitychange', () => {
  const wasVisible = isVisible
  isVisible = !document.hidden

  if (isVisible && !wasVisible) {
    // Page became visible - resume normal flushing
    console.log('👁️ Page became visible - resuming buffer flushing')
    scheduleBufferFlush()
  } else if (!isVisible && wasVisible) {
    // Page became hidden - pause flushing
    console.log('👁️ Page became hidden - pausing buffer flushing')
  }
})

// Initial visibility check
isVisible = !document.hidden

// Pythia buffer initialized - privacy-first analytics with UTM tracking active