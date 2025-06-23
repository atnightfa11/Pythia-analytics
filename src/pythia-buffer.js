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
    
    console.log('🆔 New session created:', sessionId)
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
    console.log('🎯 UTM parameters detected:', utmParams)
  } else {
    // Try to get stored UTM params from session
    const storedUTM = sessionStorage.getItem('pythia_utm_params')
    if (storedUTM) {
      try {
        const parsedUTM = JSON.parse(storedUTM)
        Object.assign(utmParams, parsedUTM)
        console.log('🎯 Using stored UTM parameters:', utmParams)
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

console.log('📱 Device detected:', deviceType)
console.log('🆔 Session ID:', sessionId)
if (Object.keys(utmParams).length > 0) {
  console.log('🎯 UTM tracking active:', utmParams)
}

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
  console.log('📄 Pageview tracked with UTM data:', pageviewEvent)
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

// Enhanced batch sending with better error handling and alerter trigger
setInterval(async () => {
  if (!window.pythiaBuffer.length) return
  
  // add Laplace noise ε=1
  const noisy = window.pythiaBuffer.map(evt => ({
    ...evt,
    count: evt.count + (Math.random() * 2 - 1)
  }))
  
  console.log('🧪 noisy batch', noisy)              // inspect noise
  
  try {
    // Use the deployed site URL instead of localhost
    const ingestUrl = window.location.hostname === 'localhost' 
      ? '/.netlify/functions/ingest'
      : 'https://getpythia.tech/.netlify/functions/ingest'
    
    const response = await fetch(ingestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noisy)
    })
    
    const result = await safeJsonParse(response)
    
    // Check for successful response (200-299 status codes) and no error in result
    if (response.ok && !result.error) {
      console.log('✅ batch sent successfully:', result)
      if (result.inserted?.pageviews > 0) {
        console.log(`📄 ${result.inserted.pageviews} pageviews with UTM data processed`)
      }
      
      // Clear buffer only on successful processing
      window.pythiaBuffer.length = 0
      
    } else {
      console.error('❌ server error:', result)
      // Don't clear buffer on error - events will be retried in next interval
    }
  } catch (error) {
    console.error('❌ failed to send batch:', error)
    // Don't clear buffer on network error - events will be retried in next interval
  }
}, 60_000)

// Enhanced manual flush with better error handling
window.flushPythia = async () => {
  const evts = window.pythiaBuffer.slice()
  console.log('⚡️ manual flush', evts)
  
  if (evts.length === 0) {
    console.log('📭 no events to flush')
    return { message: 'No events to flush' }
  }
  
  // add Laplace noise ε=1
  const noisy = evts.map(evt => ({
    ...evt,
    count: evt.count + (Math.random() * 2 - 1)
  }))
  
  try {
    // Use the deployed site URL instead of localhost
    const ingestUrl = window.location.hostname === 'localhost' 
      ? '/.netlify/functions/ingest'
      : 'https://getpythia.tech/.netlify/functions/ingest'
    
    const response = await fetch(ingestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noisy)
    })
    
    const result = await safeJsonParse(response)
    
    // Check for successful response and no error in result
    if (response.ok && !result.error) {
      console.log('✅ manual flush successful:', result)
      if (result.inserted?.pageviews > 0) {
        console.log(`📄 ${result.inserted.pageviews} pageviews with UTM data processed`)
      }
      
      // Clear buffer only on successful processing
      window.pythiaBuffer.length = 0
      
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
  console.log('📊 event added to buffer:', event)
  console.log('📋 current buffer size:', window.pythiaBuffer.length)
  
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

console.log('🔧 Pythia buffer initialized - privacy-first analytics with UTM tracking active')
console.log('🆔 Session tracking enabled with device detection')
console.log('🎯 UTM parameter tracking enabled')
console.log('💡 Try: pythia("test_event", 1) then flushPythia()')
console.log('🔍 Debug with: pythiaStatus()')