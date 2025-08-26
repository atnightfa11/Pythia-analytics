#!/usr/bin/env node

/**
 * Dependency Management Automation for Pythia Analytics
 *
 * Checks for outdated packages, validates caniuse-lite freshness,
 * updates browserslist on install, and provides automated updates.
 *
 * Usage:
 *   node scripts/dependency-check.js
 *   npm run dependency-audit
 *   npm run dependency-update
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Critical dependencies that should be kept up-to-date
const CRITICAL_DEPENDENCIES = [
  'vite',
  'react',
  'react-dom',
  '@supabase/supabase-js',
  'typescript',
  'tailwindcss',
  'lucide-react'
]

// Dependencies that should be updated with caution
const CAUTION_DEPENDENCIES = [
  'chart.js',
  'react-chartjs-2',
  'recharts',
  'date-fns',
  'zustand'
]

// Maximum age for caniuse-lite data (30 days)
const MAX_CANIUSE_LITE_AGE = 30 * 24 * 60 * 60 * 1000

/**
 * Check for outdated packages
 */
async function checkOutdatedPackages() {
  console.log('📦 Checking for outdated packages...\n')

  try {
    // Run npm outdated and parse output
    const outdatedOutput = execSync('npm outdated --json', { encoding: 'utf8' })
    const outdatedPackages = JSON.parse(outdatedOutput)

    const criticalUpdates = []
    const cautionUpdates = []
    const minorUpdates = []

    for (const [packageName, info] of Object.entries(outdatedPackages)) {
      const update = {
        name: packageName,
        current: info.current,
        latest: info.latest,
        type: getUpdateType(info.current, info.latest)
      }

      if (CRITICAL_DEPENDENCIES.includes(packageName)) {
        criticalUpdates.push(update)
      } else if (CAUTION_DEPENDENCIES.includes(packageName)) {
        cautionUpdates.push(update)
      } else {
        minorUpdates.push(update)
      }
    }

    console.log(`📊 Found ${Object.keys(outdatedPackages).length} outdated packages\n`)

    if (criticalUpdates.length > 0) {
      console.log('🚨 Critical Updates Required:')
      criticalUpdates.forEach(pkg => {
        console.log(`  ❌ ${pkg.name}: ${pkg.current} → ${pkg.latest} (${pkg.type})`)
      })
      console.log('')
    }

    if (cautionUpdates.length > 0) {
      console.log('⚠️  Updates Requiring Caution:')
      cautionUpdates.forEach(pkg => {
        console.log(`  🟡 ${pkg.name}: ${pkg.current} → ${pkg.latest} (${pkg.type})`)
      })
      console.log('')
    }

    if (minorUpdates.length > 0) {
      console.log('ℹ️  Minor Updates Available:')
      minorUpdates.slice(0, 10).forEach(pkg => {
        console.log(`  🔵 ${pkg.name}: ${pkg.current} → ${pkg.latest} (${pkg.type})`)
      })
      if (minorUpdates.length > 10) {
        console.log(`  ... and ${minorUpdates.length - 10} more`)
      }
      console.log('')
    }

    return {
      critical: criticalUpdates,
      caution: cautionUpdates,
      minor: minorUpdates,
      total: Object.keys(outdatedPackages).length
    }

  } catch (error) {
    console.warn('⚠️  Could not check for outdated packages:', error.message)
    return { critical: [], caution: [], minor: [], total: 0 }
  }
}

/**
 * Check caniuse-lite database freshness
 */
function checkCaniuseLiteFreshness() {
  console.log('🌐 Checking caniuse-lite database freshness...\n')

  try {
    // Find caniuse-lite directory
    const caniuseLitePath = path.join(__dirname, '..', 'node_modules', 'caniuse-lite', 'data', 'regions')

    if (!fs.existsSync(caniuseLitePath)) {
      console.warn('⚠️  caniuse-lite data not found')
      return { fresh: false, age: null }
    }

    // Get the most recent file modification time
    const files = fs.readdirSync(caniuseLitePath)
    const stats = files.map(file => {
      const filePath = path.join(caniuseLitePath, file)
      return fs.statSync(filePath)
    })

    const mostRecent = stats.reduce((latest, current) =>
      current.mtime > latest.mtime ? current : latest
    )

    const age = Date.now() - mostRecent.mtime.getTime()
    const daysOld = Math.floor(age / (24 * 60 * 60 * 1000))
    const isFresh = age < MAX_CANIUSE_LITE_AGE

    if (isFresh) {
      console.log(`✅ caniuse-lite is fresh (${daysOld} days old)`)
    } else {
      console.log(`❌ caniuse-lite is stale (${daysOld} days old, max ${Math.floor(MAX_CANIUSE_LITE_AGE / (24 * 60 * 60 * 1000))} days)`)
    }

    return { fresh: isFresh, age: daysOld }

  } catch (error) {
    console.warn('⚠️  Could not check caniuse-lite freshness:', error.message)
    return { fresh: false, age: null }
  }
}

/**
 * Check for security vulnerabilities
 */
async function checkSecurityVulnerabilities() {
  console.log('🔒 Checking for security vulnerabilities...\n')

  try {
    const auditOutput = execSync('npm audit --json', { encoding: 'utf8' })
    const auditResult = JSON.parse(auditOutput)

    const vulnerabilities = auditResult.metadata?.vulnerabilities || {}
    const totalVulns = Object.values(vulnerabilities).reduce((sum, count) => sum + count, 0)

    if (totalVulns > 0) {
      console.log(`🚨 Found ${totalVulns} security vulnerabilities:`)
      Object.entries(vulnerabilities).forEach(([level, count]) => {
        if (count > 0) {
          const icon = level === 'critical' ? '💀' : level === 'high' ? '🔴' : level === 'moderate' ? '🟠' : '🟡'
          console.log(`  ${icon} ${count} ${level} severity`)
        }
      })
    } else {
      console.log('✅ No security vulnerabilities found')
    }

    return {
      total: totalVulns,
      breakdown: vulnerabilities,
      hasCritical: vulnerabilities.critical > 0,
      hasHigh: vulnerabilities.high > 0
    }

  } catch (error) {
    console.warn('⚠️  Could not check security vulnerabilities:', error.message)
    return { total: 0, breakdown: {}, hasCritical: false, hasHigh: false }
  }
}

/**
 * Update browserslist database
 */
function updateBrowserslistInternal() {
  console.log('🌐 Updating browserslist database...\n')

  try {
    execSync('npx browserslist@latest --update-db', { stdio: 'inherit' })
    console.log('✅ Browserslist database updated successfully')
    return true
  } catch (error) {
    console.warn('⚠️  Could not update browserslist database:', error.message)
    return false
  }
}

/**
 * Generate automated dependency updates
 */
function generateAutomatedUpdates(outdatedPackages) {
  console.log('🤖 Generating automated dependency updates...\n')

  const safeUpdates = []
  const manualUpdates = []

  // Separate safe vs manual updates
  outdatedPackages.critical.forEach(pkg => {
    if (pkg.type === 'patch') {
      safeUpdates.push(pkg)
    } else {
      manualUpdates.push(pkg)
    }
  })

  outdatedPackages.caution.forEach(pkg => {
    if (pkg.type === 'patch') {
      safeUpdates.push(pkg)
    } else {
      manualUpdates.push(pkg)
    }
  })

  if (safeUpdates.length > 0) {
    console.log('🔄 Safe automated updates available:')
    safeUpdates.forEach(pkg => {
      console.log(`  📦 ${pkg.name}: ${pkg.current} → ${pkg.latest}`)
    })
    console.log('')
  }

  if (manualUpdates.length > 0) {
    console.log('🔧 Manual updates requiring review:')
    manualUpdates.forEach(pkg => {
      console.log(`  📋 ${pkg.name}: ${pkg.current} → ${pkg.latest} (${pkg.type})`)
    })
    console.log('')
  }

  return { safeUpdates, manualUpdates }
}

/**
 * Get update type (major, minor, patch)
 */
function getUpdateType(current, latest) {
  const currentParts = current.split('.').map(Number)
  const latestParts = latest.split('.').map(Number)

  if (latestParts[0] > currentParts[0]) return 'major'
  if (latestParts[1] > currentParts[1]) return 'minor'
  return 'patch'
}

/**
 * Generate CI configuration for dependency checking
 */
function generateCICIConfig() {
  const ciConfig = `# Dependency Management CI Configuration
# Add this to your GitHub Actions or CI pipeline

name: Dependency Check
on:
  schedule:
    # Run weekly on Mondays at 9 AM UTC
    - cron: '0 9 * * 1'
  push:
    branches: [main, develop]
    paths:
      - 'package.json'
      - 'package-lock.json'

jobs:
  dependency-check:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write

    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm ci

    - name: Check dependencies
      run: npm run dependency-audit

    - name: Update browserslist
      run: npm run browserslist-update

    - name: Create dependency update PR
      if: github.event_name == 'schedule'
      run: |
        # This would create a PR with safe dependency updates
        # Implementation depends on your CI platform
        echo "Dependency update PR would be created here"
`

  const ciPath = path.join(__dirname, '..', '.github', 'workflows', 'dependency-check.yml')

  // Ensure directory exists
  const dir = path.dirname(ciPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(ciPath, ciConfig)
  console.log(`📝 Generated CI configuration: ${ciPath}`)
}

/**
 * Main execution
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const generateCI = process.argv.includes('--generate-ci')
  const updateBrowserslist = process.argv.includes('--update-browserslist')
  const fullAudit = process.argv.includes('--full')

  if (generateCI) {
    generateCICIConfig()
    console.log('✅ CI configuration generated successfully!')
  } else if (updateBrowserslist) {
    updateBrowserslistInternal()
  } else {
    runDependencyAudit(fullAudit)
      .then(success => {
        process.exit(success ? 0 : 1)
      })
      .catch(error => {
        console.error('💥 Unexpected error:', error)
        process.exit(1)
      })
  }
}

/**
 * Run complete dependency audit
 */
async function runDependencyAudit(fullAudit = false) {
  console.log('🔍 Running Dependency Audit...\n')
  console.log('=' .repeat(60))

  // Check outdated packages
  const outdatedPackages = await checkOutdatedPackages()

  // Check caniuse-lite freshness
  const caniuseLiteStatus = checkCaniuseLiteFreshness()

  // Check security vulnerabilities
  const securityStatus = await checkSecurityVulnerabilities()

  // Generate automated updates
  if (fullAudit) {
    generateAutomatedUpdates(outdatedPackages)
  }

  console.log('='.repeat(60))

  // Summary and recommendations
  console.log('📊 SUMMARY:')
  console.log(`  📦 Outdated packages: ${outdatedPackages.total}`)
  console.log(`  🔒 Security vulnerabilities: ${securityStatus.total}`)
  console.log(`  🌐 caniuse-lite status: ${caniuseLiteStatus.fresh ? 'Fresh' : 'Stale'}`)

  console.log('\n💡 RECOMMENDATIONS:')

  if (outdatedPackages.critical.length > 0) {
    console.log('  🚨 Update critical dependencies immediately')
  }

  if (securityStatus.hasCritical || securityStatus.hasHigh) {
    console.log('  🔒 Address security vulnerabilities ASAP')
  }

  if (!caniuseLiteStatus.fresh) {
    console.log('  🌐 Update browserslist database')
  }

  if (outdatedPackages.total === 0 && securityStatus.total === 0 && caniuseLiteStatus.fresh) {
    console.log('  ✅ All dependencies are up-to-date and secure!')
  }

  console.log('='.repeat(60))

  const hasIssues = outdatedPackages.critical.length > 0 ||
                   securityStatus.hasCritical ||
                   securityStatus.hasHigh ||
                   !caniuseLiteStatus.fresh

  return !hasIssues
}

export {
  runDependencyAudit,
  checkOutdatedPackages,
  checkCaniuseLiteFreshness,
  checkSecurityVulnerabilities,
  updateBrowserslistInternal,
  generateCICIConfig
}
