import { motion } from 'framer-motion';
import {
  LayoutDashboard, FileText, Map, Bot, BarChart3, CloudLightning, Network,
  Shield, Bell, Users, Clock, Zap, Eye, Target, Layers, BookOpen,
  CheckCircle2, Lightbulb, ArrowRight, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import builderPhoto from '@/assets/builder-photo.png';

const fadeIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

const modules = [
  {
    icon: LayoutDashboard, title: 'Dashboard', path: '/dashboard',
    desc: 'Real-time operational command center with KPI cards, crew workload, safety risk panels, and an operational timeline.',
    tips: ['Flip KPI cards to see outage-type breakdowns', 'High-priority alerts auto-surface events needing immediate attention', 'Readiness strip shows pre-event preparedness at a glance'],
  },
  {
    icon: FileText, title: 'Events', path: '/events',
    desc: 'Comprehensive event registry with list and card views, advanced filtering by lifecycle stage, outage type, priority, and service area.',
    tips: ['Use the lifecycle filter to isolate Pre-Event items for proactive planning', 'Click any event row to drill into its detail page with ETR timeline', 'Generate a Situation Report directly from an event's detail view'],
  },
  {
    icon: Map, title: 'Outage Map', path: '/outage-map',
    desc: 'Geospatial situational awareness with clustered outage markers, feeder zone overlays, crew positions, and asset detail drawers.',
    tips: ['Use the search bar to locate feeders, assets, or events by ID', 'Click a crew marker to see dispatch status and ETA', 'Feeder zones color-code by severity for rapid triage'],
  },
  {
    icon: Bot, title: 'Copilot Studio', path: '/copilot-studio',
    desc: 'AI-powered conversational assistant for natural-language queries about outage status, ETR reasoning, crew availability, and decision support.',
    tips: ['Ask "What events need escalation?" for a prioritized summary', 'Query crew availability with "Which crews are available near Feeder F-201?"', 'Copilot provides advisory insights — all actions require operator approval'],
  },
  {
    icon: BarChart3, title: 'Analytics', path: '/analytics',
    desc: 'Post-event and trend analytics with flippable metric cards, restoration curves, and performance benchmarking.',
    tips: ['Flip metric cards to see detailed breakdowns by outage type', 'Use analytics to identify recurring failure patterns across feeders'],
  },
  {
    icon: CloudLightning, title: 'Weather Alerts', path: '/weather-alerts',
    desc: 'Weather-driven risk correlation linking forecast data to potential outage zones and pre-event mobilization triggers.',
    tips: ['Weather data is illustrative in demo mode — no live NWS feed', 'Correlate weather alerts with feeder vulnerability for proactive staging'],
  },
  {
    icon: Network, title: 'Architecture', path: '/architecture',
    desc: 'Interactive 4-layer technical diagram showing data flow from external sources through the backend and AI layers to the presentation tier.',
    tips: ['Hover over any block to see tech stack and protocol details', 'Animated particles show the real-time data flow direction'],
  },
];

const untappedFeatures = [
  {
    category: 'Predictive Intelligence',
    items: [
      { title: 'ETR Confidence Bands', desc: 'Every event carries earliest, expected, and latest ETR estimates with confidence levels and uncertainty drivers — enabling risk-adjusted scheduling.' },
      { title: 'Critical Load Runway', desc: 'Tracks backup runtime remaining for critical facilities (hospitals, water treatment). Runway status auto-escalates when thresholds are breached.' },
      { title: 'Copilot Signals', desc: 'The events_intelligence view computes derived signals like requires_escalation and etr_risk_level — surfacing decisions operators might otherwise miss.' },
    ],
  },
  {
    category: 'Operational Workflow',
    items: [
      { title: 'Crew Overtime Tracking', desc: 'Dedicated crew_overtime_logs table captures dispatch times, authorization, and shift compliance — supporting fatigue management and labor compliance.' },
      { title: 'Event Status History', desc: 'Full audit trail of every ETR change, confidence shift, and runway status update for post-event review and regulatory reporting.' },
      { title: 'Dispatch Recommendations', desc: 'AI-generated crew dispatch suggestions factoring proximity, specialization, shift window, and current workload.' },
    ],
  },
  {
    category: 'Situational Awareness',
    items: [
      { title: 'Situation Reports', desc: 'One-click generation of structured situation reports from any active event, ready for executive or regulatory distribution.' },
      { title: 'Feeder Zone Geospatial Overlays', desc: 'GeoJSON-based feeder boundaries overlay on the outage map for instant spatial correlation of assets and events.' },
      { title: 'Playback Mode', desc: 'Timeline playback panel allows replaying event progression for training and post-event analysis.' },
    ],
  },
];

export default function About() {
  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div variants={fadeIn} initial="hidden" animate="show" className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <BookOpen className="w-3.5 h-3.5" /> About This Solution
        </div>
        <h1 className="text-xl font-semibold text-foreground">Operator Copilot — Predictive Outage Management</h1>
        <p className="text-sm text-muted-foreground max-w-3xl">
          A decision-support and situational awareness platform for utility outage operations. 
          This tool helps operators surface critical information, reason about ETR uncertainty, 
          and coordinate restoration — without executing autonomous control actions.
        </p>
      </motion.div>

      {/* Safety Notice */}
      <motion.div variants={fadeIn} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-amber-500">Safety & Compliance Notice</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                All insights are advisory and require explicit human operator review and approval. 
                This application does not execute, authorize, or recommend autonomous control actions. 
                Events, assets, and metrics may be synthetic or illustrative for demo purposes.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs defaultValue="modules" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="modules" className="text-xs gap-1.5"><Layers className="w-3.5 h-3.5" /> Modules Guide</TabsTrigger>
          <TabsTrigger value="features" className="text-xs gap-1.5"><Lightbulb className="w-3.5 h-3.5" /> Untapped Features</TabsTrigger>
          <TabsTrigger value="howto" className="text-xs gap-1.5"><Target className="w-3.5 h-3.5" /> How to Use</TabsTrigger>
          <TabsTrigger value="builder" className="text-xs gap-1.5"><Info className="w-3.5 h-3.5" /> About the Builder</TabsTrigger>
        </TabsList>

        {/* Modules */}
        <TabsContent value="modules">
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-3">
            {modules.map((m) => (
              <motion.div key={m.title} variants={fadeIn}>
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <m.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{m.title}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{m.path}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
                        <div className="space-y-1 pt-1">
                          {m.tips.map((tip, i) => (
                            <div key={i} className="flex items-start gap-1.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                              <span className="text-[11px] text-muted-foreground">{tip}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>

        {/* Untapped Features */}
        <TabsContent value="features">
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
            {untappedFeatures.map((cat) => (
              <motion.div key={cat.category} variants={fadeIn}>
                <Card className="border-border/50">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      {cat.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <Accordion type="multiple" className="space-y-0">
                      {cat.items.map((item, i) => (
                        <AccordionItem key={i} value={`${cat.category}-${i}`} className="border-border/30">
                          <AccordionTrigger className="py-2.5 text-xs font-medium hover:no-underline">
                            {item.title}
                          </AccordionTrigger>
                          <AccordionContent className="text-[11px] text-muted-foreground leading-relaxed pb-3">
                            {item.desc}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>

        {/* How to Use */}
        <TabsContent value="howto">
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
            {[
              { step: '1', title: 'Start at the Dashboard', desc: 'Review active KPIs, high-priority alerts, and the operational timeline. Flip KPI cards for outage-type detail. The readiness strip shows pre-event posture.', icon: Eye },
              { step: '2', title: 'Triage via Events', desc: 'Filter events by lifecycle stage, priority, or outage type. Click into any event for full ETR bands, status history, crew assignments, and affected assets.', icon: FileText },
              { step: '3', title: 'Visualize on the Outage Map', desc: 'Use the geospatial view to correlate events with feeder zones, crew positions, and asset locations. Search by feeder ID or event name.', icon: Map },
              { step: '4', title: 'Query the Copilot', desc: 'Ask natural-language questions about outage status, crew availability, or escalation needs. All responses are advisory — confirm before acting.', icon: Bot },
              { step: '5', title: 'Analyze & Report', desc: 'Use Analytics for trend patterns and post-event review. Generate Situation Reports from any event detail page for stakeholder distribution.', icon: BarChart3 },
            ].map((s) => (
              <motion.div key={s.step} variants={fadeIn}>
                <Card className="border-border/50">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                      {s.step}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <s.icon className="w-3.5 h-3.5 text-primary" />
                        <span className="text-sm font-semibold text-foreground">{s.title}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{s.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>

        {/* About the Builder */}
        <TabsContent value="builder">
          <motion.div variants={fadeIn} initial="hidden" animate="show">
            <Card className="border-border/50">
              <CardContent className="p-6 flex flex-col sm:flex-row items-start gap-6">
                <img
                  src={builderPhoto}
                  alt="Builder"
                  className="w-24 h-24 rounded-xl object-cover border border-border/50 flex-shrink-0"
                />
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Built with Lovable AI</h3>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      This solution was designed and developed as a demonstration of how modern AI-assisted development 
                      can accelerate the creation of operationally complex, utility-grade applications. The entire platform — 
                      from database schema to interactive map overlays — was built using Lovable's AI-powered development environment.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['React', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Recharts', 'Leaflet', 'PostgreSQL', 'Edge Functions', 'Lovable AI'].map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Footer disclaimer */}
      <p className="text-[10px] text-muted-foreground/60 text-center pt-4">
        Prototype Demo • Synthetic Data • Decision Support Only • No SCADA/OMS/ADMS Integration
      </p>
    </div>
  );
}
