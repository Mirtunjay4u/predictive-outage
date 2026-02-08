import { useWeatherData, weatherCodeToDescription } from '@/hooks/useWeatherData';
import { CloudLightning, ExternalLink, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const severityFromCode = (code: number): 'green' | 'amber' | 'red' => {
  if (code >= 95) return 'red';
  if (code >= 61 || code === 45 || code === 48) return 'amber';
  return 'green';
};

const dotColor = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

export default function WeatherAlerts() {
  const { data: weather, isLoading, refetch, dataUpdatedAt } = useWeatherData(true);

  const updatedLabel = dataUpdatedAt
    ? `Updated ${new Date(dataUpdatedAt).toLocaleTimeString()}`
    : '';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <CloudLightning className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground leading-tight">Real-Time Weather Alerts</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Live weather intelligence for Houston service territory • Decision support only
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {updatedLabel && (
            <span className="text-[10px] text-muted-foreground">{updatedLabel}</span>
          )}
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* Weather summary strip */}
      <div className="px-6 py-2.5 border-b border-border/30 bg-muted/20">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-medium text-muted-foreground/80 whitespace-nowrap mr-1">
            Grid Conditions
          </span>
          {isLoading ? (
            <span className="text-[10px] text-muted-foreground">Loading…</span>
          ) : (
            weather?.points.map((pt, i) => {
              const info = weatherCodeToDescription[pt.weatherCode] ?? { label: 'Unknown', icon: '❓' };
              const sev = severityFromCode(pt.weatherCode);
              return (
                <div
                  key={i}
                  className="flex items-center gap-1.5 rounded-md border border-border/40 bg-card px-2.5 py-1.5 min-w-0 shrink-0"
                >
                  <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor[sev])} />
                  <span className="text-[10px] font-medium text-foreground truncate max-w-[100px]">
                    {info.icon} {Math.round(pt.temperature)}°F
                  </span>
                  <span className="text-[9px] text-muted-foreground truncate max-w-[80px]">
                    {info.label}
                  </span>
                  <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                    {Math.round(pt.windSpeed)}mph
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Windy weather map embed */}
      <div className="flex-1 relative min-h-0">
        <iframe
          src="https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=in&metricTemp=°F&metricWind=mph&zoom=8&overlay=radar&product=radar&level=surface&lat=29.76&lon=-95.37&detailLat=29.76&detailLon=-95.37&marker=true"
          title="Windy – Live Weather Map"
          className="w-full h-full border-0"
          allow="geolocation"
          loading="lazy"
        />
        <a
          href="https://www.windy.com/?29.76,-95.37,8"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md bg-card/90 backdrop-blur border border-border/50 px-2.5 py-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors shadow-sm"
        >
          <ExternalLink className="w-3 h-3" />
          Open in Windy
        </a>
      </div>
    </div>
  );
}
