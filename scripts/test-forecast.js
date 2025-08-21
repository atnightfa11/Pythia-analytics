#!/usr/bin/env node

/**
 * Forecast test script
 * Calls /.netlify/functions/forecast?force=true and prints MAPE + generatedAt
 * Usage: npm run forecast
 */

import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const BASE_URL = process.env.SITE_URL || 'http://localhost:5173'

async function testForecast() {
  console.log('🔮 Testing forecast API...')
  console.log(`📍 Calling: ${BASE_URL}/.netlify/functions/forecast?force=true`)

  try {
    const response = await fetch(`${BASE_URL}/.netlify/functions/forecast?force=true`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error('Error details:', errorText)
      process.exit(1)
    }

    const data = await response.json()

    console.log('✅ Forecast API Response:')
    console.log(`   MAPE: ${data.mape}%`)
    console.log(`   Generated At: ${data.generatedAt}`)
    console.log(`   Forecast: ${data.forecast}`)
    console.log(`   Data Points: ${data.dataPoints}`)
    console.log(`   Cached: ${data.cached}`)
    console.log(`   Model Version: ${data.modelVersion}`)

    if (data.future && data.future.length > 0) {
      console.log(`   Future Points: ${data.future.length} days`)
      console.log(`   Next 3 Days:`, data.future.slice(0, 3).map(f => `${f.ds}: ${f.yhat}`).join(', '))
    }

    // Summary
    console.log('\n📊 Summary:')
    console.log(`   Accuracy: ${data.mape < 10 ? 'Excellent' : data.mape < 20 ? 'Good' : data.mape < 30 ? 'Fair' : 'Poor'}`)
    console.log(`   Cache Status: ${data.cached ? 'Cached' : 'Fresh'}`)

  } catch (error) {
    console.error('❌ Forecast test failed:', error.message)
    process.exit(1)
  }
}

// Run the test
testForecast()
