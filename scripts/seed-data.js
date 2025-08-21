#!/usr/bin/env node

/**
 * Seed script to inject 30 days of realistic aggregate data
 * Usage: npm run seed
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials')
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Generate realistic time series data
function generateTimeSeriesData() {
  const data = []
  const now = new Date()
  const baseTraffic = 125 + Math.random() * 50 // Base traffic between 125-175

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    // Add some realistic patterns
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const weekendMultiplier = isWeekend ? 0.7 : 1.0

    // Add some trend (slight growth)
    const trendMultiplier = 1 + (i * 0.005)

    // Add random variation
    const randomVariation = 0.8 + Math.random() * 0.4

    const dailyTraffic = Math.round(baseTraffic * weekendMultiplier * trendMultiplier * randomVariation)

    // Split by device type with realistic ratios
    const desktopTraffic = Math.round(dailyTraffic * 0.45)
    const mobileTraffic = Math.round(dailyTraffic * 0.40)
    const tabletTraffic = dailyTraffic - desktopTraffic - mobileTraffic

    data.push({
      timestamp: date.toISOString(),
      count: dailyTraffic,
      event_type: 'pageview',
      device_type: 'desktop',
      country: 'US',
      city: 'San Francisco',
      region: 'CA'
    })

    // Add some mobile traffic
    data.push({
      timestamp: date.toISOString(),
      count: mobileTraffic,
      event_type: 'pageview',
      device_type: 'mobile',
      country: 'US',
      city: 'New York',
      region: 'NY'
    })

    // Add some tablet traffic
    data.push({
      timestamp: date.toISOString(),
      count: tabletTraffic,
      event_type: 'pageview',
      device_type: 'tablet',
      country: 'CA',
      city: 'Toronto',
      region: 'ON'
    })

    // Add some conversion events
    if (Math.random() < 0.3) { // 30% chance of conversion
      data.push({
        timestamp: date.toISOString(),
        count: Math.floor(Math.random() * 5) + 1,
        event_type: 'signup',
        device_type: Math.random() < 0.6 ? 'desktop' : 'mobile',
        country: Math.random() < 0.7 ? 'US' : 'CA',
        city: 'Various',
        region: 'Various'
      })
    }
  }

  return data
}

// Insert data in batches
async function seedData() {
  console.log('🌱 Starting data seeding...')

  try {
    const events = generateTimeSeriesData()
    console.log(`📊 Generated ${events.length} events over 30 days`)

    // Insert in batches of 100
    const batchSize = 100
    let inserted = 0

    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize)

      const { data, error } = await supabase
        .from('events')
        .insert(batch)
        .select()

      if (error) {
        console.error('❌ Error inserting batch:', error)
        continue
      }

      inserted += data.length
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}: ${data.length} events`)
    }

    console.log(`🎉 Successfully seeded ${inserted} events!`)

    // Create a sample forecast entry
    const { data: forecastData, error: forecastError } = await supabase
      .from('forecasts')
      .insert({
        forecast: 150,
        mape: 11.5,
        generated_at: new Date().toISOString(),
        events_count_at_generation: inserted,
        model_version: '1.0'
      })
      .select()

    if (forecastError) {
      console.warn('⚠️ Could not create sample forecast:', forecastError.message)
    } else {
      console.log('📈 Created sample forecast entry')
    }

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

// Run the seeding
seedData()
