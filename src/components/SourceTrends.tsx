import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, ExternalLink } from 'lucide-react';
import Spinner from './Spinner';

interface SourceData {
  source: string;
  medium: string;
  campaign: string;
  visitors: number;
  pageviews: number;
  percentage: string;
  sourceObject: any;
}

interface SourceTrendsProps {
  className?: string;
}

export default function SourceTrends({ className = '' }: SourceTrendsProps) {
  const [data, setData] = useState<SourceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSourceData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('📊 Fetching source trends data...');
        
        const response = await fetch('/.netlify/functions/source-trends');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        console.log('✅ Source trends data loaded:', result.data?.length || 0, 'sources');
        setData(result.data || []);
        
      } catch (err) {
        console.error('❌ Failed to fetch source trends:', err);
        setError(err instanceof Error ? err.message : 'Failed to load source trends');
      } finally {
        setLoading(false);
      }
    };

    fetchSourceData();
  }, []);

  // Transform data for chart
  const chartData = data.map(item => ({
    name: item.source === 'direct' ? 'Direct' : item.source,
    visitors: item.visitors,
    percentage: parseFloat(item.percentage)
  }));

  const totalVisitors = data.reduce((sum, item) => sum + item.visitors, 0);

  if (loading) {
    return (
      <div className={`bg-slate-800 rounded-xl border border-slate-700 p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-teal-900/50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-teal-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-100">Top Traffic Sources</h3>
        </div>
        <div className="flex items-center justify-center h-[300px]">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-slate-800 rounded-xl border border-slate-700 p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-teal-900/50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-teal-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-100">Top Traffic Sources</h3>
        </div>
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-center">
            <p className="text-red-400 mb-2">Failed to load source data</p>
            <p className="text-sm text-slate-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800 rounded-xl border border-slate-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-teal-900/50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Top Traffic Sources</h3>
            <p className="text-sm text-slate-400">Last 7 days • {totalVisitors.toLocaleString()} total visitors</p>
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-slate-500" />
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="mb-6">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="name" 
                stroke="#9ca3af" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
                formatter={(value: any, name: string) => [
                  `${value.toLocaleString()} visitors`,
                  'Visitors'
                ]}
              />
              <Bar dataKey="visitors" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[200px] bg-slate-700/50 rounded-lg mb-6">
          <div className="text-center">
            <TrendingUp className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-slate-400">No source data available</p>
            <p className="text-sm text-slate-500">UTM parameters will appear here</p>
          </div>
        </div>
      )}

      {/* Source List */}
      <div className="space-y-3">
        {data.slice(0, 5).map((source, index) => (
          <div key={`${source.source}-${source.medium}-${index}`} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                {index + 1}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-100">
                  {source.source === 'direct' ? 'Direct Traffic' : source.source}
                </p>
                <p className="text-xs text-slate-400">
                  {source.medium !== 'none' && `${source.medium}`}
                  {source.campaign !== 'none' && ` • ${source.campaign}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-100">{source.visitors.toLocaleString()}</p>
              <p className="text-xs text-slate-400">{source.percentage}%</p>
            </div>
          </div>
        ))}
      </div>

      {data.length === 0 && !loading && (
        <div className="text-center py-8">
          <TrendingUp className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400">No traffic sources found</p>
          <p className="text-sm text-slate-500">Add UTM parameters to track sources</p>
        </div>
      )}
    </div>
  );
}