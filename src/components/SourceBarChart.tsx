import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { ExternalLink, Loader2 } from 'lucide-react';
import { format, subDays } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SourceData {
  source: string;
  visitors: number;
}

interface SourceBarChartProps {
  className?: string;
  dateRange?: number;
}

export function SourceBarChart({ className = "", dateRange = 30 }: SourceBarChartProps) {
  const [data, setData] = useState<SourceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSourceData = async () => {
      try {
        setLoading(true);
        setError(null);

        const fromDate = format(subDays(new Date(), dateRange), 'yyyy-MM-dd');
        const toDate = format(new Date(), 'yyyy-MM-dd');
        
        console.log('📊 Fetching source trends data...');
        
        const response = await fetch(`/.netlify/functions/source-trends?from=${fromDate}&to=${toDate}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          // Process and limit to top 10 sources
          const processedData = processSourceData(result.topSources || []);
          setData(processedData);
          console.log('✅ Source data loaded:', processedData.length, 'sources');
        } else {
          throw new Error(result.error || 'Failed to fetch source data');
        }
      } catch (err) {
        console.error('❌ Failed to fetch source data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchSourceData();
  }, [dateRange]);

  const processSourceData = (sources: any[]): SourceData[] => {
    // Sort by visitors and take top 10
    const sortedSources = sources
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 10);

    // Calculate "Other" category if there are more than 10 sources
    const topSources = sortedSources.slice(0, 9);
    const otherSources = sortedSources.slice(9);
    
    const result = topSources.map(source => ({
      source: source.source || 'Direct',
      visitors: source.visitors || 0
    }));

    // Add "Other" category if needed
    if (otherSources.length > 0) {
      const otherVisitors = otherSources.reduce((sum, source) => sum + (source.visitors || 0), 0);
      if (otherVisitors > 0) {
        result.push({
          source: 'Other',
          visitors: otherVisitors
        });
      }
    }

    return result;
  };

  const chartData = {
    labels: data.map(item => item.source),
    datasets: [
      {
        label: 'Visitors',
        data: data.map(item => item.visitors),
        backgroundColor: [
          '#0ea5e9', // sky-500
          '#14b8a6', // teal-500
          '#8b5cf6', // violet-500
          '#f59e0b', // amber-500
          '#ef4444', // red-500
          '#10b981', // emerald-500
          '#3b82f6', // blue-500
          '#f97316', // orange-500
          '#ec4899', // pink-500
          '#6b7280', // gray-500 for "Other"
        ],
        borderColor: '#1e293b',
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: '#475569',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => {
            const value = context.parsed.x;
            const total = data.reduce((sum, item) => sum + item.visitors, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${value.toLocaleString()} visitors (${percentage}%)`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: '#374151',
          drawBorder: false,
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 11,
          },
          callback: (value: any) => {
            return value.toLocaleString();
          },
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 11,
          },
          maxRotation: 0,
        },
      },
    },
    elements: {
      bar: {
        borderRadius: 4,
      },
    },
  };

  if (loading) {
    return (
      <div className={`bg-slate-800 rounded-xl border border-slate-700 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-slate-700 rounded-lg">
              <ExternalLink className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Traffic Sources</h3>
              <p className="text-sm text-slate-400">Top referral sources</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-2" />
            <p className="text-sm text-slate-500">Loading source data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-slate-800 rounded-xl border border-slate-700 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-slate-700 rounded-lg">
              <ExternalLink className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Traffic Sources</h3>
              <p className="text-sm text-slate-400">Top referral sources</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ExternalLink className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-400 mb-2">Failed to load source data</p>
            <p className="text-xs text-slate-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={`bg-slate-800 rounded-xl border border-slate-700 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-slate-700 rounded-lg">
              <ExternalLink className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Traffic Sources</h3>
              <p className="text-sm text-slate-400">Top referral sources</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ExternalLink className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No source data available</p>
            <p className="text-xs text-slate-400">Start tracking pageviews with UTM parameters</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800 rounded-xl border border-slate-700 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-slate-700 rounded-lg">
            <ExternalLink className="w-5 h-5 text-slate-300" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Traffic Sources</h3>
            <p className="text-sm text-slate-400">
              Top {data.length} referral sources ({dateRange} days)
            </p>
          </div>
        </div>
        <div className="text-sm text-slate-400">
          Total: {data.reduce((sum, item) => sum + item.visitors, 0).toLocaleString()} visitors
        </div>
      </div>

      <div className="h-64">
        <Bar data={chartData} options={chartOptions} />
      </div>

      <div className="mt-4 p-3 bg-slate-700/50 border border-slate-600 rounded-lg">
        <div className="text-sm text-slate-300">
          <p className="font-medium mb-1">Source Attribution:</p>
          <ul className="text-xs space-y-1 list-disc list-inside text-slate-400">
            <li>Direct traffic includes visitors without referrer information</li>
            <li>Sources are determined from UTM parameters and referrer headers</li>
            <li>Data excludes bot traffic and includes privacy noise (ε-differential privacy)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}