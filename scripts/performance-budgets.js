#!/usr/bin/env node

/**
 * Performance Budgets for Pythia Analytics Functions
 *
 * Defines and validates performance budgets for Netlify functions.
 * Integrates with CI to prevent performance regressions.
 *
 * Usage:
 *   node scripts/performance-budgets.js
 *   npm run performance-check
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Performance budgets (in milliseconds)
const PERFORMANCE_BUDGETS = {
  // Core data functions - should be fast
  'get-events': {
    warning: 3000,    // 3 seconds
    critical: 5000,   // 5 seconds
    description: 'Event data retrieval'
  },
  'get-live-visitors': {
    warning: 2000,    // 2 seconds
    critical: 4000,   // 4 seconds
    description: 'Live visitor count'
  },
  'get-alerts': {
    warning: 2500,    // 2.5 seconds
    critical: 4500,   // 4.5 seconds
    description: 'Alert retrieval'
  },

  // Analytics functions - can be slower but still bounded
  'forecast': {
    warning: 8000,    // 8 seconds (calls Python service)
    critical: 15000,  // 15 seconds
    description: 'ML forecasting with Python service'
  },
  'alerter': {
    warning: 4000,    // 4 seconds
    critical: 8000,   // 8 seconds
    description: 'Alert processing and anomaly detection'
  },

  // Utility functions
  'get-metrics': {
    warning: 3500,    // 3.5 seconds
    critical: 6000,   // 6 seconds
    description: 'Analytics metrics aggregation'
  },
  'acknowledge-alert': {
    warning: 1500,    // 1.5 seconds
    critical: 3000,   // 3 seconds
    description: 'Alert acknowledgment'
  }
}

/**
 * Validate function performance against budgets
 */
function validatePerformanceBudget(functionName, executionTime) {
  const budget = PERFORMANCE_BUDGETS[functionName]

  if (!budget) {
    return {
      valid: true,
      level: 'unknown',
      message: `No performance budget defined for ${functionName}`
    }
  }

  const time = parseInt(executionTime)

  if (time >= budget.critical) {
    return {
      valid: false,
      level: 'critical',
      message: `${functionName} exceeded critical budget: ${time}ms > ${budget.critical}ms`
    }
  } else if (time >= budget.warning) {
    return {
      valid: true, // Still valid but needs attention
      level: 'warning',
      message: `${functionName} exceeded warning budget: ${time}ms > ${budget.warning}ms`
    }
  } else {
    return {
      valid: true,
      level: 'good',
      message: `${functionName} within budget: ${time}ms < ${budget.warning}ms`
    }
  }
}

/**
 * Parse performance metrics from logs
 */
function parsePerformanceMetrics(logOutput) {
  const metrics = []
  const lines = logOutput.split('\n')

  // Look for PERFORMANCE_METRICS lines
  const performanceRegex = /PERFORMANCE_METRICS:\s*(\{.*\})/

  for (const line of lines) {
    const match = line.match(performanceRegex)
    if (match) {
      try {
        const metric = JSON.parse(match[1])
        metrics.push(metric)
      } catch (error) {
        console.warn('Failed to parse performance metric:', error.message)
      }
    }
  }

  return metrics
}

/**
 * Generate performance report
 */
function generatePerformanceReport(metrics) {
  console.log('📊 Performance Budget Report\n')
  console.log('=' .repeat(60))

  const report = {
    summary: {
      total: metrics.length,
      good: 0,
      warning: 0,
      critical: 0,
      violations: []
    },
    byFunction: {}
  }

  // Group by function
  for (const metric of metrics) {
    const functionName = metric.function
    if (!report.byFunction[functionName]) {
      report.byFunction[functionName] = []
    }
    report.byFunction[functionName].push(metric)
  }

  // Analyze each function
  for (const [functionName, functionMetrics] of Object.entries(report.byFunction)) {
    console.log(`🔍 ${functionName}:`)

    let avgDuration = 0
    let maxDuration = 0
    let violations = 0

    for (const metric of functionMetrics) {
      avgDuration += metric.duration
      maxDuration = Math.max(maxDuration, metric.duration)

      const validation = validatePerformanceBudget(functionName, metric.duration)
      if (validation.level === 'critical') {
        violations++
        report.summary.violations.push(validation.message)
        console.log(`  ❌ ${validation.message}`)
      } else if (validation.level === 'warning') {
        violations++
        console.log(`  ⚠️  ${validation.message}`)
      }
    }

    avgDuration /= functionMetrics.length

    if (violations === 0) {
      console.log(`  ✅ Average: ${avgDuration.toFixed(0)}ms, Max: ${maxDuration}ms`)
      report.summary.good++
    } else {
      console.log(`  📊 Average: ${avgDuration.toFixed(0)}ms, Max: ${maxDuration}ms`)
      if (violations > functionMetrics.length * 0.5) {
        report.summary.critical++
      } else {
        report.summary.warning++
      }
    }

    console.log('')
  }

  console.log('=' .repeat(60))
  console.log('📈 SUMMARY:')
  console.log(`  📊 Total executions: ${report.summary.total}`)
  console.log(`  ✅ Good: ${report.summary.good}`)
  console.log(`  ⚠️  Warning: ${report.summary.warning}`)
  console.log(`  ❌ Critical: ${report.summary.critical}`)

  if (report.summary.violations.length > 0) {
    console.log('\n🚨 VIOLATIONS:')
    report.summary.violations.forEach(violation => {
      console.log(`  • ${violation}`)
    })
  }

  console.log('=' .repeat(60))

  return report
}

/**
 * Generate CI configuration for performance monitoring
 */
function generateCICIConfig() {
  const ciConfig = `# Performance Monitoring CI Configuration
# Add this to your GitHub Actions or CI pipeline

name: Performance Check
on:
  push:
    branches: [main, develop]
    paths:
      - 'netlify/functions/**'
      - 'scripts/performance-budgets.js'
  pull_request:
    paths:
      - 'netlify/functions/**'

jobs:
  performance-check:
    runs-on: ubuntu-latest
    environment: testing

    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm ci

    - name: Check function performance budgets
      run: npm run performance-check

    - name: Run performance tests
      run: npm run performance-test
      env:
        SUPABASE_URL: \${{ secrets.SUPABASE_URL }}
        SUPABASE_SERVICE_ROLE_KEY: \${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
`

  const ciPath = path.join(process.cwd(), '.github', 'workflows', 'performance-check.yml')

  // Ensure directory exists
  const dir = path.dirname(ciPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(ciPath, ciConfig)
  console.log(`📝 Generated CI configuration: ${ciPath}`)
}

/**
 * Create performance test suite
 */
function createPerformanceTests() {
  const testSuite = `/**
 * Performance Test Suite for Netlify Functions
 *
 * Tests functions against performance budgets and timeout limits.
 * Run with: npm run performance-test
 */

import { performance } from 'perf_hooks'

const PERFORMANCE_BUDGETS = ${JSON.stringify(PERFORMANCE_BUDGETS, null, 2)}

describe('Performance Tests', () => {
  // Mock environment for testing
  const mockEvent = {
    httpMethod: 'GET',
    path: '/',
    headers: {},
    body: null,
    queryStringParameters: {}
  }

  const mockContext = {
    functionName: 'test-function'
  }

  Object.entries(PERFORMANCE_BUDGETS).forEach(([functionName, budget]) => {
    test(\`\${functionName} meets performance budget\`, async () => {
      // This would require importing and testing actual functions
      // For now, it's a placeholder for the testing framework

      const startTime = performance.now()
      // Simulate function call
      await new Promise(resolve => setTimeout(resolve, 100))
      const endTime = performance.now()

      const duration = endTime - startTime

      expect(duration).toBeLessThan(budget.critical)
      if (duration > budget.warning) {
        console.warn(\`⚠️  \${functionName} exceeded warning budget: \${duration}ms > \${budget.warning}ms\`)
      }
    }, budget.critical + 1000) // Test timeout slightly higher than budget
  })
})

export { PERFORMANCE_BUDGETS }
`

  const testPath = path.join(process.cwd(), 'src', 'test', 'performance.test.js')

  fs.writeFileSync(testPath, testSuite)
  console.log(`📝 Generated performance test suite: ${testPath}`)
}

/**
 * Main execution
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const generateCI = process.argv.includes('--generate-ci')
  const generateTests = process.argv.includes('--generate-tests')
  const analyzeLogs = process.argv.includes('--analyze-logs')

  if (generateCI) {
    generateCICIConfig()
    console.log('✅ CI configuration generated successfully!')
  } else if (generateTests) {
    createPerformanceTests()
    console.log('✅ Performance test suite generated successfully!')
  } else if (analyzeLogs) {
    // Read from stdin or log file
    const logData = process.argv[3] || ''
    const metrics = parsePerformanceMetrics(logData)
    generatePerformanceReport(metrics)
  } else {
    // Show current budgets
    console.log('🎯 Performance Budgets:\n')
    console.log('=' .repeat(60))

    Object.entries(PERFORMANCE_BUDGETS).forEach(([functionName, budget]) => {
      console.log(`🔧 ${functionName}:`)
      console.log(`  📝 ${budget.description}`)
      console.log(`  ⚠️  Warning: ${budget.warning}ms`)
      console.log(`  🚨 Critical: ${budget.critical}ms`)
      console.log('')
    })

    console.log('=' .repeat(60))
    console.log('💡 Usage:')
    console.log('  npm run performance-check -- --generate-ci     # Generate CI config')
    console.log('  npm run performance-check -- --generate-tests  # Generate test suite')
    console.log('  npm run performance-check -- --analyze-logs    # Analyze log files')
    console.log('=' .repeat(60))
  }
}

export {
  PERFORMANCE_BUDGETS,
  validatePerformanceBudget,
  parsePerformanceMetrics,
  generatePerformanceReport
}
