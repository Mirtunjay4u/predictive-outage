import { useEffect, useRef } from 'react';
import { useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
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

// Individual weather marker with native popup binding
function WeatherMarker({ point, index }: { point: WeatherPoint; index: number }) {
  const markerRef = useRef<L.CircleMarker>(null);
  const weather = weatherCodeToDescription[point.weatherCode] || { label: 'Unknown', icon: '❓' };
  const color = getWeatherColor(point.weatherCode);
  const opacity = getWeatherOpacity(point.weatherCode);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    // Bind native Leaflet popup
    marker.bindPopup(
      `<div style="padding: 8px; min-width: 160px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span style="font-size: 24px;">${weather.icon}</span>
          <span style="font-weight: 600; font-size: 14px;">${weather.label}</span>
        </div>
        <div style="font-size: 12px; color: #888;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Temperature</span>
            <span style="font-weight: 500; color: #fff;">${Math.round(point.temperature)}°F</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Wind Speed</span>
            <span style="font-weight: 500; color: #fff;">${Math.round(point.windSpeed)} mph</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Humidity</span>
            <span style="font-weight: 500; color: #fff;">${point.humidity}%</span>
          </div>
          ${point.precipitation > 0 ? `
            <div style="display: flex; justify-content: space-between;">
              <span>Precipitation</span>
              <span style="font-weight: 500; color: #fff;">${point.precipitation.toFixed(2)}"</span>
            </div>
          ` : ''}
        </div>
      </div>`,
      { className: 'weather-popup' }
    );

    return () => {
      marker.unbindPopup();
    };
  }, [point, weather]);

  return (
    <CircleMarker
      ref={markerRef}
      center={[point.lat, point.lng]}
      radius={35}
      pathOptions={{
        fillColor: color,
        fillOpacity: opacity,
        color: color,
        weight: 1,
        opacity: 0.6,
      }}
    />
  );
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
      {weatherPoints.map((point, index) => (
        <WeatherMarker key={`weather-${index}`} point={point} index={index} />
      ))}
    </>
  );
}
