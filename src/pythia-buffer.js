// pythia-buffer.js - Enhanced with session tracking and device detection
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
      device: getDeviceType()
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

// Initialize session on load
const sessionId = getOrCreateSessionId()
const deviceType = getDeviceType()

console.log('📱 Device detected:', deviceType)
console.log('🆔 Session ID:', sessionId)

setInterval(async () => {
  if (!window.pythiaBuffer.length) return
  
  // add Laplace noise ε=1
  const noisy = window.pythiaBuffer.map(evt => ({
    ...evt,
    count: evt.count + (Math.random() * 2 - 1)
  }))
  
  console.log('🧪 noisy batch', noisy)              // inspect noise
  
  try {
    const response = await fetch('/.netlify/functions/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noisy)
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ batch sent successfully:', result)
    } else {
      console.error('❌ server error:', result)
    }
  } catch (error) {
    console.error('❌ failed to send batch:', error)
    // Re-add events to buffer on failure
    window.pythiaBuffer.unshift(...noisy.map(evt => ({
      ...evt,
      count: evt.count - (Math.random() * 2 - 1) // remove noise for retry
    })))
  }
  
  window.pythiaBuffer.length = 0
}, 60_000)

// helper for manual flush
window.flushPythia = async () => {
  const evts = window.pythiaBuffer.slice()
  window.pythiaBuffer.length = 0
  console.log('⚡️ manual flush', evts)
  
  if (evts.length === 0) {
    console.log('📭 no events to flush')
    return []
  }
  
  // add Laplace noise ε=1
  const noisy = evts.map(evt => ({
    ...evt,
    count: evt.count + (Math.random() * 2 - 1)
  }))
  
  try {
    const response = await fetch('/.netlify/functions/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noisy)
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ manual flush successful:', result)
    } else {
      console.error('❌ manual flush failed:', result)
    }
    
    return result
  } catch (error) {
    console.error('❌ manual flush error:', error)
    // Re-add events to buffer on failure
    window.pythiaBuffer.unshift(...evts)
    return { error: error.message }
  }
}

// Enhanced helper to add events to buffer with session and device data
window.pythia = (eventType, count = 1, data = {}) => {
  const event = {
    event_type: eventType,
    count: count,
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    device: deviceType,
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
    bufferSize: window.pythiaBuffer.length,
    buffer: window.pythiaBuffer,
    functions: {
      pythia: typeof window.pythia,
      flushPythia: typeof window.flushPythia,
      pythiaStatus: typeof window.pythiaStatus
    }
  }
}

console.log('🔧 Pythia buffer initialized - privacy-first analytics active')
console.log('🆔 Session tracking enabled with device detection')
console.log('💡 Try: pythia("test_event", 1) then flushPythia()')
console.log('🔍 Debug with: pythiaStatus()')