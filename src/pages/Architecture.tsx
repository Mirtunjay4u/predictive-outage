import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function ArchBlock({
  icon: Icon,
  title,
  items,
  accent,
  className = '',
}: {
  icon: React.ElementType;
  title: string;
  items: string[];
  accent: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-border/60 bg-card p-4 flex flex-col gap-2 ${className}`}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: accent + '22', color: accent }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-semibold text-foreground">{title}</span>
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
                <ArchBlock icon={Zap} title="OMS / SCADA" accent="#f59e0b" items={['Outage events & fault signals', 'Real-time telemetry feeds', 'Equipment status updates']} />
                <ArchBlock icon={Cloud} title="Weather Services" accent="#3b82f6" items={['NWS alerts & forecasts', 'Storm track predictions', 'Severity classifications']} />
                <ArchBlock icon={Map} title="GIS / Asset Registry" accent="#10b981" items={['Feeder zone geometry', 'Asset locations & topology', 'Critical load mapping']} />
                <ArchBlock icon={Users} title="Workforce / CRM" accent="#8b5cf6" items={['Crew availability & shifts', 'Skill & vehicle inventory', 'Customer account data']} />
              </div>
            </div>

            <FlowArrow label="Ingest & Normalize" />

            {/* Layer 2 — Backend Platform */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">
                Backend Platform (Lovable Cloud)
              </p>
              <div className="grid grid-cols-3 gap-3">
                <ArchBlock icon={Database} title="Data Layer" accent="#f97316" items={['PostgreSQL relational store', 'Scenarios & event tables', 'Event status history tracking', 'Crew & asset registries']} />
                <ArchBlock icon={Shield} title="Security & Auth" accent="#ef4444" items={['Row-Level Security policies', 'Role-based access control', 'Session management', 'Encrypted credentials']} />
                <ArchBlock icon={Radio} title="Edge Functions" accent="#06b6d4" items={['Copilot AI orchestration', 'ETR confidence computation', 'Real-time event processing', 'External API integration']} />
              </div>
            </div>

            <FlowArrow label="API / Real-time" />

            {/* Layer 3 — AI & Intelligence */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">
                AI & Intelligence Layer
              </p>
              <div className="grid grid-cols-3 gap-3">
                <ArchBlock icon={Bot} title="Operator Copilot" accent="#a855f7" items={['Natural language Q&A', 'Contextual scenario analysis', 'Structured JSON response contract', 'Multi-mode reasoning']} />
                <ArchBlock icon={Zap} title="Predictive Engine" accent="#eab308" items={['ETR band estimation', 'Uncertainty driver analysis', 'Critical runway forecasting', 'Escalation risk scoring']} />
                <ArchBlock icon={FileText} title="Report Generation" accent="#14b8a6" items={['Situation report synthesis', 'Customer communications', 'Post-event analysis packs', 'Regulatory compliance docs']} />
              </div>
            </div>

            <FlowArrow label="Serve" />

            {/* Layer 4 — Presentation */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">
                Presentation Layer (React SPA)
              </p>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { icon: Monitor, title: 'Dashboard', accent: '#6366f1', items: ['KPI cards & work queue', 'Safety & crew panels'] },
                  { icon: FileText, title: 'Events', accent: '#f59e0b', items: ['List / card views', 'Advanced filtering'] },
                  { icon: Map, title: 'Outage Map', accent: '#10b981', items: ['Leaflet map layers', 'Asset & crew overlays'] },
                  { icon: Bot, title: 'Copilot Studio', accent: '#a855f7', items: ['Interactive AI chat', 'Scenario deep-dives'] },
                  { icon: BarChart3, title: 'Analytics', accent: '#3b82f6', items: ['Distribution charts', 'Crew & ops metrics'] },
                ].map((block) => (
                  <ArchBlock key={block.title} {...block} />
                ))}
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
