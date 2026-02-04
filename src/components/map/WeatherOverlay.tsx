import { useEffect } from 'react';
import { useMap, CircleMarker, Popup } from 'react-leaflet';
import type { WeatherPoint } from '@/hooks/useWeatherData';
import { weatherCodeToDescription } from '@/hooks/useWeatherData';

interface WeatherOverlayProps {
  weatherPoints: WeatherPoint[];
  visible: boolean;
}

// Get color based on weather severity
function getWeatherColor(weatherCode: number): string {
  // Severe weather (thunderstorms, heavy precipitation)
  if (weatherCode >= 95) return '#dc2626'; // Red
  if (weatherCode >= 80) return '#f59e0b'; // Amber - showers
  if (weatherCode >= 71) return '#3b82f6'; // Blue - snow
  if (weatherCode >= 61) return '#0ea5e9'; // Sky blue - rain
  if (weatherCode >= 51) return '#06b6d4'; // Cyan - drizzle
  if (weatherCode >= 45) return '#6b7280'; // Gray - fog
  if (weatherCode >= 1) return '#94a3b8'; // Light gray - clouds
  return '#22c55e'; // Green - clear
}

function getWeatherOpacity(weatherCode: number): number {
  if (weatherCode >= 95) return 0.7;
  if (weatherCode >= 61) return 0.5;
  if (weatherCode >= 45) return 0.4;
  return 0.3;
}

export function WeatherOverlay({ weatherPoints, visible }: WeatherOverlayProps) {
  const map = useMap();

  useEffect(() => {
    if (!visible) return;
    // Force map to re-render when visibility changes
    map.invalidateSize();
  }, [visible, map]);

  if (!visible || !weatherPoints.length) return null;

  return (
    <>
      {weatherPoints.map((point, index) => {
        const weather = weatherCodeToDescription[point.weatherCode] || { label: 'Unknown', icon: '❓' };
        const color = getWeatherColor(point.weatherCode);
        const opacity = getWeatherOpacity(point.weatherCode);

        return (
          <CircleMarker
            key={`weather-${index}`}
            center={[point.lat, point.lng]}
            radius={35}
            pathOptions={{
              fillColor: color,
              fillOpacity: opacity,
              color: color,
              weight: 1,
              opacity: 0.6,
            }}
          >
            <Popup>
              <div className="p-2 min-w-[160px]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{weather.icon}</span>
                  <span className="font-semibold text-sm">{weather.label}</span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Temperature</span>
                    <span className="font-medium text-foreground">{Math.round(point.temperature)}°F</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wind Speed</span>
                    <span className="font-medium text-foreground">{Math.round(point.windSpeed)} mph</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Humidity</span>
                    <span className="font-medium text-foreground">{point.humidity}%</span>
                  </div>
                  {point.precipitation > 0 && (
                    <div className="flex justify-between">
                      <span>Precipitation</span>
                      <span className="font-medium text-foreground">{point.precipitation.toFixed(2)}"</span>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}
