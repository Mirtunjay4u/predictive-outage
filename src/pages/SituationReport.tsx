import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Map } from 'lucide-react';
import { useScenarioWithIntelligence } from '@/hooks/useScenarios';
import { SituationReportContent } from '@/components/report/SituationReportContent';
import { Skeleton } from '@/components/ui/skeleton';

export default function SituationReport() {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading, error } = useScenarioWithIntelligence(id || null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Event not found or an error occurred.</p>
          <Link 
            to="/outage-map" 
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Outage Map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Persistent Navigation Header */}
      <header className="sticky top-0 z-40 h-14 border-b border-border bg-card/95 backdrop-blur-sm flex items-center px-6 gap-4">
        <Link 
          to={`/outage-map?event=${id}`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Map</span>
        </Link>
        
        <div className="h-4 w-px bg-border" />
        
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground truncate max-w-md">
            {event.name}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <SituationReportContent event={event} />
      </main>
    </div>
  );
}
