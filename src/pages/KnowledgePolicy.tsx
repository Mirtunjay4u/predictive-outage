import { useState } from 'react';
import { ShieldCheck, Layers, Lock, Cog, BarChart3, Activity, Database, HelpCircle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Section definitions ── */
const sections = [
  { id: 'scope', label: 'Phase 1 Scope', icon: Layers },
  { id: 'safety', label: 'Safety Policies', icon: ShieldCheck },
  { id: 'rules', label: 'Rule Engine', icon: Cog },
  { id: 'etr', label: 'ETR Confidence', icon: BarChart3 },
  { id: 'runway', label: 'Critical Load Runway', icon: Activity },
  { id: 'data', label: 'Data & Integration', icon: Database },
  { id: 'audit', label: 'Auditability', icon: BookOpen },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
];

/* ── Reusable sub-components ── */
const SectionHeading = ({ id, icon: Icon, children }: { id: string; icon: React.ElementType; children: React.ReactNode }) => (
  <div id={id} className="scroll-mt-24 flex items-center gap-2.5 pb-2 pt-1">
    <Icon className="h-[18px] w-[18px] shrink-0 text-primary/70" strokeWidth={1.75} />
    <h2 className="text-[15px] font-semibold text-foreground tracking-tight">{children}</h2>
  </div>
);

const Divider = () => <div className="my-6 h-px bg-border/40" />;

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-2 text-[13px] leading-relaxed text-foreground/85">
    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
    <span>{children}</span>
  </li>
);

const Tag = ({ color, children }: { color: 'green' | 'red' | 'amber' | 'sky' | 'neutral'; children: React.ReactNode }) => {
  const styles: Record<string, string> = {
    green: 'border-emerald-500/25 bg-emerald-500/8 text-emerald-400',
    red: 'border-red-500/25 bg-red-500/8 text-red-400',
    amber: 'border-amber-500/25 bg-amber-500/8 text-amber-400',
    sky: 'border-sky-500/25 bg-sky-500/8 text-sky-400',
    neutral: 'border-border/50 bg-muted/30 text-muted-foreground',
  };
  return <span className={cn('inline-block rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', styles[color])}>{children}</span>;
};

/* ── Rule table data ── */
const rules = [
  { condition: 'asset_status = Maintenance', action: 'Block switching suggestions', rationale: 'Asset unavailable for operational change' },
  { condition: 'lockout_tagout = true', action: 'Mark non-operable', rationale: 'Safety lockout must be cleared by field crew' },
  { condition: 'backup_runtime_remaining < threshold', action: 'Escalate to critical priority', rationale: 'Critical facility at risk of service loss' },
  { condition: 'crew_specialization ≠ required_skill', action: 'Do not recommend dispatch', rationale: 'Skill mismatch creates safety risk' },
  { condition: 'hazard_level = High', action: 'Recommend non-field actions only', rationale: 'Field operations unsafe during active hazard' },
  { condition: 'etr_confidence = Low AND critical_load = true', action: 'Flag for operator review', rationale: 'Uncertain estimate on high-priority load' },
  { condition: 'weather_severity ≥ Severe', action: 'Suspend proactive dispatch', rationale: 'Storm conditions preclude safe field work' },
];

/* ── ETR band definitions ── */
const etrBands = [
  { band: 'High', range: '≤ 2 hr window', meaning: 'Fault well-understood, crew dispatched, minimal unknowns', color: 'text-emerald-400' },
  { band: 'Medium', range: '2–6 hr window', meaning: 'Partial information; weather or access factors pending', color: 'text-amber-400' },
  { band: 'Low', range: '> 6 hr window', meaning: 'Significant unknowns — damage extent, access, or resource constraints', color: 'text-red-400' },
];

/* ── Critical load types ── */
const criticalLoads = [
  { type: 'Hospital / Medical', threshold: '< 4 hrs', note: 'Life-safety priority — automatic escalation' },
  { type: 'Water Treatment', threshold: '< 6 hrs', note: 'Public health infrastructure' },
  { type: 'Telecom / 911 Center', threshold: '< 4 hrs', note: 'Emergency communications backbone' },
  { type: 'Emergency Services', threshold: '< 3 hrs', note: 'Fire, police, EMS staging facilities' },
  { type: 'Senior Care Facility', threshold: '< 5 hrs', note: 'Vulnerable population — HVAC / medical equipment' },
];

/* ── FAQ data ── */
const faqs = [
  { q: 'Is this a production system?', a: 'No. This is a Phase 1 demonstrator / proof-of-concept. It uses synthetic data and is intended to validate decision-support logic, not to control grid operations.' },
  { q: 'Can this system control the grid?', a: 'No. There is no SCADA, breaker, or switching integration. All outputs are advisory and require explicit operator approval.' },
  { q: 'What AI model is used?', a: 'The primary inference model is NVIDIA Nemotron (via NIM endpoint). A fallback model is available if the primary is unreachable. All responses pass through the deterministic rule engine before delivery.' },
  { q: 'What happens if the AI model fails?', a: 'The system fails safe. The rule engine continues to enforce constraints independently. Operators see a clear "model unavailable" status and can continue with standard procedures.' },
  { q: 'How is data stored?', a: 'The current demo uses a managed cloud datastore with synthetic scenario data. Enterprise-grade storage (encrypted, role-based) is planned for Phase 2.' },
  { q: 'Is the AI making decisions?', a: 'No. The AI surfaces patterns and drafts advisory outputs. Every recommendation is gated by the rule engine and requires human approval before any action.' },
  { q: 'What about data privacy?', a: 'Demo data is fully synthetic. No real customer PII, asset identifiers, or operational telemetry is used. Production deployment would require enterprise data governance review.' },
  { q: 'How do I know the AI output is trustworthy?', a: 'Every response includes its assumptions, uncertainty drivers, and which constraints were evaluated. There are no opaque outputs — explainability is a core design requirement.' },
  { q: 'Can operators override AI suggestions?', a: 'Yes, always. Operator judgment takes precedence. The system is designed to inform, not to direct.' },
  { q: 'What is the roadmap beyond Phase 1?', a: 'Phase 2 targets OMS/SCADA read-only integration, Dataverse connectivity, expanded crew optimization, and regulatory reporting — all subject to governance review.' },
];

export default function KnowledgePolicy() {
  const [activeSection, setActiveSection] = useState('scope');

  const handleAnchorClick = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem-1.75rem)] overflow-hidden">
      {/* ── Left: Section Navigation ── */}
      <nav className="hidden lg:flex w-56 shrink-0 flex-col border-r border-border/30 bg-card/50 px-3 py-5 overflow-y-auto" aria-label="Page sections">
        <span className="px-2 pb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">Sections</span>
        <div className="space-y-0.5">
          {sections.map((s) => {
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => handleAnchorClick(s.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2.5 py-[7px] text-left text-[12px] font-medium transition-colors duration-100',
                  isActive
                    ? 'bg-primary/8 text-primary'
                    : 'text-muted-foreground/70 hover:bg-muted/40 hover:text-foreground/80',
                )}
              >
                <s.icon className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-primary/80' : 'text-muted-foreground/50')} strokeWidth={1.75} />
                {s.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Right: Content Panel ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 lg:px-10 lg:py-8">
        {/* Header */}
        <div className="pb-6">
          <div className="flex items-center gap-3 pb-1.5">
            <Lock className="h-5 w-5 text-primary/70" strokeWidth={1.75} />
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Knowledge & Policy</h1>
          </div>
          <p className="text-sm text-muted-foreground/80">Governance, operational constraints, and system logic (Phase 1)</p>
          <p className="mt-2 rounded-md border border-border/30 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground/70 leading-relaxed">
            Decision-support only. No control actions. Demo uses synthetic data unless explicitly integrated.
          </p>
        </div>

        {/* ═══════ SECTION 1: Phase 1 Scope ═══════ */}
        <SectionHeading id="scope" icon={Layers}>Phase 1 Scope — What's In / What's Out</SectionHeading>

        <div className="grid gap-4 sm:grid-cols-2 pb-1">
          <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/[0.03] p-4">
            <div className="flex items-center gap-2 pb-2.5">
              <Tag color="green">Included</Tag>
            </div>
            <ul className="space-y-1.5">
              <Bullet>ETR confidence band estimation (earliest / expected / latest)</Bullet>
              <Bullet>Critical-load runway monitoring and escalation advisories</Bullet>
              <Bullet>Crew allocation insight and skill-match evaluation</Bullet>
              <Bullet>Weather hazard correlation and risk scoring</Bullet>
              <Bullet>Operator-approved communication drafts</Bullet>
              <Bullet>Deterministic rule-engine constraint enforcement</Bullet>
              <Bullet>Decision explainability (assumptions, drivers, constraints)</Bullet>
            </ul>
          </div>

          <div className="rounded-lg border border-red-500/15 bg-red-500/[0.03] p-4">
            <div className="flex items-center gap-2 pb-2.5">
              <Tag color="red">Not Included</Tag>
            </div>
            <ul className="space-y-1.5">
              <Bullet>Switching automation or breaker control</Bullet>
              <Bullet>SCADA command execution</Bullet>
              <Bullet>Load flow simulation or optimization</Bullet>
              <Bullet>Protection relay coordination</Bullet>
              <Bullet>ADMS integration or direct dispatch</Bullet>
            </ul>
          </div>
        </div>

        <Divider />

        {/* ═══════ SECTION 2: Safety Policies ═══════ */}
        <SectionHeading id="safety" icon={ShieldCheck}>Operational Safety Policies</SectionHeading>

        <ul className="space-y-2 pb-1">
          <Bullet>Operator approval is required for every operational decision. No autonomous actions are permitted.</Bullet>
          <Bullet>No switching recommendations are generated when an asset is flagged as locked out, under maintenance, or tagged for inspection.</Bullet>
          <Bullet>Field guidance is suppressed during lightning stand-down, active wildfire proximity, or hazardous weather conditions.</Bullet>
          <Bullet>Downed-wire, arcing, or public-safety events trigger immediate escalation — AI inference is bypassed in favor of deterministic safety protocols.</Bullet>
          <Bullet>Critical facility runway breaches ({'<'} threshold hours) auto-escalate priority regardless of other scoring factors.</Bullet>
          <Bullet>Field safety explicitly overrides restoration speed in all system logic.</Bullet>
        </ul>

        <Divider />

        {/* ═══════ SECTION 3: Rule Engine ═══════ */}
        <SectionHeading id="rules" icon={Cog}>Rule Engine — Deterministic Constraints</SectionHeading>

        <p className="pb-3 text-[13px] leading-relaxed text-foreground/80">
          The rule engine executes <strong className="text-foreground/95">before</strong> any AI inference. It enforces hard operational constraints that cannot be overridden by the language model. If a rule blocks an action, the AI response will reflect that constraint and explain why.
        </p>

        <div className="overflow-x-auto rounded-lg border border-border/30">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20">
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground/80 uppercase tracking-wider text-[10px]">Condition</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground/80 uppercase tracking-wider text-[10px]">Action</th>
                <th className="hidden sm:table-cell px-3 py-2 text-left font-semibold text-muted-foreground/80 uppercase tracking-wider text-[10px]">Rationale</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r, i) => (
                <tr key={i} className={cn('border-b border-border/20', i % 2 === 0 ? 'bg-transparent' : 'bg-muted/10')}>
                  <td className="px-3 py-2 font-mono text-[11px] text-foreground/80">{r.condition}</td>
                  <td className="px-3 py-2 text-foreground/80">{r.action}</td>
                  <td className="hidden sm:table-cell px-3 py-2 text-muted-foreground/70">{r.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Divider />

        {/* ═══════ SECTION 4: ETR Confidence ═══════ */}
        <SectionHeading id="etr" icon={BarChart3}>ETR Confidence Bands</SectionHeading>

        <p className="pb-3 text-[13px] leading-relaxed text-foreground/80">
          ETR (Estimated Time to Restoration) is expressed as a confidence band rather than a single point estimate. This reflects the inherent uncertainty in outage restoration and helps operators set realistic expectations.
        </p>

        <div className="overflow-x-auto rounded-lg border border-border/30 mb-4">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20">
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground/80 uppercase tracking-wider text-[10px]">Confidence</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground/80 uppercase tracking-wider text-[10px]">Window</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground/80 uppercase tracking-wider text-[10px]">Interpretation</th>
              </tr>
            </thead>
            <tbody>
              {etrBands.map((b, i) => (
                <tr key={i} className="border-b border-border/20">
                  <td className={cn('px-3 py-2 font-semibold', b.color)}>{b.band}</td>
                  <td className="px-3 py-2 text-foreground/80">{b.range}</td>
                  <td className="px-3 py-2 text-muted-foreground/70">{b.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="pb-1 text-[12px] font-semibold text-foreground/80 uppercase tracking-wider">Typical Uncertainty Drivers</p>
        <ul className="space-y-1.5 pb-1">
          <Bullet>Weather volatility — ongoing storm activity widening the window</Bullet>
          <Bullet>Access constraints — flooded roads, debris, or restricted areas</Bullet>
          <Bullet>Damage extent unknown — underground fault, multi-point failure</Bullet>
          <Bullet>Crew availability — shift transitions, overtime limits, travel time</Bullet>
          <Bullet>Equipment staging — specialized gear or material lead time</Bullet>
        </ul>

        <Divider />

        {/* ═══════ SECTION 5: Critical Load Runway ═══════ */}
        <SectionHeading id="runway" icon={Activity}>Critical Load Runway</SectionHeading>

        <p className="pb-3 text-[13px] leading-relaxed text-foreground/80">
          <strong className="text-foreground/95">Runway</strong> is the estimated time remaining before a critical facility's backup power is exhausted. When runway drops below the escalation threshold, the event is automatically elevated in priority — this is an advisory escalation, not an automated control action.
        </p>

        <div className="overflow-x-auto rounded-lg border border-border/30 mb-4">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20">
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground/80 uppercase tracking-wider text-[10px]">Facility Type</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground/80 uppercase tracking-wider text-[10px]">Threshold</th>
                <th className="hidden sm:table-cell px-3 py-2 text-left font-semibold text-muted-foreground/80 uppercase tracking-wider text-[10px]">Note</th>
              </tr>
            </thead>
            <tbody>
              {criticalLoads.map((c, i) => (
                <tr key={i} className={cn('border-b border-border/20', i % 2 === 0 ? 'bg-transparent' : 'bg-muted/10')}>
                  <td className="px-3 py-2 font-medium text-foreground/85">{c.type}</td>
                  <td className="px-3 py-2 font-mono text-amber-400/90 text-[11px]">{c.threshold}</td>
                  <td className="hidden sm:table-cell px-3 py-2 text-muted-foreground/70">{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Divider />

        {/* ═══════ SECTION 6: Data & Integration ═══════ */}
        <SectionHeading id="data" icon={Database}>Data & Integration Boundaries</SectionHeading>

        <div className="space-y-2.5 pb-1">
          <div className="flex items-start gap-2.5">
            <Tag color="amber">Current Phase</Tag>
            <p className="text-[13px] text-foreground/80 leading-relaxed">No live OMS, SCADA, or ADMS feeds are connected in the demo environment. All scenario data is synthetic.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <Tag color="sky">AI Model</Tag>
            <p className="text-[13px] text-foreground/80 leading-relaxed">NVIDIA Nemotron (via NIM endpoint) serves as the primary inference model. Fallback models are available for resilience.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <Tag color="neutral">Backend</Tag>
            <p className="text-[13px] text-foreground/80 leading-relaxed">Edge functions handle rule enforcement, API proxying, and policy evaluation. No direct database mutations from AI inference.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <Tag color="neutral">Dataverse</Tag>
            <p className="text-[13px] text-foreground/80 leading-relaxed">Microsoft Dataverse integration is <strong>planned</strong> for Phase 2, pending enterprise governance approval. Currently not connected.</p>
          </div>
        </div>

        <Divider />

        {/* ═══════ SECTION 7: Auditability ═══════ */}
        <SectionHeading id="audit" icon={BookOpen}>Auditability & Explainability</SectionHeading>

        <p className="pb-3 text-[13px] leading-relaxed text-foreground/80">
          Every AI-generated response is designed to be transparent and auditable. The system does not produce opaque outputs.
        </p>

        <ul className="space-y-1.5 pb-1">
          <Bullet>Each response includes the <strong>assumptions</strong> it was based on (e.g., weather severity, crew availability).</Bullet>
          <Bullet><strong>Uncertainty drivers</strong> are explicitly listed when ETR confidence is Medium or Low.</Bullet>
          <Bullet><strong>Constraints triggered</strong> by the rule engine are surfaced in the response metadata.</Bullet>
          <Bullet><strong>Source notes</strong> identify whether data came from scenario playback, rule evaluation, or model inference.</Bullet>
          <Bullet>No citation brackets or fabricated references are used. All outputs are self-contained.</Bullet>
          <Bullet>Decision logs capture the sequence: Event Data → Rule Engine → Guardrails → AI Inference → Validation → Advisory Output.</Bullet>
        </ul>

        <Divider />

        {/* ═══════ SECTION 8: FAQ ═══════ */}
        <SectionHeading id="faq" icon={HelpCircle}>Frequently Asked Questions</SectionHeading>

        <div className="space-y-3 pb-8">
          {faqs.map((f, i) => (
            <div key={i} className="rounded-lg border border-border/25 bg-card/50 px-4 py-3">
              <p className="text-[13px] font-semibold text-foreground/90 pb-1">{f.q}</p>
              <p className="text-[12px] leading-relaxed text-muted-foreground/80">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
