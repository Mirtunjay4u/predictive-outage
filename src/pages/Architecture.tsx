import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import {
  Cloud,
  Database,
  Monitor,
  Bot,
  Map,
  Shield,
  Zap,
  ArrowDown,
  ArrowRight,
  Layers,
  Radio,
  Users,
  BarChart3,
  FileText,
  Info,
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

interface ArchBlockProps {
  icon: React.ElementType;
  title: string;
  items: string[];
  accent: string;
  detail?: { summary: string; techStack: string[]; protocols?: string[] };
  className?: string;
}

function ArchBlock({ icon: Icon, title, items, accent, detail, className = '' }: ArchBlockProps) {
  const content = (
    <div className={`rounded-lg border border-border/60 bg-card p-4 flex flex-col gap-2 transition-colors ${detail ? 'hover:border-primary/40 cursor-pointer' : ''} ${className}`}>
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: accent + '22', color: accent }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-semibold text-foreground flex-1">{title}</span>
        {detail && <Info className="w-3 h-3 text-muted-foreground/40" />}
      </div>
      <ul className="space-y-0.5 pl-1">
        {items.map((item) => (
          <li key={item} className="text-[11px] text-muted-foreground leading-snug flex items-start gap-1.5">
            <span className="mt-1 w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );

  if (!detail) return content;

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>{content}</HoverCardTrigger>
      <HoverCardContent side="top" align="center" className="w-72 p-3 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: accent + '22', color: accent }}>
            <Icon className="w-3 h-3" />
          </div>
          <span className="text-xs font-semibold text-foreground">{title}</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{detail.summary}</p>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Tech Stack</p>
          <div className="flex flex-wrap gap-1">
            {detail.techStack.map((t) => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t}</span>
            ))}
          </div>
        </div>
        {detail.protocols && detail.protocols.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1">Protocols</p>
            <div className="flex flex-wrap gap-1">
              {detail.protocols.map((p) => (
                <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{p}</span>
              ))}
            </div>
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}

function FlowArrow({ direction = 'down', label }: { direction?: 'down' | 'right'; label?: string }) {
  return (
    <div className={`flex items-center justify-center gap-1 ${direction === 'right' ? 'flex-row' : 'flex-col'} py-1`}>
      {direction === 'down' ? (
        <ArrowDown className="w-4 h-4 text-muted-foreground/60" />
      ) : (
        <ArrowRight className="w-4 h-4 text-muted-foreground/60" />
      )}
      {label && <span className="text-[9px] text-muted-foreground/50 font-medium uppercase tracking-wider">{label}</span>}
    </div>
  );
}

// --- Block definitions with detail tooltips ---

const dataSources: ArchBlockProps[] = [
  {
    icon: Zap, title: 'OMS / SCADA', accent: '#f59e0b',
    items: ['Outage events & fault signals', 'Real-time telemetry feeds', 'Equipment status updates'],
    detail: { summary: 'Ingests outage management and supervisory control data to establish the real-time operational picture. Fault signals trigger event creation and asset correlation.', techStack: ['DNP3', 'IEC 61850', 'OPC-UA', 'REST API'], protocols: ['Polling', 'Push/Webhook'] },
  },
  {
    icon: Cloud, title: 'Weather Services', accent: '#3b82f6',
    items: ['NWS alerts & forecasts', 'Storm track predictions', 'Severity classifications'],
    detail: { summary: 'Correlates National Weather Service alerts with service territories to enable pre-event staging and predictive crew positioning.', techStack: ['NWS CAP/ATOM', 'GeoJSON', 'REST'], protocols: ['HTTP Pull', 'WebSocket'] },
  },
  {
    icon: Map, title: 'GIS / Asset Registry', accent: '#10b981',
    items: ['Feeder zone geometry', 'Asset locations & topology', 'Critical load mapping'],
    detail: { summary: 'Provides geospatial context for all grid assets. Feeder polygons define outage boundaries; critical-load flags drive prioritization logic.', techStack: ['ArcGIS', 'PostGIS', 'GeoJSON', 'Leaflet'], protocols: ['WFS', 'REST'] },
  },
  {
    icon: Users, title: 'Workforce / CRM', accent: '#8b5cf6',
    items: ['Crew availability & shifts', 'Skill & vehicle inventory', 'Customer account data'],
    detail: { summary: 'Supplies crew roster, shift windows, and vehicle capabilities for dispatch optimization. Customer data enables impact scoring and proactive communications.', techStack: ['Dataverse', 'REST API', 'OAuth 2.0'], protocols: ['Batch Sync', 'Delta Query'] },
  },
];

const backendBlocks: ArchBlockProps[] = [
  {
    icon: Database, title: 'Data Layer', accent: '#f97316',
    items: ['PostgreSQL relational store', 'Scenarios & event tables', 'Event status history tracking', 'Crew & asset registries'],
    detail: { summary: 'Core relational store hosting all operational entities. The events_intelligence view enriches raw scenario data with computed fields like ETR risk levels and copilot signals.', techStack: ['PostgreSQL 15', 'PostgREST', 'Realtime'], protocols: ['SQL', 'REST', 'WebSocket'] },
  },
  {
    icon: Shield, title: 'Security & Auth', accent: '#ef4444',
    items: ['Row-Level Security policies', 'Role-based access control', 'Session management', 'Encrypted credentials'],
    detail: { summary: 'Every table enforces Row-Level Security. Authentication uses JWT tokens with automatic refresh. Secrets are vault-encrypted and never exposed client-side.', techStack: ['RLS', 'JWT', 'bcrypt', 'Vault'], protocols: ['OAuth 2.0', 'PKCE'] },
  },
  {
    icon: Radio, title: 'Edge Functions', accent: '#06b6d4',
    items: ['Copilot AI orchestration', 'ETR confidence computation', 'Real-time event processing', 'External API integration'],
    detail: { summary: 'Serverless Deno-based functions handle AI prompt orchestration, structured JSON response contracts, and external API mediation without exposing credentials to the client.', techStack: ['Deno', 'TypeScript', 'OpenAI SDK'], protocols: ['HTTPS', 'JSON-RPC'] },
  },
];

const aiBlocks: ArchBlockProps[] = [
  {
    icon: Bot, title: 'Operator Copilot', accent: '#a855f7',
    items: ['Natural language Q&A', 'Contextual scenario analysis', 'Structured JSON response contract', 'Multi-mode reasoning'],
    detail: { summary: 'Accepts scenario context and operator queries, returning structured insights (mode_banner, framing_line, insights array, assumptions, source_notes). Includes fallback logic for resilient responses.', techStack: ['LLM', 'Prompt Engineering', 'JSON Schema'], protocols: ['Chat Completion API'] },
  },
  {
    icon: Zap, title: 'Predictive Engine', accent: '#eab308',
    items: ['ETR band estimation', 'Uncertainty driver analysis', 'Critical runway forecasting', 'Escalation risk scoring'],
    detail: { summary: 'Computes ETR confidence bands (earliest/expected/latest) and identifies uncertainty drivers. Monitors backup runtime against critical escalation thresholds to flag runway risks.', techStack: ['Statistical Models', 'PostgreSQL Views', 'Edge Compute'], protocols: ['Computed Columns', 'Triggers'] },
  },
  {
    icon: FileText, title: 'Report Generation', accent: '#14b8a6',
    items: ['Situation report synthesis', 'Customer communications', 'Post-event analysis packs', 'Regulatory compliance docs'],
    detail: { summary: 'Generates structured situation reports and customer-facing communications from event data. Templates follow utility regulatory standards for outage disclosure.', techStack: ['Template Engine', 'PDF Export', 'Markdown'], protocols: ['REST', 'Batch'] },
  },
];

const presentationBlocks: ArchBlockProps[] = [
  { icon: Monitor, title: 'Dashboard', accent: '#6366f1', items: ['KPI cards & work queue', 'Safety & crew panels'], detail: { summary: 'Command-center view optimized for 1366×768 control-room displays. Flippable KPI cards provide progressive disclosure of outage breakdowns without leaving the main view.', techStack: ['React', 'Framer Motion', 'Recharts'], protocols: ['REST', 'Realtime'] } },
  { icon: FileText, title: 'Events', accent: '#f59e0b', items: ['List / card views', 'Advanced filtering'], detail: { summary: 'Dual-view event management with lifecycle, priority, and outage-type filters. Event detail drawers provide ETR timeline, crew dispatch, and situation report access.', techStack: ['React Table', 'shadcn/ui', 'Zod'], protocols: ['REST Query'] } },
  { icon: Map, title: 'Outage Map', accent: '#10b981', items: ['Leaflet map layers', 'Asset & crew overlays'], detail: { summary: 'Interactive geospatial view with feeder zone polygons, asset markers, crew positions, and heat-map overlays. Supports playback for post-event analysis.', techStack: ['Leaflet', 'React-Leaflet', 'GeoJSON'], protocols: ['Tile Server', 'WMS'] } },
  { icon: Bot, title: 'Copilot Studio', accent: '#a855f7', items: ['Interactive AI chat', 'Scenario deep-dives'], detail: { summary: 'Conversational interface for querying the Operator Copilot. Supports multiple reasoning modes and displays structured insight cards inline with the chat.', techStack: ['React', 'Edge Functions', 'Streaming'], protocols: ['HTTPS', 'SSE'] } },
  { icon: BarChart3, title: 'Analytics', accent: '#3b82f6', items: ['Distribution charts', 'Crew & ops metrics'], detail: { summary: 'Interactive bar charts for lifecycle, priority, and crew distributions with click-through drill-down popovers listing individual events and their details.', techStack: ['Recharts', 'Popover', 'React Query'], protocols: ['REST'] } },
];

export default function Architecture() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div {...fadeUp} className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-widest text-primary/80 mb-1">
          System Design
        </p>
        <h1 className="text-xl font-semibold text-foreground">Technical Architecture</h1>
        <p className="text-sm text-muted-foreground mt-1">
          End-to-end solution architecture for predictive outage management
          <span className="text-[10px] text-muted-foreground/50 ml-2">— hover blocks for technical detail</span>
        </p>
      </motion.div>

      <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
        <Card className="border-border/50">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Solution Architecture Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-3">

            {/* Layer 1 — Data Sources */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">
                External Data Sources
              </p>
              <div className="grid grid-cols-4 gap-3">
                {dataSources.map((b) => <ArchBlock key={b.title} {...b} />)}
              </div>
            </div>

            <FlowArrow label="Ingest & Normalize" />

            {/* Layer 2 — Backend Platform */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">
                Backend Platform (Lovable Cloud)
              </p>
              <div className="grid grid-cols-3 gap-3">
                {backendBlocks.map((b) => <ArchBlock key={b.title} {...b} />)}
              </div>
            </div>

            <FlowArrow label="API / Real-time" />

            {/* Layer 3 — AI & Intelligence */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">
                AI & Intelligence Layer
              </p>
              <div className="grid grid-cols-3 gap-3">
                {aiBlocks.map((b) => <ArchBlock key={b.title} {...b} />)}
              </div>
            </div>

            <FlowArrow label="Serve" />

            {/* Layer 4 — Presentation */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">
                Presentation Layer (React SPA)
              </p>
              <div className="grid grid-cols-5 gap-3">
                {presentationBlocks.map((b) => <ArchBlock key={b.title} {...b} />)}
              </div>
            </div>

            {/* Footer note */}
            <div className="pt-2 border-t border-border/30">
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                All insights are advisory. The system provides structured context, visualization, and decision-support only — it does not execute autonomous control actions. Detailed outage reasoning and prioritization logic are delegated to the Operator Copilot AI layer.
              </p>
            </div>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
