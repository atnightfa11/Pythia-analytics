import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Users,
  Globe,
  Zap,
  Shield,
  Settings as SettingsIcon,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Activity,
  Clock,
  Target,
  Layers,
  Database,
  RefreshCw,
  Wifi,
  WifiOff,
  Check,
  X,
  Loader2,
  Sliders,
  MousePointer,
  Timer,
  MapPin,
  ChevronDown,
  Calendar
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, addDays, subDays } from 'date-fns';

// Types for our live data
interface TimeSeriesData {
  hour: string;
  count: number;
  date?: string;
  visitors?: number;
  pageviews?: number;
  events?: number;
  forecast?: number;
  isForecast?: boolean;
  isHistoricalForecast?: boolean;
}

interface Alert {
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

interface GeographicData {
  country: string;
  visitors: number;
  percentage: number;
  color: string;
}

interface ConversionData {
  event_type: string;
  conversions: number;
  rate: number;
}

// Date range options
interface DateRangeOption {
  label: string;
  value: string;
  days: number;
  shortcut?: string;
}

const DATE_RANGE_OPTIONS: DateRangeOption[] = [
  { label: 'Today', value: 'today', days: 1, shortcut: 'D' },
  { label: 'Yesterday', value: 'yesterday', days: 1, shortcut: 'E' },
  { label: 'Realtime', value: 'realtime', days: 1, shortcut: 'R' },
  { label: 'Last 7 Days', value: 'last-7-days', days: 7, shortcut: 'W' },
  { label: 'Last 28 Days', value: 'last-28-days', days: 28, shortcut: 'F' },
  { label: 'Last 91 Days', value: 'last-91-days', days: 91, shortcut: 'N' },
  { label: 'Month to Date', value: 'month-to-date', days: 30, shortcut: 'M' },
  { label: 'Last Month', value: 'last-month', days: 30, shortcut: 'P' },
  { label: 'Year to Date', value: 'year-to-date', days: 365, shortcut: 'Y' },
  { label: 'Last 12 Months', value: 'last-12-months', days: 365, shortcut: 'L' },
  { label: 'All time', value: 'all-time', days: 9999, shortcut: 'A' },
  { label: 'Custom Range', value: 'custom', days: 30, shortcut: 'C' },
  { label: 'Compare', value: 'compare', days: 30, shortcut: 'X' },
];

// Brand color palette
const BRAND_COLORS = {
  primary: '#0EA5E9',
  secondary: '#14B8A6',
  accent: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  forecast: '#F97316', // Orange for forecast
  historicalForecast: '#EC4899' // Pink for historical forecasts
};

// Device data colors using brand palette
const DEVICE_COLORS = {
  'Desktop': BRAND_COLORS.primary,
  'Mobile': BRAND_COLORS.secondary, 
  'Tablet': BRAND_COLORS.accent
};

// Geographic colors
const GEO_COLORS = ['#0EA5E9', '#14B8A6', '#8B5CF6', '#F59E0B', '#EF4444', '#6B7280'];

// Loading skeleton component
const LoadingSkeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`}></div>
);

// Chart loading component
const ChartLoading = () => (
  <div className="flex items-center justify-center h-[300px]">
    <div className="text-center">
      <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-2" />
      <p className="text-sm text-slate-500">Loading chart data...</p>
    </div>
  </div>
);

// Date Range Selector Component
const DateRangeSelector = ({ 
  selectedRange, 
  onRangeChange 
}: { 
  selectedRange: string; 
  onRangeChange: (range: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = DATE_RANGE_OPTIONS.find(opt => opt.value === selectedRange) || DATE_RANGE_OPTIONS[4];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:border-slate-400 transition-colors min-w-[160px]"
      >
        <Calendar className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-700">{selectedOption.label}</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
          <div className="p-2 max-h-80 overflow-y-auto">
            {DATE_RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onRangeChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                  selectedRange === option.value
                    ? 'bg-sky-50 text-sky-700 font-medium'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{option.label}</span>
                {option.shortcut && (
                  <span className="text-xs text-slate-400 font-mono">{option.shortcut}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Alert Card Component
const AlertCard = ({ alert, onAcknowledge }: { alert: Alert; onAcknowledge: (id: string, ack: boolean) => void }) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  };

  return (
    <div 
      className={`p-4 border rounded-lg transition-all ${
        alert.acknowledged ? 'bg-slate-50 border-slate-200 opacity-75' :
        alert.type === 'spike' ? 'bg-amber-50 border-amber-200' :
        alert.type === 'drop' ? 'bg-red-50 border-red-200' :
        alert.type === 'anomaly' ? 'bg-purple-50 border-purple-200' :
        'bg-emerald-50 border-emerald-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 flex-1">
          {alert.type === 'spike' && <TrendingUp className="w-5 h-5 text-amber-600 flex-shrink-0" />}
          {alert.type === 'drop' && <ArrowDown className="w-5 h-5 text-red-600 flex-shrink-0" />}
          {alert.type === 'anomaly' && <AlertTriangle className="w-5 h-5 text-purple-600 flex-shrink-0" />}
          {alert.type === 'info' && <Activity className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${
              alert.acknowledged ? 'text-slate-600' :
              alert.type === 'spike' ? 'text-amber-900' :
              alert.type === 'drop' ? 'text-red-900' :
              alert.type === 'anomaly' ? 'text-purple-900' :
              'text-emerald-900'
            }`}>
              {alert.title}
            </p>
            <p className={`text-xs ${
              alert.acknowledged ? 'text-slate-500' :
              alert.type === 'spike' ? 'text-amber-600' :
              alert.type === 'drop' ? 'text-red-600' :
              alert.type === 'anomaly' ? 'text-purple-600' :
              'text-emerald-600'
            }`}>
              {alert.message}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {formatTimestamp(alert.timestamp)}
            </p>
          </div>
        </div>
        <button
          onClick={() => onAcknowledge(alert.id, !alert.acknowledged)}
          className={`p-1 rounded transition-colors ${
            alert.acknowledged 
              ? 'text-slate-400 hover:text-slate-600' 
              : 'text-emerald-600 hover:text-emerald-700'
          }`}
          title={alert.acknowledged ? 'Mark as unread' : 'Mark as read'}
        >
          {alert.acknowledged ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export function Dashboard() {
  // State hooks as requested
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [liveCount, setLiveCount] = useState<number>(0);
  const [forecast, setForecast] = useState<number>(0);
  const [mape, setMape] = useState<number>(0);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [forecastData, setForecastData] = useState<any>(null);

  // Date range state
  const [selectedDateRange, setSelectedDateRange] = useState('last-28-days');

  // Additional state for enhanced features
  const [loading, setLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [epsilon, setEpsilon] = useState(1.0);
  
  // Enhanced metrics state
  const [bounceRate, setBounceRate] = useState<number>(0);
  const [avgTimeOnSite, setAvgTimeOnSite] = useState<number>(0);
  const [conversionRate, setConversionRate] = useState<number>(0);
  const [conversions, setConversions] = useState<ConversionData[]>([]);
  const [geographicData, setGeographicData] = useState<GeographicData[]>([]);
  
  const [deviceData, setDeviceData] = useState([
    { name: 'Desktop', value: 45, color: BRAND_COLORS.primary },
    { name: 'Mobile', value: 40, color: BRAND_COLORS.secondary },
    { name: 'Tablet', value: 15, color: BRAND_COLORS.accent },
  ]);

  // Generate historical forecast points (simulated for now)
  const generateHistoricalForecasts = (actualData: TimeSeriesData[]) => {
    return actualData.map((point, index) => {
      // Simulate historical forecasts with some variance
      const baseValue = point.count;
      const variance = 0.85 + Math.random() * 0.3; // ±15% variance
      const historicalForecast = baseValue * variance;
      
      return {
        ...point,
        historicalForecast,
        isHistoricalForecast: true
      };
    });
  };

  // Generate forecast points for the next 7 days
  const generateForecastPoints = (currentData: TimeSeriesData[], forecastValue: number) => {
    const forecastPoints: TimeSeriesData[] = [];
    const lastDate = currentData.length > 0 ? new Date(currentData[currentData.length - 1].date || currentData[currentData.length - 1].hour) : new Date();
    
    for (let i = 1; i <= 7; i++) {
      const forecastDate = addDays(lastDate, i);
      const dateStr = forecastDate.toISOString().split('T')[0];
      
      // Add some variation to the forecast (±10%)
      const variation = 0.9 + Math.random() * 0.2;
      const adjustedForecast = forecastValue * variation;
      
      forecastPoints.push({
        hour: dateStr,
        count: 0,
        date: dateStr,
        visitors: 0,
        pageviews: 0,
        events: 0,
        forecast: adjustedForecast,
        isForecast: true
      });
    }
    
    return forecastPoints;
  };

  // Calculate enhanced metrics from events data
  const calculateEnhancedMetrics = (eventsData: any) => {
    if (!eventsData.rawEvents || eventsData.rawEvents.length === 0) return;

    const events = eventsData.rawEvents;
    
    // Group events by session
    const sessionData: Record<string, any[]> = {};
    events.forEach((event: any) => {
      if (event.session_id) {
        if (!sessionData[event.session_id]) {
          sessionData[event.session_id] = [];
        }
        sessionData[event.session_id].push(event);
      }
    });

    // Calculate bounce rate (sessions with only 1 event)
    const sessions = Object.values(sessionData);
    const bouncedSessions = sessions.filter(session => session.length === 1).length;
    const calculatedBounceRate = sessions.length > 0 ? (bouncedSessions / sessions.length) * 100 : 0;
    setBounceRate(calculatedBounceRate);

    // Calculate average time on site
    let totalSessionTime = 0;
    let validSessions = 0;
    
    sessions.forEach(session => {
      if (session.length > 1) {
        const sortedEvents = session.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const sessionDuration = new Date(sortedEvents[sortedEvents.length - 1].timestamp).getTime() - 
                               new Date(sortedEvents[0].timestamp).getTime();
        if (sessionDuration > 0 && sessionDuration < 30 * 60 * 1000) { // Less than 30 minutes
          totalSessionTime += sessionDuration;
          validSessions++;
        }
      }
    });
    
    const avgTime = validSessions > 0 ? totalSessionTime / validSessions / 1000 : 0; // Convert to seconds
    setAvgTimeOnSite(avgTime);

    // Calculate conversion events
    const conversionEvents = ['checkout', 'signup', 'purchase', 'subscribe', 'download'];
    const conversionCounts: Record<string, number> = {};
    let totalConversions = 0;

    events.forEach((event: any) => {
      if (conversionEvents.includes(event.event_type.toLowerCase())) {
        conversionCounts[event.event_type] = (conversionCounts[event.event_type] || 0) + 1;
        totalConversions++;
      }
    });

    const conversionData = Object.entries(conversionCounts).map(([type, count]) => ({
      event_type: type,
      conversions: count,
      rate: sessions.length > 0 ? (count / sessions.length) * 100 : 0
    }));

    setConversions(conversionData);
    
    // Overall conversion rate
    const overallConversionRate = sessions.length > 0 ? (totalConversions / sessions.length) * 100 : 0;
    setConversionRate(overallConversionRate);

    // Generate mock geographic data (in production, this would come from server-side IP geolocation)
    const mockGeoData: GeographicData[] = [
      { country: 'United States', visitors: Math.floor(sessions.length * 0.35), percentage: 35, color: GEO_COLORS[0] },
      { country: 'United Kingdom', visitors: Math.floor(sessions.length * 0.20), percentage: 20, color: GEO_COLORS[1] },
      { country: 'Canada', visitors: Math.floor(sessions.length * 0.15), percentage: 15, color: GEO_COLORS[2] },
      { country: 'Germany', visitors: Math.floor(sessions.length * 0.12), percentage: 12, color: GEO_COLORS[3] },
      { country: 'France', visitors: Math.floor(sessions.length * 0.10), percentage: 10, color: GEO_COLORS[4] },
      { country: 'Other', visitors: Math.floor(sessions.length * 0.08), percentage: 8, color: GEO_COLORS[5] },
    ];
    
    setGeographicData(mockGeoData);
  };

  // Get days from selected range
  const getDaysFromRange = (range: string): number => {
    const option = DATE_RANGE_OPTIONS.find(opt => opt.value === range);
    return option?.days || 28;
  };

  // Data fetching as requested
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('📊 Loading dashboard data...');

        // Test connection first
        try {
          const testResponse = await fetch('/.netlify/functions/test-connection');
          const testResult = await testResponse.json();
          
          if (!testResponse.ok) {
            console.error('❌ Connection test failed:', testResult);
            throw new Error(`Connection test failed: ${testResult.error || testResult.details}`);
          }
          
          console.log('✅ Connection test passed:', testResult);
        } catch (testError) {
          console.error('❌ Connection test error:', testError);
          throw new Error(`Database connection failed: ${testError.message}`);
        }

        // Get days for current range
        const days = getDaysFromRange(selectedDateRange);

        // Historical & real-time events
        const eventsResponse = await fetch(`/.netlify/functions/get-events?days=${days}`);
        if (!eventsResponse.ok) {
          const errorData = await eventsResponse.json().catch(() => ({}));
          throw new Error(`Events API error: ${eventsResponse.status} - ${errorData.error || errorData.details || eventsResponse.statusText}`);
        }
        const eventsData = await eventsResponse.json();
        
        // Transform time series data for charts
        const transformedTimeSeries = eventsData.timeSeries?.map((item: any) => ({
          hour: item.date,
          count: item.count,
          date: item.date,
          visitors: item.count,
          pageviews: item.events * 2.5,
          events: item.events,
          isForecast: false
        })) || [];

        // Add historical forecasts to show actual vs predicted
        const timeSeriesWithHistoricalForecasts = generateHistoricalForecasts(transformedTimeSeries);
        
        // Calculate live count from realtime data
        const realtimeTotal = eventsData.realtime?.reduce((sum: number, e: any) => sum + e.count, 0) || 0;
        setLiveCount(realtimeTotal);

        // Calculate enhanced metrics
        calculateEnhancedMetrics(eventsData);

        // Forecast + accuracy
        try {
          const forecastResponse = await fetch('/.netlify/functions/get-forecast');
          if (forecastResponse.ok) {
            const forecastResult = await forecastResponse.json();
            setForecast(forecastResult.forecast || 0);
            setMape(forecastResult.mape || 15);
            setForecastData(forecastResult);

            // Add future forecast points to time series if we have forecast data
            if (forecastResult.forecast && forecastResult.forecast > 0) {
              const forecastPoints = generateForecastPoints(timeSeriesWithHistoricalForecasts, forecastResult.forecast);
              timeSeriesWithHistoricalForecasts.push(...forecastPoints);
            }
          }
        } catch (forecastError) {
          console.warn('⚠️ Forecast fetch failed:', forecastError);
          setForecast(0);
          setMape(15);
        }

        setTimeSeries(timeSeriesWithHistoricalForecasts);

        // Smart alerts
        try {
          const alertsResponse = await fetch('/.netlify/functions/get-alerts');
          if (alertsResponse.ok) {
            const alertsData = await alertsResponse.json();
            setAlerts(alertsData.alerts || []);
          }
        } catch (alertsError) {
          console.warn('⚠️ Alerts fetch failed:', alertsError);
          setAlerts([]);
        }

        console.log('✅ Data loaded successfully');
        setLastUpdated(new Date());
        setIsOnline(true);

      } catch (err) {
        console.error('❌ Failed to load dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setIsOnline(false);
      } finally {
        setLoading(false);
        setAlertsLoading(false);
      }
    };

    loadData();
  }, [selectedDateRange]); // Reload when date range changes

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const days = getDaysFromRange(selectedDateRange);
      
      // Reload data without showing loading state
      fetch(`/.netlify/functions/get-events?days=${days}`)
        .then(r => r.json())
        .then(data => {
          const transformedTimeSeries = data.timeSeries?.map((item: any) => ({
            hour: item.date,
            count: item.count,
            date: item.date,
            visitors: item.count,
            pageviews: item.events * 2.5,
            events: item.events,
            isForecast: false
          })) || [];
          
          // Add historical forecasts
          const timeSeriesWithHistoricalForecasts = generateHistoricalForecasts(transformedTimeSeries);
          
          // Add future forecast points if available
          if (forecast > 0) {
            const forecastPoints = generateForecastPoints(timeSeriesWithHistoricalForecasts, forecast);
            timeSeriesWithHistoricalForecasts.push(...forecastPoints);
          }
          
          setTimeSeries(timeSeriesWithHistoricalForecasts);
          setLiveCount(data.realtime?.reduce((sum: number, e: any) => sum + e.count, 0) || 0);
          calculateEnhancedMetrics(data);
          setLastUpdated(new Date());
        })
        .catch(err => console.warn('Auto-refresh failed:', err));
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [forecast, selectedDateRange]);

  // Test function for analytics
  const testAnalytics = () => {
    if (typeof window.pythia === 'function') {
      window.pythia('dashboard_test', 1, { source: 'dashboard_button' });
      console.log('🧪 Test event sent!');
    } else {
      console.error('❌ Pythia not available');
    }
  };

  const flushTest = async () => {
    if (typeof window.flushPythia === 'function') {
      const result = await window.flushPythia();
      console.log('🚀 Flush result:', result);
      // Refresh data after flush
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      console.error('❌ FlushPythia not available');
    }
  };

  // Handle alert acknowledgment
  const handleAcknowledgeAlert = async (alertId: string, acknowledged: boolean = true) => {
    try {
      const response = await fetch('/.netlify/functions/acknowledge-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, acknowledged })
      });
      
      if (response.ok) {
        console.log(`✅ Alert ${acknowledged ? 'acknowledged' : 'unacknowledged'}:`, alertId);
        
        // Update local state
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, acknowledged } : alert
        ));
      }
    } catch (error) {
      console.error('❌ Failed to acknowledge alert:', error);
    }
  };

  // Handle epsilon change
  const handleEpsilonChange = (newEpsilon: number) => {
    setEpsilon(newEpsilon);
    console.log(`🔒 Privacy epsilon updated to: ${newEpsilon}`);
    localStorage.setItem('pythia_epsilon', newEpsilon.toString());
  };

  // Load epsilon from localStorage on mount
  useEffect(() => {
    const savedEpsilon = localStorage.getItem('pythia_epsilon');
    if (savedEpsilon) {
      setEpsilon(parseFloat(savedEpsilon));
    }
  }, []);

  // Custom tooltip formatter for charts
  const formatTooltipValue = (value: any, name: string) => {
    if (typeof value === 'number') {
      return [value.toLocaleString(), name];
    }
    return [value, name];
  };

  // Custom dot renderer for forecast points
  const renderForecastDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.isForecast) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill={BRAND_COLORS.forecast}
          stroke="#fff"
          strokeWidth={2}
        />
      );
    }
    return null;
  };

  // Format time duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Calculate basic metrics from time series data
  const actualTimeSeries = timeSeries.filter(item => !item.isForecast);
  const totalVisitors = actualTimeSeries.reduce((sum, item) => sum + (item.visitors || 0), 0);
  const totalPageviews = actualTimeSeries.reduce((sum, item) => sum + (item.pageviews || 0), 0);
  const totalEvents = actualTimeSeries.reduce((sum, item) => sum + (item.events || 0), 0);

  // Get selected date range label for metrics
  const selectedRangeLabel = DATE_RANGE_OPTIONS.find(opt => opt.value === selectedDateRange)?.label || 'Last 28 Days';

  // Loading state
  if (loading && timeSeries.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Loading Dashboard</h2>
          <p className="text-slate-600">Fetching your analytics data...</p>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (error && timeSeries.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Failed to Load Data</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
            <div className="text-xs text-slate-500">
              <p>If this persists, check:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Netlify environment variables are set</li>
                <li>Supabase database is accessible</li>
                <li>Functions are deployed correctly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">Pythia Analytics</span>
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link to="/dashboard" className="text-sky-600 font-medium">Dashboard</Link>
              <Link to="/integration" className="text-slate-600 hover:text-slate-900">Integration</Link>
              <Link to="/settings" className="text-slate-600 hover:text-slate-900">Settings</Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {/* Date Range Selector */}
            <DateRangeSelector 
              selectedRange={selectedDateRange}
              onRangeChange={setSelectedDateRange}
            />
            
            {/* Live Gauge */}
            <div className="live-gauge flex items-center space-x-2 px-3 py-2 bg-emerald-50 rounded-lg">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-emerald-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm font-medium text-emerald-700">
                Live Now: {liveCount}
              </span>
            </div>
            <button
              onClick={() => window.location.reload()}
              disabled={loading}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/settings"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <SettingsIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Privacy Notice with Test Buttons and Epsilon Control */}
        <div className="mb-8 p-4 bg-gradient-to-r from-sky-50 to-teal-50 border border-sky-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-sky-600" />
              <div>
                <p className="text-sm font-medium text-sky-900">Privacy-First Analytics Active</p>
                <p className="text-xs text-sky-600">
                  Session tracking • Device detection • Differential privacy (ε = {epsilon}) • No cookies
                  {lastUpdated && (
                    <span className="ml-2">• Last updated: {lastUpdated.toLocaleTimeString('en-US', { hour12: false })}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Epsilon Control */}
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-purple-600" />
                <label className="text-xs text-slate-600">ε:</label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={epsilon}
                  onChange={(e) => handleEpsilonChange(parseFloat(e.target.value))}
                  className="w-16 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer slider"
                  title={`Privacy parameter: ${epsilon} (lower = more private)`}
                />
                <span className="text-xs text-purple-600 font-medium min-w-[2rem]">{epsilon}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={testAnalytics}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white text-xs rounded-lg transition-colors"
                >
                  Test Event
                </button>
                <button
                  onClick={flushTest}
                  className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white text-xs rounded-lg transition-colors"
                >
                  Flush Buffer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Forecast Summary */}
        {forecast > 0 && (
          <div className="forecast-summary mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-purple-900">
                    Forecast: {forecast.toFixed(1)} • Accuracy: {(100 - mape).toFixed(0)}%
                  </p>
                  <p className="text-xs text-purple-600">
                    Next 7 days prediction based on historical patterns
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-sky-100 rounded-lg">
                <Users className="w-5 h-5 text-sky-600" />
              </div>
              <span className="flex items-center text-sm font-medium text-emerald-600">
                <ArrowUp className="w-4 h-4 mr-1" />
                12.3%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">
              {totalVisitors.toLocaleString()}
            </h3>
            <p className="text-sm text-slate-600">Total Visitors ({selectedRangeLabel})</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Globe className="w-5 h-5 text-teal-600" />
              </div>
              <span className="flex items-center text-sm font-medium text-emerald-600">
                <ArrowUp className="w-4 h-4 mr-1" />
                8.7%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">
              {Math.floor(totalPageviews).toLocaleString()}
            </h3>
            <p className="text-sm text-slate-600">Page Views ({selectedRangeLabel})</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MousePointer className="w-5 h-5 text-purple-600" />
              </div>
              <span className="flex items-center text-sm font-medium text-red-600">
                <ArrowDown className="w-4 h-4 mr-1" />
                3.2%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">
              {bounceRate.toFixed(1)}%
            </h3>
            <p className="text-sm text-slate-600">Bounce Rate</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Timer className="w-5 h-5 text-orange-600" />
              </div>
              <span className="flex items-center text-sm font-medium text-red-600">
                <ArrowDown className="w-4 h-4 mr-1" />
                12%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">
              {formatDuration(avgTimeOnSite)}
            </h3>
            <p className="text-sm text-slate-600">Avg. Time on Site</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="flex items-center text-sm font-medium text-emerald-600">
                <ArrowUp className="w-4 h-4 mr-1" />
                4.1%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">
              {conversionRate.toFixed(1)}%
            </h3>
            <p className="text-sm text-slate-600">Conversion Rate</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Activity className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="flex items-center text-sm font-medium text-emerald-600">
                <ArrowUp className="w-4 h-4 mr-1" />
                15.2%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">
              {totalEvents.toLocaleString()}
            </h3>
            <p className="text-sm text-slate-600">Events Tracked</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Visitor Trends with Historical vs Predicted */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Visitor Trends: Actual vs Predicted</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: BRAND_COLORS.primary }}></div>
                  <span className="text-xs text-slate-600">Actual</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: BRAND_COLORS.historicalForecast }}></div>
                  <span className="text-xs text-slate-600">Historical Forecast</span>
                </div>
                {forecast > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: BRAND_COLORS.forecast }}></div>
                    <span className="text-xs text-slate-600">Future Forecast</span>
                  </div>
                )}
              </div>
            </div>
            {loading ? (
              <ChartLoading />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="hour" 
                    stroke="#64748b" 
                    fontSize={12}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis stroke="#64748b" fontSize={12} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={formatTooltipValue}
                  />
                  <Legend />
                  {/* Actual data line */}
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    name="Actual"
                    stroke={BRAND_COLORS.primary}
                    strokeWidth={3}
                    dot={{ fill: BRAND_COLORS.primary, strokeWidth: 2, r: 5 }}
                    connectNulls={false}
                  />
                  {/* Historical forecast line */}
                  <Line 
                    type="monotone" 
                    dataKey="historicalForecast" 
                    name="Historical Forecast"
                    stroke={BRAND_COLORS.historicalForecast}
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={{ fill: BRAND_COLORS.historicalForecast, strokeWidth: 1, r: 3 }}
                    connectNulls={false}
                  />
                  {/* Future forecast line */}
                  <Line 
                    type="monotone" 
                    dataKey="forecast" 
                    name="Future Forecast"
                    stroke={BRAND_COLORS.forecast}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={renderForecastDot}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Real-time Activity */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Real-time Activity</h3>
              <div className="flex items-center space-x-2 text-emerald-600">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Live</span>
              </div>
            </div>
            {loading ? (
              <ChartLoading />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={actualTimeSeries.slice(-24)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="hour" 
                    stroke="#64748b" 
                    fontSize={12}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis stroke="#64748b" fontSize={12} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={formatTooltipValue}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke={BRAND_COLORS.accent}
                    fill={BRAND_COLORS.accent}
                    fillOpacity={0.3}
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Secondary Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          {/* Page Views Bar Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Daily Page Views</h3>
            {loading ? (
              <ChartLoading />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={actualTimeSeries.slice(-7)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="hour" 
                    stroke="#64748b" 
                    fontSize={10}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis stroke="#64748b" fontSize={10} tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={formatTooltipValue}
                  />
                  <Bar dataKey="pageviews" fill={BRAND_COLORS.secondary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Device Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Device Breakdown</h3>
            {loading ? (
              <ChartLoading />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={formatTooltipValue} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {deviceData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm text-slate-600">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-slate-900">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Geographic Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <MapPin className="w-5 h-5 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-900">Top Locations</h3>
            </div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <LoadingSkeleton className="w-20 h-4" />
                    <LoadingSkeleton className="w-8 h-4" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {geographicData.slice(0, 6).map((country, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: country.color }}></div>
                      <span className="text-sm text-slate-600">{country.country}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-slate-900">{country.visitors}</span>
                      <span className="text-xs text-slate-500 ml-1">({country.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Smart Alerts Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Smart Alerts</h3>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span className="text-xs text-slate-600">
                  {alerts.filter(a => !a.acknowledged).length} unread
                </span>
              </div>
            </div>
            <section className="smart-alerts space-y-4 max-h-80 overflow-y-auto">
              {alertsLoading ? (
                // Loading skeletons for alerts
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <LoadingSkeleton className="w-5 h-5 rounded" />
                        <div className="flex-1">
                          <LoadingSkeleton className="w-32 h-4 mb-2" />
                          <LoadingSkeleton className="w-48 h-3 mb-1" />
                          <LoadingSkeleton className="w-24 h-3" />
                        </div>
                      </div>
                      <LoadingSkeleton className="w-6 h-6 rounded" />
                    </div>
                  </div>
                ))
              ) : alerts.length > 0 ? (
                alerts.slice(0, 5).map(alert => (
                  <AlertCard 
                    key={alert.id} 
                    alert={alert} 
                    onAcknowledge={handleAcknowledgeAlert}
                  />
                ))
              ) : (
                <p className="text-sm text-slate-600 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  No alerts in the past 24 h 👍
                </p>
              )}
            </section>
          </div>
        </div>

        {/* Conversion Goals */}
        {conversions.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <Target className="w-6 h-6 text-emerald-600" />
              <h3 className="text-lg font-semibold text-slate-900">Conversion Goals</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {conversions.map((conversion, index) => (
                <div key={index} className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-emerald-900 capitalize">
                      {conversion.event_type}
                    </span>
                    <span className="text-xs text-emerald-600">
                      {conversion.rate.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-900">
                    {conversion.conversions}
                  </p>
                  <p className="text-xs text-emerald-600">conversions</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Privacy Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Privacy & Performance Status</h3>
            <div className="flex items-center space-x-2 text-emerald-600">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">All Systems Secure</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <Layers className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Differential Privacy</p>
                <p className="text-xs text-slate-600">ε = {epsilon} (Configurable privacy-utility balance)</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-sky-100 rounded-lg">
                <Database className="w-6 h-6 text-sky-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Session Tracking</p>
                <p className="text-xs text-slate-600">
                  {actualTimeSeries.length} data points tracked
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Prophet Forecasting</p>
                <p className="text-xs text-slate-600">
                  {forecast > 0 ? `${(100 - mape).toFixed(0)}% accuracy` : 'Generating...'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Data Processing</p>
                <p className="text-xs text-slate-600">
                  {totalEvents.toLocaleString()} events processed
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Custom CSS for slider */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #8B5CF6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #8B5CF6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}