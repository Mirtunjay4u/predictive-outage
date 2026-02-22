import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { DashboardUiProvider } from "./contexts/DashboardUiContext";
import { AppLayout } from "./components/layout/AppLayout";
import { DemoScriptModal } from "./components/DemoScriptModal";
import { DemoTourHUD } from "./components/DemoTourHUD";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Architecture from "./pages/Architecture";
import AppPage from "./pages/AppPage";
import CopilotStudio from "./pages/CopilotStudio";
import OutageMap from "./pages/OutageMap";
import EventDetails from "./pages/EventDetails";
import SituationReport from "./pages/SituationReport";
import WeatherAlerts from "./pages/WeatherAlerts";
import ArtOfPossibilities from "./pages/ArtOfPossibilities";
import About from "./pages/About";
import ExecutiveValidation from "./pages/ExecutiveValidation";
import ExecutiveSummary from "./pages/ExecutiveSummary";
import KnowledgePolicy from "./pages/KnowledgePolicy";
import Glossary from "./pages/Glossary";
import SolutionRoadmap from "./pages/SolutionRoadmap";
import UseCases from "./pages/UseCases";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppPage />
          </ProtectedRoute>
        }
      />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/events" element={<Events />} />
        <Route path="/outage-map" element={<OutageMap />} />
        <Route path="/event/:id" element={<EventDetails />} />
        <Route path="/event/:id/situation-report" element={<SituationReport />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/weather-alerts" element={<WeatherAlerts />} />
        <Route path="/art-of-possibilities" element={<ArtOfPossibilities />} />
        <Route path="/copilot-studio" element={<CopilotStudio />} />
        <Route path="/architecture" element={<Architecture />} />
        <Route path="/about" element={<About />} />
        <Route path="/executive-validation" element={<ExecutiveValidation />} />
        <Route path="/executive-summary" element={<ExecutiveSummary />} />
        <Route path="/knowledge-policy" element={<KnowledgePolicy />} />
        <Route path="/glossary" element={<Glossary />} />
        <Route path="/solution-roadmap" element={<SolutionRoadmap />} />
        <Route path="/use-cases" element={<UseCases />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <DashboardUiProvider>
              <AppRoutes />
              <DemoScriptModal />
              <DemoTourHUD />
            </DashboardUiProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
