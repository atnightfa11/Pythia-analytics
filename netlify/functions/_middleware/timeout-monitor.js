/**
 * Timeout Monitoring Middleware for Netlify Functions
 *
 * Wraps function execution with performance monitoring:
 * - Logs warnings at 5s execution time
 * - Aborts at 9s with graceful error message
 * - Reports performance metrics for optimization
 *
 * Usage:
 * const { withTimeoutMonitoring } = require('./_middleware/timeout-monitor')
 *
 * export const handler = withTimeoutMonitoring(async (event, context) => {
 *   // Your function logic here
 * })
 */

const WARNING_THRESHOLD = 5000 // 5 seconds
const ABORT_THRESHOLD = 9000   // 9 seconds
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

/**
 * Performance metrics collector
 */
class PerformanceMonitor {
  constructor(functionName) {
    this.functionName = functionName
    this.startTime = Date.now()
    this.warningLogged = false
    this.aborted = false
    this.checkInterval = null
  }

  /**
   * Start monitoring execution time
   */
  startMonitoring() {
    this.checkInterval = setInterval(() => {
      const elapsed = Date.now() - this.startTime

      if (elapsed >= ABORT_THRESHOLD && !this.aborted) {
        this.abortExecution()
      } else if (elapsed >= WARNING_THRESHOLD && !this.warningLogged) {
        this.logWarning()
      }
    }, 100) // Check every 100ms
  }

  /**
   * Log performance warning at 5s
   */
  logWarning() {
    this.warningLogged = true
    console.warn(`⚠️  [${this.functionName}] SLOW EXECUTION: ${WARNING_THRESHOLD/1000}s elapsed`)

    // Log additional context for debugging
    const memoryUsage = process.memoryUsage()
    console.warn(`📊 [${this.functionName}] Memory: RSS=${Math.round(memoryUsage.rss/1024/1024)}MB, Heap=${Math.round(memoryUsage.heapUsed/1024/1024)}MB`)
  }

  /**
   * Abort execution at 9s with graceful error
   */
  abortExecution() {
    this.aborted = true
    console.error(`❌ [${this.functionName}] EXECUTION ABORTED: ${ABORT_THRESHOLD/1000}s timeout exceeded`)

    // Clean up interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }

    // Force process termination with error code
    process.exit(1)
  }

  /**
   * Stop monitoring and log completion
   */
  stopMonitoring(success = true) {
    const elapsed = Date.now() - this.startTime

    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }

    if (success) {
      const status = elapsed >= WARNING_THRESHOLD ? '🐌' : '⚡'
      console.log(`${status} [${this.functionName}] COMPLETED in ${elapsed}ms`)
    }

    return {
      functionName: this.functionName,
      duration: elapsed,
      success,
      warning: this.warningLogged,
      aborted: this.aborted
    }
  }
}

/**
 * Middleware wrapper for timeout monitoring
 */
export function withTimeoutMonitoring(handler) {
  return async (event, context) => {
    // Extract function name from context or URL
    const functionName = context.functionName ||
                        event.path?.split('/').pop() ||
                        'unknown-function'

    console.log(`🚀 [${functionName}] STARTING execution`)

    const monitor = new PerformanceMonitor(functionName)

    // Start monitoring
    monitor.startMonitoring()

    try {
      // Execute the original handler
      const result = await handler(event, context)

      // Stop monitoring on success
      const metrics = monitor.stopMonitoring(true)

      // Add performance headers to response
      if (result && typeof result === 'object' && result.headers) {
        result.headers['X-Execution-Time'] = `${metrics.duration}ms`
        result.headers['X-Performance-Status'] = metrics.warning ? 'slow' : 'fast'
      }

      return result

    } catch (error) {
      // Stop monitoring on error
      const metrics = monitor.stopMonitoring(false)

      console.error(`💥 [${functionName}] ERROR after ${metrics.duration}ms:`, error.message)

      // Return graceful error response
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Execution-Time': `${metrics.duration}ms`,
          'X-Error-Type': 'timeout'
        },
        body: JSON.stringify({
          error: 'Function execution timeout',
          message: 'The request took too long to process. Please try again.',
          function: functionName,
          executionTime: metrics.duration,
          timestamp: new Date().toISOString()
        })
      }
    }
  }
}

/**
 * Utility function to create timeout-aware promises
 */
export function withTimeout(promise, timeoutMs = ABORT_THRESHOLD, functionName = 'unknown') {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      console.error(`⏰ [${functionName}] Promise timeout after ${timeoutMs}ms`)
      reject(new Error(`Operation timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    promise
      .then((result) => {
        clearTimeout(timeoutId)
        resolve(result)
      })
      .catch((error) => {
        clearTimeout(timeoutId)
        reject(error)
      })
  })
}

/**
 * Performance metrics reporter
 */
export function reportPerformanceMetrics(functionName, metrics) {
  // In production, this could send metrics to monitoring service
  const report = {
    function: functionName,
    timestamp: new Date().toISOString(),
    duration: metrics.duration,
    success: metrics.success,
    warning: metrics.warning,
    aborted: metrics.aborted,
    environment: process.env.NODE_ENV || 'development'
  }

  // Log structured metrics for monitoring
  console.log(`📈 PERFORMANCE_METRICS:`, JSON.stringify(report))

  // Could send to external monitoring service here
  // Example: sendToMonitoringService(report)

  return report
}

/**
 * Health check function for monitoring
 */
export function createHealthCheck() {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    },
    body: JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timeoutThresholds: {
        warning: WARNING_THRESHOLD,
        abort: ABORT_THRESHOLD
      }
    })
  }
}
