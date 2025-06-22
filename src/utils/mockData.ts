import { format, subDays, subHours } from 'date-fns';

export interface MetricData {
  date: string;
  visitors: number;
  pageviews: number;
  events: number;
  predictions: number;
  bounceRate: number;
  conversionRate: number;
}

export interface RealTimeData {
  time: string;
  visitors: number;
  events: number;
}

export interface DeviceData {
  name: string;
  value: number;
  color: string;
}

export interface AlertData {
  id: string;
  type: 'spike' | 'drop' | 'anomaly' | 'info';
  title: string;
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
}

// Generate realistic analytics data with seasonality and trends
export function generateTimeSeriesData(days: number = 30): MetricData[] {
  const data: MetricData[] = [];
  const baseVisitors = 800;
  const basePageviews = 2400;
  const baseEvents = 400;
  
  for (let i = days; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dayOfWeek = date.getDay();
    
    // Add weekly seasonality (lower on weekends)
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1.0;
    
    // Add some trend and randomness
    const trendFactor = 1 + (days - i) * 0.002; // Slight upward trend
    const randomFactor = 0.8 + Math.random() * 0.4; // ±20% random variation
    
    const visitors = Math.floor(baseVisitors * weekendFactor * trendFactor * randomFactor);
    const pageviews = Math.floor(visitors * (2.5 + Math.random() * 0.5)); // 2.5-3 pages per visitor
    const events = Math.floor(visitors * (0.4 + Math.random() * 0.2)); // 40-60% event rate
    
    // Generate predictions (slightly higher with noise)
    const predictions = Math.floor(visitors * (1.05 + Math.random() * 0.1));
    
    data.push({
      date: format(date, 'MMM dd'),
      visitors,
      pageviews,
      events,
      predictions,
      bounceRate: 35 + Math.random() * 20, // 35-55%
      conversionRate: 3 + Math.random() * 4, // 3-7%
    });
  }
  
  return data;
}

export function generateRealTimeData(): RealTimeData[] {
  const data: RealTimeData[] = [];
  const now = new Date();
  
  for (let i = 23; i >= 0; i--) {
    const time = subHours(now, i);
    const hour = time.getHours();
    
    // Business hours have more traffic
    const hourFactor = hour >= 9 && hour <= 17 ? 1.5 : 
                      hour >= 19 && hour <= 22 ? 1.2 : 0.6;
    
    const visitors = Math.floor(50 * hourFactor * (0.8 + Math.random() * 0.4));
    const events = Math.floor(visitors * (0.3 + Math.random() * 0.2));
    
    data.push({
      time: format(time, 'HH:mm'),
      visitors,
      events,
    });
  }
  
  return data;
}

export function generateDeviceData(): DeviceData[] {
  return [
    { name: 'Desktop', value: 45, color: '#0EA5E9' },
    { name: 'Mobile', value: 40, color: '#14B8A6' },
    { name: 'Tablet', value: 15, color: '#8B5CF6' },
  ];
}

export function generateCountryData(): DeviceData[] {
  return [
    { name: 'United States', value: 35, color: '#0EA5E9' },
    { name: 'United Kingdom', value: 20, color: '#14B8A6' },
    { name: 'Canada', value: 15, color: '#8B5CF6' },
    { name: 'Germany', value: 12, color: '#F59E0B' },
    { name: 'France', value: 10, color: '#EF4444' },
    { name: 'Other', value: 8, color: '#6B7280' },
  ];
}

export function generateAlerts(): AlertData[] {
  return [
    {
      id: '1',
      type: 'spike',
      title: 'Traffic Spike Detected',
      message: '45% increase in visitors over the last hour',
      timestamp: '2 hours ago',
      severity: 'medium',
    },
    {
      id: '2',
      type: 'info',
      title: 'Model Updated',
      message: 'Prediction accuracy improved to 94.2%',
      timestamp: '6 hours ago',
      severity: 'low',
    },
    {
      id: '3',
      type: 'anomaly',
      title: 'Unusual Pattern',
      message: 'Mobile traffic 23% higher than predicted',
      timestamp: '12 hours ago',
      severity: 'low',
    },
    {
      id: '4',
      type: 'info',
      title: 'Weekly Report',
      message: 'Analytics summary sent to configured recipients',
      timestamp: '1 day ago',
      severity: 'low',
    },
  ];
}

// Simulate real-time data updates
export function useRealTimeUpdates(callback: (data: any) => void, interval: number = 5000) {
  if (typeof window === 'undefined') return;
  
  const timer = setInterval(() => {
    const now = new Date();
    const currentVisitors = Math.floor(50 + Math.random() * 100);
    const currentEvents = Math.floor(currentVisitors * (0.3 + Math.random() * 0.2));
    
    callback({
      visitors: currentVisitors,
      events: currentEvents,
      timestamp: now.toISOString(),
    });
  }, interval);
  
  return () => clearInterval(timer);
}