#!/usr/bin/env node

/**
 * Forecasting Service Warm-Start Benchmarking
 *
 * Tests cold start vs warm start performance of the forecasting service.
 * Measures time to first response and subsequent request performance.
 *
 * Usage:
 *   node scripts/benchmark-forecasting.js
 *   npm run benchmark-forecasting
 */

import { performance } from 'perf_hooks'

const FORECASTING_SERVICE_URL = process.env.FORECASTING_SERVICE_URL || 'https://forecasting-service.fly.dev'
const WARM_UP_REQUESTS = 3
const TEST_REQUESTS = 10
const REQUEST_TIMEOUT = 30000 // 30 seconds

/**
 * Make HTTP request with timing
 */
async function timedRequest(url, timeout = REQUEST_TIMEOUT) {
  const startTime = performance.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    clearTimeout(timeoutId)
    const endTime = performance.now()
    const duration = endTime - startTime

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      success: true,
      duration,
      status: response.status,
      data,
      coldStart: data.response_time_ms > 2000 // Rough indicator of cold start
    }
  } catch (error) {
    const endTime = performance.now()
    const duration = endTime - startTime

    return {
      success: false,
      duration,
      error: error.message,
      timeout: error.name === 'AbortError'
    }
  }
}

/**
 * Benchmark health check endpoint
 */
async function benchmarkHealthCheck() {
  console.log('🏥 Benchmarking Health Check Endpoint\n')
  console.log('=' .repeat(50))

  const results = []

  // Warm-up requests
  console.log('🔄 Warm-up phase...')
  for (let i = 0; i < WARM_UP_REQUESTS; i++) {
    const result = await timedRequest(`${FORECASTING_SERVICE_URL}/health`)
    console.log(`  Warm-up ${i + 1}: ${result.duration.toFixed(0)}ms ${result.success ? '✅' : '❌'}`)
    if (result.success) {
      results.push(result)
    }
  }

  console.log('\n📊 Test phase...')
  const testResults = []

  for (let i = 0; i < TEST_REQUESTS; i++) {
    const result = await timedRequest(`${FORECASTING_SERVICE_URL}/health`)
    const status = result.success ? '✅' : '❌'
    const coldStart = result.success && result.coldStart ? '🧊' : '🔥'
    console.log(`  Request ${i + 1}: ${result.duration.toFixed(0)}ms ${status} ${coldStart}`)

    testResults.push(result)
    await new Promise(resolve => setTimeout(resolve, 1000)) // 1s between requests
  }

  // Analyze results
  const successful = testResults.filter(r => r.success)
  const coldStarts = successful.filter(r => r.coldStart)

  console.log('\n📈 HEALTH CHECK RESULTS:')
  console.log(`  Total requests: ${TEST_REQUESTS}`)
  console.log(`  Successful: ${successful.length}/${TEST_REQUESTS}`)
  console.log(`  Cold starts: ${coldStarts.length}/${successful.length}`)
  console.log(`  Average response: ${successful.length > 0 ? (successful.reduce((sum, r) => sum + r.duration, 0) / successful.length).toFixed(0) : 0}ms`)
  console.log(`  Fastest: ${successful.length > 0 ? Math.min(...successful.map(r => r.duration)).toFixed(0) : 0}ms`)
  console.log(`  Slowest: ${successful.length > 0 ? Math.max(...successful.map(r => r.duration)).toFixed(0) : 0}ms`)

  return {
    healthCheck: {
      total: TEST_REQUESTS,
      successful: successful.length,
      coldStarts: coldStarts.length,
      averageResponse: successful.length > 0 ? successful.reduce((sum, r) => sum + r.duration, 0) / successful.length : 0,
      minResponse: successful.length > 0 ? Math.min(...successful.map(r => r.duration)) : 0,
      maxResponse: successful.length > 0 ? Math.max(...successful.map(r => r.duration)) : 0
    }
  }
}

/**
 * Benchmark forecast endpoint (more expensive operation)
 */
async function benchmarkForecast() {
  console.log('\n📈 Benchmarking Forecast Endpoint\n')
  console.log('=' .repeat(50))

  const results = []

  // Single warm-up request for forecast (expensive operation)
  console.log('🔄 Warm-up phase...')
  const warmUp = await timedRequest(`${FORECASTING_SERVICE_URL}/forecast`, 60000) // 60s timeout
  console.log(`  Warm-up: ${warmUp.duration.toFixed(0)}ms ${warmUp.success ? '✅' : '❌'}`)

  console.log('\n📊 Test phase (forecasting is expensive, testing sparingly)...')

  // Only test a few forecast requests to avoid overwhelming the service
  const forecastTests = 3

  for (let i = 0; i < forecastTests; i++) {
    const result = await timedRequest(`${FORECASTING_SERVICE_URL}/forecast`, 60000)
    const status = result.success ? '✅' : '❌'
    const coldStart = result.success && result.coldStart ? '🧊' : '🔥'
    console.log(`  Forecast ${i + 1}: ${result.duration.toFixed(0)}ms ${status} ${coldStart}`)

    results.push(result)
    await new Promise(resolve => setTimeout(resolve, 3000)) // 3s between forecast requests
  }

  const successful = results.filter(r => r.success)
  const coldStarts = successful.filter(r => r.coldStart)

  console.log('\n📈 FORECAST RESULTS:')
  console.log(`  Total requests: ${forecastTests}`)
  console.log(`  Successful: ${successful.length}/${forecastTests}`)
  console.log(`  Cold starts: ${coldStarts.length}/${successful.length}`)
  console.log(`  Average response: ${successful.length > 0 ? (successful.reduce((sum, r) => sum + r.duration, 0) / successful.length).toFixed(0) : 0}ms`)
  console.log(`  Fastest: ${successful.length > 0 ? Math.min(...successful.map(r => r.duration)).toFixed(0) : 0}ms`)
  console.log(`  Slowest: ${successful.length > 0 ? Math.max(...successful.map(r => r.duration)).toFixed(0) : 0}ms`)

  return {
    forecast: {
      total: forecastTests,
      successful: successful.length,
      coldStarts: coldStarts.length,
      averageResponse: successful.length > 0 ? successful.reduce((sum, r) => sum + r.duration, 0) / successful.length : 0,
      minResponse: successful.length > 0 ? Math.min(...successful.map(r => r.duration)) : 0,
      maxResponse: successful.length > 0 ? Math.max(...successful.map(r => r.duration)) : 0
    }
  }
}

/**
 * Generate performance report
 */
function generatePerformanceReport(healthResults, forecastResults) {
  console.log('\n🚀 PERFORMANCE REPORT\n')
  console.log('=' .repeat(60))

  const health = healthResults.healthCheck
  const forecast = forecastResults.forecast

  console.log('🏥 Health Check Performance:')
  console.log(`  • Success Rate: ${((health.successful / health.total) * 100).toFixed(1)}%`)
  console.log(`  • Cold Start Rate: ${health.successful > 0 ? ((health.coldStarts / health.successful) * 100).toFixed(1) : 0}%`)
  console.log(`  • Average Response: ${health.averageResponse.toFixed(0)}ms`)
  console.log(`  • Response Range: ${health.minResponse.toFixed(0)}ms - ${health.maxResponse.toFixed(0)}ms`)

  console.log('\n📈 Forecast Performance:')
  console.log(`  • Success Rate: ${((forecast.successful / forecast.total) * 100).toFixed(1)}%`)
  console.log(`  • Cold Start Rate: ${forecast.successful > 0 ? ((forecast.coldStarts / forecast.successful) * 100).toFixed(1) : 0}%`)
  console.log(`  • Average Response: ${forecast.averageResponse.toFixed(0)}ms`)
  console.log(`  • Response Range: ${forecast.minResponse.toFixed(0)}ms - ${forecast.maxResponse.toFixed(0)}ms`)

  console.log('\n🎯 WARM-START OPTIMIZATION ASSESSMENT:')

  // Assess warm-start performance
  const healthColdStartRate = health.successful > 0 ? (health.coldStarts / health.successful) * 100 : 0
  const forecastColdStartRate = forecast.successful > 0 ? (forecast.coldStarts / forecast.successful) * 100 : 0

  if (healthColdStartRate < 20 && forecastColdStartRate < 30) {
    console.log('  ✅ EXCELLENT: Low cold start rates indicate good warm-start optimization')
  } else if (healthColdStartRate < 50 && forecastColdStartRate < 60) {
    console.log('  ⚠️  MODERATE: Some cold starts detected, but within acceptable range')
  } else {
    console.log('  ❌ POOR: High cold start rates indicate warm-start optimization needed')
  }

  if (health.averageResponse < 1000) {
    console.log('  ✅ FAST: Health check responses are quick')
  } else {
    console.log('  🐌 SLOW: Health check responses could be faster')
  }

  if (forecast.averageResponse < 5000) {
    console.log('  ✅ FAST: Forecast responses are within performance budget')
  } else {
    console.log('  🐌 SLOW: Forecast responses exceed performance budget')
  }

  console.log('\n💡 RECOMMENDATIONS:')

  if (healthColdStartRate > 50) {
    console.log('  • Increase min_machines_running in fly.toml')
    console.log('  • Consider using Fly.io paid plans for better performance')
  }

  if (forecast.averageResponse > 10000) {
    console.log('  • Optimize Prophet model parameters')
    console.log('  • Consider caching frequent forecasts')
    console.log('  • Review database query performance')
  }

  if (health.averageResponse > 2000) {
    console.log('  • Optimize health check database queries')
    console.log('  • Consider in-memory caching for health status')
  }

  console.log('=' .repeat(60))
}

/**
 * Main execution
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const runFullBenchmark = process.argv.includes('--full')
  const generateReport = process.argv.includes('--report')

  if (generateReport) {
    // Generate CI report format
    const report = {
      timestamp: new Date().toISOString(),
      service: FORECASTING_SERVICE_URL,
      version: '1.0.0',
      benchmarks: {
        healthCheck: 'pending',
        forecast: 'pending'
      }
    }

    console.log(JSON.stringify(report, null, 2))
  } else {
    console.log('🚀 Forecasting Service Warm-Start Benchmark\n')
    console.log(`📍 Service URL: ${FORECASTING_SERVICE_URL}`)
    console.log(`🔄 Warm-up requests: ${WARM_UP_REQUESTS}`)
    console.log(`📊 Test requests: ${TEST_REQUESTS}`)
    console.log('='.repeat(60))

    benchmarkHealthCheck()
      .then(healthResults => {
        if (runFullBenchmark) {
          return benchmarkForecast()
            .then(forecastResults => {
              generatePerformanceReport(healthResults, forecastResults)
            })
        } else {
          console.log('\n💡 Run with --full flag to include expensive forecast benchmarking')
        }
      })
      .catch(error => {
        console.error('💥 Benchmark failed:', error.message)
        process.exit(1)
      })
  }
}

export {
  benchmarkHealthCheck,
  benchmarkForecast,
  generatePerformanceReport,
  timedRequest
}
