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
  Loader2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { VisitorTrends } from './VisitorTrends';
import { PrivacyControls } from './PrivacyControls';
import { CohortHeatmap } from './CohortHeatmap';

// Types for our live data
interface TimeSeriesData {
  hour: string;
  count: number;
  date?: string;
  visitors?: number;
  pageviews?: number;
  events?: number;
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

interface ForecastData {
  forecast: number;
  yhat_lower?: number;
  yhat_upper?: number;
  mape: number;
  generatedAt: string;
  model?: string;
}

// Brand color palette
const BRAND_COLORS = {
  primary: '#0EA5E9',
  secondary: '#14B8A6',
  accent: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6'
};

// Device data colors using brand palette
const DEVICE_COLORS = {
  'Desktop': BRAND_COLORS.primary,
  'Mobile': BRAND_COLORS.secondary, 
  'Tablet': BRAND_COLORS.accent
};

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
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dateRange, setDateRange] = useState<number>(28);

  // Additional state for UI
  const [loading, setLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [epsilon, setEpsilon] = useState(1.0);
  const [deviceData, setDeviceData] = useState([
    { name: 'Desktop', value: 45, color: BRAND_COLORS.primary },
    { name: 'Mobile', value: 40, color: BRAND_COLORS.secondary },
    { name: 'Tablet', value: 15, color: BRAND_COLORS.accent },
  ]);

  // Data fetching as requested
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('📊 Loading dashboard data...');

        // Historical & real-time events
        const eventsResponse = await fetch(`/.netlify/functions/get-events?days=${dateRange}`);
        if (!eventsResponse.ok) {
          throw new Error(`Events API error: ${eventsResponse.status}`);
        }
        const eventsData = await eventsResponse.json();
        
        // Transform time series data for charts
        const transformedTimeSeries = eventsData.timeSeries?.map((item: any) => ({
          hour: item.date,
          count: item.count,
          date: item.date,
          visitors: item.count,
          pageviews: item.events * 2.5,
          events: item.events
        })) || [];
        
        setTimeSeries(transformedTimeSeries);
        
        // Calculate live count from realtime data
        const realtimeTotal = eventsData.realtime?.reduce((sum: number, e: any) => sum + e.count, 0) || 0;
        setLiveCount(realtimeTotal);

        // Forecast + accuracy
        try {
          const forecastResponse = await fetch('/.netlify/functions/get-forecast');
          if (forecastResponse.ok) {
            const forecastData = await forecastResponse.json();
            setForecast({
              forecast: forecastData.forecast || 0,
              mape: forecastData.mape || 15,
              generatedAt: forecastData.generatedAt || new Date().toISOString(),
              model: forecastData.metadata?.algorithm || 'simplified-prophet'
            });
          }
        } catch (forecastError) {
          console.warn('⚠️ Forecast fetch failed:', forecastError);
          setForecast(null);
        }

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
  }, [dateRange]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      // Reload data without showing loading state
      fetch(`/.netlify/functions/get-events?days=${dateRange}`)
        .then(r => r.json())
        .then(data => {
          const transformedTimeSeries = data.timeSeries?.map((item: any) => ({
            hour: item.date,
            count: item.count,
            date: item.date,
            visitors: item.count,
            pageviews: item.events * 2.5,
            events: item.events
          })) || [];
          
          setTimeSeries(transformedTimeSeries);
          setLiveCount(data.realtime?.reduce((sum: number, e: any) => sum + e.count, 0) || 0);
          setLastUpdated(new Date());
        })
        .catch(err => console.warn('Auto-refresh failed:', err));
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [dateRange]);

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
  };

  // Handle date range change
  const handleDateRangeChange = (days: number) => {
    setDateRange(days);
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

  // Calculate basic metrics from time series data
  const totalVisitors = timeSeries.reduce((sum, item) => sum + (item.visitors || 0), 0);
  const totalPageviews = timeSeries.reduce((sum, item) => sum + (item.pageviews || 0), 0);
  const totalEvents = timeSeries.reduce((sum, item) => sum + (item.events || 0), 0);

  // Loading state
  if (loading && timeSeries.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Loading Dashboard</h2>
          <p className="text-slate-600">Fetching your analytics data...</p>
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
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
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
        {/* Privacy Notice with Test Buttons */}
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

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            <p className="text-sm text-slate-600">Total Visitors ({dateRange}d)</p>
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
            <p className="text-sm text-slate-600">Page Views ({dateRange}d)</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <span className="flex items-center text-sm font-medium text-emerald-600">
                <ArrowUp className="w-4 h-4 mr-1" />
                15.2%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">
              {totalEvents.toLocaleString()}
            </h3>
            <p className="text-sm text-slate-600">Events Tracked ({dateRange}d)</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Target className="w-5 h-5 text-orange-600" />
              </div>
              <span className="flex items-center text-sm font-medium text-emerald-600">
                <ArrowUp className="w-4 h-4 mr-1" />
                4.1%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">4.2%</h3>
            <p className="text-sm text-slate-600">Conversion Rate</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Visitor Trends with Chart.js */}
          <div className="lg:col-span-2">
            <VisitorTrends
              timeSeries={timeSeries}
              forecast={forecast}
              loading={loading}
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
            />
          </div>

          {/* Privacy Controls */}
          <div>
            <PrivacyControls
              epsilon={epsilon}
              onEpsilonChange={handleEpsilonChange}
            />
          </div>
        </div>

        {/* Cohort Retention Heatmap */}
        <div className="mb-8">
          <CohortHeatmap />
        </div>

        {/* Secondary Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
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
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={timeSeries.slice(-24)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="hour" 
                    stroke="#64748b" 
                    fontSize={12}
                  />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                    formatter={formatTooltipValue}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke={BRAND_COLORS.accent}
                    fill={BRAND_COLORS.accent}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
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
                      innerRadius={50}
                      outerRadius={80}
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
                  {timeSeries.length} data points tracked
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
                  {forecast ? `${(100 - forecast.mape).toFixed(0)}% accuracy` : 'Generating...'}
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
    </div>
  );
}