import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Flame, TreePine, ShieldAlert, Layers, Wind, Droplets, Bug, Radio,
  ArrowRight, Lock, Sparkles, Eye, BarChart3, AlertTriangle, CheckCircle2,
  ArrowLeft, Mountain, PawPrint, CloudRain, ChevronDown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useState } from 'react';
import { cn } from '@/lib/utils';

/* ── tiny helpers ── */
const SectionTitle = ({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) => (
  <h2 id={id} className={cn('text-xl font-bold text-foreground tracking-tight scroll-mt-20', className)}>{children}</h2>
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
  ['Operator-approved reports', 'Proactive staging advisory insights'],
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
  const [highlightedZone, setHighlightedZone] = useState<string | null>(null);
  const [cloudburstIntensity, setCloudburstIntensity] = useState(50); // 0-100

  return (
    <div className="min-h-screen space-y-10 pb-16">
      <p className="px-1 text-xs text-muted-foreground/70 italic">Reference concepts and roadmap ideas (non-operational).</p>
      {/* ── SECTION NAVIGATION BAR ── */}
      <nav className="sticky top-0 z-30 -mx-1 rounded-lg border border-border/30 bg-card/95 backdrop-blur-md px-4 py-2.5 flex items-center gap-1 overflow-x-auto scrollbar-none">
        {[
          { href: '#aop-banner', label: 'Overview', icon: Sparkles },
          { href: '#aop-domain-cards', label: 'Why It Matters', icon: Eye },
          { href: '#aop-fusion-map', label: 'Fusion Map', icon: Layers },
          { href: '#aop-bio-sentinel', label: 'Bio-Sentinel', icon: Bug },
          { href: '#aop-smoke-sensing', label: 'Smoke & Nature', icon: Flame },
          { href: '#aop-ground-level', label: 'Ground Level', icon: Mountain },
          { href: '#aop-phase-bridge', label: 'Phase Bridge', icon: BarChart3 },
          { href: '#aop-governance', label: 'Governance', icon: Lock },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <link.icon className="h-3.5 w-3.5" />
            {link.label}
          </a>
        ))}
        <ChevronDown className="ml-auto h-3.5 w-3.5 text-muted-foreground/40 shrink-0 sm:hidden" />
      </nav>

      {/* ── 1) TOP BANNER ── */}
      <motion.section
        {...fade}
        id="aop-banner"
        data-tour-section="aop-banner"
        className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-card via-card to-[hsl(var(--primary)/0.04)] px-6 py-8 sm:px-8"
      >
        {/* decorative glow */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Art of Possibilities</h1>
            </div>
            <p className="text-base font-medium text-muted-foreground">
              Future Environmental Intelligence for Wildfire &amp; Vegetation Risk
            </p>
            <p className="text-[13px] leading-relaxed text-muted-foreground/80">
              Designed to augment operator situational awareness — advisory only, no control actions.
            </p>
          </div>

          <Badge variant="outline" className="shrink-0 border-amber-500/40 bg-amber-500/5 text-amber-400 text-[11px] uppercase tracking-widest px-3 py-1.5">
            Concept · Phase 2+ · Not Active in Phase 1
          </Badge>
        </div>
      </motion.section>

      {/* ── 2) WHY THIS MATTERS ── */}
      <motion.section {...fade} transition={{ delay: 0.05 }} id="aop-domain-cards" data-tour-section="aop-domain-cards">
        <SectionTitle className="mb-4" id="aop-domain-cards-title">Why This Matters</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-3">
          {domainCards.map((c) => (
            <Card
              key={c.title}
              className="group transition-shadow duration-200 hover:shadow-md hover:shadow-primary/5 hover:border-border/80"
            >
              <CardContent className="flex flex-col gap-2.5 p-5">
                <c.icon className={cn('h-6 w-6', c.accent)} strokeWidth={1.6} />
                <h3 className="text-[15px] font-semibold text-foreground">{c.title}</h3>
                <p className="text-[13px] leading-relaxed text-muted-foreground">{c.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.section>

      {/* ── 3) CONCEPT VISUALIZATION MAP ── */}
      <motion.section {...fade} transition={{ delay: 0.1 }} id="aop-fusion-map" data-tour-section="aop-fusion-map">
        <Card className="overflow-hidden border-border/30">
          <div className="flex flex-col gap-3 border-b border-border/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <SectionTitle>Environmental Signal Fusion Overlay</SectionTitle>
              <span className="text-[11px] text-muted-foreground/70 uppercase tracking-wider">Concept Visualization</span>
            </div>
            <ToggleGroup
              type="multiple"
              value={activeOverlays}
              onValueChange={(v) => v.length && setActiveOverlays(v)}
              className="flex flex-wrap gap-1.5"
            >
              {overlayOptions.map((o) => (
                <ToggleGroupItem
                  key={o.value}
                  value={o.value}
                  size="sm"
                  className="gap-1.5 text-[12px] px-3 py-1.5 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                >
                  <o.icon className="h-3.5 w-3.5" />
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
                <filter id="glowRed" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                </filter>
                <linearGradient id="riskHeat" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0" />
                  <stop offset="30%" stopColor="#ef4444" stopOpacity="0.6" />
                  <stop offset="70%" stopColor="#f97316" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* ── Transmission Lines (catenary curves between towers) ── */}
              {[
                "M80,310 Q200,295 320,305",
                "M320,305 Q480,290 620,300",
                "M620,300 Q780,285 920,295",
              ].map((d, i) => (
                <g key={`line-${i}`}>
                  <path d={d} fill="none" stroke="url(#powerLine)" strokeWidth="1.5" />
                  <path d={d} fill="none" stroke="#60a5fa" strokeWidth="3" opacity="0.08" filter="url(#glowBlue)" />
                  {/* power flow particles */}
                  {[0, 1, 2].map((p) => (
                    <circle key={`particle-${i}-${p}`} r="2.5" fill="#60a5fa" opacity="0">
                      <animateMotion dur={`${2.5 + p * 0.4}s`} begin={`${p * 0.8 + i * 0.3}s`} repeatCount="indefinite" path={d} />
                      <animate attributeName="opacity" values="0;0.7;0.9;0.7;0" dur={`${2.5 + p * 0.4}s`} begin={`${p * 0.8 + i * 0.3}s`} repeatCount="indefinite" />
                      <animate attributeName="r" values="1.5;3;1.5" dur={`${2.5 + p * 0.4}s`} begin={`${p * 0.8 + i * 0.3}s`} repeatCount="indefinite" />
                    </circle>
                  ))}
                  {/* glow trail particle */}
                  <circle r="6" fill="#60a5fa" opacity="0" filter="url(#glowBlue)">
                    <animateMotion dur="3s" begin={`${i * 0.5}s`} repeatCount="indefinite" path={d} />
                    <animate attributeName="opacity" values="0;0.2;0.3;0.2;0" dur="3s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
                  </circle>
                </g>
              ))}

              {/* ── Corridor Risk Heat-Lines (glow when hotspots/vegetation active) ── */}
              {(activeOverlays.includes('hotspots') || activeOverlays.includes('vegetation')) && (
                <g className="animate-fade-in">
                  {/* segment 1: near hotspot zone (towers 1-2) */}
                  {activeOverlays.includes('hotspots') && (
                    <>
                      <path d="M80,310 Q200,295 320,305" fill="none" stroke="url(#riskHeat)" strokeWidth="6" opacity="0.4">
                        <animate attributeName="opacity" values="0.25;0.5;0.25" dur="2s" repeatCount="indefinite" />
                      </path>
                      <path d="M80,310 Q200,295 320,305" fill="none" stroke="#ef4444" strokeWidth="10" opacity="0.08" filter="url(#glowRed)">
                        <animate attributeName="opacity" values="0.05;0.12;0.05" dur="2s" repeatCount="indefinite" />
                      </path>
                      {/* risk label */}
                      <g transform="translate(200, 285)">
                        <rect x="-28" y="-7" width="56" height="14" rx="7" fill="#7f1d1d" opacity="0.7" stroke="#ef4444" strokeWidth="0.5" />
                        <text x="0" y="3" textAnchor="middle" fill="#fca5a5" fontSize="6" fontFamily="monospace">FIRE RISK</text>
                        <circle cx="22" cy="0" r="1.5" fill="#ef4444">
                          <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />
                        </circle>
                      </g>
                    </>
                  )}
                  {/* segment 3: near vegetation zone (towers 3-4) */}
                  {activeOverlays.includes('vegetation') && (
                    <>
                      <path d="M620,300 Q780,285 920,295" fill="none" stroke="#22c55e" strokeWidth="5" opacity="0.3">
                        <animate attributeName="opacity" values="0.2;0.4;0.2" dur="2.5s" repeatCount="indefinite" />
                      </path>
                      <path d="M620,300 Q780,285 920,295" fill="none" stroke="#22c55e" strokeWidth="10" opacity="0.06" filter="url(#glowBlue)">
                        <animate attributeName="opacity" values="0.04;0.1;0.04" dur="2.5s" repeatCount="indefinite" />
                      </path>
                      <g transform="translate(770, 278)">
                        <rect x="-28" y="-7" width="56" height="14" rx="7" fill="#052e16" opacity="0.7" stroke="#22c55e" strokeWidth="0.5" />
                        <text x="0" y="3" textAnchor="middle" fill="#86efac" fontSize="6" fontFamily="monospace">VEG RISK</text>
                        <circle cx="22" cy="0" r="1.5" fill="#22c55e">
                          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" />
                        </circle>
                      </g>
                    </>
                  )}
                </g>
              )}

              {/* ── Transmission Towers with spark effects ── */}
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

                  {/* ── Spark effects at insulator points ── */}
                  {[
                    { cx: -10, cy: -28 },
                    { cx: 10, cy: -28 },
                  ].map((ins, j) => (
                    <g key={`spark-${i}-${j}`}>
                      {/* pulsing glow */}
                      <circle cx={ins.cx} cy={ins.cy} r="5" fill="#60a5fa" opacity="0" filter="url(#glowBlue)">
                        <animate attributeName="opacity" values="0;0.5;0" dur="2.2s" begin={`${i * 0.6 + j * 1.1}s`} repeatCount="indefinite" />
                        <animate attributeName="r" values="3;8;3" dur="2.2s" begin={`${i * 0.6 + j * 1.1}s`} repeatCount="indefinite" />
                      </circle>
                      {/* spark lines radiating outward */}
                      {[0, 60, 120, 180, 240, 300].map((angle, k) => {
                        const rad = (angle * Math.PI) / 180;
                        const len = 5 + (k % 2) * 3;
                        return (
                          <line
                            key={`sl-${k}`}
                            x1={ins.cx}
                            y1={ins.cy}
                            x2={ins.cx + Math.cos(rad) * len}
                            y2={ins.cy + Math.sin(rad) * len}
                            stroke="#93c5fd"
                            strokeWidth="0.6"
                            opacity="0"
                            strokeLinecap="round"
                          >
                            <animate attributeName="opacity" values="0;0.7;0" dur="1.8s" begin={`${i * 0.6 + j * 1.1 + k * 0.08}s`} repeatCount="indefinite" />
                          </line>
                        );
                      })}
                      {/* tiny bright dot burst */}
                      <circle cx={ins.cx} cy={ins.cy} r="1" fill="#dbeafe" opacity="0">
                        <animate attributeName="opacity" values="0;1;0" dur="1.8s" begin={`${i * 0.6 + j * 1.1}s`} repeatCount="indefinite" />
                      </circle>
                    </g>
                  ))}

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
                  { x: '40%', y: '48%', conf: 72, label: 'Acoustic anomaly', zone: 'FDR-4401' },
                  { x: '62%', y: '28%', conf: 58, label: 'Behavioral shift', zone: 'FDR-4402' },
                  { x: '25%', y: '38%', conf: 45, label: 'Migration pattern', zone: 'FDR-4403' },
                ].map((b, i) => {
                  const isHighlighted = highlightedZone === b.zone;
                  return (
                    <div key={i} className={cn('absolute transition-all duration-500', isHighlighted && 'z-20')} style={{ left: b.x, top: b.y }}>
                      {/* highlight ring */}
                      {isHighlighted && (
                        <>
                          <div className="absolute -inset-6 rounded-full border-2 border-amber-400/60 animate-pulse" />
                          <div className="absolute -inset-10 rounded-full border border-amber-400/25 animate-ping" style={{ animationDuration: '1.5s' }} />
                        </>
                      )}
                      {/* pulsing rings */}
                      <div className="relative flex items-center justify-center">
                        <div className={cn('absolute h-10 w-10 rounded-full border animate-ping', isHighlighted ? 'border-amber-400/40' : 'border-violet-400/20')} style={{ animationDuration: '2s', animationDelay: `${i * 0.4}s` }} />
                        <div className={cn('absolute h-6 w-6 rounded-full border animate-ping', isHighlighted ? 'border-amber-400/50' : 'border-violet-400/30')} style={{ animationDuration: '2s', animationDelay: `${i * 0.4 + 0.3}s` }} />
                        <div className={cn('h-3.5 w-3.5 rounded-full', isHighlighted ? 'bg-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.7)]' : 'bg-violet-500/60 shadow-[0_0_12px_rgba(139,92,246,0.5)]')}>
                          <Bug className={cn('h-3.5 w-3.5 p-[2px]', isHighlighted ? 'text-amber-100' : 'text-violet-200')} />
                        </div>
                      </div>
                      <div className={cn('mt-2 whitespace-nowrap rounded border px-2 py-0.5 backdrop-blur-sm', isHighlighted ? 'bg-amber-950/90 border-amber-400/50' : 'bg-violet-950/80 border-violet-500/25')}>
                        <span className={cn('text-[8px] font-mono', isHighlighted ? 'text-amber-200 font-semibold' : 'text-violet-300')}>{b.label} · {b.conf}% conf</span>
                        {isHighlighted && <span className="ml-1 text-[7px] text-amber-400 animate-pulse">● FOCUS</span>}
                      </div>
                    </div>
                  );
                })}
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
      <motion.section {...fade} transition={{ delay: 0.15 }} id="aop-bio-sentinel" data-tour-section="aop-biosentinel">
        <SectionTitle className="mb-4">Bio-Sentinel Signals (Experimental) — Optional Secondary Indicator</SectionTitle>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* left column wrapper */}
          <div className="flex flex-col gap-4">
          {/* left: animated corridor visualization */}
          <Card className="overflow-hidden p-0">
            <div className="relative h-[580px] bg-gradient-to-b from-[hsl(270,20%,8%)] via-[hsl(260,15%,10%)] to-[hsl(250,12%,7%)]">
              {/* animated SVG corridor scene */}
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 500 580" xmlns="http://www.w3.org/2000/svg">
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

                {/* ── Signal Strength Meter (right of sensor) ── */}
                {(() => {
                  const isActive = activeOverlays.includes('biosentinel');
                  return (
                    <g transform="translate(310, 130)">
                      {/* meter background */}
                      <rect x="0" y="0" width="48" height="56" rx="4" fill="#1e1b4b" opacity="0.6" stroke="#8b5cf6" strokeWidth="0.5" />
                      <text x="24" y="11" textAnchor="middle" fill="#a78bfa" fontSize="6" fontFamily="monospace" opacity="0.8">SIGNAL</text>
                      {/* 5-bar meter */}
                      {[0, 1, 2, 3, 4].map((b) => {
                        const barH = 4 + b * 2;
                        const x = 6 + b * 8;
                        const yBase = 46;
                        const litColor = b < 2 ? '#22c55e' : b < 4 ? '#f59e0b' : '#ef4444';
                        const lit = isActive ? true : b < 2;
                        return (
                          <g key={`bar-${b}`}>
                            <rect x={x} y={yBase - barH} width="5" height={barH} rx="1" fill={lit ? litColor : '#334155'} opacity={lit ? 0.7 : 0.2}>
                              {isActive && (
                                <animate attributeName="opacity" values={`0.5;${0.7 + b * 0.06};0.5`} dur={`${0.9 + b * 0.15}s`} repeatCount="indefinite" />
                              )}
                            </rect>
                          </g>
                        );
                      })}
                      {/* dBm readout */}
                      <text x="24" y="54" textAnchor="middle" fill={isActive ? '#a78bfa' : '#64748b'} fontSize="6" fontFamily="monospace">
                        {isActive ? '-42 dBm' : '-78 dBm'}
                      </text>
                      {/* status dot */}
                      <circle cx="42" cy="8" r="2" fill={isActive ? '#22c55e' : '#64748b'}>
                        {isActive && <animate attributeName="opacity" values="0.5;1;0.5" dur="1.2s" repeatCount="indefinite" />}
                      </circle>
                    </g>
                  );
                })()}

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

                {/* waveform visualization — reacts to biosentinel toggle */}
                {(() => {
                  const isActive = activeOverlays.includes('biosentinel');
                  const intensity = isActive ? 2.8 : 1;
                  const baseOpacity = isActive ? 0.35 : 0.15;
                  const speedMul = isActive ? 0.6 : 1;
                  return (
                    <g transform="translate(250, 295)">
                      {Array.from({ length: 40 }).map((_, i) => {
                        const h = (Math.sin(i * 0.5) * 8 + Math.sin(i * 0.3) * 5) * (isActive ? 1.4 : 1);
                        const absH = Math.abs(h);
                        return (
                          <rect
                            key={`wave-${i}`}
                            x={-100 + i * 5}
                            y={-absH}
                            width="3"
                            height={absH * 2 + 1}
                            rx="1"
                            fill={isActive ? '#a78bfa' : '#8b5cf6'}
                            opacity={baseOpacity + absH * 0.02}
                          >
                            <animate
                              attributeName="height"
                              values={`${absH * 2 + 1};${absH * intensity + 2};${absH * 2 + 1}`}
                              dur={`${(1.5 + (i % 5) * 0.2) * speedMul}s`}
                              repeatCount="indefinite"
                            />
                            <animate
                              attributeName="y"
                              values={`${-absH};${-absH * (intensity / 2)};${-absH}`}
                              dur={`${(1.5 + (i % 5) * 0.2) * speedMul}s`}
                              repeatCount="indefinite"
                            />
                            {isActive && (
                              <animate
                                attributeName="opacity"
                                values={`${baseOpacity};${baseOpacity + 0.3};${baseOpacity}`}
                                dur={`${0.8 + (i % 3) * 0.15}s`}
                                repeatCount="indefinite"
                              />
                            )}
                          </rect>
                        );
                      })}
                      {/* active state label */}
                      {isActive && (
                        <text x="0" y="22" textAnchor="middle" fill="#a78bfa" fontSize="7" fontFamily="monospace" opacity="0.7">
                          ▲ LIVE SIGNAL ACTIVE ▲
                        </text>
                      )}
                    </g>
                  );
                })()}

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

                {/* ── AVIAN DISPERSAL EVENT VISUALIZATION ── */}
                {(() => {
                  const bioActive = activeOverlays.includes('biosentinel');
                  const speedFactor = bioActive ? 0.55 : 1;
                  const distFactor = bioActive ? 1.4 : 1;
                  const birdOpacity = bioActive ? 0.9 : 0.5;
                  const allBirds = [
                    { angle: -35,  dist: 80,  size: 1.0, dur: 3.5, delay: 0 },
                    { angle: -65,  dist: 110, size: 0.8, dur: 4.0, delay: 0.3 },
                    { angle: -20,  dist: 95,  size: 0.9, dur: 3.8, delay: 0.6 },
                    { angle: -80,  dist: 70,  size: 0.7, dur: 3.2, delay: 0.9 },
                    { angle: -50,  dist: 120, size: 0.6, dur: 4.2, delay: 0.2 },
                    { angle: -10,  dist: 60,  size: 1.1, dur: 3.0, delay: 1.2 },
                    { angle: -100, dist: 90,  size: 0.75, dur: 3.6, delay: 0.5 },
                    { angle: -130, dist: 75,  size: 0.85, dur: 3.4, delay: 0.8 },
                    { angle: -150, dist: 100, size: 0.65, dur: 4.1, delay: 0.1 },
                    { angle: -45,  dist: 130, size: 0.55, dur: 4.5, delay: 1.0 },
                    { angle: -160, dist: 115, size: 0.7, dur: 3.9, delay: 0.4 },
                    { angle: -5,   dist: 85,  size: 0.9, dur: 3.3, delay: 0.7 },
                  ];
                  // Show all 12 when active, only 5 when inactive
                  const visibleBirds = bioActive ? allBirds : allBirds.slice(0, 5);
                  return (
                    <g>
                      {/* ground/habitat zone */}
                      <rect x="60" y="370" width="380" height="180" rx="8" fill="#1a0e2e" opacity="0.4" stroke="#8b5cf6" strokeWidth="0.3" />
                      
                      {/* section title */}
                      <text x="250" y="390" textAnchor="middle" fill="#c4b5fd" fontSize="8" fontFamily="sans-serif" fontWeight="600" opacity="0.7">
                        Avian Dispersal Event — Behavioral Anomaly Indicator
                      </text>

                      {/* ── RADAR SWEEP behind dispersal origin ── */}
                      <defs>
                        <clipPath id="radarClip">
                          <circle cx="250" cy="460" r="55" />
                        </clipPath>
                        <linearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
                          <stop offset="70%" stopColor="#8b5cf6" stopOpacity={bioActive ? '0.18' : '0.08'} />
                          <stop offset="100%" stopColor="#a78bfa" stopOpacity={bioActive ? '0.35' : '0.15'} />
                        </linearGradient>
                      </defs>
                      {/* radar rings */}
                      {[20, 35, 50].map((r) => (
                        <circle key={`rr-${r}`} cx="250" cy="460" r={r} fill="none" stroke="#8b5cf6" strokeWidth="0.3" opacity={bioActive ? 0.2 : 0.1} />
                      ))}
                      {/* cross-hair lines */}
                      <line x1="195" y1="460" x2="305" y2="460" stroke="#8b5cf6" strokeWidth="0.3" opacity="0.1" />
                      <line x1="250" y1="405" x2="250" y2="515" stroke="#8b5cf6" strokeWidth="0.3" opacity="0.1" />
                      {/* rotating sweep wedge */}
                      <g clipPath="url(#radarClip)">
                        <g style={{ transformOrigin: '250px 460px' }}>
                          <path d="M250,460 L250,405 A55,55 0 0,1 297,432 Z" fill="url(#sweepGrad)">
                            <animateTransform
                              attributeName="transform"
                              type="rotate"
                              from="0 250 460"
                              to="360 250 460"
                              dur={bioActive ? '2s' : '4s'}
                              repeatCount="indefinite"
                            />
                          </path>
                        </g>
                      </g>
                      {/* center dot */}
                      <circle cx="250" cy="460" r="3" fill="#a78bfa" opacity="0.6" />
                      {/* detection blip on sweep */}
                      <circle cx="250" cy="460" r="5" fill="#8b5cf6" opacity="0">
                        <animate attributeName="r" values="3;8;3" dur={bioActive ? '2s' : '4s'} repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.5;0.05;0.5" dur={bioActive ? '2s' : '4s'} repeatCount="indefinite" />
                      </circle>
                      
                      {/* tree canopy (habitat) */}
                      {[120, 160, 340, 380].map((tx, ti) => (
                        <g key={`ht-${ti}`} transform={`translate(${tx}, 530)`}>
                          <line x1="0" y1="0" x2="0" y2="-14" stroke="#15803d" strokeWidth="1.5" opacity="0.3" />
                          <polygon points="-8,-10 0,-28 8,-10" fill="#22c55e" opacity="0.12" />
                          <polygon points="-5,-16 0,-32 5,-16" fill="#16a34a" opacity="0.15" />
                        </g>
                      ))}
                      
                      {/* animated bird silhouettes — reactive to biosentinel */}
                      {visibleBirds.map((bird, bi) => {
                        const rad = (bird.angle * Math.PI) / 180;
                        const d = bird.dist * distFactor;
                        const ex = 250 + Math.cos(rad) * d;
                        const ey = 460 + Math.sin(rad) * d;
                        const s = bird.size;
                        const flightDur = bird.dur * speedFactor;
                        const flapDur = (0.4 + (bi % 3) * 0.1) * (bioActive ? 0.6 : 1);
                        return (
                          <g key={`bird-${bi}`} opacity="0">
                            <line x1="250" y1="460" x2={ex} y2={ey} stroke="#a78bfa" strokeWidth="0.3" strokeDasharray="2 3" opacity={bioActive ? 0.25 : 0.1} />
                            <g>
                              <animateMotion
                                dur={`${flightDur}s`}
                                begin={`${bird.delay}s`}
                                repeatCount="indefinite"
                                path={`M250,460 Q${250 + (ex - 250) * 0.5},${460 + (ey - 460) * 0.3 - 15} ${ex},${ey}`}
                              />
                              <path
                                d={`M${-8 * s},${2 * s} Q${-4 * s},${-4 * s} 0,0 Q${4 * s},${-4 * s} ${8 * s},${2 * s}`}
                                fill="none"
                                stroke={bioActive ? '#e9d5ff' : '#c4b5fd'}
                                strokeWidth={1 * s}
                                strokeLinecap="round"
                              >
                                <animate
                                  attributeName="d"
                                  values={`M${-8 * s},${2 * s} Q${-4 * s},${-4 * s} 0,0 Q${4 * s},${-4 * s} ${8 * s},${2 * s};M${-8 * s},${-3 * s} Q${-4 * s},${1 * s} 0,0 Q${4 * s},${1 * s} ${8 * s},${-3 * s};M${-8 * s},${2 * s} Q${-4 * s},${-4 * s} 0,0 Q${4 * s},${-4 * s} ${8 * s},${2 * s}`}
                                  dur={`${flapDur}s`}
                                  repeatCount="indefinite"
                                />
                              </path>
                              <circle cx="0" cy="0" r={1.2 * s} fill="#c4b5fd" opacity="0.6" />
                            </g>
                            <animate attributeName="opacity" values={`0;${birdOpacity};${birdOpacity * 0.9};${birdOpacity * 0.5};0`} dur={`${flightDur}s`} begin={`${bird.delay}s`} repeatCount="indefinite" />
                          </g>
                        );
                      })}
                      
                      {/* explainer badge */}
                      <g transform="translate(250, 405)">
                        <rect x="-110" y="-8" width="220" height="16" rx="8" fill="#3b0764" opacity="0.5" stroke="#a78bfa" strokeWidth="0.4" />
                        <text x="0" y="4" textAnchor="middle" fill="#ddd6fe" fontSize="6" fontFamily="monospace">
                          ⚠ SUDDEN FLOCK DISPERSAL — POTENTIAL ENVIRONMENTAL STRESSOR DETECTED
                        </text>
                      </g>

                      {/* status badge reactive to toggle */}
                      <g transform="translate(250, 420)">
                        <rect x="-40" y="-6" width="80" height="12" rx="6" fill={bioActive ? '#7c2d12' : '#1e1b4b'} opacity="0.6" stroke={bioActive ? '#f97316' : '#8b5cf6'} strokeWidth="0.4" />
                        <text x="0" y="3" textAnchor="middle" fill={bioActive ? '#fed7aa' : '#a78bfa'} fontSize="5.5" fontFamily="monospace">
                          {bioActive ? '▲ HIGH INTENSITY' : '△ BASELINE'}
                        </text>
                        {bioActive && <circle cx="34" cy="0" r="1.5" fill="#f97316"><animate attributeName="opacity" values="0.4;1;0.4" dur="0.8s" repeatCount="indefinite" /></circle>}
                      </g>
                      
                      {/* interpretive annotation */}
                      <g transform="translate(250, 540)">
                        <rect x="-145" y="-10" width="290" height="28" rx="6" fill="#1e1b4b" opacity="0.5" stroke="#8b5cf6" strokeWidth="0.3" />
                        <text x="0" y="-1" textAnchor="middle" fill="#a78bfa" fontSize="5.5" fontFamily="monospace" opacity="0.8">
                          Rapid avian dispersal from a nesting corridor can indicate sudden
                        </text>
                        <text x="0" y="10" textAnchor="middle" fill="#a78bfa" fontSize="5.5" fontFamily="monospace" opacity="0.8">
                          environmental change (fire, EMF surge, ground vibration) — advisory only
                        </text>
                      </g>
                      
                      {/* confidence meter — reactive */}
                      <g transform="translate(405, 430)">
                        <rect x="0" y="0" width="30" height="50" rx="3" fill="#1e1b4b" opacity="0.5" stroke="#8b5cf6" strokeWidth="0.3" />
                        <text x="15" y="12" textAnchor="middle" fill="#a78bfa" fontSize="5" fontFamily="monospace">CONF</text>
                        {[0, 1, 2, 3, 4].map((b) => {
                          const barH = 3 + b * 1.5;
                          const lit = bioActive ? true : b < 3;
                          return (
                            <rect key={`bc-${b}`} x={4 + b * 5} y={42 - barH} width="3.5" height={barH} rx="0.5" fill={lit ? '#a78bfa' : '#334155'} opacity={lit ? 0.6 : 0.2}>
                              <animate attributeName="opacity" values={`${lit ? 0.4 : 0.2};${lit ? 0.8 : 0.2};${lit ? 0.4 : 0.2}`} dur={`${(1.2 + b * 0.2) * (bioActive ? 0.6 : 1)}s`} repeatCount="indefinite" />
                            </rect>
                          );
                        })}
                        <text x="15" y="49" textAnchor="middle" fill={bioActive ? '#c4b5fd' : '#a78bfa'} fontSize="5" fontFamily="monospace" opacity="0.6">
                          {bioActive ? '87%' : '62%'}
                        </text>
                      </g>
                    </g>
                  );
                })()}

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

          {/* Sensor Network Status — fills blank space below corridor SVG */}
          <Card className="border-violet-500/15 bg-gradient-to-b from-violet-950/30 to-transparent">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-violet-300 uppercase tracking-wider">Sensor Network Status</span>
                <Badge variant="outline" className="border-violet-500/30 text-violet-400 text-[10px] px-2 py-0.5">
                  {activeOverlays.includes('biosentinel') ? '● Live' : '○ Standby'}
                </Badge>
              </div>
              {/* sensor grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'SN-4401', loc: 'Corridor North', status: 'online', battery: 87 },
                  { id: 'SN-4402', loc: 'Corridor South', status: 'online', battery: 72 },
                  { id: 'SN-4403', loc: 'Feeder Junction', status: activeOverlays.includes('biosentinel') ? 'alert' : 'online', battery: 91 },
                  { id: 'SN-4404', loc: 'Nesting Zone', status: 'online', battery: 64 },
                ].map((sensor) => (
                  <div key={sensor.id} className={cn(
                    'rounded-md border p-2.5 transition-all',
                    sensor.status === 'alert'
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : 'border-violet-500/15 bg-violet-950/20'
                  )}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-semibold text-foreground/80">{sensor.id}</span>
                      <span className={cn('h-1.5 w-1.5 rounded-full', sensor.status === 'alert' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400')} />
                    </div>
                    <span className="text-[9px] text-muted-foreground/60 block mb-1.5">{sensor.loc}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 flex-1 rounded-full bg-violet-950">
                        <div className="h-full rounded-full bg-violet-400/50" style={{ width: `${sensor.battery}%` }} />
                      </div>
                      <span className="text-[9px] text-muted-foreground/50 font-mono">{sensor.battery}%</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* deployment summary */}
              <div className="rounded-md border border-violet-500/15 bg-violet-950/15 p-3">
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Active Nodes', value: '4/4' },
                    { label: 'Avg Signal', value: activeOverlays.includes('biosentinel') ? '-42 dBm' : '-78 dBm' },
                    { label: 'Uptime', value: '99.2%' },
                  ].map((m) => (
                    <div key={m.label}>
                      <div className="text-[13px] font-semibold text-foreground/80">{m.value}</div>
                      <div className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* coverage note */}
              <p className="text-[10px] text-muted-foreground/50 italic leading-relaxed">
                Sensor coverage spans 2.4 km of right-of-way corridor. Acoustic + behavioral anomaly detection operates as a secondary corroboration layer — advisory only.
              </p>
            </CardContent>
          </Card>

          </div>

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
                  <li key={b} className="flex items-start gap-2 text-[13px] leading-relaxed text-muted-foreground">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/80" />
                    {b}
                  </li>
                ))}
              </ul>

              <div className="rounded-lg border border-border/30 bg-muted/30 p-4">
                <p className="mb-3 text-[13px] font-semibold text-foreground/90">How it would work</p>
                <div className="flex flex-col gap-2.5">
                  {bioFlow.map((f, i) => (
                    <div key={f.step} className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                        {f.step}
                      </span>
                      <div>
                        <span className="text-[13px] font-medium text-foreground/90">{f.label}</span>
                        <span className="ml-1.5 text-[11px] text-muted-foreground/70">— {f.detail}</span>
                      </div>
                      {i < bioFlow.length - 1 && <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/40" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* live signal feed mockup */}
              <div className="rounded-lg border border-violet-500/20 bg-violet-950/20 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-violet-300 uppercase tracking-wider">Live Signal Feed</span>
                  <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                </div>
                <div className="space-y-2">
                  {[
                    { time: '14:32:18', type: 'Acoustic', val: '72%', color: 'text-violet-300' },
                    { time: '14:31:45', type: 'Behavioral', val: '58%', color: 'text-violet-300/70' },
                    { time: '14:30:02', type: 'Migration', val: '45%', color: 'text-violet-300/50' },
                    { time: '14:28:11', type: 'Acoustic', val: '31%', color: 'text-violet-300/40' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-muted-foreground/50">{s.time}</span>
                      <span className={s.color}>{s.type}</span>
                      <span className="ml-auto text-violet-200/70">{s.val}</span>
                      <div className="h-1.5 w-12 rounded-full bg-violet-950">
                        <div className="h-full rounded-full bg-violet-500/60" style={{ width: s.val }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Mini Anomaly Detection Timeline ── */}
              <div className="rounded-lg border border-violet-500/20 bg-violet-950/20 p-3">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-semibold text-violet-300 uppercase tracking-wider">Recent Anomaly Detections</span>
                  <Badge variant="outline" className="border-violet-500/30 text-violet-400 text-[10px] px-2 py-0.5">Last 24h</Badge>
                </div>
                <div className="relative pl-3">
                  {/* vertical timeline line */}
                  <div className="absolute left-[5px] top-0 bottom-0 w-px bg-gradient-to-b from-violet-500/40 via-violet-500/20 to-transparent" />
                  <div className="space-y-2.5">
                    {[
                      { time: '14:32', ago: '2m ago', type: 'Acoustic Spike', zone: 'FDR-4401', conf: 72, severity: 'high' },
                      { time: '14:18', ago: '16m ago', type: 'Behavioral Shift', zone: 'FDR-4402', conf: 58, severity: 'medium' },
                      { time: '13:45', ago: '49m ago', type: 'Migration Alert', zone: 'FDR-4403', conf: 45, severity: 'low' },
                      { time: '12:02', ago: '2h ago', type: 'Acoustic Burst', zone: 'FDR-4401', conf: 81, severity: 'high' },
                      { time: '09:15', ago: '5h ago', type: 'Nesting Disruption', zone: 'FDR-4402', conf: 34, severity: 'low' },
                    ].map((e, i) => {
                      const dotColor = e.severity === 'high' ? 'bg-red-400' : e.severity === 'medium' ? 'bg-amber-400' : 'bg-violet-400';
                      const textColor = e.severity === 'high' ? 'text-red-300' : e.severity === 'medium' ? 'text-amber-300' : 'text-violet-300/70';
                      return (
                        <div
                          key={i}
                          className={cn(
                            'relative flex items-start gap-2 cursor-pointer rounded-md px-1 py-0.5 -mx-1 transition-all duration-200',
                            highlightedZone === e.zone
                              ? 'bg-amber-500/10 ring-1 ring-amber-400/30'
                              : 'hover:bg-violet-500/5'
                          )}
                          onClick={() => {
                            // toggle: click again to clear
                            if (highlightedZone === e.zone) {
                              setHighlightedZone(null);
                            } else {
                              setHighlightedZone(e.zone);
                              // auto-enable biosentinel overlay
                              if (!activeOverlays.includes('biosentinel')) {
                                setActiveOverlays((prev) => [...prev, 'biosentinel']);
                              }
                            }
                          }}
                        >
                          {/* timeline dot */}
                          <div className={cn('absolute -left-[7px] top-[5px] h-2.5 w-2.5 rounded-full ring-2 ring-violet-950 transition-all', highlightedZone === e.zone ? 'ring-amber-900 scale-125' : '', dotColor)}>
                            {i === 0 && <span className={cn('absolute inset-0 rounded-full animate-ping', dotColor, 'opacity-40')} />}
                          </div>
                          <div className="ml-2 flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={cn('text-[11px] font-semibold', highlightedZone === e.zone ? 'text-amber-300' : textColor)}>{e.type}</span>
                              <span className="text-[9px] text-muted-foreground/50 font-mono">{e.ago}</span>
                              {highlightedZone === e.zone && <span className="text-[9px] text-amber-400 animate-pulse">◉ MAP</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={cn('text-[10px] font-mono', highlightedZone === e.zone ? 'text-amber-300/70' : 'text-muted-foreground/60')}>{e.zone}</span>
                              <span className="text-[10px] font-mono text-violet-300/70">{e.conf}%</span>
                              <div className="h-1.5 w-10 rounded-full bg-violet-950 overflow-hidden">
                                <div className="h-full rounded-full bg-violet-400/60" style={{ width: `${e.conf}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      {/* ── 4a-ii) SMOKE & EARLY NATURE SIGNAL SENSING ── */}
      <motion.section {...fade} transition={{ delay: 0.16 }} id="aop-smoke-sensing" data-tour-section="aop-smoke-sensing">
        <Card className="overflow-hidden border-border/30">
          <div className="flex flex-col gap-2 border-b border-border/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <SectionTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-400" />
                Smoke Sensing &amp; Early Nature Signal Forecasting
              </SectionTitle>
              <span className="text-[11px] text-muted-foreground/70 uppercase tracking-wider">Concept · Post-Fire Smoke · Nature Precursors · Sense Forecasting</span>
            </div>
            <Badge variant="outline" className="shrink-0 border-orange-500/40 bg-orange-500/5 text-orange-400 text-[11px] uppercase tracking-widest px-3 py-1">
              Early Warning · Phase 2+
            </Badge>
          </div>

          <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
            {/* left: animated SVG */}
            <div className="relative bg-gradient-to-br from-[hsl(220,20%,10%)] via-[hsl(15,10%,10%)] to-[hsl(200,15%,8%)] overflow-hidden" style={{ minHeight: 520 }}>
              {(() => {
                const bioActive = activeOverlays.includes('biosentinel');
                return (
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 520" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="smokeGrad" cx="50%" cy="50%">
                    <stop offset="0%" stopColor="#78716c" stopOpacity="0.35" />
                    <stop offset="60%" stopColor="#57534e" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#44403c" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="fireGlow" cx="50%" cy="80%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.5" />
                    <stop offset="40%" stopColor="#f97316" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                  </radialGradient>
                  <filter id="smokeBlur" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
                  </filter>
                  <filter id="smokeBlurSm" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                  </filter>
                  <linearGradient id="heatSignature" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
                    <stop offset="50%" stopColor="#f97316" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.1" />
                  </linearGradient>
                </defs>

                {/* ── SCENE TITLE ── */}
                <text x="250" y="20" textAnchor="middle" fill="#a1a1aa" fontSize="7" fontFamily="monospace" letterSpacing="0.15em" opacity="0.6">
                  SMOKE DETECTION &amp; EARLY NATURE SIGNAL AWARENESS
                </text>

                {/* ── FOREST SCENE ── */}
                {/* ground terrain */}
                <path d="M0,380 Q80,370 160,375 Q250,365 340,372 Q420,368 500,375 L500,520 L0,520 Z" fill="#1a2e05" opacity="0.5" />

                {/* forest trees — some burnt, some healthy */}
                {[
                  { x: 40, h: 50, burnt: false },
                  { x: 80, h: 45, burnt: false },
                  { x: 120, h: 55, burnt: true },
                  { x: 155, h: 48, burnt: true },
                  { x: 190, h: 52, burnt: true },
                  { x: 230, h: 42, burnt: false },
                  { x: 270, h: 58, burnt: true },
                  { x: 310, h: 44, burnt: false },
                  { x: 350, h: 50, burnt: false },
                  { x: 390, h: 46, burnt: false },
                  { x: 430, h: 52, burnt: false },
                  { x: 465, h: 40, burnt: false },
                ].map((t, ti) => (
                  <g key={`ftree-${ti}`} transform={`translate(${t.x}, ${375 + (ti % 3) * 2})`}>
                    <line x1="0" y1="0" x2="0" y2={-t.h * 0.4} stroke={t.burnt ? '#57534e' : '#15803d'} strokeWidth="1.5" opacity={t.burnt ? 0.5 : 0.3} />
                    <polygon points={`-${t.h * 0.15},-${t.h * 0.2} 0,-${t.h * 0.7} ${t.h * 0.15},-${t.h * 0.2}`} fill={t.burnt ? '#78716c' : '#22c55e'} opacity={t.burnt ? 0.15 : 0.1} />
                    <polygon points={`-${t.h * 0.1},-${t.h * 0.4} 0,-${t.h * 0.9} ${t.h * 0.1},-${t.h * 0.4}`} fill={t.burnt ? '#57534e' : '#16a34a'} opacity={t.burnt ? 0.12 : 0.12} />
                    {t.burnt && (
                      <>
                        <circle cx="0" cy={-t.h * 0.15} r="2" fill="#ef4444" opacity="0.15">
                          <animate attributeName="opacity" values="0.1;0.25;0.1" dur="2s" begin={`${ti * 0.3}s`} repeatCount="indefinite" />
                        </circle>
                      </>
                    )}
                  </g>
                ))}

                {/* ── FIRE SOURCE (smoldering) ── */}
                <g transform="translate(185, 355)">
                  {/* fire glow base */}
                  <circle cx="0" cy="0" r="20" fill="url(#fireGlow)">
                    <animate attributeName="r" values="15;25;15" dur={bioActive ? '1.5s' : '2.5s'} repeatCount="indefinite" />
                  </circle>
                  {/* embers */}
                  {[0, 1, 2, 3, 4].map((ei) => {
                    const ea = (ei * 72) * Math.PI / 180;
                    return (
                      <circle key={`ember-${ei}`} cx={Math.cos(ea) * 8} cy={Math.sin(ea) * 5 - 3} r={1.2 + (ei % 2) * 0.5} fill="#ef4444" opacity="0">
                        <animate attributeName="opacity" values="0;0.8;0.4;0" dur={`${1.2 + ei * 0.2}s`} begin={`${ei * 0.25}s`} repeatCount="indefinite" />
                        <animate attributeName="cy" values={`${Math.sin(ea) * 5 - 3};${Math.sin(ea) * 5 - 12}`} dur={`${1.2 + ei * 0.2}s`} begin={`${ei * 0.25}s`} repeatCount="indefinite" />
                      </circle>
                    );
                  })}
                  <rect x="-18" y="8" width="36" height="10" rx="5" fill="#451a03" opacity="0.5" stroke="#d97706" strokeWidth="0.3" />
                  <text x="0" y="15" textAnchor="middle" fill="#fbbf24" fontSize="5" fontFamily="monospace">FIRE SRC</text>
                </g>

                {/* ── RISING SMOKE PLUMES — dense layered effect ── */}
                {/* Layer 1: Large background haze columns */}
                {[
                  { cx: 165, cy: 300, r: 40, delay: 0 },
                  { cx: 200, cy: 240, r: 50, delay: 0.5 },
                  { cx: 180, cy: 180, r: 55, delay: 1.0 },
                  { cx: 210, cy: 120, r: 60, delay: 1.5 },
                  { cx: 175, cy: 80, r: 55, delay: 2.0 },
                  { cx: 195, cy: 50, r: 50, delay: 2.5 },
                ].map((s, si) => (
                  <circle key={`smoke-bg-${si}`} cx={s.cx} cy={s.cy} r={s.r} fill="url(#smokeGrad)" filter="url(#smokeBlur)" opacity="0">
                    <animate attributeName="cy" values={`${s.cy + 30};${s.cy - 40}`} dur={bioActive ? '4s' : '6s'} begin={`${s.delay}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values={`0;${bioActive ? 0.55 : 0.3};${bioActive ? 0.35 : 0.18};0`} dur={bioActive ? '4s' : '6s'} begin={`${s.delay}s`} repeatCount="indefinite" />
                    <animate attributeName="r" values={`${s.r * 0.7};${s.r * 1.4}`} dur={bioActive ? '4s' : '6s'} begin={`${s.delay}s`} repeatCount="indefinite" />
                  </circle>
                ))}
                {/* Layer 2: Mid-density wispy plumes with lateral drift */}
                {[
                  { cx: 150, cy: 330, r: 20, delay: 0.2 },
                  { cx: 190, cy: 290, r: 25, delay: 0.7 },
                  { cx: 170, cy: 250, r: 28, delay: 1.1 },
                  { cx: 205, cy: 210, r: 30, delay: 0.3 },
                  { cx: 185, cy: 160, r: 32, delay: 1.4 },
                  { cx: 160, cy: 130, r: 28, delay: 0.9 },
                  { cx: 210, cy: 100, r: 25, delay: 1.8 },
                  { cx: 175, cy: 60, r: 22, delay: 2.2 },
                ].map((s, si) => (
                  <ellipse key={`smoke-mid-${si}`} cx={s.cx} cy={s.cy} rx={s.r * 1.3} ry={s.r} fill="#78716c" filter="url(#smokeBlurSm)" opacity="0">
                    <animate attributeName="cy" values={`${s.cy + 15};${s.cy - 35}`} dur={bioActive ? '3.5s' : '5.5s'} begin={`${s.delay}s`} repeatCount="indefinite" />
                    <animate attributeName="cx" values={`${s.cx};${s.cx + (si % 2 === 0 ? 20 : -15)}`} dur={bioActive ? '3.5s' : '5.5s'} begin={`${s.delay}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values={`0;${bioActive ? 0.35 : 0.18};${bioActive ? 0.2 : 0.1};0`} dur={bioActive ? '3.5s' : '5.5s'} begin={`${s.delay}s`} repeatCount="indefinite" />
                    <animate attributeName="ry" values={`${s.r * 0.8};${s.r * 1.3}`} dur={bioActive ? '3.5s' : '5.5s'} begin={`${s.delay}s`} repeatCount="indefinite" />
                  </ellipse>
                ))}
                {/* Layer 3: Small sharp smoke wisps for detail texture */}
                {[
                  { cx: 175, cy: 340, r: 10, delay: 0.1 },
                  { cx: 195, cy: 310, r: 12, delay: 0.5 },
                  { cx: 160, cy: 275, r: 14, delay: 0.9 },
                  { cx: 210, cy: 240, r: 11, delay: 0.4 },
                  { cx: 180, cy: 200, r: 13, delay: 1.3 },
                  { cx: 155, cy: 170, r: 10, delay: 1.7 },
                  { cx: 215, cy: 150, r: 12, delay: 0.6 },
                  { cx: 190, cy: 110, r: 11, delay: 2.1 },
                  { cx: 170, cy: 80, r: 9, delay: 1.0 },
                  { cx: 200, cy: 55, r: 10, delay: 2.4 },
                ].map((s, si) => (
                  <circle key={`smoke-wisp-${si}`} cx={s.cx} cy={s.cy} r={s.r} fill="#a8a29e" opacity="0">
                    <animate attributeName="cy" values={`${s.cy + 10};${s.cy - 25}`} dur={bioActive ? '2.5s' : '4s'} begin={`${s.delay}s`} repeatCount="indefinite" />
                    <animate attributeName="cx" values={`${s.cx};${s.cx + (si % 3 - 1) * 12}`} dur={bioActive ? '2.5s' : '4s'} begin={`${s.delay}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values={`0;${bioActive ? 0.25 : 0.12};0`} dur={bioActive ? '2.5s' : '4s'} begin={`${s.delay}s`} repeatCount="indefinite" />
                    <animate attributeName="r" values={`${s.r};${s.r * 1.8}`} dur={bioActive ? '2.5s' : '4s'} begin={`${s.delay}s`} repeatCount="indefinite" />
                  </circle>
                ))}
                {/* Layer 4: Orange-tinted heat haze near fire source */}
                {[
                  { cx: 175, cy: 345, r: 18, delay: 0 },
                  { cx: 195, cy: 330, r: 22, delay: 0.3 },
                  { cx: 185, cy: 315, r: 15, delay: 0.6 },
                ].map((s, si) => (
                  <circle key={`heat-haze-${si}`} cx={s.cx} cy={s.cy} r={s.r} fill="#f97316" filter="url(#smokeBlur)" opacity="0">
                    <animate attributeName="cy" values={`${s.cy};${s.cy - 30}`} dur={bioActive ? '2s' : '3.5s'} begin={`${s.delay}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values={`0;${bioActive ? 0.15 : 0.08};0`} dur={bioActive ? '2s' : '3.5s'} begin={`${s.delay}s`} repeatCount="indefinite" />
                  </circle>
                ))}

                {/* ── SMOKE SENSOR ARRAY ── */}
                <g transform="translate(30, 100)">
                  <rect x="0" y="-10" width="90" height="50" rx="4" fill="#1c1917" opacity="0.5" stroke="#78716c" strokeWidth="0.3" />
                  <text x="45" y="2" textAnchor="middle" fill="#a8a29e" fontSize="5.5" fontFamily="monospace">SMOKE SENSOR</text>
                  {/* particulate bars */}
                  {['PM2.5', 'PM10', 'CO', 'VOC'].map((label, bi) => {
                    const barW = bioActive ? 12 + bi * 4 : 6 + bi * 2;
                    const barColor = bi > 1 && bioActive ? '#ef4444' : bi > 1 ? '#f59e0b' : '#22c55e';
                    return (
                      <g key={`pb-${bi}`} transform={`translate(5, ${10 + bi * 8})`}>
                        <text x="0" y="5" fill="#a8a29e" fontSize="4" fontFamily="monospace">{label}</text>
                        <rect x="22" y="1" width={barW} height="4" rx="1" fill={barColor} opacity="0.5">
                          <animate attributeName="width" values={`${barW};${barW + 3};${barW}`} dur={`${1.5 + bi * 0.3}s`} repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.4;0.7;0.4" dur={`${1.5 + bi * 0.3}s`} repeatCount="indefinite" />
                        </rect>
                      </g>
                    );
                  })}
                </g>

                {/* ── SMOKE DENSITY GAUGE — reactive to biosentinel ── */}
                <g transform="translate(400, 120)">
                  {/* gauge background */}
                  <rect x="-38" y="-45" width="76" height="90" rx="5" fill="#1c1917" opacity="0.5" stroke={bioActive ? '#ef4444' : '#78716c'} strokeWidth="0.4" />
                  <text x="0" y="-36" textAnchor="middle" fill={bioActive ? '#fca5a5' : '#a8a29e'} fontSize="5" fontFamily="monospace">SMOKE DENSITY</text>
                  {/* circular arc gauge */}
                  {(() => {
                    const pct = bioActive ? 82 : 38;
                    const r = 22;
                    const startAngle = -225;
                    const endAngle = 45;
                    const totalArc = endAngle - startAngle; // 270°
                    const filledArc = totalArc * (pct / 100);
                    const toRad = (d: number) => (d * Math.PI) / 180;
                    // background arc
                    const bgX1 = Math.cos(toRad(startAngle)) * r;
                    const bgY1 = Math.sin(toRad(startAngle)) * r;
                    const bgX2 = Math.cos(toRad(endAngle)) * r;
                    const bgY2 = Math.sin(toRad(endAngle)) * r;
                    // filled arc
                    const fillEnd = startAngle + filledArc;
                    const fX2 = Math.cos(toRad(fillEnd)) * r;
                    const fY2 = Math.sin(toRad(fillEnd)) * r;
                    const largeArcBg = totalArc > 180 ? 1 : 0;
                    const largeArcFill = filledArc > 180 ? 1 : 0;
                    const gaugeColor = pct > 70 ? '#ef4444' : pct > 40 ? '#f59e0b' : '#22c55e';
                    return (
                      <g transform="translate(0, -5)">
                        {/* bg arc */}
                        <path
                          d={`M${bgX1},${bgY1} A${r},${r} 0 ${largeArcBg} 1 ${bgX2},${bgY2}`}
                          fill="none" stroke="#334155" strokeWidth="5" strokeLinecap="round" opacity="0.4"
                        />
                        {/* filled arc */}
                        <path
                          d={`M${bgX1},${bgY1} A${r},${r} 0 ${largeArcFill} 1 ${fX2},${fY2}`}
                          fill="none" stroke={gaugeColor} strokeWidth="5" strokeLinecap="round" opacity="0.7"
                        >
                          <animate attributeName="opacity" values="0.5;0.8;0.5" dur={bioActive ? '1.2s' : '2.5s'} repeatCount="indefinite" />
                        </path>
                        {/* glow on active */}
                        {bioActive && (
                          <path
                            d={`M${bgX1},${bgY1} A${r},${r} 0 ${largeArcFill} 1 ${fX2},${fY2}`}
                            fill="none" stroke={gaugeColor} strokeWidth="10" strokeLinecap="round" opacity="0.15" filter="url(#smokeBlur)"
                          />
                        )}
                        {/* center text */}
                        <text x="0" y="5" textAnchor="middle" fill={gaugeColor} fontSize="12" fontFamily="monospace" fontWeight="bold">{pct}%</text>
                        <text x="0" y="14" textAnchor="middle" fill="#a8a29e" fontSize="4.5" fontFamily="monospace">
                          {pct > 70 ? 'HAZARDOUS' : pct > 40 ? 'MODERATE' : 'LOW'}
                        </text>
                        {/* tick marks */}
                        {[0, 25, 50, 75, 100].map((tick) => {
                          const tickAngle = startAngle + totalArc * (tick / 100);
                          const ix = Math.cos(toRad(tickAngle)) * (r + 5);
                          const iy = Math.sin(toRad(tickAngle)) * (r + 5);
                          const ox = Math.cos(toRad(tickAngle)) * (r + 8);
                          const oy = Math.sin(toRad(tickAngle)) * (r + 8);
                          return (
                            <g key={`tick-${tick}`}>
                              <line x1={ix} y1={iy} x2={ox} y2={oy} stroke="#64748b" strokeWidth="0.5" opacity="0.5" />
                              <text x={Math.cos(toRad(tickAngle)) * (r + 13)} y={Math.sin(toRad(tickAngle)) * (r + 13) + 1.5} textAnchor="middle" fill="#64748b" fontSize="3.5" fontFamily="monospace">{tick}</text>
                            </g>
                          );
                        })}
                      </g>
                    );
                  })()}
                  {/* status indicator */}
                  <g transform="translate(0, 32)">
                    <rect x="-20" y="-5" width="40" height="10" rx="5" fill={bioActive ? '#7f1d1d' : '#1e293b'} opacity="0.6" stroke={bioActive ? '#ef4444' : '#475569'} strokeWidth="0.3" />
                    <circle cx="-14" cy="0" r="1.5" fill={bioActive ? '#ef4444' : '#22c55e'}>
                      {bioActive && <animate attributeName="opacity" values="0.4;1;0.4" dur="0.8s" repeatCount="indefinite" />}
                    </circle>
                    <text x="2" y="2.5" textAnchor="middle" fill={bioActive ? '#fca5a5' : '#94a3b8'} fontSize="4" fontFamily="monospace">
                      {bioActive ? 'ALERT' : 'NORMAL'}
                    </text>
                  </g>
                </g>

                {/* ── SMOKE DISPERSION DIRECTION ── */}
                {/* wind-blown smoke drift arrows */}
                {[140, 180, 220].map((ay, ai) => (
                  <g key={`drift-${ai}`} opacity="0">
                    <line x1={220 + ai * 10} y1={ay} x2={280 + ai * 15} y2={ay - 8} stroke="#a8a29e" strokeWidth="0.6" strokeDasharray="3 2" />
                    <polygon points={`${280 + ai * 15},${ay - 8} ${275 + ai * 15},${ay - 5} ${275 + ai * 15},${ay - 11}`} fill="#a8a29e" opacity="0.4" />
                    <animate attributeName="opacity" values="0;0.4;0.2;0" dur="3s" begin={`${ai * 0.6}s`} repeatCount="indefinite" />
                  </g>
                ))}
                <text x="330" y="175" textAnchor="middle" fill="#a8a29e" fontSize="5" fontFamily="monospace" opacity="0.4">WIND DRIFT →</text>

                {/* ── HORIZONTAL DIVIDER ── */}
                <line x1="20" y1="400" x2="480" y2="400" stroke="#365314" strokeWidth="0.5" opacity="0.2" strokeDasharray="4 3" />
                <text x="250" y="415" textAnchor="middle" fill="#86efac" fontSize="5.5" fontFamily="monospace" letterSpacing="0.15em" opacity="0.4">
                  ▼ EARLY NATURE SIGNAL INDICATORS ▼
                </text>

                {/* ── NATURE PRECURSOR SIGNALS ── */}
                {/* Section: insect swarm behavior */}
                <g transform="translate(70, 445)">
                  <circle cx="0" cy="0" r="18" fill="none" stroke="#a78bfa" strokeWidth="0.4" strokeDasharray="2 2" opacity="0.3" />
                  <text x="0" y="-22" textAnchor="middle" fill="#c4b5fd" fontSize="5" fontFamily="monospace">INSECT SWARM</text>
                  {Array.from({ length: bioActive ? 12 : 6 }).map((_, ii) => {
                    const ia = (ii * (360 / (bioActive ? 12 : 6))) * Math.PI / 180;
                    const ir = 8 + (ii % 3) * 4;
                    return (
                      <circle key={`insect-${ii}`} cx={Math.cos(ia) * ir} cy={Math.sin(ia) * ir} r="1" fill="#c4b5fd" opacity="0">
                        <animate attributeName="cx" values={`${Math.cos(ia) * ir};${Math.cos(ia + 0.5) * (ir + 3)};${Math.cos(ia) * ir}`} dur={`${0.8 + (ii % 4) * 0.2}s`} repeatCount="indefinite" />
                        <animate attributeName="cy" values={`${Math.sin(ia) * ir};${Math.sin(ia + 0.5) * (ir + 3)};${Math.sin(ia) * ir}`} dur={`${0.8 + (ii % 4) * 0.2}s`} repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.2;0.7;0.2" dur={`${0.8 + (ii % 4) * 0.2}s`} repeatCount="indefinite" />
                      </circle>
                    );
                  })}
                  <text x="0" y="26" textAnchor="middle" fill="#a78bfa" fontSize="4" fontFamily="monospace" opacity="0.5">Erratic Pattern</text>
                </g>

                {/* Section: soil moisture / temperature anomaly */}
                <g transform="translate(200, 450)">
                  <rect x="-30" y="-18" width="60" height="36" rx="4" fill="#1c1917" opacity="0.4" stroke="#f97316" strokeWidth="0.3" />
                  <text x="0" y="-10" textAnchor="middle" fill="#fdba74" fontSize="5" fontFamily="monospace">SOIL TEMP</text>
                  {/* heat bars rising */}
                  {[0, 1, 2, 3, 4].map((bi) => (
                    <rect key={`ht-${bi}`} x={-20 + bi * 9} y={-2} width="5" height={6 + bi * 2.5} rx="1" fill="url(#heatSignature)" opacity="0.4">
                      <animate attributeName="height" values={`${6 + bi * 2.5};${9 + bi * 3};${6 + bi * 2.5}`} dur={`${1.5 + bi * 0.2}s`} repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.3;0.6;0.3" dur={`${1.5 + bi * 0.2}s`} repeatCount="indefinite" />
                    </rect>
                  ))}
                  <text x="0" y="24" textAnchor="middle" fill="#f97316" fontSize="4.5" fontFamily="monospace" opacity="0.5">+4.2°C Anomaly</text>
                </g>

                {/* Section: plant VOC emission spike */}
                <g transform="translate(330, 445)">
                  <circle cx="0" cy="0" r="20" fill="none" stroke="#22c55e" strokeWidth="0.4" strokeDasharray="3 2" opacity="0.3" />
                  <text x="0" y="-24" textAnchor="middle" fill="#86efac" fontSize="5" fontFamily="monospace">PLANT VOC</text>
                  {/* gas particles rising */}
                  {Array.from({ length: bioActive ? 8 : 4 }).map((_, vi) => {
                    const vx = -10 + (vi % 4) * 7;
                    return (
                      <circle key={`voc-${vi}`} cx={vx} cy={8} r={1.5 + (vi % 2)} fill="#4ade80" opacity="0" filter="url(#smokeBlurSm)">
                        <animate attributeName="cy" values="8;-15" dur={`${1.5 + vi * 0.2}s`} begin={`${vi * 0.3}s`} repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0;0.5;0.2;0" dur={`${1.5 + vi * 0.2}s`} begin={`${vi * 0.3}s`} repeatCount="indefinite" />
                      </circle>
                    );
                  })}
                  <text x="0" y="26" textAnchor="middle" fill="#4ade80" fontSize="4" fontFamily="monospace" opacity="0.5">Stress Emission</text>
                </g>

                {/* Section: humidity drop indicator */}
                <g transform="translate(440, 450)">
                  <rect x="-22" y="-16" width="44" height="32" rx="3" fill="#0c4a6e" opacity="0.3" stroke="#06b6d4" strokeWidth="0.3" />
                  <text x="0" y="-8" textAnchor="middle" fill="#67e8f9" fontSize="5" fontFamily="monospace">HUMIDITY</text>
                  {/* dropping arrow */}
                  <line x1="0" y1="-2" x2="0" y2="10" stroke="#06b6d4" strokeWidth="1" opacity="0.5">
                    <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.5s" repeatCount="indefinite" />
                  </line>
                  <polygon points="-3,8 0,14 3,8" fill="#06b6d4" opacity="0.5">
                    <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.5s" repeatCount="indefinite" />
                  </polygon>
                  <text x="0" y="22" textAnchor="middle" fill="#22d3ee" fontSize="5" fontFamily="monospace" opacity="0.5">↓ 18%</text>
                </g>

                {/* ── CORRELATION BADGE ── */}
                <g transform="translate(250, 500)">
                  <rect x="-155" y="-8" width="310" height="16" rx="8" fill="#451a03" opacity="0.5" stroke="#f97316" strokeWidth="0.4" />
                  <text x="0" y="3" textAnchor="middle" fill="#fed7aa" fontSize="5.5" fontFamily="monospace">
                    {bioActive
                      ? '⚠ MULTI-SIGNAL CONVERGENCE — SMOKE + NATURE PRECURSORS DETECTED'
                      : '△ MONITORING — SMOKE DISPERSION + NATURE SIGNAL BASELINE'}
                  </text>
                </g>
              </svg>
              );
              })()}
            </div>

            {/* right: explanation panel */}
            <Card className="border-0 rounded-none border-l border-border/20">
              <CardContent className="space-y-4 p-5">
                <div className="space-y-1.5">
                  <h3 className="text-[15px] font-semibold text-foreground flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-400" />
                    Post-Fire Smoke Sensing
                  </h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    After forest fires, residual smoke carries particulate matter (PM2.5, PM10), carbon monoxide, and volatile organic compounds. Sensor arrays detect plume density, dispersion direction, and concentration thresholds to assess corridor exposure risk.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-[15px] font-semibold text-foreground flex items-center gap-2">
                    <TreePine className="h-5 w-5 text-emerald-400" />
                    Early Nature Signal Forecasting
                  </h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    Nature provides pre-fire indicators: erratic insect swarm patterns, sudden soil temperature anomalies, stress-induced plant VOC emissions, and rapid humidity drops. Correlating these signals helps surface fire risk before ignition — an early biological forecasting layer.
                  </p>
                </div>

                <div className="rounded-lg border border-border/30 bg-muted/30 p-4">
                  <p className="mb-2.5 text-[13px] font-semibold text-foreground/90">Nature Precursor Signals</p>
                  <div className="flex flex-col gap-2.5">
                    {[
                      { step: 1, label: 'Insect Behavior', detail: 'Erratic swarm = thermal/chemical shift' },
                      { step: 2, label: 'Soil Temperature', detail: 'Subsurface heat anomaly detection' },
                      { step: 3, label: 'Plant VOC Spike', detail: 'Vegetation stress gas emissions' },
                      { step: 4, label: 'Humidity Drop', detail: 'Rapid moisture loss → ignition risk' },
                      { step: 5, label: 'Correlated Forecast', detail: 'Multi-signal confidence → advisory' },
                    ].map((f, i) => (
                      <div key={f.step} className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-[11px] font-bold text-orange-400">
                          {f.step}
                        </span>
                        <div>
                          <span className="text-[13px] font-medium text-foreground/90">{f.label}</span>
                          <span className="ml-1.5 text-[11px] text-muted-foreground/70">— {f.detail}</span>
                        </div>
                        {i < 4 && <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/40" />}
                      </div>
                    ))}
                  </div>
                </div>

                <ul className="space-y-2">
                  {[
                    'Smoke particulate sensors detect PM2.5/PM10/CO/VOC concentrations in real-time.',
                    'Nature precursors (insect behavior, soil temp, plant VOC, humidity) provide pre-ignition warnings.',
                    'Multi-signal correlation generates a forecasting confidence score.',
                    'All outputs are advisory — operator review required before corridor action.',
                  ].map((b) => (
                    <li key={b} className="flex items-start gap-2 text-[13px] leading-relaxed text-muted-foreground">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-400/80" />
                      {b}
                    </li>
                  ))}
                </ul>

                {/* live nature signal feed */}
                <div className="rounded-lg border border-orange-500/20 bg-orange-950/20 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-orange-300 uppercase tracking-wider">Nature Signal Feed</span>
                    <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    {[
                      { time: '14:52:08', type: 'PM2.5 Spike', val: '89%', color: 'text-red-300' },
                      { time: '14:51:30', type: 'Soil Temp ↑', val: '76%', color: 'text-orange-300' },
                      { time: '14:50:15', type: 'VOC Emission', val: '63%', color: 'text-emerald-300' },
                      { time: '14:48:42', type: 'Humidity ↓', val: '71%', color: 'text-cyan-300' },
                      { time: '14:46:18', type: 'Insect Swarm', val: '54%', color: 'text-violet-300' },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="text-muted-foreground/50">{s.time}</span>
                        <span className={s.color}>{s.type}</span>
                        <span className="ml-auto text-orange-200/70">{s.val}</span>
                        <div className="h-1.5 w-12 rounded-full bg-orange-950">
                          <div className="h-full rounded-full bg-orange-500/60" style={{ width: s.val }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Card>
      </motion.section>

      {/* ── 4b) GROUND-LEVEL ENVIRONMENTAL SENSING ── */}
      <motion.section {...fade} transition={{ delay: 0.18 }} id="aop-ground-level" data-tour-section="aop-ground-level">
        <Card className="overflow-hidden border-border/30">
          <div className="flex flex-col gap-2 border-b border-border/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <SectionTitle className="flex items-center gap-2">
                <Mountain className="h-5 w-5 text-amber-500" />
                Ground-Level Environmental Sensing
              </SectionTitle>
              <span className="text-[11px] text-muted-foreground/70 uppercase tracking-wider">Concept · Cloudburst · Landslide · Wildlife Behavioral Shift</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <CloudRain className="h-3.5 w-3.5 text-cyan-400" />
                <span className="text-[11px] text-muted-foreground/80 uppercase tracking-wider">Intensity</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={cloudburstIntensity}
                  onChange={(e) => setCloudburstIntensity(Number(e.target.value))}
                  className="w-24 h-1.5 accent-cyan-500 cursor-pointer"
                />
                <span className="text-[12px] font-mono font-semibold text-cyan-400 w-8">{cloudburstIntensity}%</span>
              </div>
              <Badge variant="outline" className="shrink-0 border-cyan-500/40 bg-cyan-500/5 text-cyan-400 text-[11px] uppercase tracking-widest px-3 py-1">
                Earth-Level Scenario
              </Badge>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
            {/* left: animated SVG visualization */}
            <div className="relative bg-gradient-to-br from-[hsl(220,20%,10%)] via-[hsl(200,15%,12%)] to-[hsl(180,10%,8%)] overflow-hidden" style={{ minHeight: 520 }}>
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 520" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="mudGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#92400e" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#78350f" stopOpacity="0.2" />
                  </linearGradient>
                  <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#365314" stopOpacity="0.4" />
                    <stop offset="60%" stopColor="#1a2e05" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#0a0f02" stopOpacity="0.8" />
                  </linearGradient>
                  <filter id="glowCyan" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                  </filter>
                  <filter id="glowAmber" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" />
                  </filter>
                  <radialGradient id="impactGlow" cx="50%" cy="50%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* ── SCENE TITLE ── */}
                <text x="250" y="22" textAnchor="middle" fill="#a1a1aa" fontSize="7" fontFamily="monospace" letterSpacing="0.15em" opacity="0.6">
                  GROUND-LEVEL ENVIRONMENTAL SCENARIO — ADVISORY VISUALIZATION
                </text>

                {/* ── CLOUDBURST / RAINFALL ── */}
                {/* dark cloud mass */}
                <ellipse cx="130" cy="55" rx="70" ry="22" fill="#334155" opacity="0.6" />
                <ellipse cx="145" cy="48" rx="50" ry="18" fill="#475569" opacity="0.5" />
                <ellipse cx="115" cy="60" rx="40" ry="14" fill="#334155" opacity="0.4" />
                {/* cloud label */}
                <g transform="translate(130,38)">
                  <rect x="-28" y="-7" width="56" height="14" rx="7" fill="#164e63" opacity="0.7" stroke="#06b6d4" strokeWidth="0.5" />
                  <text x="0" y="3" textAnchor="middle" fill="#67e8f9" fontSize="5.5" fontFamily="monospace">CLOUDBURST</text>
                </g>
                {/* animated rain streaks — reactive to intensity slider */}
                {(() => {
                  const rainCount = Math.max(4, Math.round(18 * (cloudburstIntensity / 50)));
                  const rainSpeed = Math.max(0.3, 0.8 * (50 / Math.max(cloudburstIntensity, 10)));
                  const rainOpacity = 0.2 + (cloudburstIntensity / 100) * 0.6;
                  return Array.from({ length: rainCount }).map((_, ri) => {
                    const rx = 75 + (ri * (130 / rainCount)) + (ri % 3) * 2;
                    const rDelay = (ri * 0.12) % 1.5;
                    const rLen = 8 + (ri % 4) * 4 + (cloudburstIntensity / 100) * 6;
                    return (
                      <line key={`rain-${ri}`} x1={rx} y1={70} x2={rx - 2} y2={70 + rLen} stroke="#06b6d4" strokeWidth={0.6 + (cloudburstIntensity / 100) * 0.8} strokeLinecap="round" opacity="0">
                        <animate attributeName="y1" values="70;155" dur={`${rainSpeed}s`} begin={`${rDelay}s`} repeatCount="indefinite" />
                        <animate attributeName="y2" values={`${70 + rLen};${155 + rLen}`} dur={`${rainSpeed}s`} begin={`${rDelay}s`} repeatCount="indefinite" />
                        <animate attributeName="opacity" values={`0;${rainOpacity};${rainOpacity * 0.6};0`} dur={`${rainSpeed}s`} begin={`${rDelay}s`} repeatCount="indefinite" />
                      </line>
                    );
                  });
                })()}
                {/* water accumulation at base — reactive */}
                <ellipse cx="130" cy="170" rx="60" ry="5" fill="#06b6d4" opacity={0.04 + (cloudburstIntensity / 100) * 0.15}>
                  <animate attributeName="rx" values={`${40 + cloudburstIntensity * 0.3};${55 + cloudburstIntensity * 0.3};${40 + cloudburstIntensity * 0.3}`} dur={`${Math.max(1.5, 3 - cloudburstIntensity * 0.015)}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" values={`${0.04 + cloudburstIntensity * 0.001};${0.08 + cloudburstIntensity * 0.002};${0.04 + cloudburstIntensity * 0.001}`} dur={`${Math.max(1.5, 3 - cloudburstIntensity * 0.015)}s`} repeatCount="indefinite" />
                </ellipse>

                {/* ── HILLSIDE / LANDSLIDE ── */}
                {/* mountain silhouette */}
                <polygon points="250,80 350,180 150,180" fill="#1c1917" stroke="#78350f" strokeWidth="0.5" opacity="0.6" />
                <polygon points="280,95 370,180 200,180" fill="#292524" stroke="#78350f" strokeWidth="0.3" opacity="0.4" />
                {/* stable ground lines */}
                <line x1="180" y1="180" x2="320" y2="180" stroke="#365314" strokeWidth="1" opacity="0.3" />

                {/* landslide debris flow — reactive to intensity slider */}
                {(() => {
                  const debrisPath = "M270,120 Q310,145 330,165 Q345,175 360,180";
                  const debrisSpeed = Math.max(0.8, 1.8 * (50 / Math.max(cloudburstIntensity, 10)));
                  const debrisCount = Math.max(2, Math.round(5 * (cloudburstIntensity / 50)));
                  const channelOpacity = 0.1 + (cloudburstIntensity / 100) * 0.2;
                  return (
                    <g>
                      {/* debris channel */}
                      <path d={debrisPath} fill="none" stroke="#92400e" strokeWidth={8 + (cloudburstIntensity / 100) * 8} opacity={channelOpacity} strokeLinecap="round" />
                      <path d={debrisPath} fill="none" stroke="#78350f" strokeWidth={4 + (cloudburstIntensity / 100) * 4} opacity="0.25" strokeLinecap="round">
                        <animate attributeName="opacity" values={`${0.1 + channelOpacity * 0.5};${0.2 + channelOpacity};${0.1 + channelOpacity * 0.5}`} dur={`${Math.max(1.2, 2.5 - cloudburstIntensity * 0.013)}s`} repeatCount="indefinite" />
                      </path>
                      {/* moving debris particles */}
                      {Array.from({ length: debrisCount }).map((_, di) => (
                        <g key={`debris-${di}`}>
                          <rect width={3 + (di % 2) * 2} height={2 + (di % 3)} rx="1" fill="#a16207" opacity="0">
                            <animateMotion dur={`${debrisSpeed + di * 0.2}s`} begin={`${di * 0.3}s`} repeatCount="indefinite" path={debrisPath} />
                            <animate attributeName="opacity" values="0;0.7;0.5;0" dur={`${debrisSpeed + di * 0.2}s`} begin={`${di * 0.3}s`} repeatCount="indefinite" />
                          </rect>
                        </g>
                      ))}
                      {/* impact zone glow */}
                      <circle cx="355" cy="178" r={10 + (cloudburstIntensity / 100) * 10} fill="url(#impactGlow)">
                        <animate attributeName="r" values={`${8 + cloudburstIntensity * 0.1};${18 + cloudburstIntensity * 0.15};${8 + cloudburstIntensity * 0.1}`} dur={`${Math.max(1, 2 - cloudburstIntensity * 0.01)}s`} repeatCount="indefinite" />
                      </circle>
                    </g>
                  );
                })()}

                {/* landslide label */}
                <g transform="translate(310,110)">
                  <rect x="-28" y="-7" width="56" height="14" rx="7" fill="#451a03" opacity="0.7" stroke="#d97706" strokeWidth="0.5" />
                  <text x="0" y="3" textAnchor="middle" fill="#fbbf24" fontSize="5.5" fontFamily="monospace">LANDSLIDE</text>
                  <circle cx="22" cy="0" r="1.5" fill="#f59e0b">
                    <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />
                  </circle>
                </g>

                {/* ── GROUND SENSOR LINE ── */}
                <line x1="30" y1="200" x2="470" y2="200" stroke="#365314" strokeWidth="1.5" opacity="0.3" strokeDasharray="4 3" />
                <text x="250" y="215" textAnchor="middle" fill="#4ade80" fontSize="5" fontFamily="monospace" opacity="0.4" letterSpacing="0.2em">
                  ▼ GROUND SENSOR ARRAY ▼
                </text>
                {/* sensor nodes */}
                {[80, 170, 250, 330, 420].map((sx, si) => (
                  <g key={`sensor-${si}`} transform={`translate(${sx}, 200)`}>
                    <circle r="3" fill="#166534" stroke="#4ade80" strokeWidth="0.5" opacity="0.5" />
                    <circle r="6" fill="#22c55e" opacity="0" filter="url(#glowCyan)">
                      <animate attributeName="opacity" values="0;0.3;0" dur={`${2 + si * 0.3}s`} repeatCount="indefinite" />
                      <animate attributeName="r" values="4;10;4" dur={`${2 + si * 0.3}s`} repeatCount="indefinite" />
                    </circle>
                  </g>
                ))}

                {/* ── SEISMIC WAVEFORM ── */}
                <g transform="translate(30, 240)">
                  <rect x="0" y="-15" width="440" height="30" rx="4" fill="#0f172a" opacity="0.4" stroke="#334155" strokeWidth="0.3" />
                  <text x="5" y="-8" fill="#94a3b8" fontSize="5" fontFamily="monospace">SEISMIC / VIBRATION WAVEFORM</text>
                  {/* waveform line */}
                  <polyline
                    points={Array.from({ length: 80 }).map((_, wi) => {
                      const wx = 10 + wi * 5.3;
                      const amp = wi > 30 && wi < 55 ? 8 + Math.sin(wi * 0.8) * 5 : 2 + Math.sin(wi * 0.5) * 1.5;
                      const wy = (wi % 2 === 0 ? -1 : 1) * amp;
                      return `${wx},${wy}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="1"
                    opacity="0.6"
                  >
                    <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2s" repeatCount="indefinite" />
                  </polyline>
                  {/* anomaly region marker */}
                  <rect x={10 + 30 * 5.3} y="-12" width={(55 - 30) * 5.3} height="24" rx="2" fill="#ef4444" opacity="0.06" stroke="#ef4444" strokeWidth="0.3" strokeDasharray="2 2" />
                  <text x={10 + 42 * 5.3} y="11" textAnchor="middle" fill="#fca5a5" fontSize="4.5" fontFamily="monospace">ANOMALY ZONE</text>
                </g>

                {/* ── WILDLIFE BEHAVIORAL SHIFT ── */}
                <text x="250" y="295" textAnchor="middle" fill="#a1a1aa" fontSize="6.5" fontFamily="monospace" letterSpacing="0.1em" opacity="0.5">
                  WILDLIFE BEHAVIORAL ANOMALY DETECTION
                </text>

                {/* terrain with vegetation */}
                <path d="M0,430 Q50,420 100,425 Q200,415 250,420 Q350,410 400,418 Q450,425 500,420 L500,520 L0,520 Z" fill="url(#groundGrad)" opacity="0.5" />

                {/* scattered trees on ground */}
                {[60, 120, 200, 300, 380, 440].map((tx, ti) => (
                  <g key={`gtree-${ti}`} transform={`translate(${tx}, ${420 + (ti % 3) * 3})`}>
                    <line x1="0" y1="0" x2="0" y2="-10" stroke="#15803d" strokeWidth="1.2" opacity="0.3" />
                    <polygon points="-5,-6 0,-20 5,-6" fill="#22c55e" opacity="0.1" />
                    <polygon points="-3,-12 0,-24 3,-12" fill="#16a34a" opacity="0.12" />
                  </g>
                ))}

                {/* wildlife group: deer/animals — reactive to biosentinel toggle */}
                {(() => {
                  const bioActive = activeOverlays.includes('biosentinel');
                  const allAnimals = [
                    { angle: -30, dist: 80, delay: 0, size: 1.1 },
                    { angle: -60, dist: 95, delay: 0.3, size: 0.9 },
                    { angle: 15, dist: 70, delay: 0.5, size: 1.0 },
                    { angle: 45, dist: 100, delay: 0.2, size: 0.85 },
                    { angle: -10, dist: 60, delay: 0.8, size: 1.05 },
                    { angle: 70, dist: 85, delay: 0.4, size: 0.95 },
                    { angle: -80, dist: 75, delay: 0.6, size: 0.9 },
                    { angle: 120, dist: 90, delay: 0.1, size: 0.8 },
                    { angle: -120, dist: 88, delay: 0.15, size: 0.85 },
                    { angle: 160, dist: 72, delay: 0.7, size: 1.0 },
                    { angle: -150, dist: 105, delay: 0.35, size: 0.75 },
                  ];
                  const visibleAnimals = bioActive ? allAnimals : allAnimals.slice(0, 4);
                  const speedFactor = bioActive ? 0.5 : 1;
                  const distFactor = bioActive ? 1.4 : 1;
                  const animalOpacity = bioActive ? 0.8 : 0.5;
                  const cx = 250, cy = 370;
                  return (
                    <g>
                      {/* stressor epicenter */}
                      <circle cx={cx} cy={cy} r="8" fill="#ef4444" opacity="0.1">
                        <animate attributeName="r" values={bioActive ? "5;20;5" : "5;15;5"} dur={bioActive ? "1.5s" : "2s"} repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.15;0.05;0.15" dur={bioActive ? "1.5s" : "2s"} repeatCount="indefinite" />
                      </circle>
                      <circle cx={cx} cy={cy} r="3" fill="#ef4444" opacity={bioActive ? 0.5 : 0.3} />
                      {/* seismic ripple rings — more when active */}
                      {(bioActive ? [0, 0.7, 1.4, 2.1] : [0, 1, 2]).map((ri, idx) => (
                        <circle key={`ripple-${idx}`} cx={cx} cy={cy} r="5" fill="none" stroke="#f97316" strokeWidth={bioActive ? "0.8" : "0.5"} opacity="0">
                          <animate attributeName="r" values={bioActive ? "5;50;80" : "5;40;70"} dur={bioActive ? "2s" : "3s"} begin={`${ri}s`} repeatCount="indefinite" />
                          <animate attributeName="opacity" values={bioActive ? "0.5;0.2;0" : "0.4;0.15;0"} dur={bioActive ? "2s" : "3s"} begin={`${ri}s`} repeatCount="indefinite" />
                        </circle>
                      ))}
                      {/* stressor label — reactive */}
                      <g transform={`translate(${cx}, ${cy - 15})`}>
                        <rect x="-38" y="-6" width="76" height="12" rx="6" fill={bioActive ? "#7f1d1d" : "#451a03"} opacity="0.6" stroke={bioActive ? "#ef4444" : "#d97706"} strokeWidth="0.4" />
                        <text x="0" y="3" textAnchor="middle" fill={bioActive ? "#fca5a5" : "#fbbf24"} fontSize="5" fontFamily="monospace">
                          {bioActive ? '⚠ HIGH ALERT' : '△ STRESSOR'}
                        </text>
                        {bioActive && <circle cx="32" cy="0" r="1.5" fill="#ef4444"><animate attributeName="opacity" values="0.4;1;0.4" dur="0.6s" repeatCount="indefinite" /></circle>}
                      </g>

                      {/* animal silhouettes scattering — reactive */}
                      {visibleAnimals.map((a, ai) => {
                        const rad = (a.angle * Math.PI) / 180;
                        const d = a.dist * distFactor;
                        const ex = cx + Math.cos(rad) * d;
                        const ey = cy + Math.sin(rad) * d * 0.6;
                        const s = a.size;
                        const dur = (3 + ai * 0.3) * speedFactor;
                        const legSpeed = (0.3 + (ai % 3) * 0.05) * (bioActive ? 0.5 : 1);
                        return (
                          <g key={`animal-${ai}`} opacity="0">
                            {/* trail line */}
                            <line x1={cx} y1={cy} x2={ex} y2={ey} stroke="#f97316" strokeWidth="0.3" strokeDasharray="2 3" opacity={bioActive ? 0.25 : 0.1} />
                            <g>
                              <animateMotion
                                dur={`${dur}s`}
                                begin={`${a.delay}s`}
                                repeatCount="indefinite"
                                path={`M${cx},${cy} Q${cx + (ex - cx) * 0.5},${cy + (ey - cy) * 0.3 - 8} ${ex},${ey}`}
                              />
                              {/* quadruped body */}
                              <ellipse cx="0" cy="0" rx={5 * s} ry={2.5 * s} fill={bioActive ? '#f59e0b' : '#d97706'} opacity={bioActive ? 0.6 : 0.5} />
                              {/* head */}
                              <circle cx={5 * s} cy={-1.5 * s} r={1.8 * s} fill={bioActive ? '#fbbf24' : '#f59e0b'} opacity={bioActive ? 0.6 : 0.5} />
                              {/* legs — running speed reactive */}
                              <g>
                                <line x1={-2 * s} y1={2.5 * s} x2={-3 * s} y2={5 * s} stroke={bioActive ? '#f59e0b' : '#d97706'} strokeWidth={0.8 * s} strokeLinecap="round" opacity="0.5">
                                  <animate attributeName="x2" values={`${-3 * s};${-1 * s};${-3 * s}`} dur={`${legSpeed}s`} repeatCount="indefinite" />
                                </line>
                                <line x1={2 * s} y1={2.5 * s} x2={3 * s} y2={5 * s} stroke={bioActive ? '#f59e0b' : '#d97706'} strokeWidth={0.8 * s} strokeLinecap="round" opacity="0.5">
                                  <animate attributeName="x2" values={`${3 * s};${1 * s};${3 * s}`} dur={`${legSpeed}s`} repeatCount="indefinite" />
                                </line>
                              </g>
                            </g>
                            <animate attributeName="opacity" values={`0;${animalOpacity};${animalOpacity * 0.85};${animalOpacity * 0.4};0`} dur={`${dur}s`} begin={`${a.delay}s`} repeatCount="indefinite" />
                          </g>
                        );
                      })}
                    </g>
                  );
                })()}

                {/* ── DETECTION ALERT BADGE — reactive ── */}
                {(() => {
                  const bioActive = activeOverlays.includes('biosentinel');
                  return (
                    <g transform="translate(250, 315)">
                      <rect x="-120" y="-9" width="240" height="18" rx="9" fill={bioActive ? '#7f1d1d' : '#451a03'} opacity="0.5" stroke={bioActive ? '#ef4444' : '#d97706'} strokeWidth="0.4" />
                      <text x="0" y="4" textAnchor="middle" fill={bioActive ? '#fca5a5' : '#fde68a'} fontSize="6" fontFamily="monospace">
                        {bioActive
                          ? '⚠ MASS WILDLIFE DISPERSAL — ELEVATED GROUND STRESSOR DETECTED'
                          : '△ WILDLIFE MOVEMENT BASELINE — MONITORING'}
                      </text>
                    </g>
                  );
                })()}

                {/* ── INTERPRETIVE TEXT ── */}
                <g transform="translate(250, 490)">
                  <rect x="-170" y="-14" width="340" height="36" rx="6" fill="#1e1b4b" opacity="0.4" stroke="#8b5cf6" strokeWidth="0.3" />
                  <text x="0" y="-2" textAnchor="middle" fill="#a78bfa" fontSize="5.5" fontFamily="monospace" opacity="0.8">
                    After cloudburst, landslide debris and sudden wildlife flight patterns
                  </text>
                  <text x="0" y="9" textAnchor="middle" fill="#a78bfa" fontSize="5.5" fontFamily="monospace" opacity="0.8">
                    help surface ground-level instability risks to utility corridors — advisory only
                  </text>
                </g>
              </svg>
            </div>

            {/* right: contextual explanation */}
            <Card className="border-0 rounded-none border-l border-border/20">
              <CardContent className="space-y-4 p-5">
                <div className="space-y-1.5">
                  <h3 className="text-[15px] font-semibold text-foreground flex items-center gap-2">
                    <CloudRain className="h-5 w-5 text-cyan-400" />
                    Cloudburst &amp; Landslide Detection
                  </h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    Extreme precipitation triggers terrain instability. Ground vibration sensors detect debris flow movement before it reaches utility infrastructure corridors.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-[15px] font-semibold text-foreground flex items-center gap-2">
                    <PawPrint className="h-5 w-5 text-amber-400" />
                    Wildlife Behavioral Shift
                  </h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    Sudden mass dispersal of ground-dwelling wildlife (deer, mammals) from a nesting/resting corridor can indicate seismic activity, debris flow, fire, or toxic gas exposure — providing an early biological warning signal.
                  </p>
                </div>

                <div className="rounded-lg border border-border/30 bg-muted/30 p-4">
                  <p className="mb-2.5 text-[13px] font-semibold text-foreground/90">Signal Integration Flow</p>
                  <div className="flex flex-col gap-2.5">
                    {[
                      { step: 1, label: 'Rainfall Surge', detail: 'Cloud-burst detected above threshold' },
                      { step: 2, label: 'Seismic Anomaly', detail: 'Ground vibration spike in corridor' },
                      { step: 3, label: 'Wildlife Scatter', detail: 'Abnormal herd dispersal pattern' },
                      { step: 4, label: 'Correlated Alert', detail: 'Multi-signal confidence score → advisory' },
                    ].map((f, i) => (
                      <div key={f.step} className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-[11px] font-bold text-amber-400">
                          {f.step}
                        </span>
                        <div>
                          <span className="text-[13px] font-medium text-foreground/90">{f.label}</span>
                          <span className="ml-1.5 text-[11px] text-muted-foreground/70">— {f.detail}</span>
                        </div>
                        {i < 3 && <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/40" />}
                      </div>
                    ))}
                  </div>
                </div>

                <ul className="space-y-2">
                  {[
                    'Ground sensors detect vibration anomalies preceding landslide debris flow.',
                    'Wildlife behavioral models compare real-time motion vs seasonal baselines.',
                    'Cloudburst + seismic + wildlife data are correlated for multi-signal confidence scoring.',
                    'All outputs are advisory — operator review required before action.',
                  ].map((b) => (
                    <li key={b} className="flex items-start gap-2 text-[13px] leading-relaxed text-muted-foreground">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/80" />
                      {b}
                    </li>
                  ))}
                </ul>

                {/* live feed mockup */}
                <div className="rounded-lg border border-amber-500/20 bg-amber-950/20 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">Ground Sensor Feed</span>
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    {[
                      { time: '14:45:22', type: 'Seismic Spike', val: '84%', color: 'text-red-300' },
                      { time: '14:44:58', type: 'Debris Flow', val: '71%', color: 'text-amber-300' },
                      { time: '14:43:10', type: 'Wildlife Scatter', val: '67%', color: 'text-amber-300/70' },
                      { time: '14:41:30', type: 'Rain Intensity', val: '92%', color: 'text-cyan-300' },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="text-muted-foreground/50">{s.time}</span>
                        <span className={s.color}>{s.type}</span>
                        <span className="ml-auto text-amber-200/70">{s.val}</span>
                        <div className="h-1.5 w-12 rounded-full bg-amber-950">
                          <div className="h-full rounded-full bg-amber-500/60" style={{ width: s.val }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Card>
      </motion.section>

      {/* ── 5) BRIDGE SECTION: PHASE 1 vs PHASE 2 ── */}
      <motion.section {...fade} transition={{ delay: 0.2 }} id="aop-phase-bridge" data-tour-section="aop-phase-bridge">
        <SectionTitle className="mb-4">How This Connects to Operator Copilot (Current Phase 1)</SectionTitle>

        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-2 border-b border-border/30 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
              <div className="border-r border-border/30 px-5 py-3.5">Phase 1 (Current Demo)</div>
              <div className="px-5 py-3.5">Phase 2+ (Concept Extensions)</div>
            </div>
            {comparisonRows.map(([p1, p2], i) => (
              <div
                key={i}
                className={cn(
                  'grid grid-cols-2 text-[13px]',
                  i < comparisonRows.length - 1 && 'border-b border-border/20',
                )}
              >
                <div className="flex items-center gap-2.5 border-r border-border/20 px-5 py-3.5 text-foreground/85">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400/80" />
                  {p1}
                </div>
                <div className="flex items-center gap-2.5 px-5 py-3.5 text-muted-foreground">
                  <Eye className="h-4 w-4 shrink-0 text-primary/60" />
                  {p2}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <p className="mt-3 text-[13px] text-muted-foreground/80">
          Phase 1 remains OMS-adjacent decision support. Phase 2 adds environmental intelligence as a bounded advisory layer.
        </p>
      </motion.section>

      {/* ── 6) GOVERNANCE ── */}
      <motion.section {...fade} transition={{ delay: 0.25 }} id="aop-governance" data-tour-section="aop-governance">
        <Card className="border-amber-500/20 bg-card">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:gap-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/5">
              <Lock className="h-6 w-6 text-amber-400" />
            </div>
            <div className="space-y-3">
              <h3 className="text-base font-bold text-foreground">Operational Governance</h3>
              <ul className="space-y-2">
                {[
                  'Decision-support only. No autonomous control actions.',
                  'No live SCADA/OMS/ADMS integration in this demo.',
                  'Concept features require validation, sensor partnerships, and utility governance approval.',
                  'All outputs remain advisory and must be operator-approved.',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-[13px] text-muted-foreground">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* ── 7) CTA ── */}
      <div className="flex justify-center pt-4">
        <Button
          variant="outline"
          className="gap-2 text-sm px-6 py-2.5"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4" />
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}
