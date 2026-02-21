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
        data-tour-section="aop-banner"
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
      <motion.section {...fade} transition={{ delay: 0.05 }} data-tour-section="aop-domain-cards">
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
      <motion.section {...fade} transition={{ delay: 0.1 }} data-tour-section="aop-fusion-map">
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
          <div className="relative h-[420px] sm:h-[480px] bg-gradient-to-br from-[hsl(220,20%,10%)] via-[hsl(200,15%,12%)] to-[hsl(180,10%,8%)] overflow-hidden">
            {/* terrain texture lines */}
            <svg className="absolute inset-0 h-full w-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="topo" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M0 30Q15 10 30 30T60 30" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <path d="M0 45Q15 25 30 45T60 45" fill="none" stroke="currentColor" strokeWidth="0.3" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#topo)" />
            </svg>

            {/* grid overlay */}
            <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                  <path d="M80 0L0 0 0 80" fill="none" stroke="hsl(var(--primary))" strokeWidth="0.3" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* ── INFRASTRUCTURE SVG LAYER (towers, lines, trees) ── */}
            <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="feederGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
                  <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="powerLine" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.1" />
                  <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.1" />
                </linearGradient>
                <filter id="glowBlue" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
                </filter>
              </defs>

              {/* ── Transmission Lines (catenary curves between towers) ── */}
              <path d="M80,310 Q200,295 320,305" fill="none" stroke="url(#powerLine)" strokeWidth="1.5" />
              <path d="M320,305 Q480,290 620,300" fill="none" stroke="url(#powerLine)" strokeWidth="1.5" />
              <path d="M620,300 Q780,285 920,295" fill="none" stroke="url(#powerLine)" strokeWidth="1.5" />
              {/* glow duplicates */}
              <path d="M80,310 Q200,295 320,305" fill="none" stroke="#60a5fa" strokeWidth="3" opacity="0.08" filter="url(#glowBlue)" />
              <path d="M320,305 Q480,290 620,300" fill="none" stroke="#60a5fa" strokeWidth="3" opacity="0.08" filter="url(#glowBlue)" />
              <path d="M620,300 Q780,285 920,295" fill="none" stroke="#60a5fa" strokeWidth="3" opacity="0.08" filter="url(#glowBlue)" />

              {/* ── Transmission Towers ── */}
              {[
                { x: 80, y: 310 },
                { x: 320, y: 305 },
                { x: 620, y: 300 },
                { x: 920, y: 295 },
              ].map((t, i) => (
                <g key={`tower-${i}`} transform={`translate(${t.x}, ${t.y})`}>
                  {/* tower base */}
                  <line x1="-8" y1="0" x2="8" y2="0" stroke="#94a3b8" strokeWidth="1.5" opacity="0.5" />
                  {/* tower legs */}
                  <line x1="-6" y1="0" x2="-3" y2="-28" stroke="#94a3b8" strokeWidth="1" opacity="0.4" />
                  <line x1="6" y1="0" x2="3" y2="-28" stroke="#94a3b8" strokeWidth="1" opacity="0.4" />
                  {/* tower body */}
                  <line x1="0" y1="-5" x2="0" y2="-38" stroke="#94a3b8" strokeWidth="1.2" opacity="0.5" />
                  {/* cross arms */}
                  <line x1="-10" y1="-28" x2="10" y2="-28" stroke="#94a3b8" strokeWidth="1" opacity="0.4" />
                  <line x1="-7" y1="-33" x2="7" y2="-33" stroke="#94a3b8" strokeWidth="0.8" opacity="0.35" />
                  <line x1="-5" y1="-38" x2="5" y2="-38" stroke="#94a3b8" strokeWidth="0.8" opacity="0.35" />
                  {/* insulators */}
                  <circle cx="-10" cy="-28" r="1.5" fill="#60a5fa" opacity="0.4" />
                  <circle cx="10" cy="-28" r="1.5" fill="#60a5fa" opacity="0.4" />
                  <circle cx="-7" cy="-33" r="1" fill="#60a5fa" opacity="0.3" />
                  <circle cx="7" cy="-33" r="1" fill="#60a5fa" opacity="0.3" />
                  {/* label */}
                  <text x="0" y="12" textAnchor="middle" fill="#94a3b8" opacity="0.35" fontSize="7" fontFamily="monospace">T-{i + 1}</text>
                </g>
              ))}

              {/* ── Trees (along corridor edges) ── */}
              {[
                { x: 140, y: 330 }, { x: 170, y: 325 }, { x: 200, y: 335 },
                { x: 420, y: 320 }, { x: 460, y: 328 }, { x: 500, y: 318 },
                { x: 720, y: 315 }, { x: 760, y: 325 }, { x: 800, y: 312 },
                { x: 140, y: 280 }, { x: 450, y: 275 }, { x: 740, y: 272 },
              ].map((t, i) => (
                <g key={`tree-${i}`} transform={`translate(${t.x}, ${t.y})`} opacity={0.3 + (i % 3) * 0.1}>
                  {/* trunk */}
                  <line x1="0" y1="0" x2="0" y2="-8" stroke="#65a30d" strokeWidth="1.2" />
                  {/* canopy layers */}
                  <polygon points="-6,- 6 0,-18 6,-6" fill="#22c55e" opacity="0.25" />
                  <polygon points="-5,-10 0,-20 5,-10" fill="#16a34a" opacity="0.3" />
                  <polygon points="-3.5,-14 0,-22 3.5,-14" fill="#15803d" opacity="0.35" />
                </g>
              ))}

              {/* ── Feeder corridor labels ── */}
              <text x="22%" y="44%" fill="hsl(var(--primary))" opacity="0.25" fontSize="8" fontFamily="monospace">FDR-4401</text>
              <text x="58%" y="37%" fill="hsl(var(--primary))" opacity="0.25" fontSize="8" fontFamily="monospace">FDR-4402</text>
              <text x="42%" y="68%" fill="hsl(var(--primary))" opacity="0.25" fontSize="8" fontFamily="monospace">FDR-4403</text>

              {/* ── Feeder corridor dashed lines ── */}
              <line x1="5%" y1="65%" x2="45%" y2="30%" stroke="url(#feederGrad)" strokeWidth="2" strokeDasharray="8 4" />
              <line x1="45%" y1="30%" x2="90%" y2="50%" stroke="url(#feederGrad)" strokeWidth="2" strokeDasharray="8 4" />
              <line x1="25%" y1="75%" x2="70%" y2="20%" stroke="url(#feederGrad)" strokeWidth="1.5" strokeDasharray="6 4" />
              <line x1="15%" y1="40%" x2="60%" y2="70%" stroke="url(#feederGrad)" strokeWidth="1" strokeDasharray="4 4" />

              {/* ── Substation icons ── */}
              {[
                { x: 80, y: 350, label: 'SUB-A' },
                { x: 920, y: 340, label: 'SUB-B' },
              ].map((s, i) => (
                <g key={`sub-${i}`} transform={`translate(${s.x}, ${s.y})`}>
                  <rect x="-10" y="-8" width="20" height="16" rx="2" fill="none" stroke="#f59e0b" strokeWidth="0.8" opacity="0.4" />
                  <circle cx="0" cy="0" r="4" fill="none" stroke="#f59e0b" strokeWidth="0.6" opacity="0.3" />
                  <line x1="-3" y1="0" x2="3" y2="0" stroke="#f59e0b" strokeWidth="0.6" opacity="0.3" />
                  <text x="0" y="18" textAnchor="middle" fill="#f59e0b" opacity="0.4" fontSize="7" fontFamily="monospace">{s.label}</text>
                </g>
              ))}
            </svg>

            {/* ── SATELLITE HOTSPOTS ── */}
            {activeOverlays.includes('hotspots') && (
              <div className="animate-fade-in">
                {/* primary hotspot cluster */}
                <div className="absolute left-[16%] top-[28%]">
                  <div className="h-28 w-28 rounded-full bg-red-500/15 blur-2xl animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-10 w-10 rounded-full bg-red-500/30 blur-md" />
                    <Flame className="absolute h-5 w-5 text-red-400 drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
                  </div>
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-red-950/80 border border-red-500/30 px-2 py-0.5">
                    <span className="text-[9px] font-mono text-red-300">MODIS · 412°K · 94% conf</span>
                  </div>
                </div>
                {/* secondary hotspot */}
                <div className="absolute left-[54%] top-[42%]">
                  <div className="h-24 w-24 rounded-full bg-orange-500/12 blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full bg-orange-500/25 blur-md" />
                    <Flame className="absolute h-4 w-4 text-orange-400 drop-shadow-[0_0_6px_rgba(249,115,22,0.5)]" />
                  </div>
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-orange-950/80 border border-orange-500/30 px-2 py-0.5">
                    <span className="text-[9px] font-mono text-orange-300">VIIRS · 388°K · 78% conf</span>
                  </div>
                </div>
                {/* tertiary small */}
                <div className="absolute right-[22%] top-[22%]">
                  <div className="h-16 w-16 rounded-full bg-red-600/18 blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Flame className="h-3.5 w-3.5 text-red-300/80 drop-shadow-[0_0_4px_rgba(239,68,68,0.4)]" />
                  </div>
                </div>
              </div>
            )}

            {/* ── WIND VECTORS ── */}
            {activeOverlays.includes('wind') && (
              <div className="animate-fade-in">
                {[
                  { x: '28%', y: '18%', rot: 25, speed: 35, gust: 52 },
                  { x: '48%', y: '32%', rot: 20, speed: 28, gust: 41 },
                  { x: '38%', y: '55%', rot: 30, speed: 22, gust: 35 },
                  { x: '68%', y: '40%', rot: 15, speed: 31, gust: 47 },
                  { x: '80%', y: '25%', rot: 22, speed: 25, gust: 38 },
                ].map((w, i) => (
                  <div key={i} className="absolute" style={{ left: w.x, top: w.y }}>
                    <div className="relative" style={{ transform: `rotate(${w.rot}deg)` }}>
                      {/* animated arrow shaft */}
                      <div className="h-[2px] w-14 bg-gradient-to-r from-transparent via-sky-400/50 to-sky-400/80 rounded">
                        <div
                          className="h-full w-5 bg-sky-300/60 rounded animate-[windParticle_1.5s_ease-in-out_infinite]"
                          style={{ animationDelay: `${i * 0.3}s` }}
                        />
                      </div>
                      {/* arrowhead */}
                      <div className="absolute -right-1 -top-[3px] w-0 h-0 border-l-[6px] border-l-sky-400/80 border-y-[4px] border-y-transparent" />
                    </div>
                    <div className="mt-1 whitespace-nowrap rounded bg-sky-950/80 border border-sky-500/20 px-1.5 py-0.5">
                      <span className="text-[8px] font-mono text-sky-300">{w.speed} mph · G{w.gust}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── FUEL DRYNESS INDEX ── */}
            {activeOverlays.includes('fuel') && (
              <div className="animate-fade-in">
                {/* heat zone 1 */}
                <div className="absolute bottom-[18%] left-[22%]">
                  <div className="h-32 w-44 rounded-2xl bg-gradient-to-br from-amber-600/15 via-orange-600/10 to-red-600/8 blur-xl" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-lg border border-amber-500/25 bg-amber-950/70 px-3 py-1.5 backdrop-blur-sm">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Droplets className="h-3 w-3 text-amber-400" />
                        <span className="text-[9px] font-semibold text-amber-300 uppercase tracking-wider">Fuel Moisture</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-amber-600 via-orange-500 to-red-500" />
                        <span className="text-[9px] font-mono text-amber-200">8.2%</span>
                      </div>
                      <span className="text-[8px] text-red-400 font-medium">CRITICAL DRY</span>
                    </div>
                  </div>
                </div>
                {/* heat zone 2 */}
                <div className="absolute top-[15%] right-[15%]">
                  <div className="h-24 w-32 rounded-2xl bg-gradient-to-br from-amber-500/10 via-yellow-600/8 to-transparent blur-xl" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-lg border border-yellow-500/20 bg-yellow-950/60 px-2 py-1 backdrop-blur-sm">
                      <div className="flex items-center gap-1 mb-0.5">
                        <Droplets className="h-2.5 w-2.5 text-yellow-400" />
                        <span className="text-[8px] text-yellow-300 uppercase tracking-wider">Fuel</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-1 w-14 rounded-full bg-gradient-to-r from-yellow-600 to-amber-500" />
                        <span className="text-[8px] font-mono text-yellow-200">14%</span>
                      </div>
                      <span className="text-[7px] text-amber-300">ELEVATED</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── VEGETATION CONTACT RISK ── */}
            {activeOverlays.includes('vegetation') && (
              <div className="animate-fade-in">
                {/* risk corridor 1 */}
                <div className="absolute right-[28%] top-[35%]">
                  <div className="h-20 w-40 rounded-xl bg-emerald-500/8 blur-lg" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/70 px-3 py-1.5 backdrop-blur-sm">
                      <div className="flex items-center gap-1.5 mb-1">
                        <TreePine className="h-3 w-3 text-emerald-400" />
                        <span className="text-[9px] font-semibold text-emerald-300 uppercase tracking-wider">Veg Risk</span>
                      </div>
                      <div className="flex gap-0.5 mb-0.5">
                        {[85, 72, 91, 68, 95, 80].map((v, i) => (
                          <div key={i} className="w-2 rounded-sm bg-emerald-500/40" style={{ height: `${v / 5}px` }}>
                            <div className="w-full rounded-sm bg-emerald-400" style={{ height: `${v}%` }} />
                          </div>
                        ))}
                      </div>
                      <span className="text-[8px] text-emerald-200 font-mono">Score: 87/100 · HIGH</span>
                    </div>
                  </div>
                </div>
                {/* risk corridor 2 */}
                <div className="absolute left-[35%] top-[60%]">
                  <div className="h-14 w-28 rounded-xl bg-emerald-500/6 blur-lg" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded border border-emerald-500/20 bg-emerald-950/60 px-2 py-1 backdrop-blur-sm">
                      <div className="flex items-center gap-1">
                        <TreePine className="h-2.5 w-2.5 text-emerald-400/70" />
                        <span className="text-[8px] text-emerald-300">Veg: 62/100</span>
                      </div>
                      <span className="text-[7px] text-yellow-300">MODERATE</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── BIO-SENTINEL SIGNALS ── */}
            {activeOverlays.includes('biosentinel') && (
              <div className="animate-fade-in">
                {[
                  { x: '40%', y: '48%', conf: 72, label: 'Acoustic anomaly' },
                  { x: '62%', y: '28%', conf: 58, label: 'Behavioral shift' },
                  { x: '25%', y: '38%', conf: 45, label: 'Migration pattern' },
                ].map((b, i) => (
                  <div key={i} className="absolute" style={{ left: b.x, top: b.y }}>
                    {/* pulsing rings */}
                    <div className="relative flex items-center justify-center">
                      <div className="absolute h-10 w-10 rounded-full border border-violet-400/20 animate-ping" style={{ animationDuration: '2s', animationDelay: `${i * 0.4}s` }} />
                      <div className="absolute h-6 w-6 rounded-full border border-violet-400/30 animate-ping" style={{ animationDuration: '2s', animationDelay: `${i * 0.4 + 0.3}s` }} />
                      <div className="h-3.5 w-3.5 rounded-full bg-violet-500/60 shadow-[0_0_12px_rgba(139,92,246,0.5)]">
                        <Bug className="h-3.5 w-3.5 text-violet-200 p-[2px]" />
                      </div>
                    </div>
                    <div className="mt-2 whitespace-nowrap rounded bg-violet-950/80 border border-violet-500/25 px-2 py-0.5 backdrop-blur-sm">
                      <span className="text-[8px] font-mono text-violet-300">{b.label} · {b.conf}% conf</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* legend */}
            <div className="absolute bottom-3 left-3 rounded-lg border border-border/30 bg-card/90 px-3 py-2 backdrop-blur-sm">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Risk Index</p>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="h-2.5 w-20 rounded-full bg-gradient-to-r from-emerald-600 via-amber-500 to-red-600" />
                <span className="text-[9px] text-muted-foreground font-mono">0 – 100</span>
              </div>
              <div className="flex gap-2 text-[8px] text-muted-foreground/70">
                <span className="flex items-center gap-0.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Low</span>
                <span className="flex items-center gap-0.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />Med</span>
                <span className="flex items-center gap-0.5"><span className="h-1.5 w-1.5 rounded-full bg-red-500" />High</span>
              </div>
            </div>

            {/* active layers indicator */}
            <div className="absolute top-3 left-3 flex flex-col gap-1">
              {activeOverlays.map((o) => {
                const opt = overlayOptions.find((oo) => oo.value === o);
                if (!opt) return null;
                const colors: Record<string, string> = {
                  hotspots: 'border-red-500/30 text-red-300 bg-red-950/70',
                  wind: 'border-sky-500/30 text-sky-300 bg-sky-950/70',
                  fuel: 'border-amber-500/30 text-amber-300 bg-amber-950/70',
                  vegetation: 'border-emerald-500/30 text-emerald-300 bg-emerald-950/70',
                  biosentinel: 'border-violet-500/30 text-violet-300 bg-violet-950/70',
                };
                return (
                  <div key={o} className={cn('flex items-center gap-1.5 rounded-full border px-2 py-0.5 backdrop-blur-sm text-[8px] font-medium uppercase tracking-wider', colors[o])}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                    {opt.label}
                  </div>
                );
              })}
            </div>

            {/* disclaimer pill */}
            <div className="absolute bottom-3 right-3 rounded-full border border-amber-500/30 bg-card/80 px-3 py-1 backdrop-blur-sm">
              <span className="text-[9px] text-amber-400/80">Conceptual visualization · Synthetic demo overlays</span>
            </div>
          </div>
        </Card>
      </motion.section>

      {/* ── 4) BIO-SENTINEL MODULE ── */}
      <motion.section {...fade} transition={{ delay: 0.15 }} data-tour-section="aop-biosentinel">
        <SectionTitle className="mb-4">Bio-Sentinel Signals (Experimental) — Optional Secondary Indicator</SectionTitle>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* left: animated corridor visualization */}
          <Card className="overflow-hidden p-0">
            <div className="relative h-[340px] bg-gradient-to-b from-[hsl(270,20%,8%)] via-[hsl(260,15%,10%)] to-[hsl(250,12%,7%)]">
              {/* animated SVG corridor scene */}
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 500 340" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="bioGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                  </radialGradient>
                  <filter id="bioBlur" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                  </filter>
                  <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
                    <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* ground line */}
                <line x1="0" y1="260" x2="500" y2="260" stroke="#334155" strokeWidth="0.5" opacity="0.3" />

                {/* corridor trees (left side) */}
                {[60, 100, 145].map((x, i) => (
                  <g key={`btl-${i}`} transform={`translate(${x}, 260)`}>
                    <line x1="0" y1="0" x2="0" y2="-20" stroke="#15803d" strokeWidth="2" opacity="0.5" />
                    <polygon points="-12,-15 0,-42 12,-15" fill="#22c55e" opacity="0.2" />
                    <polygon points="-9,-22 0,-48 9,-22" fill="#16a34a" opacity="0.25" />
                    <polygon points="-6,-30 0,-52 6,-30" fill="#15803d" opacity="0.3" />
                  </g>
                ))}

                {/* corridor trees (right side) */}
                {[355, 400, 440].map((x, i) => (
                  <g key={`btr-${i}`} transform={`translate(${x}, 260)`}>
                    <line x1="0" y1="0" x2="0" y2="-20" stroke="#15803d" strokeWidth="2" opacity="0.5" />
                    <polygon points="-12,-15 0,-42 12,-15" fill="#22c55e" opacity="0.2" />
                    <polygon points="-9,-22 0,-48 9,-22" fill="#16a34a" opacity="0.25" />
                    <polygon points="-6,-30 0,-52 6,-30" fill="#15803d" opacity="0.3" />
                  </g>
                ))}

                {/* transmission tower (center) */}
                <g transform="translate(250, 260)">
                  <line x1="-12" y1="0" x2="12" y2="0" stroke="#94a3b8" strokeWidth="2" opacity="0.5" />
                  <line x1="-10" y1="0" x2="-4" y2="-55" stroke="#94a3b8" strokeWidth="1.5" opacity="0.4" />
                  <line x1="10" y1="0" x2="4" y2="-55" stroke="#94a3b8" strokeWidth="1.5" opacity="0.4" />
                  <line x1="0" y1="-10" x2="0" y2="-70" stroke="#94a3b8" strokeWidth="1.5" opacity="0.5" />
                  <line x1="-16" y1="-50" x2="16" y2="-50" stroke="#94a3b8" strokeWidth="1.2" opacity="0.4" />
                  <line x1="-12" y1="-58" x2="12" y2="-58" stroke="#94a3b8" strokeWidth="1" opacity="0.35" />
                  <line x1="-8" y1="-65" x2="8" y2="-65" stroke="#94a3b8" strokeWidth="0.8" opacity="0.3" />
                  <circle cx="-16" cy="-50" r="2.5" fill="#60a5fa" opacity="0.5" />
                  <circle cx="16" cy="-50" r="2.5" fill="#60a5fa" opacity="0.5" />
                </g>

                {/* power lines from tower */}
                <path d="M60,220 Q150,210 234,210" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.25" />
                <path d="M266,210 Q350,210 440,220" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.25" />

                {/* central sensor device */}
                <g transform="translate(250, 155)">
                  {/* sensor body */}
                  <rect x="-8" y="-6" width="16" height="12" rx="3" fill="#7c3aed" opacity="0.3" stroke="#8b5cf6" strokeWidth="0.8" />
                  <circle cx="0" cy="0" r="3" fill="#8b5cf6" opacity="0.6" />
                  {/* antenna */}
                  <line x1="0" y1="-6" x2="0" y2="-18" stroke="#a78bfa" strokeWidth="1" opacity="0.5" />
                  <circle cx="0" cy="-18" r="2" fill="#a78bfa" opacity="0.4" />
                </g>

                {/* animated sonar rings from sensor */}
                {[1, 2, 3].map((r) => (
                  <circle
                    key={`ring-${r}`}
                    cx="250" cy="155"
                    r={25 * r}
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="0.8"
                    opacity="0"
                  >
                    <animate
                      attributeName="r"
                      from="10"
                      to={60 + r * 30}
                      dur="3s"
                      begin={`${r * 0.8}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.4"
                      to="0"
                      dur="3s"
                      begin={`${r * 0.8}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                ))}

                {/* waveform visualization */}
                <g transform="translate(250, 295)">
                  {Array.from({ length: 40 }).map((_, i) => {
                    const h = Math.sin(i * 0.5) * 8 + Math.sin(i * 0.3) * 5;
                    return (
                      <rect
                        key={`wave-${i}`}
                        x={-100 + i * 5}
                        y={-Math.abs(h)}
                        width="3"
                        height={Math.abs(h) * 2 + 1}
                        rx="1"
                        fill="#8b5cf6"
                        opacity={0.15 + Math.abs(h) * 0.02}
                      >
                        <animate
                          attributeName="height"
                          values={`${Math.abs(h) * 2 + 1};${Math.abs(h) * 3 + 2};${Math.abs(h) * 2 + 1}`}
                          dur={`${1.5 + (i % 5) * 0.2}s`}
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="y"
                          values={`${-Math.abs(h)};${-Math.abs(h) * 1.5};${-Math.abs(h)}`}
                          dur={`${1.5 + (i % 5) * 0.2}s`}
                          repeatCount="indefinite"
                        />
                      </rect>
                    );
                  })}
                </g>

                {/* label */}
                <text x="250" y="330" textAnchor="middle" fill="#a78bfa" fontSize="9" fontFamily="monospace" opacity="0.5">
                  ACOUSTIC &amp; BEHAVIORAL ANOMALY DETECTION
                </text>
                <text x="250" y="125" textAnchor="middle" fill="#c4b5fd" fontSize="10" fontFamily="sans-serif" fontWeight="600" opacity="0.7">
                  Bio-Sentinel Sensor Node
                </text>

                {/* signal path indicators */}
                {[
                  { x1: 100, y1: 230, x2: 220, y2: 165 },
                  { x1: 400, y1: 230, x2: 280, y2: 165 },
                ].map((p, i) => (
                  <g key={`sig-${i}`}>
                    <line {...p} stroke="#8b5cf6" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.25" />
                    <circle cx={p.x2} cy={p.y2} r="2" fill="#8b5cf6" opacity="0.4">
                      <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" begin={`${i * 0.5}s`} />
                    </circle>
                  </g>
                ))}

                {/* anomaly indicator badges */}
                <g transform="translate(120, 175)">
                  <rect x="-35" y="-8" width="70" height="16" rx="8" fill="#7c3aed" opacity="0.15" stroke="#8b5cf6" strokeWidth="0.5" />
                  <text x="0" y="4" textAnchor="middle" fill="#c4b5fd" fontSize="7" fontFamily="monospace">ANOMALY 72%</text>
                </g>
                <g transform="translate(380, 180)">
                  <rect x="-35" y="-8" width="70" height="16" rx="8" fill="#7c3aed" opacity="0.15" stroke="#8b5cf6" strokeWidth="0.5" />
                  <text x="0" y="4" textAnchor="middle" fill="#c4b5fd" fontSize="7" fontFamily="monospace">ANOMALY 58%</text>
                </g>

                {/* ambient glow */}
                <circle cx="250" cy="155" r="80" fill="url(#bioGlow)" />
              </svg>

              {/* corridor label */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-violet-500/30" />
                <span className="text-[9px] uppercase tracking-[0.2em] text-violet-400/50 font-medium">Right-of-Way Corridor</span>
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-violet-500/30" />
              </div>
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

              {/* live signal feed mockup */}
              <div className="rounded-lg border border-violet-500/20 bg-violet-950/20 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-semibold text-violet-300 uppercase tracking-wider">Live Signal Feed</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  {[
                    { time: '14:32:18', type: 'Acoustic', val: '72%', color: 'text-violet-300' },
                    { time: '14:31:45', type: 'Behavioral', val: '58%', color: 'text-violet-300/70' },
                    { time: '14:30:02', type: 'Migration', val: '45%', color: 'text-violet-300/50' },
                    { time: '14:28:11', type: 'Acoustic', val: '31%', color: 'text-violet-300/40' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-[9px] font-mono">
                      <span className="text-muted-foreground/40">{s.time}</span>
                      <span className={s.color}>{s.type}</span>
                      <span className="ml-auto text-violet-200/60">{s.val}</span>
                      <div className="h-1 w-10 rounded-full bg-violet-950">
                        <div className="h-full rounded-full bg-violet-500/50" style={{ width: s.val }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      {/* ── 5) BRIDGE SECTION: PHASE 1 vs PHASE 2 ── */}
      <motion.section {...fade} transition={{ delay: 0.2 }} data-tour-section="aop-phase-bridge">
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
      <motion.section {...fade} transition={{ delay: 0.25 }} data-tour-section="aop-governance">
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
