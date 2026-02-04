import { useQuery } from '@tanstack/react-query';

export interface WeatherPoint {
  lat: number;
  lng: number;
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  precipitation: number;
  humidity: number;
}

export interface WeatherData {
  points: WeatherPoint[];
  timestamp: Date;
}

// Weather code to description mapping (WMO codes)
export const weatherCodeToDescription: Record<number, { label: string; icon: string }> = {
  0: { label: 'Clear sky', icon: '☀️' },
  1: { label: 'Mainly clear', icon: '🌤️' },
  2: { label: 'Partly cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Fog', icon: '🌫️' },
  48: { label: 'Rime fog', icon: '🌫️' },
  51: { label: 'Light drizzle', icon: '🌧️' },
  53: { label: 'Moderate drizzle', icon: '🌧️' },
  55: { label: 'Dense drizzle', icon: '🌧️' },
  61: { label: 'Slight rain', icon: '🌧️' },
  63: { label: 'Moderate rain', icon: '🌧️' },
  65: { label: 'Heavy rain', icon: '🌧️' },
  66: { label: 'Freezing rain', icon: '🌨️' },
  67: { label: 'Heavy freezing rain', icon: '🌨️' },
  71: { label: 'Slight snow', icon: '🌨️' },
  73: { label: 'Moderate snow', icon: '🌨️' },
  75: { label: 'Heavy snow', icon: '❄️' },
  77: { label: 'Snow grains', icon: '❄️' },
  80: { label: 'Slight showers', icon: '🌦️' },
  81: { label: 'Moderate showers', icon: '🌦️' },
  82: { label: 'Violent showers', icon: '⛈️' },
  85: { label: 'Slight snow showers', icon: '🌨️' },
  86: { label: 'Heavy snow showers', icon: '🌨️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
  96: { label: 'Thunderstorm with hail', icon: '⛈️' },
  99: { label: 'Thunderstorm with heavy hail', icon: '⛈️' },
};

// Grid points around Houston metro area for weather sampling
const WEATHER_GRID_POINTS = [
  { lat: 29.7604, lng: -95.3698 }, // Downtown Houston
  { lat: 29.55, lng: -94.95 },     // Galveston Bay
  { lat: 29.77, lng: -95.44 },     // Memorial
  { lat: 29.62, lng: -95.63 },     // Sugar Land
  { lat: 30.17, lng: -95.46 },     // The Woodlands
  { lat: 29.79, lng: -95.82 },     // Katy
  { lat: 29.69, lng: -95.21 },     // Pasadena
  { lat: 30.31, lng: -95.46 },     // Conroe
  { lat: 29.95, lng: -95.35 },     // North Houston
];

async function fetchWeatherData(): Promise<WeatherData> {
  // Build URL with all lat/lng pairs for batch request
  const lats = WEATHER_GRID_POINTS.map(p => p.lat).join(',');
  const lngs = WEATHER_GRID_POINTS.map(p => p.lng).join(',');
  
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&current=temperature_2m,weather_code,wind_speed_10m,precipitation,relative_humidity_2m&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }
  
  const data = await response.json();
  
  // Parse response - Open-Meteo returns array when multiple locations
  const points: WeatherPoint[] = WEATHER_GRID_POINTS.map((point, index) => {
    const current = Array.isArray(data) ? data[index].current : data.current;
    return {
      lat: point.lat,
      lng: point.lng,
      temperature: current.temperature_2m,
      weatherCode: current.weather_code,
      windSpeed: current.wind_speed_10m,
      precipitation: current.precipitation,
      humidity: current.relative_humidity_2m,
    };
  });
  
  return {
    points,
    timestamp: new Date(),
  };
}

export function useWeatherData(enabled: boolean = true) {
  return useQuery({
    queryKey: ['weather-data'],
    queryFn: fetchWeatherData,
    enabled,
    refetchInterval: 15 * 60 * 1000, // Refresh every 15 minutes
    staleTime: 10 * 60 * 1000, // Consider stale after 10 minutes
    retry: 2,
  });
}
