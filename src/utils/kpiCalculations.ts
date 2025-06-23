import { format, subDays, parseISO } from 'date-fns';

export interface RawPageview {
  session_id: string;
  timestamp: string;
  url: string;
  is_bot?: boolean;
}

export interface SessionData {
  session_id: string;
  first_visit: Date;
  last_visit: Date;
  pageviews: number;
  duration: number; // in seconds
  is_bounce: boolean;
  is_bot: boolean;
}

export interface KPIMetrics {
  uniqueVisitors: number;
  totalVisits: number;
  totalPageviews: number;
  viewsPerVisit: number;
  bounceRate: number;
  avgVisitDuration: number;
  trends: {
    uniqueVisitors: number;
    totalVisits: number;
    totalPageviews: number;
    viewsPerVisit: number;
    bounceRate: number;
    avgVisitDuration: number;
  };
}

/**
 * Process raw pageview data into session-based metrics
 */
export function processPageviewsToSessions(pageviews: RawPageview[]): SessionData[] {
  const sessionMap = new Map<string, SessionData>();

  pageviews.forEach(pv => {
    // Skip bot traffic
    if (pv.is_bot) return;
    
    const timestamp = new Date(pv.timestamp);
    const sessionId = pv.session_id;

    if (!sessionMap.has(sessionId)) {
      sessionMap.set(sessionId, {
        session_id: sessionId,
        first_visit: timestamp,
        last_visit: timestamp,
        pageviews: 0,
        duration: 0,
        is_bounce: false,
        is_bot: pv.is_bot || false
      });
    }

    const session = sessionMap.get(sessionId)!;
    session.pageviews += 1;
    
    // Update visit times
    if (timestamp < session.first_visit) {
      session.first_visit = timestamp;
    }
    if (timestamp > session.last_visit) {
      session.last_visit = timestamp;
    }
    
    // Calculate duration
    session.duration = Math.floor((session.last_visit.getTime() - session.first_visit.getTime()) / 1000);
    
    // Determine if bounce (single page session)
    session.is_bounce = session.pageviews === 1;
  });

  return Array.from(sessionMap.values());
}

/**
 * Calculate KPI metrics from session data
 */
export function calculateKPIMetrics(
  currentSessions: SessionData[],
  previousSessions: SessionData[]
): KPIMetrics {
  // Current period metrics
  const current = calculatePeriodMetrics(currentSessions);
  
  // Previous period metrics for trend calculation
  const previous = calculatePeriodMetrics(previousSessions);
  
  // Calculate trends (percentage change)
  const trends = {
    uniqueVisitors: calculateTrend(current.uniqueVisitors, previous.uniqueVisitors),
    totalVisits: calculateTrend(current.totalVisits, previous.totalVisits),
    totalPageviews: calculateTrend(current.totalPageviews, previous.totalPageviews),
    viewsPerVisit: calculateTrend(current.viewsPerVisit, previous.viewsPerVisit),
    bounceRate: calculateTrend(current.bounceRate, previous.bounceRate),
    avgVisitDuration: calculateTrend(current.avgVisitDuration, previous.avgVisitDuration)
  };

  return {
    ...current,
    trends
  };
}

/**
 * Calculate metrics for a single period
 */
function calculatePeriodMetrics(sessions: SessionData[]) {
  const validSessions = sessions.filter(s => !s.is_bot);
  
  const uniqueVisitors = validSessions.length;
  const totalVisits = validSessions.length; // Each session is a visit
  const totalPageviews = validSessions.reduce((sum, s) => sum + s.pageviews, 0);
  const viewsPerVisit = totalVisits > 0 ? totalPageviews / totalVisits : 0;
  
  // Bounce rate: percentage of single-page sessions
  const bouncedSessions = validSessions.filter(s => s.is_bounce).length;
  const bounceRate = totalVisits > 0 ? (bouncedSessions / totalVisits) * 100 : 0;
  
  // Average visit duration: exclude bounces and very long sessions (> 30 minutes)
  const validDurations = validSessions
    .filter(s => !s.is_bounce && s.duration > 0 && s.duration < 1800) // 30 minutes max
    .map(s => s.duration);
  
  const avgVisitDuration = validDurations.length > 0 
    ? validDurations.reduce((sum, d) => sum + d, 0) / validDurations.length 
    : 0;

  return {
    uniqueVisitors,
    totalVisits,
    totalPageviews,
    viewsPerVisit,
    bounceRate,
    avgVisitDuration
  };
}

/**
 * Calculate percentage trend between current and previous values
 */
function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Mock KPI data generator for development/demo
 */
export function generateMockKPIData(): KPIMetrics {
  const baseMetrics = {
    uniqueVisitors: 2847,
    totalVisits: 3156,
    totalPageviews: 8934,
    viewsPerVisit: 2.83,
    bounceRate: 42.7,
    avgVisitDuration: 187 // seconds
  };

  // Generate realistic trends
  const trends = {
    uniqueVisitors: 12.3,
    totalVisits: 8.7,
    totalPageviews: 15.2,
    viewsPerVisit: 4.1,
    bounceRate: -6.8, // Negative is good for bounce rate
    avgVisitDuration: 23.4
  };

  return {
    ...baseMetrics,
    trends
  };
}

/**
 * Fetch and process KPI data from API
 */
export async function fetchKPIData(days: number = 30): Promise<KPIMetrics> {
  try {
    console.log('📊 Fetching KPI data...');
    
    // Fetch pageview data for current and previous periods
    const currentStart = format(subDays(new Date(), days), 'yyyy-MM-dd');
    const currentEnd = format(new Date(), 'yyyy-MM-dd');
    const previousStart = format(subDays(new Date(), days * 2), 'yyyy-MM-dd');
    const previousEnd = format(subDays(new Date(), days), 'yyyy-MM-dd');
    
    // In a real implementation, you would fetch actual pageview data
    // For now, return mock data
    return generateMockKPIData();
    
  } catch (error) {
    console.error('❌ Failed to fetch KPI data:', error);
    // Return mock data as fallback
    return generateMockKPIData();
  }
}