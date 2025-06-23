import React, { useState, useEffect } from 'react';
import { HeatmapRect } from '@visx/heatmap';
import { scaleLinear } from '@visx/scale';
import { withTooltip, Tooltip } from '@visx/tooltip';
import { format, parseISO } from 'date-fns';
import { Users, Calendar, TrendingUp, Loader2 } from 'lucide-react';

interface CohortData {
  cohort_day: string;
  day_offset: number;
  sessions: number;
}

interface CohortHeatmapProps {
  width?: number;
  height?: number;
  className?: string;
}

interface TooltipData {
  cohort_day: string;
  day_offset: number;
  sessions: number;
  retention_rate?: number;
}

const CohortHeatmapComponent = withTooltip<CohortHeatmapProps, TooltipData>(
  ({ width = 800, height = 400, showTooltip, hideTooltip, tooltipData, tooltipTop, tooltipLeft }) => {
    const [data, setData] = useState<CohortData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch cohort data
    useEffect(() => {
      const fetchCohortData = async () => {
        try {
          setLoading(true);
          setError(null);
          
          console.log('📊 Fetching cohort retention data...');
          
          const response = await fetch('/.netlify/functions/cohort-analysis');
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const result = await response.json();
          
          if (result.success) {
            setData(result.data || []);
            console.log('✅ Cohort data loaded:', result.data?.length, 'data points');
          } else {
            throw new Error(result.error || 'Failed to fetch cohort data');
          }
        } catch (err) {
          console.error('❌ Failed to fetch cohort data:', err);
          setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
          setLoading(false);
        }
      };

      fetchCohortData();
    }, []);

    // Process data for heatmap
    const processedData = React.useMemo(() => {
      if (!data.length) return { heatmapData: [], cohorts: [], maxSessions: 0 };

      // Get unique cohort days and sort them
      const cohorts = [...new Set(data.map(d => d.cohort_day))].sort();
      
      // Calculate cohort sizes (day 0 sessions)
      const cohortSizes: Record<string, number> = {};
      data.forEach(d => {
        if (d.day_offset === 0) {
          cohortSizes[d.cohort_day] = d.sessions;
        }
      });

      // Create heatmap data structure
      const heatmapData = cohorts.map(cohort => {
        const cohortSize = cohortSizes[cohort] || 1;
        const cohortData: Array<{ 
          day_offset: number; 
          sessions: number; 
          retention_rate: number;
          cohort_day: string;
        }> = [];

        // Fill in data for days 0-30
        for (let day = 0; day <= 30; day++) {
          const dataPoint = data.find(d => d.cohort_day === cohort && d.day_offset === day);
          const sessions = dataPoint?.sessions || 0;
          const retention_rate = cohortSize > 0 ? (sessions / cohortSize) * 100 : 0;
          
          cohortData.push({
            day_offset: day,
            sessions,
            retention_rate,
            cohort_day: cohort
          });
        }

        return {
          cohort_day: cohort,
          data: cohortData
        };
      });

      const maxSessions = Math.max(...data.map(d => d.sessions));

      return { heatmapData, cohorts, maxSessions };
    }, [data]);

    // Color scale for retention rates
    const colorScale = scaleLinear<string>({
      range: ['#f8fafc', '#1e40af'], // slate-50 to blue-700
      domain: [0, 100],
    });

    // Dimensions
    const margin = { top: 60, right: 40, bottom: 60, left: 120 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const cellWidth = innerWidth / 31; // 31 days (0-30)
    const cellHeight = processedData.cohorts.length > 0 ? innerHeight / processedData.cohorts.length : 20;

    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-sky-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-slate-500">Loading cohort data...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600 mb-2">Failed to load cohort data</p>
            <p className="text-xs text-slate-500">{error}</p>
          </div>
        </div>
      );
    }

    if (!data.length) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No cohort data available</p>
            <p className="text-xs text-slate-400">Start tracking pageviews to see retention analysis</p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        <svg width={width} height={height}>
          {/* Background */}
          <rect width={width} height={height} fill="#ffffff" />
          
          {/* Title */}
          <text
            x={width / 2}
            y={30}
            textAnchor="middle"
            fontSize={16}
            fontWeight="600"
            fill="#1e293b"
          >
            Cohort Retention Analysis
          </text>
          
          {/* Subtitle */}
          <text
            x={width / 2}
            y={50}
            textAnchor="middle"
            fontSize={12}
            fill="#64748b"
          >
            Retention rates by cohort day and days since first visit
          </text>

          {/* Y-axis labels (Cohort Days) */}
          {processedData.cohorts.map((cohort, i) => (
            <text
              key={cohort}
              x={margin.left - 10}
              y={margin.top + i * cellHeight + cellHeight / 2}
              textAnchor="end"
              fontSize={10}
              fill="#64748b"
              dominantBaseline="middle"
            >
              {format(parseISO(cohort), 'MMM dd')}
            </text>
          ))}

          {/* X-axis labels (Day Offset) */}
          {[0, 1, 7, 14, 21, 30].map(day => (
            <text
              key={day}
              x={margin.left + day * cellWidth + cellWidth / 2}
              y={height - 20}
              textAnchor="middle"
              fontSize={10}
              fill="#64748b"
            >
              {day === 0 ? 'Day 0' : `+${day}`}
            </text>
          ))}

          {/* Heatmap */}
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            <HeatmapRect
              data={processedData.heatmapData}
              xAccessor={(d: any) => d.day_offset}
              yAccessor={(d: any, i: number) => i}
              colorAccessor={(d: any) => d.retention_rate}
              opacityAccessor={() => 1}
              binWidth={cellWidth}
              binHeight={cellHeight}
              gap={1}
            >
              {(heatmap) =>
                heatmap.map((heatmapBins) =>
                  heatmapBins.map((bin) => (
                    <rect
                      key={`heatmap-rect-${bin.row}-${bin.column}`}
                      className="cursor-pointer transition-opacity hover:opacity-80"
                      width={bin.width}
                      height={bin.height}
                      x={bin.x}
                      y={bin.y}
                      fill={colorScale(bin.datum.retention_rate)}
                      stroke="#ffffff"
                      strokeWidth={1}
                      onMouseEnter={(event) => {
                        showTooltip({
                          tooltipData: bin.datum,
                          tooltipTop: event.clientY,
                          tooltipLeft: event.clientX,
                        });
                      }}
                      onMouseLeave={hideTooltip}
                    />
                  ))
                )
              }
            </HeatmapRect>
          </g>

          {/* Legend */}
          <g transform={`translate(${width - 150}, ${margin.top})`}>
            <text x={0} y={-10} fontSize={12} fontWeight="500" fill="#1e293b">
              Retention Rate
            </text>
            {[0, 25, 50, 75, 100].map((value, i) => (
              <g key={value} transform={`translate(0, ${i * 20})`}>
                <rect
                  width={15}
                  height={15}
                  fill={colorScale(value)}
                  stroke="#e2e8f0"
                  strokeWidth={1}
                />
                <text x={20} y={12} fontSize={10} fill="#64748b">
                  {value}%
                </text>
              </g>
            ))}
          </g>
        </svg>

        {/* Tooltip */}
        {tooltipData && (
          <Tooltip
            top={tooltipTop}
            left={tooltipLeft}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              pointerEvents: 'none',
            }}
          >
            <div>
              <strong>Cohort:</strong> {format(parseISO(tooltipData.cohort_day), 'MMM dd, yyyy')}
            </div>
            <div>
              <strong>Day:</strong> +{tooltipData.day_offset}
            </div>
            <div>
              <strong>Sessions:</strong> {tooltipData.sessions.toLocaleString()}
            </div>
            <div>
              <strong>Retention:</strong> {tooltipData.retention_rate?.toFixed(1)}%
            </div>
          </Tooltip>
        )}
      </div>
    );
  }
);

export function CohortHeatmap({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Cohort Retention Analysis</h3>
            <p className="text-sm text-slate-600">
              User retention patterns by first visit date
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-purple-600">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-medium">30-Day Window</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <CohortHeatmapComponent width={900} height={500} />
      </div>

      <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="text-sm text-purple-800">
          <p className="font-medium mb-1">How to read this chart:</p>
          <ul className="text-xs space-y-1 list-disc list-inside">
            <li>Each row represents a cohort (users who first visited on the same day)</li>
            <li>Each column represents days since their first visit (0 = first day, +7 = one week later)</li>
            <li>Color intensity shows retention rate - darker blue means higher retention</li>
            <li>Hover over cells to see detailed retention metrics</li>
          </ul>
        </div>
      </div>
    </div>
  );
}