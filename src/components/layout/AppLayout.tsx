import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { ExecutiveIntelligenceConsole } from '@/components/executive/ExecutiveIntelligenceConsole';

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to main content
      </a>
      
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main 
          id="main-content" 
          className="flex-1 overflow-auto" 
          tabIndex={-1}
          role="main"
          aria-label="Main content"
        >
          <Outlet />
        </main>
        
        {/* Persistent Demo Footer with Operational Boundaries */}
        <footer className="border-t border-border/30 bg-surface-0 shrink-0">
          <div className="h-7 flex items-center justify-between px-4">
            <p className="text-[10px] text-muted-foreground/60 tracking-wide font-medium">
              Operator Copilot – Predictive Outage Management · Phase-1 Decision Intelligence Demonstrator · Synthetic Data
            </p>
            <p className="text-[10px] text-muted-foreground/50 tracking-wide">
              No SCADA actuation · No breaker control · No autonomous dispatch · Human-in-the-loop only
            </p>
          </div>
        </footer>
      </div>
      <ExecutiveIntelligenceConsole />
    </div>
  );
}
