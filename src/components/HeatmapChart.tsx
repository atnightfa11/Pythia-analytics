import React from 'react';

interface HeatmapData {
  cohort: string;
  cohortIndex: number;
  dayOffset: number;
  sessions: number;
  retentionRate: number;
  day0Sessions: number;
}

interface HeatmapChartProps {
  data: HeatmapData[];
}

export default function HeatmapChart({ data }: HeatmapChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-slate-700/50 rounded-lg">
        <p className="text-slate-400">No data to display</p>
      </div>
    );
  }

  // Get unique cohorts and day offsets
  const cohorts = Array.from(new Set(data.map(d => d.cohort))).sort();
  const maxDayOffset = Math.max(...data.map(d => d.dayOffset));
  const dayOffsets = Array.from({ length: Math.min(maxDayOffset + 1, 31) }, (_, i) => i);

  // Create a lookup map for quick access
  const dataMap = new Map<string, HeatmapData>();
  data.forEach(d => {
    dataMap.set(`${d.cohort}-${d.dayOffset}`, d);
  });

  // Calculate color intensity based on retention rate
  const getColor = (retentionRate: number) => {
    if (retentionRate === 0) return 'bg-slate-700';
    
    const intensity = Math.min(retentionRate / 100, 1);
    const opacity = Math.max(0.1, intensity);
    
    // Use purple color scale
    if (intensity < 0.2) return 'bg-purple-900/20';
    if (intensity < 0.4) return 'bg-purple-800/40';
    if (intensity < 0.6) return 'bg-purple-700/60';
    if (intensity < 0.8) return 'bg-purple-600/80';
    return 'bg-purple-500';
  };

  const cellSize = Math.max(16, Math.min(24, 600 / Math.max(cohorts.length, dayOffsets.length)));

  return (
    <div className="overflow-auto">
      <div className="min-w-max">
        {/* Header with day offsets */}
        <div className="flex mb-1">
          <div className="w-20 flex-shrink-0"></div> {/* Space for cohort labels */}
          {dayOffsets.map(dayOffset => (
            <div
              key={dayOffset}
              className="text-xs text-slate-400 text-center flex-shrink-0"
              style={{ width: cellSize, minWidth: cellSize }}
            >
              {dayOffset === 0 ? 'D0' : dayOffset % 7 === 0 ? `W${dayOffset / 7}` : dayOffset}
            </div>
          ))}
        </div>

        {/* Heatmap rows */}
        {cohorts.slice(0, 20).map((cohort, cohortIndex) => (
          <div key={cohort} className="flex mb-1">
            {/* Cohort label */}
            <div className="w-20 flex-shrink-0 text-xs text-slate-400 pr-2 flex items-center">
              {new Date(cohort).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            
            {/* Heatmap cells */}
            {dayOffsets.map(dayOffset => {
              const cellData = dataMap.get(`${cohort}-${dayOffset}`);
              const retentionRate = cellData?.retentionRate || 0;
              const sessions = cellData?.sessions || 0;
              
              return (
                <div
                  key={`${cohort}-${dayOffset}`}
                  className={`flex-shrink-0 border border-slate-600 ${getColor(retentionRate)} hover:border-slate-400 transition-colors cursor-pointer`}
                  style={{ 
                    width: cellSize, 
                    height: cellSize, 
                    minWidth: cellSize 
                  }}
                  title={`${cohort} Day ${dayOffset}: ${retentionRate}% retention (${sessions} sessions)`}
                >
                  {sessions > 0 && cellSize >= 20 && (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs text-white font-medium">
                        {retentionRate >= 10 ? Math.round(retentionRate) : ''}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}