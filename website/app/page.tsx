'use client';

import { useEffect, useState } from 'react';

interface SensorData {
  id: number;
  temperature: number;
  humidity: number;
  pressure: number;
  gasResistance: number;
  timestamp: string;
  createdAt: string;
}

type TimeFrame = '1h' | '6h' | '24h' | '7d' | '30d';

export default function Home() {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [filteredData, setFilteredData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('24h');
  const [selectedMetric, setSelectedMetric] = useState<'temperature' | 'humidity' | 'pressure' | 'gasResistance'>('temperature');

  const fetchSensorData = async () => {
    try {
      const response = await fetch('/api/sensor-data');
      if (!response.ok) {
        throw new Error('Failed to fetch sensor data');
      }
      const result = await response.json();
      setSensorData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filterDataByTimeFrame = (data: SensorData[], timeFrame: TimeFrame) => {
    const now = new Date();
    const cutoffTime = new Date();
    
    switch (timeFrame) {
      case '1h':
        cutoffTime.setHours(now.getHours() - 1);
        break;
      case '6h':
        cutoffTime.setHours(now.getHours() - 6);
        break;
      case '24h':
        cutoffTime.setDate(now.getDate() - 1);
        break;
      case '7d':
        cutoffTime.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffTime.setDate(now.getDate() - 30);
        break;
    }

    return data.filter(item => new Date(item.timestamp) >= cutoffTime);
  };

  useEffect(() => {
    fetchSensorData();
    const interval = setInterval(fetchSensorData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const filtered = filterDataByTimeFrame(sensorData, timeFrame);
    setFilteredData(filtered);
  }, [sensorData, timeFrame]);

  const getMetricValue = (data: SensorData, metric: string) => {
    switch (metric) {
      case 'temperature':
        return data.temperature * (9/5) + 32;
      case 'humidity':
        return data.humidity;
      case 'pressure':
        return data.pressure;
      case 'gasResistance':
        return data.gasResistance;
      default:
        return 0;
    }
  };

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'temperature':
        return 'text-red-600';
      case 'humidity':
        return 'text-blue-600';
      case 'pressure':
        return 'text-purple-600';
      case 'gasResistance':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading sensor data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">⚠️ Error</div>
          <div className="text-gray-600">{error}</div>
          <button
            onClick={fetchSensorData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const latestData = sensorData[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900 text-center">
            🌡️ Attic Weather Station
          </h1>
          <div className="text-sm text-gray-500 text-center mt-1">
            {latestData ? `Last updated: ${new Date(latestData.timestamp).toLocaleTimeString()}` : 'No data'}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* Current Readings */}
        {latestData && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">Temperature</div>
              <div className="text-2xl font-bold text-red-600">
                {(latestData.temperature * (9/5) + 32).toFixed(1)}°F
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">Humidity</div>
              <div className="text-2xl font-bold text-blue-600">
                {latestData.humidity.toFixed(1)}%
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">Pressure</div>
              <div className="text-2xl font-bold text-purple-600">
                {latestData.pressure.toFixed(1)} hPa
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="text-sm text-gray-500 mb-1">Gas Resistance</div>
              <div className="text-2xl font-bold text-green-600">
                {latestData.gasResistance.toFixed(1)} KΩ
              </div>
            </div>
          </div>
        )}

        {/* Time Frame Selector */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="text-sm font-medium text-gray-700 mb-3">Time Frame</div>
          <div className="grid grid-cols-5 gap-2">
            {(['1h', '6h', '24h', '7d', '30d'] as TimeFrame[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeFrame(tf)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  timeFrame === tf
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Selector */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="text-sm font-medium text-gray-700 mb-3">Chart Metric</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'temperature', label: 'Temperature', color: 'bg-red-600' },
              { key: 'humidity', label: 'Humidity', color: 'bg-blue-600' },
              { key: 'pressure', label: 'Pressure', color: 'bg-purple-600' },
              { key: 'gasResistance', label: 'Gas Resistance', color: 'bg-green-600' }
            ].map((metric) => (
              <button
                key={metric.key}
                onClick={() => setSelectedMetric(metric.key as 'temperature' | 'humidity' | 'pressure' | 'gasResistance')}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === metric.key
                    ? `${metric.color} text-white`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {metric.label}
              </button>
            ))}
          </div>
        </div>

        {/* Simple Chart */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="text-sm font-medium text-gray-700 mb-4">
            {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Chart ({timeFrame})
          </div>
          
          {filteredData.length > 0 ? (
            <div className="h-40 relative">
              <svg className="w-full h-full" viewBox="0 0 300 100">
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="300"
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="0.5"
                  />
                ))}
                
                {/* Data line */}
                {filteredData.length > 1 && (
                  <polyline
                    fill="none"
                    stroke={getMetricColor(selectedMetric).replace('text-', '#')}
                    strokeWidth="2"
                    points={filteredData
                      .slice()
                      .reverse()
                      .map((data, index) => {
                        const x = (index / (filteredData.length - 1)) * 300;
                        const values = filteredData.map(d => getMetricValue(d, selectedMetric));
                        const min = Math.min(...values);
                        const max = Math.max(...values);
                        const range = max - min || 1;
                        const y = 100 - ((getMetricValue(data, selectedMetric) - min) / range) * 100;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                  />
                )}
                
                {/* Data points */}
                {filteredData.slice().reverse().map((data, index) => {
                  const x = (index / Math.max(filteredData.length - 1, 1)) * 300;
                  const values = filteredData.map(d => getMetricValue(d, selectedMetric));
                  const min = Math.min(...values);
                  const max = Math.max(...values);
                  const range = max - min || 1;
                  const y = 100 - ((getMetricValue(data, selectedMetric) - min) / range) * 100;
                  
                  return (
                    <circle
                      key={data.id}
                      cx={x}
                      cy={y}
                      r="2"
                      fill={getMetricColor(selectedMetric).replace('text-', '#')}
                    />
                  );
                })}
              </svg>
              
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full w-12 flex flex-col justify-between text-xs text-gray-500">
                {filteredData.length > 0 && (() => {
                  const values = filteredData.map(d => getMetricValue(d, selectedMetric));
                  const min = Math.min(...values);
                  const max = Math.max(...values);
                  return [
                    <div key="max">{max.toFixed(1)}</div>,
                    <div key="mid">{((max + min) / 2).toFixed(1)}</div>,
                    <div key="min">{min.toFixed(1)}</div>
                  ];
                })()}
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-2xl mb-2">📊</div>
                <div>No data for selected time frame</div>
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-500 mt-2 text-center">
            {filteredData.length} readings in {timeFrame}
          </div>
        </div>

        {/* Recent Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <div className="text-sm font-medium text-gray-700">Recent Readings</div>
          </div>
          
          {filteredData.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              {filteredData.slice(0, 10).map((data) => (
                <div key={data.id} className="p-3 border-b border-gray-50 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xs text-gray-500">
                      {new Date(data.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">T:</span> {data.temperature.toFixed(1)}°C
                    </div>
                    <div>
                      <span className="text-gray-500">H:</span> {data.humidity.toFixed(1)}%
                    </div>
                    <div>
                      <span className="text-gray-500">P:</span> {data.pressure.toFixed(1)} hPa
                    </div>
                    <div>
                      <span className="text-gray-500">G:</span> {data.gasResistance.toFixed(1)} KΩ
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <div className="text-2xl mb-2">📱</div>
              <div>No sensor data available</div>
              <div className="text-sm mt-1">Make sure your ESP8266 is connected</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
