#!/usr/bin/env node

// Deployment Verification Script
// Run with: node scripts/verify-deployment.js https://your-site-name.netlify.app

const siteUrl = process.argv[2]

if (!siteUrl) {
  console.log('❌ Usage: node scripts/verify-deployment.js https://your-site-name.netlify.app')
  console.log('Example: node scripts/verify-deployment.js https://pythia-demo.netlify.app')
  process.exit(1)
}

console.log(`🔍 Verifying deployment at: ${siteUrl}`)
console.log('=' .repeat(50))

async function testEndpoint(endpoint, description) {
  try {
    const url = `${siteUrl}/.netlify/functions/${endpoint}`
    console.log(`\n📡 Testing: ${description}`)
    console.log(`   URL: ${url}`)

    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    })

    console.log(`   Status: ${response.status} ${response.statusText}`)

    if (response.ok) {
      const data = await response.json()
      console.log(`   ✅ SUCCESS: ${JSON.stringify(data, null, 2).substring(0, 200)}...`)
    } else {
      const errorText = await response.text()
      console.log(`   ❌ FAILED: ${errorText.substring(0, 100)}...`)
    }

  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`)
  }
}

async function verifyDeployment() {
  console.log('🚀 Starting deployment verification...\n')

  // Test environment variables
  await testEndpoint('debug-env', 'Environment Variables Configuration')

  // Test database connection
  await testEndpoint('test-connection', 'Database Connection')

  // Test forecast function
  await testEndpoint('forecast', 'Forecast Function (should not show 11.9% MAPE)')

  // Test forecast with force refresh
  try {
    console.log(`\n📡 Testing: Forecast Force Refresh`)
    const url = `${siteUrl}/.netlify/functions/forecast?force=true`
    console.log(`   URL: ${url}`)

    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(15000)
    })

    console.log(`   Status: ${response.status} ${response.statusText}`)

    if (response.ok) {
      const data = await response.json()
      const mape = data.mape
      console.log(`   MAPE: ${mape}%`)

      if (mape === 11.9358371367119 || mape === '11.9') {
        console.log(`   ❌ ISSUE: Still showing default MAPE - check SUPABASE_SERVICE_ROLE_KEY`)
      } else {
        console.log(`   ✅ SUCCESS: Fresh forecast generated with MAPE: ${mape}%`)
      }
    } else {
      console.log(`   ❌ FAILED: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`)
  }

  // Test alerts
  await testEndpoint('alerter', 'Alert System')

  console.log('\n' + '=' .repeat(50))
  console.log('🎉 Deployment verification complete!')
  console.log('\n📝 Next Steps:')
  console.log('1. If environment variables are missing, add them in Netlify dashboard')
  console.log('2. If forecast shows 11.9% MAPE, check SUPABASE_SERVICE_ROLE_KEY')
  console.log('3. If database connection fails, verify SUPABASE_URL and keys')
  console.log('4. Trigger a new deployment after fixing environment variables')
}

verifyDeployment().catch(console.error)
