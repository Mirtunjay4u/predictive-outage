import { useState, useMemo } from 'react';
import { Search, BookOpen, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface GlossaryEntry {
  term: string;
  definition: string;
}

const utilityTerms: GlossaryEntry[] = [
  { term: 'Advisory', definition: 'Operational guidance presented for human review — never executed autonomously. All Copilot outputs carry advisory status.' },
  { term: 'Critical Load', definition: 'Grid-connected facility requiring prioritized restoration (Hospital, Water, Telecom, Emergency Services).' },
  { term: 'Critical Load Runway', definition: 'Remaining operational time before backup power threshold is breached.' },
  { term: 'Crew Readiness', definition: 'Assessment of crew availability and skill alignment relative to outage demand.' },
  { term: 'ETR Confidence Band', definition: 'Probabilistic restoration time window representing uncertainty drivers rather than a single deterministic timestamp.' },
  { term: 'Event', definition: 'Structured outage occurrence associated with feeder or asset disruption.' },
  { term: 'Feeder', definition: 'Distribution line segment supplying downstream assets and customers.' },
  { term: 'Hazard Exposure', definition: 'Severity of environmental risk impacting grid assets.' },
  { term: 'Operational Risk Posture', definition: 'Aggregated summary of system-level outage severity, hazard exposure, ETR confidence, and crew readiness.' },
  { term: 'Outage Type', definition: 'Classification of event (Storm, Wildfire, Heavy Rain, Equipment Failure, etc.).' },
  { term: 'Rule Gate', definition: 'Deterministic constraint enforcement layer that evaluates safety, maintenance, and operational rules before AI reasoning is invoked. Blocks prohibited actions regardless of AI output.' },
  { term: 'Substation', definition: 'Electrical node stepping voltage levels and distributing to feeders.' },
];

const aiTerms: GlossaryEntry[] = [
  { term: 'Advisory Insight', definition: 'AI-generated guidance requiring operator validation.' },
  { term: 'Data Mode: Demo', definition: 'Indicates use of synthetic or simulated event data.' },
  { term: 'Decision Trace', definition: 'Structured explainability layer outlining inputs, rule checks, and reasoning drivers.' },
  { term: 'Deterministic Rule Engine', definition: 'Pre-inference constraint layer enforcing operational safety rules before AI output is presented.' },
  { term: 'Explainability', definition: 'Structured visibility into how outputs are derived.' },
  { term: 'Governance Layer', definition: 'Policy boundary enforcing advisory-only operation.' },
  { term: 'Model Router', definition: 'Inference management layer handling model selection and fallback.' },
  { term: 'Nemotron (NVIDIA NIM)', definition: 'Primary large language model used for structured reasoning in Phase 1.' },
  { term: 'Operational Constraint', definition: 'Rule preventing unsafe or restricted operational guidance.' },
  { term: 'Phase 1 Scope', definition: 'Bounded decision-support implementation without operational control integration.' },
  { term: 'System Status', definition: 'Header-level transparency indicator showing active model, scope, and data mode.' },
];

function GlossarySection({ title, entries, query }: { title: string; entries: GlossaryEntry[]; query: string }) {
  const filtered = useMemo(() => {
    if (!query) return entries;
    const q = query.toLowerCase();
    return entries.filter(e => e.term.toLowerCase().includes(q) || e.definition.toLowerCase().includes(q));
  }, [entries, query]);

  if (filtered.length === 0) return null;

  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground/70 mb-4">{title}</h2>
      <div className="space-y-1">
        {filtered.map((entry) => (
          <div key={entry.term} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 py-2.5 px-3 rounded-md hover:bg-muted/30 transition-colors">
            <dt className="text-sm font-semibold text-foreground min-w-[200px] shrink-0">{entry.term}</dt>
            <dd className="text-sm text-muted-foreground leading-relaxed">{entry.definition}</dd>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Glossary() {
  const [query, setQuery] = useState('');

  const totalVisible = useMemo(() => {
    if (!query) return utilityTerms.length + aiTerms.length;
    const q = query.toLowerCase();
    return [...utilityTerms, ...aiTerms].filter(e => e.term.toLowerCase().includes(q) || e.definition.toLowerCase().includes(q)).length;
  }, [query]);

  return (
    <div className="min-h-screen p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-6 w-6 text-primary/70" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Glossary of Operational & AI Terms</h1>
        </div>
        <p className="text-sm text-muted-foreground/80 ml-9">
          Standardized definitions for utility and AI terminology used within Operator Copilot (Phase 1).
        </p>
      </div>

      {/* Search */}
      <Card className="mb-8 p-1 bg-card/60 border-border/40">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Search terms…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm"
          />
        </div>
      </Card>

      {totalVisible === 0 && (
        <p className="text-center text-sm text-muted-foreground/60 py-12">No terms match "{query}"</p>
      )}

      {/* Sections */}
      <dl className="space-y-8">
        <GlossarySection title="A — Utility Domain Terms" entries={utilityTerms} query={query} />
        <Separator className="bg-border/30" />
        <GlossarySection title="B — AI & Architecture Terms" entries={aiTerms} query={query} />
      </dl>

      {/* Safety Footer */}
      <div className="mt-12 pt-6 border-t border-border/30">
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-muted/20 border border-border/30">
          <ShieldAlert className="h-4 w-4 mt-0.5 text-muted-foreground/50 shrink-0" />
          <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
            All definitions apply to Phase 1 implementation. Operator Copilot does not execute control actions or interface directly with SCADA systems.
          </p>
        </div>
      </div>
    </div>
  );
}
