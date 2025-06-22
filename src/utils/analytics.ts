// Pythia Analytics API Client
// Functions to interact with live analytics data

export interface EventsResponse {
  success: boolean;
  summary: {
    totalEvents: number;
    totalCount: number;
    dateRange: {
      start: string;
      end: string;
    };
    eventTypes: number;
  };
  timeSeries: Array<{
    date: string;
    events: number;
    count: number;
    types: Record<string, number>;
  }>;
  realtime: Array<{
    hour: string;
    events: number;
    count: number;
  }>;
  eventTypeCounts: Record<string, number>;
  rawEvents: Array<{
    timestamp: string;
    event_type: string;
    count: number;
  }>;
  generatedAt: string;
}

export interface ForecastResponse {
  forecast: number;
  window: number;
  dataPoints: number;
  last7Counts?: number[];
  sum?: number;
  generatedAt: string;
}

export interface Alert {
  id: string;
  type: 'spike' | 'drop' | 'anomaly' | 'info';
  title: string;
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  data?: Record<string, any>;
  acknowledged?: boolean;
  created_at?: string;
}

export interface AlertsResponse {
  alerts: Alert[];
  summary: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    acknowledged: number;
    unacknowledged: number;
  };
  generatedAt: string;
  query?: {
    limit: number;
    acknowledged?: string;
    severity?: string;
    type?: string;
  };
}

/**
 * Fetch events data from the analytics API
 */
export async function fetchEvents(days: number = 30, eventType?: string): Promise<EventsResponse> {
  const params = new URLSearchParams();
  params.set('days', days.toString());
  if (eventType) {
    params.set('type', eventType);
  }

  const response = await fetch(`/.netlify/functions/get-events?${params}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch forecast data from the analytics API
 */
export async function fetchForecast(): Promise<ForecastResponse> {
  const response = await fetch('/.netlify/functions/forecast');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch forecast: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch recent alerts from persistent storage
 */
export async function fetchAlerts(options?: {
  limit?: number;
  acknowledged?: boolean;
  severity?: 'low' | 'medium' | 'high';
  type?: 'spike' | 'drop' | 'anomaly' | 'info';
}): Promise<AlertsResponse> {
  const params = new URLSearchParams();
  
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.acknowledged !== undefined) params.set('acknowledged', options.acknowledged.toString());
  if (options?.severity) params.set('severity', options.severity);
  if (options?.type) params.set('type', options.type);

  const response = await fetch(`/.netlify/functions/get-alerts?${params}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch alerts: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Acknowledge or unacknowledge an alert
 */
export async function acknowledgeAlert(alertId: string, acknowledged: boolean = true): Promise<any> {
  const response = await fetch('/.netlify/functions/acknowledge-alert', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ alertId, acknowledged }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to acknowledge alert: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Backfill historical alerts from event data
 */
export async function backfillAlerts(): Promise<any> {
  const response = await fetch('/.netlify/functions/backfill-alerts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to backfill alerts: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Test database connection and functionality
 */
export async function testConnection(): Promise<any> {
  const response = await fetch('/.netlify/functions/test-connection');
  
  if (!response.ok) {
    throw new Error(`Connection test failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Debug database contents
 */
export async function debugDatabase(): Promise<any> {
  const response = await fetch('/.netlify/functions/debug-db');
  
  if (!response.ok) {
    throw new Error(`Debug failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Transform time series data for chart display
 */
export function transformTimeSeriesForChart(timeSeries: EventsResponse['timeSeries'], forecast?: ForecastResponse) {
  return timeSeries.map((point, index) => {
    const date = new Date(point.date);
    const formattedDate = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });

    return {
      date: formattedDate,
      visitors: point.count, // Use count as visitors for now
      pageviews: point.events * 2.5, // Estimate pageviews
      events: point.events,
      predictions: forecast?.forecast || point.count * 1.05, // Use forecast or slight increase
    };
  });
}

/**
 * Transform realtime data for chart display
 */
export function transformRealtimeForChart(realtime: EventsResponse['realtime']) {
  return realtime.map(point => {
    const hour = new Date(point.hour);
    const formattedTime = hour.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });

    return {
      time: formattedTime,
      visitors: point.count,
      events: point.events,
    };
  });
}

/**
 * Calculate key metrics from events data
 */
export function calculateMetrics(data: EventsResponse) {
  const { timeSeries, summary } = data;
  
  // Calculate trends (compare last 7 days to previous 7 days)
  const last7Days = timeSeries.slice(-7);
  const prev7Days = timeSeries.slice(-14, -7);
  
  const last7Total = last7Days.reduce((sum, day) => sum + day.count, 0);
  const prev7Total = prev7Days.reduce((sum, day) => sum + day.count, 0);
  
  const visitorTrend = prev7Total > 0 ? ((last7Total - prev7Total) / prev7Total) * 100 : 0;
  
  const last7Events = last7Days.reduce((sum, day) => sum + day.events, 0);
  const prev7Events = prev7Days.reduce((sum, day) => sum + day.events, 0);
  
  const eventTrend = prev7Events > 0 ? ((last7Events - prev7Events) / prev7Events) * 100 : 0;

  return {
    totalVisitors: summary.totalCount,
    totalPageviews: Math.floor(summary.totalEvents * 2.5), // Estimate
    totalEvents: summary.totalEvents,
    conversionRate: 4.2, // Placeholder - would need conversion events to calculate
    visitorTrend,
    eventTrend,
    pageviewTrend: eventTrend * 1.2, // Estimate based on events
    conversionTrend: 15.7, // Placeholder
  };
}

/**
 * Get current visitor count (from last hour of realtime data)
 */
export function getCurrentVisitors(realtime: EventsResponse['realtime']): number {
  if (realtime.length === 0) return 0;
  
  // Sum visitors from last few hours
  const recentHours = realtime.slice(-3);
  return recentHours.reduce((sum, hour) => sum + hour.count, 0);
}

// Legacy support for existing pythia buffer system
declare global {
  interface Window {
    pythia: (eventType: string, count?: number, data?: any) => void;
    flushPythia: () => Promise<any>;
    pythiaStatus: () => any;
    pythiaBuffer: Array<{
      event_type: string;
      count: number;
      timestamp: string;
      [key: string]: any;
    }>;
  }
}

export { };