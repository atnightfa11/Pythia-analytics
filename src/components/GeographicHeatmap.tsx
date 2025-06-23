import React, { useEffect, useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { Globe, MapPin } from 'lucide-react';
import Spinner from './Spinner';

interface GeoData {
  country: string;
  visitors: number;
  percentage: number;
}

interface GeographicHeatmapProps {
  className?: string;
}

// World map topology URL (using a CDN)
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function GeographicHeatmap({ className = '' }: GeographicHeatmapProps) {
  const [data, setData] = useState<GeoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🌍 Fetching geographic data...');
        
        const response = await fetch('/.netlify/functions/geo-trends');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        console.log('✅ Geographic data loaded:', result.data?.length || 0, 'countries');
        setData(result.data || []);
        
      } catch (err) {
        console.error('❌ Failed to fetch geographic data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load geographic data');
      } finally {
        setLoading(false);
      }
    };

    fetchGeoData();
  }, []);

  // Create a lookup map for country data
  const countryDataMap = new Map<string, GeoData>();
  data.forEach(item => {
    countryDataMap.set(item.country, item);
  });

  // Get color based on visitor count
  const getCountryColor = (countryCode: string) => {
    const countryData = countryDataMap.get(countryCode);
    if (!countryData || countryData.visitors === 0) {
      return '#374151'; // slate-700
    }

    const maxVisitors = Math.max(...data.map(d => d.visitors));
    const intensity = countryData.visitors / maxVisitors;

    // Teal color scale
    if (intensity < 0.1) return '#134e4a'; // teal-900
    if (intensity < 0.3) return '#0f766e'; // teal-700
    if (intensity < 0.5) return '#0d9488'; // teal-600
    if (intensity < 0.7) return '#14b8a6'; // teal-500
    if (intensity < 0.9) return '#2dd4bf'; // teal-400
    return '#5eead4'; // teal-300
  };

  const totalVisitors = data.reduce((sum, item) => sum + item.visitors, 0);
  const topCountries = data.slice(0, 5);

  if (loading) {
    return (
      <div className={`bg-slate-800 rounded-xl border border-slate-700 p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-teal-900/50 rounded-lg">
            <Globe className="w-5 h-5 text-teal-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-100">Geographic Distribution</h3>
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
          <div className="p-2 bg-teal-900/50 rounded-lg">
            <Globe className="w-5 h-5 text-teal-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-100">Geographic Distribution</h3>
        </div>
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <p className="text-red-400 mb-2">Failed to load geographic data</p>
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
            <Globe className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Geographic Distribution</h3>
            <p className="text-sm text-slate-400">{totalVisitors.toLocaleString()} visitors from {data.length} countries</p>
          </div>
        </div>
        <MapPin className="w-4 h-4 text-slate-500" />
      </div>

      {/* World Map */}
      {data.length > 0 ? (
        <div className="mb-6">
          <div className="bg-slate-900 rounded-lg p-4 overflow-hidden">
            <ComposableMap
              projectionConfig={{
                scale: 120,
                center: [0, 20]
              }}
              style={{ width: '100%', height: '300px' }}
            >
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const countryCode = geo.id;
                    const countryData = countryDataMap.get(countryCode);
                    
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={getCountryColor(countryCode)}
                        stroke="#1e293b"
                        strokeWidth={0.5}
                        style={{
                          default: { outline: 'none' },
                          hover: { 
                            fill: '#06b6d4', 
                            outline: 'none',
                            cursor: 'pointer'
                          },
                          pressed: { outline: 'none' }
                        }}
                        title={countryData ? 
                          `${geo.properties.NAME}: ${countryData.visitors.toLocaleString()} visitors (${countryData.percentage.toFixed(1)}%)` :
                          geo.properties.NAME
                        }
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[300px] bg-slate-700/50 rounded-lg mb-6">
          <div className="text-center">
            <Globe className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-slate-400">No geographic data available</p>
            <p className="text-sm text-slate-500">Country data will appear here</p>
          </div>
        </div>
      )}

      {/* Top Countries List */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-300 mb-3">Top Countries</h4>
        {topCountries.map((country, index) => (
          <div key={country.country} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                {index + 1}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-100">{country.country}</p>
                <p className="text-xs text-slate-400">{country.percentage.toFixed(1)}% of traffic</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-100">{country.visitors.toLocaleString()}</p>
              <p className="text-xs text-slate-400">visitors</p>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-slate-700 rounded"></div>
            <span>No data</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-teal-400 rounded"></div>
            <span>High traffic</span>
          </div>
        </div>
        <p>Click countries for details</p>
      </div>

      {data.length === 0 && !loading && (
        <div className="text-center py-8">
          <Globe className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400">No geographic data found</p>
          <p className="text-sm text-slate-500">Country information will appear here</p>
        </div>
      )}
    </div>
  );
}