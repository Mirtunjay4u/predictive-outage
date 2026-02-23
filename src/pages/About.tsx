import { motion } from 'framer-motion';
import {
  LayoutDashboard, FileText, Map, Bot, BarChart3, CloudLightning, Network,
  Shield, Bell, Users, Clock, Zap, Eye, Target, Layers, BookOpen,
  CheckCircle2, Lightbulb, ArrowRight, Info, ShieldAlert, Lock, UserCheck,
  HeartPulse, AlertOctagon, ToggleLeft, Building2, MessageSquare, Database,
  ClipboardList, Radio, Linkedin, Github, ExternalLink
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
    tips: ['Use the lifecycle filter to isolate Pre-Event items for proactive planning', 'Click any event row to drill into its detail page with ETR timeline', 'Generate a Situation Report directly from an event detail view'],
  },
  {
    icon: Map, title: 'Outage Map', path: '/outage-map',
    desc: 'Geospatial situational awareness with clustered outage markers, feeder zone overlays, crew positions, and asset detail drawers.',
    tips: ['Use the search bar to locate feeders, assets, or events by ID', 'Click a crew marker to see dispatch status and ETA', 'Feeder zones color-code by severity for rapid triage'],
  },
  {
    icon: Bot, title: 'Copilot Studio', path: '/copilot-studio',
    desc: 'Governed advisory assistant for structured queries about outage status, ETR reasoning, crew availability, and decision support.',
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
      { title: 'Dispatch Advisory Insights', desc: 'AI-generated crew dispatch insights factoring proximity, specialization, shift window, and current workload.' },
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

const policySections = [
  {
    icon: ShieldAlert, title: 'Operational Authority & Accountability',
    items: [
      'Operator Copilot is a decision-support system only.',
      'All operational decisions remain the responsibility of the human operator.',
      'The system does not execute switching, dispatch, or control actions.',
      'No autonomous actions are performed by this system.',
    ],
  },
  {
    icon: Lock, title: 'System Access Boundaries',
    items: [
      'Phase-1 does not integrate with live SCADA, OMS, ADMS, or DMS systems.',
      'Event, asset, and crew data are synthetic/demo unless explicitly stated otherwise.',
      'Live integrations are limited to public weather overlays (e.g., radar tiles and NWS alerts).',
    ],
  },
  {
    icon: UserCheck, title: 'Human-in-the-Loop Requirement',
    items: [
      'All advisory insights are presented as options.',
      'All communication drafts require explicit operator approval.',
      'Outputs remain "Pending Operator Review" until confirmed.',
    ],
  },
  {
    icon: HeartPulse, title: 'Safety-First Policy (Overrides All Other Logic)',
    items: [
      'Field safety overrides restoration speed.',
      'The system must not encourage unsafe field activity.',
      'During lightning, wildfire exclusion, or flooding access restrictions, the system prioritizes planning, staging, and communication over field action acceleration.',
    ],
  },
  {
    icon: AlertOctagon, title: 'Immediate Escalation Triggers',
    description: 'Escalate when any of the following are detected:',
    items: [
      'Downed wire, arcing, sparking, or fire risk',
      'Gas odor near electrical infrastructure',
      'Critical facility backup runtime below threshold',
      'Wildfire proximity to energized lines',
      'Substation flooding or water ingress risk',
      'Public evacuation or emergency responder constraints',
    ],
  },
  {
    icon: ToggleLeft, title: 'Switching & Network Operation Boundaries',
    items: [
      'The system does not provide device-level switching steps.',
      'No breaker, recloser, or protection sequence instructions are generated.',
      'Assets marked "Under Maintenance" or "Lockout/Tagout" are treated as non-operable.',
      'Advisory insights must respect maintenance and safety flags.',
    ],
  },
  {
    icon: Building2, title: 'Critical Infrastructure Prioritization Principles',
    description: 'Default prioritization lens:',
    items: [
      '1) Life safety (hospitals, emergency services)',
      '2) Essential services (water, wastewater, telecom)',
      '3) Public safety hazards',
      '4) Largest restoration impact per crew-hour',
      '5) Vulnerable or prolonged outage communities',
    ],
  },
  {
    icon: Radio, title: 'ETR Communication Policy',
    items: [
      'ETR is always presented as a band (Earliest–Latest).',
      'Confidence level (High/Medium/Low) must be shown.',
      'The system avoids guaranteeing restoration times.',
      'Uncertainty drivers are acknowledged when applicable.',
    ],
  },
  {
    icon: ShieldAlert, title: 'Model Output & Risk Scoring Policy',
    items: [
      'Risk scores, ETR confidence, and advisory insights are advisory indicators, not ground truth.',
      'Operators must validate against operational context, hazards, and field verification.',
      'The system must not present probabilistic outputs as certainties.',
      'If confidence is Low or uncertainty drivers are high, the system must advise conservative messaging and emphasize verification.',
    ],
  },
  {
    icon: Database, title: 'Data Quality & Assumption Handling',
    items: [
      'If key data is missing, the system explicitly states assumptions.',
      'The system does not fabricate device states, network topology, crew location, or restoration confirmations.',
      'Advisory insights may be conditional if data confidence is low.',
    ],
  },
  {
    icon: MessageSquare, title: 'Customer & Regulator Communication Governance',
    items: [
      'Drafted communications require operator approval.',
      'Messages include safety reminders regarding downed lines.',
      'No speculative root cause statements are generated.',
      'No absolute restoration promises are made.',
    ],
  },
  {
    icon: Lock, title: 'Security, Privacy & Data Handling (Phase-1)',
    items: [
      'No customer PII is required for Phase-1 demo operation.',
      'Any event/crew/asset data is synthetic unless explicitly labeled otherwise.',
      'API keys and credentials are stored only in backend environment variables and never exposed in the frontend.',
      'Audit logs (Event Decision Timeline) are used for traceability and demo validation; retention can be configured for enterprise policy.',
    ],
  },
  {
    icon: ClipboardList, title: 'Auditability & Traceability',
    items: [
      'All major system decisions are logged in the Event Decision Timeline.',
      'Timeline includes weather updates, rule engine triggers, copilot reasoning, and operator approvals.',
      'This ensures transparency and explainability.',
    ],
  },
  {
    icon: Target, title: 'Operational Success Metrics (Phase-1 Demonstration KPIs)',
    items: [
      'Time to triage: reduce time to identify top priority events and critical load risks.',
      'Decision transparency: clear reasoning, assumptions, and rules fired shown per event.',
      'Communication readiness: produce operator-approved customer/regulator drafts quickly with ETR band + confidence.',
      'Safety posture: escalation triggers surfaced consistently; unsafe recommendations blocked by rules.',
    ],
  },
];

export default function About() {
  return (
    <div data-tour-section="about" className="p-6 space-y-8 max-w-5xl mx-auto">
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
          <TabsTrigger value="policy" className="text-xs gap-1.5"><ShieldAlert className="w-3.5 h-3.5" /> Policy & Safety</TabsTrigger>
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

        {/* Policy & Safety */}
        <TabsContent value="policy">
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2">
            <motion.div variants={fadeIn}>
              <Card className="border-amber-500/30 bg-amber-500/5 mb-4">
                <CardContent className="p-4 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-500">Operational Policy & Safety Rules (Phase-1)</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                      This section defines operational boundaries, safety constraints, and governance principles
                      for Phase-1 of Operator Copilot. All rules are enforced at the application layer.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <Accordion type="multiple" className="space-y-2">
              {policySections.map((section, idx) => (
                <motion.div key={idx} variants={fadeIn}>
                  <AccordionItem value={`policy-${idx}`} className="border border-border/50 rounded-lg overflow-hidden bg-card/40 px-1">
                    <AccordionTrigger className="py-3 px-3 text-xs font-medium hover:no-underline gap-2">
                      <div className="flex items-center gap-2.5 flex-1 text-left">
                        <section.icon className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>{section.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3">
                      {section.description && (
                        <p className="text-[11px] text-muted-foreground mb-2 font-medium">{section.description}</p>
                      )}
                      <ul className="space-y-1.5">
                        {section.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed">
                            <span className="w-1 h-1 rounded-full bg-primary/60 mt-1.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
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
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
            {/* Hero Card */}
            <motion.div variants={fadeIn}>
              <Card className="border-border/50 overflow-hidden">
                <CardContent className="p-0">
                  <div className="gradient-primary p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    <img
                      src={builderPhoto}
                      alt="Mirtunjay Kumar"
                      className="w-28 h-28 rounded-2xl object-cover border-2 border-primary-foreground/20 shadow-lg flex-shrink-0"
                    />
                    <div className="text-primary-foreground text-center sm:text-left">
                      <h3 className="text-lg font-bold tracking-tight">Mirtunjay Kumar</h3>
                      <p className="text-sm font-medium text-primary-foreground/80 mt-0.5">AI & Domain Consultant — Tata Consultancy Services</p>
                      <p className="text-xs text-primary-foreground/60 mt-1 max-w-md leading-relaxed">
                        Industrial AI · Reliability Engineering · Smart Grid · Digital Twin · Predictive Analytics
                      </p>
                      <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                        <Badge className="bg-primary-foreground/15 text-primary-foreground border-primary-foreground/20 text-[10px] hover:bg-primary-foreground/20">15+ Years Experience</Badge>
                        <Badge className="bg-primary-foreground/15 text-primary-foreground border-primary-foreground/20 text-[10px] hover:bg-primary-foreground/20">NVIDIA Certified</Badge>
                        <Badge className="bg-primary-foreground/15 text-primary-foreground border-primary-foreground/20 text-[10px] hover:bg-primary-foreground/20">Azure AI Engineer</Badge>
                        <Badge className="bg-primary-foreground/15 text-primary-foreground border-primary-foreground/20 text-[10px] hover:bg-primary-foreground/20">Citizen Data Scientist</Badge>
                        <Badge className="bg-primary-foreground/15 text-primary-foreground border-primary-foreground/20 text-[10px] hover:bg-primary-foreground/20">Asset Reliability Leader</Badge>
                        <Badge className="bg-primary-foreground/15 text-primary-foreground border-primary-foreground/20 text-[10px] hover:bg-primary-foreground/20">SAFe Scrum Master</Badge>
                      </div>
                      <div className="flex justify-center sm:justify-start gap-2 mt-3">
                        <a href="https://www.linkedin.com/in/mirtunjay4u" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md bg-primary-foreground/15 border border-primary-foreground/20 px-2.5 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary-foreground/25 transition-colors">
                          <Linkedin className="w-3.5 h-3.5" />
                          LinkedIn
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </a>
                        <a href="https://github.com/Mirtunjay4u" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md bg-primary-foreground/15 border border-primary-foreground/20 px-2.5 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary-foreground/25 transition-colors">
                          <Github className="w-3.5 h-3.5" />
                          GitHub
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Why This Builder */}
            <motion.div variants={fadeIn}>
              <Card className="border-border/50">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Why This Builder
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-1">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This prototype wasn't built by a frontend developer guessing at utility workflows — it was architected by someone who's led 
                    <span className="text-foreground font-medium"> AI-driven smart grid programs at GE Vernova</span>, designed 
                    <span className="text-foreground font-medium"> predictive maintenance models for industrial assets</span>, and spent a decade 
                    doing hands-on reliability engineering before moving into AI consulting. The domain logic, escalation rules, ETR confidence banding, 
                    and critical load prioritization in this prototype come from real operational understanding — not generic templates.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Career Highlights */}
            <motion.div variants={fadeIn}>
              <Card className="border-border/50">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Career Highlights
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-1 space-y-3">
                  {[
                    { role: 'AI & Domain Consultant', org: 'Tata Consultancy Services', period: '2021 – Present', points: [
                      'AI Lead for GE Vernova Smart GridOS — outage prediction, blackout recovery, RE curtailment',
                      'Designed digital twins and AI-driven analytics for manufacturing & energy sectors',
                      'Platinum Certified Mentor for AI capability building (Wings2 AI program)',
                    ]},
                    { role: 'Deputy Manager — Reliability Maintenance', org: 'Shree Cement Ltd', period: '2012 - 2021', points: [
                      '9 years of hands-on vibration analysis, condition monitoring, and predictive maintenance',
                      'Built the condition monitoring lab and reliability-centered maintenance program',
                      'Integrated analytics with maintenance KPIs (MTTR, MTTF) to optimize operations',
                    ]},
                  ].map((job) => (
                    <div key={job.role} className="border border-border/40 rounded-lg p-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-foreground">{job.role}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{job.period}</Badge>
                      </div>
                      <p className="text-[11px] text-primary font-medium">{job.org}</p>
                      <ul className="space-y-1 pt-0.5">
                        {job.points.map((p, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-relaxed">
                            <ArrowRight className="w-3 h-3 text-primary/60 mt-0.5 flex-shrink-0" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Certifications & Recognition */}
            <div className="grid sm:grid-cols-2 gap-4">
              <motion.div variants={fadeIn}>
                <Card className="border-border/50 h-full">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      Certifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-1">
                    <ul className="space-y-1.5">
                      {[
                        'NVIDIA Certified: Agentic AI & GenAI LLMs',
                        'Azure AI Engineer, Data Scientist & Data Engineer',
                        'Certified Vibration Analyst (Cat III)',
                        'SAFe 6 Scrum Master & Release Train Engineer',
                        'Lean Six Sigma Black Belt',
                        'Google Project Management Certificate',
                      ].map((c, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-relaxed">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div variants={fadeIn}>
                <Card className="border-border/50 h-full">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Bell className="w-4 h-4 text-primary" />
                      Recognition
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-1">
                    <ul className="space-y-1.5">
                      {[
                        'Contextual Master Award — TCS Gems (2022)',
                        'Beyond Excellence Award — TCS Gems (2024)',
                        'Special Initiative Award — TCS Gems (2025)',
                        'Platinum Certified AI Mentor — TCS (2024)',
                        'Published researcher — Elsevier / Science Direct',
                        'Life Member — Vibration Institute (USA)',
                      ].map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-relaxed">
                          <CheckCircle2 className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Professional Affiliations */}
            <motion.div variants={fadeIn}>
              <Card className="border-border/50">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Professional Affiliations
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-1">
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Condition Monitoring Society of India',
                      'Vibration Institute (USA)',
                      'Association for Asset Management Professionals (USA)',
                      'Association for Machines & Mechanisms (IIT Madras)',
                      'Acoustic Society of India',
                      'Tribology Society of India',
                    ].map((a) => (
                      <Badge key={a} variant="secondary" className="text-[10px]">{a}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tech Stack */}
            <motion.div variants={fadeIn}>
              <Card className="border-border/50">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    Built With
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-1">
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-2.5">
                    This entire platform — from database schema to interactive map overlays — was built using Lovable's AI-powered development environment.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['React', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Recharts', 'Leaflet', 'PostgreSQL', 'Edge Functions', 'NVIDIA NIM', 'Lovable AI'].map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Domain Assumptions Disclosure */}
      <motion.div variants={fadeIn} initial="hidden" animate="show" transition={{ delay: 0.3 }}>
        <Card className="border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Domain Assumptions (Demonstration)</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
              {[
                'Synthetic outage scenarios — not connected to live systems',
                'Severity scale aligned to industry standard 1–5',
                'Hazard exposure modeled from overlay simulation',
                'Crew readiness simplified for demonstration purposes',
                'ETR bands are probabilistic, not guaranteed',
                'Geographic data is illustrative, not production GIS',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="text-muted-foreground/40 mt-0.5 text-[10px]">•</span>
                  <span className="text-[11px] text-muted-foreground leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer disclaimer */}
      <p className="text-[10px] text-muted-foreground/60 text-center pt-4">
        Prototype Demo • Synthetic Data • Decision Support Only • No SCADA/OMS/ADMS Integration
      </p>
    </div>
  );
}
