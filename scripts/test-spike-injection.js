// Test Spike Injection for Alert Testing
// Run with: node scripts/test-spike-injection.js

import { createClient } from '@supabase/supabase-js'

// Load environment variables
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set in your .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestSpike(eventCount = 100) {
  console.log(`🚨 Creating ${eventCount} test spike events...`)

  try {
    // Create events in batches to avoid overwhelming the database
    const batchSize = 50
    const batches = Math.ceil(eventCount / batchSize)

    for (let batch = 0; batch < batches; batch++) {
      const remaining = eventCount - (batch * batchSize)
      const currentBatchSize = Math.min(batchSize, remaining)

      console.log(`📦 Creating batch ${batch + 1}/${batches} (${currentBatchSize} events)`)

      const events = []
      for (let i = 0; i < currentBatchSize; i++) {
        events.push({
          event_type: 'pageview',
          count: 15 + Math.floor(Math.random() * 25), // 15-40 range to create spike
          timestamp: new Date().toISOString(),
          session_id: `test-spike-session-${Date.now()}-${batch}-${i}`,
          device: 'Desktop'
        })
      }

      const { data, error } = await supabase
        .from('events')
        .insert(events)
        .select()

      if (error) {
        console.error(`❌ Failed to create batch ${batch + 1}:`, error)
        continue
      }

      console.log(`✅ Batch ${batch + 1} created (${data?.length || 0} events)`)

      // Small delay between batches
      if (batch < batches - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log(`✅ Successfully created ${eventCount} test events`)
    console.log('⏰ Alert system should detect spike within 30-60 seconds')
    console.log('📊 Check your alerts at: /.netlify/functions/get-alerts')

  } catch (error) {
    console.error('❌ Test spike creation failed:', error)
    process.exit(1)
  }
}

// Run with default 100 events or custom count
const eventCount = process.argv[2] ? parseInt(process.argv[2]) : 100
createTestSpike(eventCount)
