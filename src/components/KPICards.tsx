import React from 'react';
import { Users, Eye, MousePointer, Clock, TrendingUp, TrendingDown } from 'lucide-react';

interface KPIData {
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

interface KPICardsProps {
  data: KPIData;
  loading?: boolean;
}

interface KPICardProps {
  title: string;
  value: string;
  trend: number;
  icon: React.ReactNode;
  loading?: boolean;
}

function KPICard({ title, value, trend, icon, loading }: KPICardProps) {
  const isPositive = trend > 0;
  const isNegative = trend < 0;
  
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:bg-slate-700/50 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-slate-700 rounded-lg">
          {icon}
        </div>
        <div className="flex items-center space-x-1">
          {isPositive && <TrendingUp className="w-4 h-4 text-emerald-400" />}
          {isNegative && <TrendingDown className="w-4 h-4 text-red-400" />}
          <span className={`text-sm font-medium ${
            isPositive ? 'text-emerald-400' : 
            isNegative ? 'text-red-400' : 
            'text-slate-400'
          }`}>
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
        </div>
      </div>
      
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-slate-100">
          {loading ? (
            <div className="w-16 h-8 bg-slate-600 rounded animate-pulse"></div>
          ) : (
            value
          )}
        </h3>
        <p className="text-sm text-slate-400">{title}</p>
      </div>
    </div>
  );
}

export function KPICards({ data, loading = false }: KPICardsProps) {
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const kpiItems = [
    {
      title: 'Unique Visitors',
      value: data.uniqueVisitors.toLocaleString(),
      trend: data.trends.uniqueVisitors,
      icon: <Users className="w-5 h-5 text-slate-300" />
    },
    {
      title: 'Total Visits',
      value: data.totalVisits.toLocaleString(),
      trend: data.trends.totalVisits,
      icon: <Eye className="w-5 h-5 text-slate-300" />
    },
    {
      title: 'Total Pageviews',
      value: data.totalPageviews.toLocaleString(),
      trend: data.trends.totalPageviews,
      icon: <MousePointer className="w-5 h-5 text-slate-300" />
    },
    {
      title: 'Views per Visit',
      value: data.viewsPerVisit.toFixed(1),
      trend: data.trends.viewsPerVisit,
      icon: <TrendingUp className="w-5 h-5 text-slate-300" />
    },
    {
      title: 'Bounce Rate',
      value: `${data.bounceRate.toFixed(1)}%`,
      trend: -data.trends.bounceRate, // Negative trend is good for bounce rate
      icon: <TrendingDown className="w-5 h-5 text-slate-300" />
    },
    {
      title: 'Average Visit Duration',
      value: formatDuration(data.avgVisitDuration),
      trend: data.trends.avgVisitDuration,
      icon: <Clock className="w-5 h-5 text-slate-300" />
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {kpiItems.map((item, index) => (
        <KPICard
          key={index}
          title={item.title}
          value={item.value}
          trend={item.trend}
          icon={item.icon}
          loading={loading}
        />
      ))}
    </div>
  );
}