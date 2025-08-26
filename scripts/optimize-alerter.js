#!/usr/bin/env node

/**
 * Alerter Database Optimization Script
 *
 * Creates optimized database indexes for the alerter function to improve performance.
 * This script should be run when deploying or when experiencing slow alerter performance.
 *
 * Usage:
 *   node scripts/optimize-alerter.js
 *   npm run optimize-alerter
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Database connection
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Database indexes to create for optimal alerter performance
 */
const INDEXES_TO_CREATE = [
  {
    name: 'idx_events_timestamp_device',
    table: 'events',
    columns: ['timestamp DESC', 'device'],
    description: 'Optimizes time-based queries with device filtering for alerter',
    sql: `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_timestamp_device
      ON events (timestamp DESC, device)
      WHERE event_type = 'pageview';
    `
  },
  {
    name: 'idx_events_timestamp_count',
    table: 'events',
    columns: ['timestamp DESC', 'count'],
    description: 'Optimizes queries that need both timestamp and count for aggregation',
    sql: `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_timestamp_count
      ON events (timestamp DESC, count DESC)
      WHERE event_type = 'pageview';
    `
  },
  {
    name: 'idx_events_device_timestamp',
    table: 'events',
    columns: ['device', 'timestamp DESC'],
    description: 'Optimizes device-based time range queries',
    sql: `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_device_timestamp
      ON events (device, timestamp DESC)
      WHERE event_type = 'pageview';
    `
  },
  {
    name: 'idx_events_event_type_timestamp',
    table: 'events',
    columns: ['event_type', 'timestamp DESC'],
    description: 'Optimizes event type filtering with time ranges',
    sql: `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_event_type_timestamp
      ON events (event_type, timestamp DESC);
    `
  },
  {
    name: 'idx_alerts_id_type',
    table: 'alerts',
    columns: ['id', 'type'],
    description: 'Optimizes alert deduplication queries',
    sql: `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_id_type
      ON alerts (id, type);
    `
  }
]

/**
 * Materialized views for better performance
 */
const MATERIALIZED_VIEWS = [
  {
    name: 'mv_daily_event_aggregates',
    description: 'Pre-aggregated daily event counts for faster alert processing',
    sql: `
      CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_event_aggregates AS
      SELECT
        DATE(timestamp) as event_date,
        device,
        event_type,
        COUNT(*) as event_count,
        SUM(count) as total_count,
        AVG(count) as avg_count,
        MAX(timestamp) as latest_timestamp
      FROM events
      WHERE event_type = 'pageview'
      GROUP BY DATE(timestamp), device, event_type
      ORDER BY DATE(timestamp) DESC, total_count DESC;

      -- Create index on materialized view
      CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_event_aggregates_date_device
      ON mv_daily_event_aggregates (event_date DESC, device);
    `,
    refreshSql: `
      REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_event_aggregates;
    `
  }
]

/**
 * Performance analysis queries
 */
const ANALYSIS_QUERIES = [
  {
    name: 'slow_queries_analysis',
    description: 'Find slow queries that might affect alerter performance',
    sql: `
      SELECT
        query,
        calls,
        total_time,
        mean_time,
        rows,
        temp_blks_read,
        temp_blks_written
      FROM pg_stat_statements
      WHERE query ILIKE '%events%'
        AND mean_time > 1000  -- Queries taking more than 1 second on average
      ORDER BY mean_time DESC
      LIMIT 10;
    `
  },
  {
    name: 'table_statistics',
    description: 'Get table statistics for events and alerts tables',
    sql: `
      SELECT
        schemaname,
        tablename,
        n_tup_ins AS inserts,
        n_tup_upd AS updates,
        n_tup_del AS deletes,
        n_live_tup AS live_rows,
        n_dead_tup AS dead_rows,
        last_autovacuum,
        last_autovacuum
      FROM pg_stat_user_tables
      WHERE tablename IN ('events', 'alerts')
      ORDER BY tablename;
    `
  },
  {
    name: 'index_usage',
    description: 'Check which indexes are being used',
    sql: `
      SELECT
        indexname,
        idx_scan AS index_scans,
        idx_tup_read AS tuples_read,
        idx_tup_fetch AS tuples_fetched
      FROM pg_stat_user_indexes
      WHERE tablename IN ('events', 'alerts')
      ORDER BY idx_scan DESC;
    `
  }
]

/**
 * Create a single index
 */
async function createIndex(index) {
  console.log(`🔧 Creating index: ${index.name}`)
  console.log(`   Description: ${index.description}`)
  console.log(`   Table: ${index.table}`)
  console.log(`   Columns: ${index.columns.join(', ')}`)

  try {
    const startTime = Date.now()
    const { error } = await supabase.rpc('exec_sql', { sql: index.sql })

    if (error) {
      console.error(`❌ Failed to create index ${index.name}:`, error.message)
      return false
    }

    const duration = Date.now() - startTime
    console.log(`✅ Index ${index.name} created successfully in ${duration}ms`)
    return true

  } catch (error) {
    console.error(`❌ Error creating index ${index.name}:`, error.message)
    return false
  }
}

/**
 * Create a materialized view
 */
async function createMaterializedView(mv) {
  console.log(`🔧 Creating materialized view: ${mv.name}`)
  console.log(`   Description: ${mv.description}`)

  try {
    const startTime = Date.now()
    const { error } = await supabase.rpc('exec_sql', { sql: mv.sql })

    if (error) {
      console.error(`❌ Failed to create materialized view ${mv.name}:`, error.message)
      return false
    }

    const duration = Date.now() - startTime
    console.log(`✅ Materialized view ${mv.name} created successfully in ${duration}ms`)
    return true

  } catch (error) {
    console.error(`❌ Error creating materialized view ${mv.name}:`, error.message)
    return false
  }
}

/**
 * Run performance analysis
 */
async function runAnalysis(analysis) {
  console.log(`🔍 Running analysis: ${analysis.name}`)
  console.log(`   Description: ${analysis.description}`)

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: analysis.sql })

    if (error) {
      console.log(`⚠️  Analysis ${analysis.name} failed:`, error.message)
      return null
    }

    if (data && data.length > 0) {
      console.log(`📊 Analysis results for ${analysis.name}:`)
      console.table(data.slice(0, 5)) // Show first 5 results
      if (data.length > 5) {
        console.log(`   ... and ${data.length - 5} more results`)
      }
    } else {
      console.log(`📭 No results for analysis ${analysis.name}`)
    }

    return data

  } catch (error) {
    console.log(`⚠️  Analysis ${analysis.name} error:`, error.message)
    return null
  }
}

/**
 * Generate optimization report
 */
function generateOptimizationReport(results) {
  console.log('\n' + '='.repeat(60))
  console.log('🚀 ALERTER OPTIMIZATION REPORT')
  console.log('='.repeat(60))

  const { indexesCreated, viewsCreated, analysisResults } = results

  console.log('\n🔧 INDEX CREATION RESULTS:')
  console.log(`   Indexes created: ${indexesCreated.filter(r => r).length}/${indexesCreated.length}`)
  console.log(`   Success rate: ${((indexesCreated.filter(r => r).length / indexesCreated.length) * 100).toFixed(1)}%`)

  console.log('\n🔧 MATERIALIZED VIEWS:')
  console.log(`   Views created: ${viewsCreated.filter(r => r).length}/${viewsCreated.length}`)
  console.log(`   Success rate: ${((viewsCreated.filter(r => r).length / viewsCreated.length) * 100).toFixed(1)}%`)

  console.log('\n📊 PERFORMANCE ANALYSIS:')

  if (analysisResults.slow_queries_analysis) {
    const slowQueries = analysisResults.slow_queries_analysis
    if (slowQueries.length > 0) {
      console.log(`   ⚠️  Found ${slowQueries.length} slow queries (>1s average)`)
      console.log(`   📈 Average query time: ${slowQueries[0].mean_time.toFixed(0)}ms`)
    } else {
      console.log('   ✅ No slow queries detected')
    }
  }

  if (analysisResults.table_statistics) {
    const stats = analysisResults.table_statistics
    console.log(`   📊 Table Statistics:`)
    stats.forEach(stat => {
      console.log(`      ${stat.tablename}: ${stat.live_rows.toLocaleString()} live rows`)
    })
  }

  if (analysisResults.index_usage) {
    const indexes = analysisResults.index_usage
    const usedIndexes = indexes.filter(idx => idx.idx_scan > 0)
    console.log(`   🔍 Index Usage: ${usedIndexes.length}/${indexes.length} indexes being used`)
  }

  console.log('\n💡 RECOMMENDATIONS:')

  // Generate specific recommendations based on results
  if (indexesCreated.filter(r => !r).length > 0) {
    console.log('   • Run this script again with proper database permissions')
    console.log('   • Check that you have CREATE INDEX privileges')
  }

  if (analysisResults.slow_queries_analysis?.length > 0) {
    console.log('   • Consider optimizing the identified slow queries')
    console.log('   • Review query patterns and add more specific indexes')
  }

  console.log('   • Monitor alerter performance after these optimizations')
  console.log('   • Consider running this script periodically for maintenance')

  console.log('\n🎯 NEXT STEPS:')
  console.log('   1. Deploy the optimized alerter function')
  console.log('   2. Monitor performance improvements')
  console.log('   3. Set up regular optimization maintenance')

  console.log('='.repeat(60))
}

/**
 * Save report to file
 */
function saveReportToFile(results) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const reportFile = path.join(process.cwd(), `alerter-optimization-${timestamp}.json`)

  const report = {
    timestamp: new Date().toISOString(),
    optimization: {
      indexesCreated: results.indexesCreated.length,
      indexesSuccessful: results.indexesCreated.filter(r => r).length,
      viewsCreated: results.viewsCreated.length,
      viewsSuccessful: results.viewsCreated.filter(r => r).length
    },
    indexes: INDEXES_TO_CREATE.map((index, i) => ({
      ...index,
      success: results.indexesCreated[i]
    })),
    materializedViews: MATERIALIZED_VIEWS.map((mv, i) => ({
      ...mv,
      success: results.viewsCreated[i]
    })),
    analysis: results.analysisResults
  }

  try {
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2))
    console.log(`📄 Report saved to: ${reportFile}`)
  } catch (error) {
    console.error('❌ Failed to save report:', error.message)
  }
}

/**
 * Main execution
 */
async function runOptimization() {
  console.log('🚀 Starting Alerter Database Optimization\n')
  console.log('=' .repeat(60))

  // Check database connection
  console.log('🔍 Checking database connection...')
  try {
    const { data, error } = await supabase.from('events').select('count').limit(1)
    if (error) throw error
    console.log('✅ Database connection successful\n')
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    console.log('💡 Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
    process.exit(1)
  }

  const results = {
    indexesCreated: [],
    viewsCreated: [],
    analysisResults: {}
  }

  // Create indexes
  console.log('🔧 CREATING DATABASE INDEXES\n')
  for (const index of INDEXES_TO_CREATE) {
    const success = await createIndex(index)
    results.indexesCreated.push(success)
    console.log('')
  }

  // Create materialized views
  console.log('🔧 CREATING MATERIALIZED VIEWS\n')
  for (const mv of MATERIALIZED_VIEWS) {
    const success = await createMaterializedView(mv)
    results.viewsCreated.push(success)
    console.log('')
  }

  // Run performance analysis
  console.log('🔍 RUNNING PERFORMANCE ANALYSIS\n')
  for (const analysis of ANALYSIS_QUERIES) {
    const result = await runAnalysis(analysis)
    results.analysisResults[analysis.name] = result
    console.log('')
  }

  // Generate and save report
  generateOptimizationReport(results)
  saveReportToFile(results)

  // Summary
  const successRate = ((results.indexesCreated.filter(r => r).length + results.viewsCreated.filter(r => r).length) /
                      (results.indexesCreated.length + results.viewsCreated.length)) * 100

  console.log(`\n🎉 Optimization completed with ${successRate.toFixed(1)}% success rate!`)
  console.log('💡 Your alerter should now be significantly faster.')
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:')
    console.error('   SUPABASE_URL')
    console.error('   SUPABASE_SERVICE_ROLE_KEY')
    console.log('\n💡 Set these environment variables and try again.')
    process.exit(1)
  }

  runOptimization().catch(error => {
    console.error('💥 Optimization failed:', error.message)
    process.exit(1)
  })
}

export {
  runOptimization,
  createIndex,
  createMaterializedView,
  runAnalysis,
  INDEXES_TO_CREATE,
  MATERIALIZED_VIEWS,
  ANALYSIS_QUERIES
}
