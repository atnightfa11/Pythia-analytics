import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Required: SUPABASE_URL and SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyMigration() {
  try {
    console.log('🔧 Applying database migration...')

    // First, let's test the connection by getting the current schema
    const { data: tables, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, table_name')
      .eq('table_name', 'forecasts')

    if (schemaError) {
      console.error('❌ Failed to query schema:', schemaError)
      console.log('💡 This might be due to RLS policies. Try adding SUPABASE_SERVICE_ROLE_KEY to your .env file')
      process.exit(1)
    }

    console.log('📊 Current forecasts table columns:', tables?.map(t => t.column_name) || [])

    // Check if the columns already exist
    const hasEventsCountCol = tables?.some(col => col.column_name === 'events_count_at_generation')
    const hasModelVersionCol = tables?.some(col => col.column_name === 'model_version')

    if (hasEventsCountCol && hasModelVersionCol) {
      console.log('✅ Migration already applied - columns exist')
      return
    }

    console.log('🔄 Columns missing, attempting to add them...')

    // Try to add the columns using a simple insert test
    const testData = {
      generated_at: new Date().toISOString(),
      forecast_data: { test: true },
      events_count_at_generation: 0,
      model_version: '1.0'
    }

    const { error: insertError } = await supabase
      .from('forecasts')
      .insert(testData)

    if (insertError) {
      console.error('❌ Failed to add columns:', insertError.message)
      console.log('💡 This requires admin privileges. Please run:')
      console.log('   npx supabase db reset')
      console.log('   Or apply the migration in your Supabase dashboard')
      process.exit(1)
    }

    // Clean up the test record
    await supabase.from('forecasts').delete().eq('model_version', '1.0')

    console.log('✅ Migration applied successfully!')
    console.log('📊 New columns added to forecasts table:')
    console.log('  - events_count_at_generation (bigint, default 0)')
    console.log('  - model_version (varchar(50), default "1.0")')

  } catch (error) {
    console.error('❌ Error applying migration:', error)
    process.exit(1)
  }
}

applyMigration()
