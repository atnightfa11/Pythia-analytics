import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
)

export const handler = async (event, context) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    }
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    console.log('🔄 Backfill alerts function called')
    
    // Get events from the last 7 days for analysis
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    const { data: recentEvents, error: fetchError } = await supabase
      .from('events')
      .select('timestamp, event_type, count')
      .gte('timestamp', sevenDaysAgo.toISOString())
      .order('timestamp', { ascending: true })

    if (fetchError) {
      console.error('❌ Error fetching events:', fetchError)
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Failed to fetch events',
          details: fetchError.message 
        })
      }
    }

    console.log(`📊 Analyzing ${recentEvents?.length || 0} events for backfill`)

    if (!recentEvents || recentEvents.length === 0) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          message: 'No events found for backfill',
          alertsCreated: 0
        })
      }
    }

    // Group events by day for analysis
    const dailyData = {}
    recentEvents.forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0]
      if (!dailyData[date]) {
        dailyData[date] = { events: 0, count: 0 }
      }
      dailyData[date].events += 1
      dailyData[date].count += Number(event.count) || 0
    })

    const days = Object.keys(dailyData).sort()
    const alertsToCreate = []

    // Analyze for spikes and drops
    for (let i = 1; i < days.length; i++) {
      const currentDay = days[i]
      const previousDay = days[i - 1]
      
      const currentCount = dailyData[currentDay].count
      const previousCount = dailyData[previousDay].count
      
      if (previousCount === 0) continue
      
      const change = (currentCount - previousCount) / previousCount
      const changePercent = Math.abs(change * 100)
      
      // Create alerts for significant changes (>25%)
      if (changePercent > 25) {
        const isSpike = change > 0
        const alertType = isSpike ? 'spike' : 'drop'
        const alertId = `backfill-${alertType}-${currentDay}-${changePercent.toFixed(0)}`
        
        // Check if alert already exists
        const { data: existingAlert } = await supabase
          .from('alerts')
          .select('id')
          .eq('id', alertId)
          .single()
        
        if (!existingAlert) {
          alertsToCreate.push({
            id: alertId,
            type: alertType,
            title: `Historical ${alertType.toUpperCase()} Detected`,
            message: `${changePercent.toFixed(0)}% ${isSpike ? 'increase' : 'decrease'} from previous day (${previousCount} → ${currentCount})`,
            timestamp: new Date(currentDay + 'T12:00:00Z').toISOString(),
            severity: changePercent > 50 ? 'high' : changePercent > 35 ? 'medium' : 'low',
            data: {
              currentCount,
              previousCount,
              changePercent: changePercent.toFixed(1),
              backfilled: true,
              date: currentDay
            }
          })
        }
      }
    }

    // Look for anomalous patterns
    const avgDailyCount = Object.values(dailyData).reduce((sum, day) => sum + day.count, 0) / days.length
    
    days.forEach(date => {
      const dayCount = dailyData[date].count
      const deviation = Math.abs(dayCount - avgDailyCount) / avgDailyCount
      
      if (deviation > 0.4 && dayCount > avgDailyCount * 1.4) { // 40% above average
        const alertId = `backfill-anomaly-${date}-${(deviation * 100).toFixed(0)}`
        
        alertsToCreate.push({
          id: alertId,
          type: 'anomaly',
          title: 'Historical Anomaly Detected',
          message: `Traffic ${(deviation * 100).toFixed(0)}% above average (${dayCount} vs avg ${avgDailyCount.toFixed(0)})`,
          timestamp: new Date(date + 'T12:00:00Z').toISOString(),
          severity: 'low',
          data: {
            count: dayCount,
            average: avgDailyCount.toFixed(0),
            deviation: (deviation * 100).toFixed(1),
            backfilled: true,
            date
          }
        })
      }
    })

    console.log(`📝 Creating ${alertsToCreate.length} backfill alerts`)

    // Insert alerts in batches
    let insertedCount = 0
    if (alertsToCreate.length > 0) {
      const { data: insertedAlerts, error: insertError } = await supabase
        .from('alerts')
        .insert(alertsToCreate)
        .select()

      if (insertError) {
        console.error('❌ Error inserting backfill alerts:', insertError)
        return {
          statusCode: 500,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ 
            error: 'Failed to insert backfill alerts',
            details: insertError.message 
          })
        }
      }

      insertedCount = insertedAlerts?.length || 0
    }

    console.log(`✅ Backfill complete: ${insertedCount} alerts created`)

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        success: true,
        message: 'Backfill completed successfully',
        alertsCreated: insertedCount,
        eventsAnalyzed: recentEvents.length,
        daysAnalyzed: days.length,
        summary: {
          spikes: alertsToCreate.filter(a => a.type === 'spike').length,
          drops: alertsToCreate.filter(a => a.type === 'drop').length,
          anomalies: alertsToCreate.filter(a => a.type === 'anomaly').length
        }
      })
    }

  } catch (error) {
    console.error('❌ Backfill alerts function error:', error)
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      })
    }
  }
}