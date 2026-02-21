import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Flame, TreePine, ShieldAlert, Layers, Wind, Droplets, Bug, Radio,
  ArrowRight, Lock, Sparkles, Eye, BarChart3, AlertTriangle, CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useState } from 'react';
import { cn } from '@/lib/utils';

/* ── tiny helpers ── */
const SectionTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h2 className={cn('text-lg font-semibold text-foreground tracking-tight', className)}>{children}</h2>
);

const fade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } };

/* ── "Why This Matters" cards data ── */
const domainCards = [
  {
    icon: Flame,
    title: 'Wildfire Corridor Awareness',
    text: 'Combine hazard layers to anticipate exposure along high-risk ROW segments and feeder corridors.',
    accent: 'text-orange-400',
  },
  {
    icon: TreePine,
    title: 'Vegetation Stress & Contact Risk',
    text: 'Detect conditions that increase tree contact probability (wind, dryness, corridor history) to support preventive staging.',
    accent: 'text-emerald-400',
  },
  {
    icon: ShieldAlert,
    title: 'Crew Safety Context',
    text: 'Surface hazard intensity and access constraints early to reduce field risk during fast-moving fire conditions.',
    accent: 'text-sky-400',
  },
];

/* ── overlay toggle options ── */
const overlayOptions = [
  { value: 'hotspots', label: 'Satellite Hotspots', icon: Flame },
  { value: 'wind', label: 'Wind Vectors', icon: Wind },
  { value: 'fuel', label: 'Fuel Dryness Index', icon: Droplets },
  { value: 'vegetation', label: 'Vegetation Contact Risk', icon: TreePine },
  { value: 'biosentinel', label: 'Bio-Sentinel Signals', icon: Bug },
];

/* ── comparison table data ── */
const comparisonRows = [
  ['Event triage + severity', 'Environmental signal fusion (multi-layer)'],
  ['ETR confidence band', 'Vegetation stress intelligence'],
  ['Critical-load runway', 'Bio-sentinel anomaly corroboration'],
  ['Hazard overlays (current)', 'Corridor-based risk scoring'],
  ['Operator-approved reports', 'Proactive staging recommendations (advisory)'],
];

/* ── bio-sentinel flow ── */
const bioFlow = [
  { step: 1, label: 'Edge Signals', detail: 'Acoustic / corridor sensors / partner feeds' },
  { step: 2, label: 'Anomaly Detection', detail: 'Baseline vs deviation' },
  { step: 3, label: 'Confidence Weighting', detail: 'Combines weather + hotspot proximity' },
  { step: 4, label: 'Risk Context Update', detail: 'Advisory highlight only' },
];

/* ══════════════════════════════════════════════════════════════════════ */

export default function ArtOfPossibilities() {
  const navigate = useNavigate();
  const [activeOverlays, setActiveOverlays] = useState<string[]>(['hotspots', 'wind']);

  return (
    <div className="min-h-screen space-y-10 pb-16">
      {/* ── 1) TOP BANNER ── */}
      <motion.section
        {...fade}
        className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-card via-card to-[hsl(var(--primary)/0.04)] px-6 py-7 sm:px-8"
      >
        {/* decorative glow */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Art of Possibilities</h1>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Future Environmental Intelligence for Wildfire &amp; Vegetation Risk
            </p>
            <p className="text-[11px] leading-relaxed text-muted-foreground/70">
              Designed to augment operator situational awareness — advisory only, no control actions.
            </p>
          </div>

          <Badge variant="outline" className="shrink-0 border-amber-500/40 bg-amber-500/5 text-amber-400 text-[10px] uppercase tracking-widest px-3 py-1">
            Concept · Phase 2+ · Not Active in Phase 1
          </Badge>
        </div>
      </motion.section>

      {/* ── 2) WHY THIS MATTERS ── */}
      <motion.section {...fade} transition={{ delay: 0.05 }}>
        <SectionTitle className="mb-4">Why This Matters</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-3">
          {domainCards.map((c) => (
            <Card
              key={c.title}
              className="group transition-shadow duration-200 hover:shadow-md hover:shadow-primary/5 hover:border-border/80"
            >
              <CardContent className="flex flex-col gap-2 p-5">
                <c.icon className={cn('h-5 w-5', c.accent)} strokeWidth={1.6} />
                <h3 className="text-[13px] font-semibold text-foreground">{c.title}</h3>
                <p className="text-[12px] leading-relaxed text-muted-foreground">{c.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.section>

      {/* ── 3) CONCEPT VISUALIZATION MAP ── */}
      <motion.section {...fade} transition={{ delay: 0.1 }}>
        <Card className="overflow-hidden border-border/30">
          <div className="flex flex-col gap-3 border-b border-border/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <SectionTitle>Environmental Signal Fusion Overlay</SectionTitle>
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Concept</span>
            </div>
            <ToggleGroup
              type="multiple"
              value={activeOverlays}
              onValueChange={(v) => v.length && setActiveOverlays(v)}
              className="flex flex-wrap gap-1"
            >
              {overlayOptions.map((o) => (
                <ToggleGroupItem
                  key={o.value}
                  value={o.value}
                  size="sm"
                  className="gap-1.5 text-[11px] data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                >
                  <o.icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{o.label}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* mock map area */}
          <div className="relative h-[340px] sm:h-[400px] bg-gradient-to-br from-[hsl(220,20%,10%)] via-[hsl(200,15%,12%)] to-[hsl(180,10%,8%)] overflow-hidden">
            {/* terrain texture lines */}
            <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="topo" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M0 30Q15 10 30 30T60 30" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <path d="M0 45Q15 25 30 45T60 45" fill="none" stroke="currentColor" strokeWidth="0.3" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#topo)" />
            </svg>

            {/* heatmap blobs */}
            {activeOverlays.includes('hotspots') && (
              <>
                <div className="absolute left-[18%] top-[30%] h-24 w-24 rounded-full bg-red-500/20 blur-2xl" />
                <div className="absolute left-[55%] top-[45%] h-32 w-32 rounded-full bg-orange-500/15 blur-3xl" />
                <div className="absolute right-[20%] top-[25%] h-20 w-20 rounded-full bg-red-600/25 blur-2xl" />
              </>
            )}
            {activeOverlays.includes('wind') && (
              <>
                <div className="absolute left-[30%] top-[20%] h-1 w-20 rotate-[25deg] rounded bg-sky-400/30" />
                <div className="absolute left-[50%] top-[35%] h-1 w-28 rotate-[20deg] rounded bg-sky-400/25" />
                <div className="absolute left-[40%] top-[60%] h-1 w-16 rotate-[30deg] rounded bg-sky-300/20" />
              </>
            )}
            {activeOverlays.includes('fuel') && (
              <div className="absolute bottom-[20%] left-[25%] h-28 w-40 rounded-xl bg-amber-600/10 blur-2xl" />
            )}
            {activeOverlays.includes('vegetation') && (
              <div className="absolute right-[30%] top-[40%] h-24 w-36 rounded-xl bg-emerald-500/10 blur-2xl" />
            )}
            {activeOverlays.includes('biosentinel') && (
              <>
                <div className="absolute left-[42%] top-[50%] h-3 w-3 rounded-full bg-violet-400/60 animate-pulse" />
                <div className="absolute left-[60%] top-[30%] h-2.5 w-2.5 rounded-full bg-violet-400/50 animate-pulse" />
              </>
            )}

            {/* feeder lines */}
            <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <line x1="10%" y1="60%" x2="45%" y2="35%" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.15" strokeDasharray="6 4" />
              <line x1="45%" y1="35%" x2="85%" y2="50%" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.15" strokeDasharray="6 4" />
              <line x1="30%" y1="70%" x2="70%" y2="25%" stroke="hsl(var(--primary))" strokeWidth="0.8" opacity="0.1" strokeDasharray="4 4" />
            </svg>

            {/* legend */}
            <div className="absolute bottom-3 left-3 rounded-lg border border-border/30 bg-card/80 px-3 py-2 backdrop-blur-sm">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Risk Index</p>
              <div className="flex items-center gap-1">
                <div className="h-2 w-16 rounded-full bg-gradient-to-r from-emerald-600 via-amber-500 to-red-600" />
                <span className="text-[9px] text-muted-foreground">0 – 100</span>
              </div>
              <p className="mt-1 text-[9px] text-muted-foreground/70">Confidence: Low / Medium / High</p>
            </div>

            {/* disclaimer pill */}
            <div className="absolute bottom-3 right-3 rounded-full border border-amber-500/30 bg-card/80 px-3 py-1 backdrop-blur-sm">
              <span className="text-[9px] text-amber-400/80">Conceptual visualization · Synthetic demo overlays</span>
            </div>
          </div>
        </Card>
      </motion.section>

      {/* ── 4) BIO-SENTINEL MODULE ── */}
      <motion.section {...fade} transition={{ delay: 0.15 }}>
        <SectionTitle className="mb-4">Bio-Sentinel Signals (Experimental) — Optional Secondary Indicator</SectionTitle>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* left: illustration */}
          <Card className="flex items-center justify-center p-6">
            <div className="relative flex flex-col items-center gap-3 text-center">
              <div className="relative">
                <Radio className="h-14 w-14 text-violet-400/60" strokeWidth={1.2} />
                <Bug className="absolute -right-2 -top-1 h-5 w-5 text-violet-300/80 animate-pulse" />
              </div>
              <div className="flex items-center gap-4 text-muted-foreground/50">
                <TreePine className="h-6 w-6" />
                <span className="text-[10px] uppercase tracking-widest">corridor</span>
                <TreePine className="h-6 w-6" />
              </div>
              <p className="max-w-[200px] text-[10px] text-muted-foreground/60">
                Acoustic &amp; behavioral anomaly detection across right-of-way corridors
              </p>
            </div>
          </Card>

          {/* right: explanation */}
          <Card>
            <CardContent className="space-y-4 p-5">
              <ul className="space-y-2.5">
                {[
                  'Signals are probabilistic and may be noisy.',
                  'Used only to corroborate other evidence layers (satellite/weather/field reports).',
                  'Does not trigger dispatch, switching, or restoration actions.',
                  'Operator review required before any operational interpretation.',
                ].map((b) => (
                  <li key={b} className="flex items-start gap-2 text-[12px] leading-relaxed text-muted-foreground">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/70" />
                    {b}
                  </li>
                ))}
              </ul>

              <div className="rounded-lg border border-border/30 bg-muted/30 p-4">
                <p className="mb-3 text-[11px] font-semibold text-foreground/80">How it would work</p>
                <div className="flex flex-col gap-2">
                  {bioFlow.map((f, i) => (
                    <div key={f.step} className="flex items-center gap-2.5">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        {f.step}
                      </span>
                      <div>
                        <span className="text-[11px] font-medium text-foreground/90">{f.label}</span>
                        <span className="ml-1.5 text-[10px] text-muted-foreground/60">— {f.detail}</span>
                      </div>
                      {i < bioFlow.length - 1 && <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground/30" />}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      {/* ── 5) BRIDGE SECTION: PHASE 1 vs PHASE 2 ── */}
      <motion.section {...fade} transition={{ delay: 0.2 }}>
        <SectionTitle className="mb-4">How This Connects to Operator Copilot (Current Phase 1)</SectionTitle>

        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-2 border-b border-border/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <div className="border-r border-border/30 px-5 py-3">Phase 1 (Current Demo)</div>
              <div className="px-5 py-3">Phase 2+ (Concept Extensions)</div>
            </div>
            {comparisonRows.map(([p1, p2], i) => (
              <div
                key={i}
                className={cn(
                  'grid grid-cols-2 text-[12px]',
                  i < comparisonRows.length - 1 && 'border-b border-border/20',
                )}
              >
                <div className="flex items-center gap-2 border-r border-border/20 px-5 py-3 text-foreground/80">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400/70" />
                  {p1}
                </div>
                <div className="flex items-center gap-2 px-5 py-3 text-muted-foreground">
                  <Eye className="h-3.5 w-3.5 shrink-0 text-primary/50" />
                  {p2}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <p className="mt-3 text-[11px] text-muted-foreground/70">
          Phase 1 remains OMS-adjacent decision support. Phase 2 adds environmental intelligence as a bounded advisory layer.
        </p>
      </motion.section>

      {/* ── 6) GOVERNANCE ── */}
      <motion.section {...fade} transition={{ delay: 0.25 }}>
        <Card className="border-amber-500/20 bg-card">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:gap-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/5">
              <Lock className="h-5 w-5 text-amber-400" />
            </div>
            <div className="space-y-2.5">
              <h3 className="text-[14px] font-semibold text-foreground">Operational Governance</h3>
              <ul className="space-y-1.5">
                {[
                  'Decision-support only. No autonomous control actions.',
                  'No live SCADA/OMS/ADMS integration in this demo.',
                  'Concept features require validation, sensor partnerships, and utility governance approval.',
                  'All outputs remain advisory and must be operator-approved.',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                    <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/60" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* ── 7) CTA ── */}
      <div className="flex justify-center pt-2">
        <Button
          variant="outline"
          className="gap-2 text-sm"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4" />
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}
