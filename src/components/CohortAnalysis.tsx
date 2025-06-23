import React, { Suspense, useEffect, useState } from 'react';
import { Users, Calendar, TrendingUp } from 'lucide-react';
import Spinner from './Spinner';
import ErrorBoundary from './ErrorBoundary';

// Lazy load the heatmap component
const HeatmapChart = React.lazy(() => import('./HeatmapChart'));

interface CohortData {
  cohort_day: string;
  day_offset: number;
  sessions: number;
}

interface CohortAnalysisProps {
  className?: string;
}

export default function CohortAnalysis({ className = '' }: CohortAnalysisProps) {
  const [data, setData] = useState<CohortData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCohortData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('📊 Fetching cohort analysis data...');
        
        const response = await fetch('/.netlify/functions/cohort-analysis');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        console.log('✅ Cohort data loaded:', result.data?.length || 0, 'data points');
        setData(result.data || []);
        
      } catch (err) {
        console.error('❌ Failed to fetch cohort data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load cohort data');
      } finally {
        setLoading(false);
      }
    };

    fetchCohortData();
  }, []);

  // Transform data for heatmap visualization
  const transformDataForHeatmap = (cohortData: CohortData[]) => {
    if (!cohortData.length) return [];

    // Group by cohort day
    const cohortGroups: Record<string, Record<number, number>> = {};
    
    cohortData.forEach(item => {
      if (!cohortGroups[item.cohort_day]) {
        cohortGroups[item.cohort_day] = {};
      }
      cohortGroups[item.cohort_day][item.day_offset] = item.sessions;
    });

    // Convert to heatmap format
    const heatmapData = [];
    const cohortDays = Object.keys(cohortGroups).sort();
    
    cohortDays.forEach((cohortDay, cohortIndex) => {
      const cohortData = cohortGroups[cohortDay];
      
      for (let dayOffset = 0; dayOffset <= 30; dayOffset++) {
        const sessions = cohortData[dayOffset] || 0;
        const day0Sessions = cohortData[0] || 1; // Avoid division by zero
        const retentionRate = day0Sessions > 0 ? (sessions / day0Sessions) * 100 : 0;
        
        heatmapData.push({
          cohort: cohortDay,
          cohortIndex,
          dayOffset,
          sessions,
          retentionRate: Math.round(retentionRate * 10) / 10, // Round to 1 decimal
          day0Sessions
        });
      }
    });

    return heatmapData;
  };

  const heatmapData = transformDataForHeatmap(data);
  const totalCohorts = new Set(data.map(d => d.cohort_day)).size;
  const totalSessions = data.reduce((sum, d) => sum + d.sessions, 0);

  if (loading) {
    return (
      <div className={`bg-slate-800 rounded-xl border border-slate-700 p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-900/50 rounded-lg">
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-100">30-Day Retention Cohorts</h3>
        </div>
        <div className="flex items-center justify-center h-[400px]">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-slate-800 rounded-xl border border-slate-700 p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-900/50 rounded-lg">
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-100">30-Day Retention Cohorts</h3>
        </div>
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <p className="text-red-400 mb-2">Failed to load cohort data</p>
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
          <div className="p-2 bg-purple-900/50 rounded-lg">
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">30-Day Retention Cohorts</h3>
            <p className="text-sm text-slate-400">User retention by signup date</p>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-sm text-slate-400">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{totalCohorts} cohorts</span>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-4 h-4" />
            <span>{totalSessions.toLocaleString()} sessions</span>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="relative">
        {heatmapData.length > 0 ? (
          <ErrorBoundary fallback={
            <div className="flex items-center justify-center h-[400px] bg-slate-700/50 rounded-lg">
              <p className="text-slate-400">Heatmap visualization unavailable</p>
            </div>
          }>
            <Suspense fallback={<Spinner size="lg" className="h-[400px]" />}>
              <HeatmapChart data={heatmapData} />
            </Suspense>
          </ErrorBoundary>
        ) : (
          <div className="flex items-center justify-center h-[400px] bg-slate-700/50 rounded-lg">
            <div className="text-center">
              <Users className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-400">No cohort data available</p>
              <p className="text-sm text-slate-500">Start tracking users to see retention patterns</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-slate-600 rounded"></div>
            <span>0% retention</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-400 rounded"></div>
            <span>100% retention</span>
          </div>
        </div>
        <p>Each cell shows retention rate for cohort day vs. days since signup</p>
      </div>
    </div>
  );
}