import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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
    <div data-tour-section="situation-report" className="min-h-screen bg-background">
      {/* Persistent Navigation Header */}
      <header className="sticky top-0 z-40 h-14 border-b border-border bg-card/95 backdrop-blur-sm flex items-center px-6 gap-4">
        <nav className="flex items-center gap-1.5 text-sm">
          <Link 
            to="/dashboard" 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <Link 
            to={`/event/${id}`}
            className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[150px]"
          >
            {event.name}
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-foreground font-medium">Situation Report</span>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <SituationReportContent event={event} />
      </main>
    </div>
  );
}
