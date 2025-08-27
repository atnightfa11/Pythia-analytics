#!/usr/bin/env node

/**
 * Check Cached Forecasts Script
 *
 * Examines the cached forecast data in the database to understand
 * why MAPE is consistently showing the same value.
 *
 * Usage:
 *   node scripts/check-cached-forecasts.js
 *   npm run check-cached-forecasts
 */

import { createClient } from '@supabase/supabase-js'

// Database connection
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Check cached forecast data
 */
async function checkCachedForecasts() {
  console.log('🔍 Checking cached forecast data...\n')

  try {
    // Get the latest cached forecast
    const { data: latest, error } = await supabase
      .from('forecasts')
      .select('forecast, mape, generated_at, future, events_count_at_generation, model_version')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('❌ Error fetching cached forecast:', error.message)
      return
    }

    if (!latest) {
      console.log('📭 No cached forecasts found')
      return
    }

    console.log('📊 Latest Cached Forecast:')
    console.log('='.repeat(50))
    console.log(`📅 Generated At: ${new Date(latest.generated_at).toLocaleString()}`)
    console.log(`📈 Forecast: ${latest.forecast}`)
    console.log(`📊 MAPE: ${latest.mape}%`)
    console.log(`🔢 Events at Generation: ${latest.events_count_at_generation}`)
    console.log(`🏷️  Model Version: ${latest.model_version || 'N/A'}`)

    const ageMinutes = Math.floor((Date.now() - new Date(latest.generated_at).getTime()) / (1000 * 60))
    console.log(`⏰ Age: ${ageMinutes} minutes ago`)

    // Check current events count
    const { count: currentEventsCount, error: countError } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })

    if (!countError) {
      console.log(`📊 Current Events Count: ${currentEventsCount}`)
      console.log(`📈 Events Change: ${currentEventsCount - (latest.events_count_at_generation || 0)}`)

      if (currentEventsCount !== latest.events_count_at_generation) {
        console.log('⚠️  Cache should be invalidated - events count changed!')
      } else {
        console.log('✅ Cache is still valid - events count unchanged')
      }
    }

    console.log('\n📈 Future Predictions (next 7 days):')
    if (latest.future && latest.future.length > 0) {
      latest.future.forEach((pred, index) => {
        console.log(`  Day ${index + 1}: ${pred.yhat} (${new Date(pred.ds).toLocaleDateString()})`)
      })
    } else {
      console.log('  No future predictions stored')
    }

    // Get all cached forecasts for comparison
    console.log('\n📊 All Cached Forecasts (Last 10):')
    console.log('='.repeat(50))

    const { data: allForecasts, error: allError } = await supabase
      .from('forecasts')
      .select('forecast, mape, generated_at, events_count_at_generation')
      .order('generated_at', { ascending: false })
      .limit(10)

    if (!allError && allForecasts) {
      allForecasts.forEach((forecast, index) => {
        const age = Math.floor((Date.now() - new Date(forecast.generated_at).getTime()) / (1000 * 60))
        console.log(`${index + 1}. ${forecast.forecast} (${forecast.mape}%) - ${age}min ago - Events: ${forecast.events_count_at_generation}`)
      })

      // Check for MAPE consistency
      const mapes = allForecasts.map(f => f.mape)
      const uniqueMapes = [...new Set(mapes)]
      console.log(`\n🎯 MAPE Analysis:`)
      console.log(`   Total forecasts: ${allForecasts.length}`)
      console.log(`   Unique MAPE values: ${uniqueMapes.length}`)
      if (uniqueMapes.length === 1) {
        console.log(`   ⚠️  All forecasts have the same MAPE: ${uniqueMapes[0]}%`)
        console.log(`   💡 This explains the consistent MAPE - it's cached data!`)
      } else {
        console.log(`   ✅ MAPE values vary: ${uniqueMapes.join('%, ')}%`)
      }
    }

    // Check forecast table structure
    console.log('\n🏗️  Database Table Info:')
    console.log('='.repeat(50))

    const { data: tableInfo, error: tableError } = await supabase
      .rpc('describe_table', { table_name: 'forecasts' })
      .select('*')

    if (tableError) {
      console.log('   Could not get table structure (this is normal)')
    } else if (tableInfo) {
      console.log('   Columns:', tableInfo.map(col => col.column_name).join(', '))
    }

    console.log('\n💡 RECOMMENDATIONS:')
    console.log('='.repeat(50))

    if (ageMinutes > 60) {
      console.log('• Cache is very old - consider forcing a refresh')
      console.log('• Add ?force=true to forecast API calls to bypass cache')
    }

    if (currentEventsCount !== latest.events_count_at_generation) {
      console.log('• Events count changed - cache should auto-invalidate')
      console.log('• Check if cache invalidation logic is working properly')
    }

    console.log('• Monitor MAPE values - they should vary between 15-30% in development')
    console.log('• Consider adding more detailed logging to cache validation')

  } catch (error) {
    console.error('❌ Error checking cached forecasts:', error.message)
  }
}

/**
 * Force refresh the forecast cache
 */
async function forceRefreshForecast() {
  console.log('🔄 Forcing forecast refresh...\n')

  try {
    // Call the forecast API with force refresh
    const response = await fetch('http://localhost:8888/.netlify/functions/forecast?force=true', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`❌ Force refresh failed: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error('Error details:', errorText)
      return
    }

    const data = await response.json()
    console.log('✅ Force refresh successful!')
    console.log(`📊 New forecast: ${data.forecast}`)
    console.log(`📈 New MAPE: ${data.mape}%`)
    console.log(`📅 Generated: ${new Date(data.generatedAt).toLocaleString()}`)
    console.log(`🔄 Source: ${data.metadata?.source || 'unknown'}`)

  } catch (error) {
    console.error('❌ Error during force refresh:', error.message)
  }
}

/**
 * Main execution
 */
async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:')
    console.error('   SUPABASE_URL')
    console.error('   SUPABASE_SERVICE_ROLE_KEY')
    console.log('\n💡 Set these environment variables and try again.')
    process.exit(1)
  }

  const command = process.argv[2]

  if (command === 'refresh') {
    await forceRefreshForecast()
  } else {
    await checkCachedForecasts()
    console.log('\n💡 TIP: Run with "refresh" to force update the cache:')
    console.log('   node scripts/check-cached-forecasts.js refresh')
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Script failed:', error.message)
    process.exit(1)
  })
}

export {
  checkCachedForecasts,
  forceRefreshForecast
}
