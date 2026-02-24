import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, SkipBack, SkipForward, RotateCcw, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import tcsLogo from '@/assets/tcs-logo.png';

const TOTAL_STEPS = 7;

/* ─── tiny reusable pieces ─── */
const Dot = () => (
  <span className="mx-2 text-muted-foreground/40 select-none">·</span>
);

const BoldTakeaway = ({ children }: { children: React.ReactNode }) => (
  <motion.p
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 1.2, duration: 0.6 }}
    className="text-lg md:text-xl font-bold text-foreground mt-8 tracking-tight"
  >
    {children}
  </motion.p>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <motion.h2
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7 }}
    className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-6"
  >
    {children}
  </motion.h2>
);

const Narration = ({ text }: { text: string }) => (
  <motion.blockquote
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.4, duration: 0.8 }}
    className="border-l-2 border-primary/40 pl-5 mt-10 max-w-3xl text-[15px] md:text-base leading-relaxed text-muted-foreground/90 italic"
  >
    {text.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ))}
  </motion.blockquote>
);

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.6 },
};

/* ─── Deep Dive confirmation modal ─── */
function DeepDiveModal({ open, onConfirm, onCancel, label }: { open: boolean; onConfirm: () => void; onCancel: () => void; label: string }) {
  if (!open) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className="rounded-lg border border-border/50 bg-background p-6 max-w-sm w-full mx-4 shadow-2xl"
      >
        <p className="text-sm font-semibold text-foreground mb-1">Exit Executive Review Mode?</p>
        <p className="text-xs text-muted-foreground/70 mb-5">Navigate to: {label}</p>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-md border border-border/40 hover:border-border/60"
          >
            Stay in Review
          </button>
          <button
            onClick={onConfirm}
            className="text-[11px] font-semibold text-foreground bg-primary/10 hover:bg-primary/20 transition-colors px-4 py-2 rounded-md border border-primary/30"
          >
            Continue
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Subtle Deep Dive link ─── */
function DeepDiveLink({ label, route }: { label: string; route: string }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 0.8 }}
        onClick={() => setShowModal(true)}
        className="absolute bottom-6 right-6 flex items-center gap-1.5 text-[12px] text-muted-foreground/80 hover:text-foreground transition-colors font-semibold tracking-wide group"
      >
        Deep Dive
        <ArrowRight className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
      </motion.button>
      <AnimatePresence>
        {showModal && (
          <DeepDiveModal
            open={showModal}
            label={label}
            onConfirm={() => navigate(route)}
            onCancel={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── SECTION COMPONENTS ─── */

function Section1() {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[70vh] gap-4 px-6">
      <motion.h1 {...fadeUp} className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
        Operator Copilot
      </motion.h1>
      <motion.p {...fadeUp} transition={{ delay: 0.15, duration: 0.6 }} className="text-lg md:text-xl text-muted-foreground font-medium">
        Predictive Outage Management Intelligence
      </motion.p>

      {/* ── Urgency anchor ── */}
      <motion.p
        {...fadeUp}
        transition={{ delay: 0.25, duration: 0.7 }}
        className="text-sm md:text-base text-destructive/80 font-medium max-w-2xl leading-relaxed"
      >
        Today, outage decisions span multiple operational systems and time-critical constraints.
      </motion.p>

      <motion.p {...fadeUp} transition={{ delay: 0.35, duration: 0.6 }} className="text-sm md:text-base text-muted-foreground/70">
        Grid Resilience Command Center
      </motion.p>

      <motion.div {...fadeUp} transition={{ delay: 0.45, duration: 0.6 }} className="flex items-center gap-0 text-sm md:text-base text-foreground font-bold tracking-wide mt-2">
        <span className="text-foreground">Governed Advisory Intelligence</span><Dot /><span className="text-foreground">Deterministic Rule Gate</span><Dot /><span className="text-foreground">Human Authority Preserved</span>
      </motion.div>

      <motion.span {...fadeUp} transition={{ delay: 0.55, duration: 0.6 }} className="mt-4 inline-block rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[11px] font-semibold px-4 py-1.5 tracking-wide">
        PHASE-1 Advisory Mode (No Control Authority)
      </motion.span>

      <motion.p {...fadeUp} transition={{ delay: 0.65, duration: 0.6 }} className="text-[11px] text-[#76B900]/70 font-medium tracking-wide mt-1">
        Enterprise AI inference via NVIDIA NIM (Nemotron) — structured, schema-bound
      </motion.p>

      <motion.p {...fadeUp} transition={{ delay: 0.9, duration: 0.8 }} className="text-xl md:text-2xl font-semibold text-foreground mt-10 tracking-tight">
        Structured Intelligence Before Action.
      </motion.p>

      <motion.div {...fadeUp} transition={{ delay: 1.0, duration: 0.6 }} className="w-24 h-px bg-border/30 mt-4" />

      <motion.p {...fadeUp} transition={{ delay: 1.1, duration: 0.7 }} className="text-sm font-medium text-foreground/70 tracking-wider text-center mt-3">
        Not automation. Not replacement. Structured augmentation.
      </motion.p>

      <Narration text={`Modern outage operations are multi-dimensional decisions.\nWeather volatility, asset health, crew constraints, and critical load risk must be evaluated together.\nOperator Copilot introduces governed intelligence between event data and human authority.`} />
    </div>
  );
}

function Section2() {
  const pillars = ['Weather Volatility', 'Asset Degradation', 'Crew Constraints', 'Critical Load Exposure', 'Regulatory Accountability'];
  const [converged, setConverged] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setConverged(true), 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[70vh] gap-6 px-6">
      <SectionTitle>Outage Decisions Are Increasingly Multi-Dimensional</SectionTitle>

      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {pillars.map((p, i) => (
          <motion.div
            key={p}
            initial={{ opacity: 0, y: 20 }}
            animate={converged
              ? { opacity: 1, y: 0, x: 0, scale: 0.92 }
              : { opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 + 0.3, duration: 0.5 }}
            className="rounded-lg border border-border/50 bg-surface-1 px-5 py-3 text-sm font-medium text-foreground/90"
          >
            {p}
          </motion.div>
        ))}
      </div>

      <motion.p {...fadeUp} transition={{ delay: 1.2, duration: 0.5 }} className="text-sm text-foreground/90 font-bold text-center mt-1">
        These dimensions must be reconciled simultaneously — not sequentially.
      </motion.p>

      <AnimatePresence>
        {converged && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="mt-6 rounded-lg border border-primary/30 bg-primary/5 px-8 py-4 text-sm font-semibold text-primary"
          >
            Structured Decision Intelligence Layer
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div {...fadeUp} transition={{ delay: 0.5, duration: 0.6 }} className="grid md:grid-cols-2 gap-8 mt-8 max-w-2xl text-left text-sm">
        <div>
          <p className="font-semibold text-muted-foreground mb-1">Traditional OMS answers:</p>
          <p className="text-foreground/80">"What is happening?"</p>
        </div>
        <div>
          <p className="font-semibold text-primary/80 mb-1">Operator Copilot structures:</p>
          <p className="text-foreground/80">"What is the safest reasoning path under constraints?"</p>
        </div>
      </motion.div>

      <Narration text={`Traditional systems excel at event tracking.\nCross-domain constraint synthesis remains manual under pressure.\nOperator Copilot structures constraints before decision.`} />
      <BoldTakeaway>Multiple decision streams → One governed intelligence output.</BoldTakeaway>
    </div>
  );
}

function Section3() {
  const left = ['Event lifecycle tracking', 'Single-point ETR', 'Cross-system correlation managed operationally', 'Reactive communication drafting', 'Decision trace focused on event lifecycle'];
  const right = ['Constraint enrichment', 'ETR confidence banding', 'Critical load runway tracking', 'Deterministic rule validation', 'Structured advisory with full decision rationale trace'];

  const [expanded, setExpanded] = useState(false);
  useEffect(() => { const t = setTimeout(() => setExpanded(true), 4500); return () => clearTimeout(t); }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-6 relative">
      <SectionTitle>Overlay, Not Replacement</SectionTitle>
      <motion.p {...fadeUp} transition={{ delay: 0.15, duration: 0.5 }} className="text-sm text-foreground/90 font-bold text-center -mt-4 mb-2">
        Preserving operational authority while elevating reasoning discipline.
      </motion.p>

      <div className="grid md:grid-cols-2 gap-10 max-w-3xl w-full">
        <div>
          <h3 className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest mb-4">Traditional OMS / ADMS</h3>
          <ul className="space-y-2.5">
            {left.map((item, i) => (
              <motion.li key={item} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 + 0.3 }} className="text-sm text-foreground/80 flex items-start gap-2">
                <span className="text-muted-foreground/40 mt-0.5">•</span>{item}
              </motion.li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-bold text-primary/70 uppercase tracking-widest mb-4">Operator Copilot</h3>
          <ul className="space-y-2.5">
            {right.map((item, i) => (
              <motion.li key={item} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 + 0.3 }} className="text-sm text-foreground/90 flex items-start gap-2">
                <span className="text-primary/60 mt-0.5">•</span>{item}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.6 }} className="mt-6 rounded-lg border border-primary/20 bg-primary/5 px-6 py-4 text-center max-w-md">
            <p className="text-sm text-foreground/90 font-bold mb-1">ETR Intelligence Evolution</p>
            <p className="text-sm text-foreground/90 font-medium">From single-point estimate → Confidence band + Risk runway</p>
          </motion.div>
        )}
      </AnimatePresence>

      <Narration text={`We are not replacing OMS.\nWe are inserting a governed reasoning layer above it.`} />
      <BoldTakeaway>Visibility alone is not structured reasoning.</BoldTakeaway>
      <DeepDiveLink label="Architecture Overview" route="/architecture" />
    </div>
  );
}

function Section4() {
  const layers = [
    'Event & Context Ingestion',
    'Constraint Enrichment Layer',
    'Deterministic Rule Gate',
    'NVIDIA NIM — Structured, Schema-Bound Inference',
    'Schema Validation',
    'Operator Approval',
    'Audit & Observability',
  ];
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (revealed < layers.length) {
      // Pause longer before NVIDIA layer (index 3) to emphasize Rule Gate boundary
      const delay = revealed === 3 ? 1600 : 800;
      const t = setTimeout(() => setRevealed((r) => r + 1), delay);
      return () => clearTimeout(t);
    }
  }, [revealed]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-6 relative">
      <SectionTitle>Bounded AI Architecture</SectionTitle>

      <div className="flex flex-col items-center gap-3 w-full max-w-md">
        {layers.map((layer, i) => {
          const isRuleGate = layer.includes('Deterministic');
          const isNvidia = layer.includes('NVIDIA');
          return (
            <motion.div
              key={layer}
              initial={{ opacity: 0, x: -20 }}
              animate={i < revealed ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.45 }}
              className={`w-full rounded-md border px-5 py-3 text-sm font-medium text-center relative ${
                isNvidia
                  ? 'border-[#76B900]/40 bg-[#76B900]/10 text-[#76B900]'
                  : isRuleGate
                  ? 'border-amber-500/30 bg-amber-500/8 text-amber-300'
                  : 'border-border/40 bg-surface-1 text-foreground/85'
              }`}
            >
              {/* Heartbeat pulse on Rule Gate */}
              {isRuleGate && i < revealed && (
                <motion.span
                  className="absolute inset-0 rounded-md border-2 border-amber-400/60"
                  animate={{ opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              {layer}
              {/* AI Execution Conditional label */}
              {isRuleGate && i < revealed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="ml-2 text-[10px] text-amber-400/70 font-bold uppercase tracking-wider"
                >
                  — AI Execution Conditional on Policy Validation
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>

      <motion.p {...fadeUp} transition={{ delay: 0.2, duration: 0.5 }} className="text-sm text-foreground/90 font-bold text-center mt-1">
        AI is an execution component within a controlled pipeline — not a decision authority.
      </motion.p>

      {revealed >= 3 && revealed < 4 && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="text-xs text-amber-400/80 font-semibold tracking-wide mt-2">
          AI execution is blocked until deterministic policy validation succeeds.
        </motion.p>
      )}

      {revealed >= 4 && (
        <>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="text-xs text-amber-400/80 font-semibold tracking-wide mt-2">
            AI execution is blocked until deterministic policy validation succeeds.
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }} className="text-sm text-[#76B900] font-bold mt-1 max-w-lg text-center">
            NVIDIA NIM provides secure, low-latency, schema-constrained inference within deterministic guardrails.
          </motion.p>
        </>
      )}

      <Narration text={`Every advisory is validated deterministically before AI execution.\nAI operates strictly within a structured output schema.\nNo autonomous switching. No SCADA control.\nHuman authority remains final.`} />
      <BoldTakeaway>Deterministic first. AI second.</BoldTakeaway>
      <DeepDiveLink label="AI Governance & Technical Controls" route="/ai-governance" />
    </div>
  );
}

function Section5() {
  const inputs = [
    { label: 'Feeder', value: '33kV' },
    { label: 'ETR Band', value: '2.5–4.0 hours' },
    { label: 'Backup Remaining', value: '1.8 hours' },
    { label: 'Hazard', value: 'Lightning — High' },
    { label: 'Crew Availability', value: 'Limited (Skill-Constrained)' },
  ];
  const traceSteps = ['Hazard fusion', 'Critical load threshold check', 'Crew skill-class validation', 'Constraint validation', 'Structured reasoning synthesis', 'Advisory classification'];
  const [phase, setPhase] = useState<'inputs' | 'flow' | 'trace'>('inputs');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('flow'), 3500);
    const t2 = setTimeout(() => setPhase('trace'), 7000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const flowSteps = ['Inputs', 'Rule Gate', 'NVIDIA NIM', 'Structured Advisory', 'Operator Approval Required'];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-6 relative">
      <SectionTitle>Severe Storm Escalation — Hospital Risk</SectionTitle>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-3xl w-full">
        {inputs.map((inp, i) => (
          <motion.div key={inp.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 + 0.2 }}
            className="rounded-md border border-border/40 bg-surface-1 p-3 text-center">
            <p className="text-[11px] text-foreground/70 uppercase tracking-wider font-semibold mb-1">{inp.label}</p>
             <p className="text-sm font-bold text-foreground">{inp.value}</p>
             {inp.label === 'ETR Band' && <p className="text-[10px] text-muted-foreground/60 mt-0.5">Confidence: Medium</p>}
          </motion.div>
        ))}
      </div>

      {/* Operational realism detail */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="text-sm text-foreground/90 italic font-semibold max-w-lg text-center"
      >
        Crew availability is skill-class constrained.<br />
        Maintenance locks and regulatory windows further restrict dispatch options.
      </motion.p>

      <AnimatePresence mode="wait">
        {phase === 'flow' && (
          <motion.div key="flow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-2 mt-6">
            {flowSteps.map((s, i) => (
              <motion.span key={s} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.35, duration: 0.4 }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md border ${
                  s.includes('NVIDIA') ? 'border-[#76B900]/40 text-[#76B900]' : s.includes('Approval') ? 'border-amber-500/30 text-amber-300' : 'border-border/40 text-foreground/80'
                }`}>
                {s}
                {i < flowSteps.length - 1 && <span className="ml-2 text-muted-foreground/30">→</span>}
              </motion.span>
            ))}
          </motion.div>
        )}

        {phase === 'trace' && (
          <motion.div key="trace" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-2 mt-6">
            <p className="text-sm text-foreground/90 font-bold uppercase tracking-widest mb-2">Deterministic Decision Trace</p>
            {traceSteps.map((s, i) => (
              <motion.div key={s} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.25, duration: 0.4 }}
                className="text-sm text-foreground/80 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center text-[10px] text-primary font-bold">{i + 1}</span>
                {s}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Narration text={`Five manual cognitive streams reconcile into one governed advisory.\nThe system does not execute decisions.\nIt structures decision context.`} />
      <BoldTakeaway>Structured intelligence reduces decision risk under crisis conditions.</BoldTakeaway>
      <DeepDiveLink label="Live Event & Outage View" route="/events" />
    </div>
  );
}

function Section6() {
  const bullets = [
    'Controlled, policy-bound inference execution',
    'Schema-bound structured output',
    'Deterministic prompt governance',
    'Logged traceability',
    'Designed for mission-critical environments',
  ];
  const [showFlow, setShowFlow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShowFlow(true), 3000); return () => clearTimeout(t); }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-6 relative">
      <SectionTitle>Enterprise-Grade AI Execution</SectionTitle>

      <ul className="space-y-2 max-w-md">
        {bullets.map((b, i) => (
          <motion.li key={b} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 + 0.3 }}
            className="text-sm text-foreground/85 flex items-start gap-2">
            <span className="text-[#76B900]/60 mt-0.5">•</span>{b}
          </motion.li>
        ))}
      </ul>

      <AnimatePresence>
        {showFlow && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mt-8">
            {['Constraint-Validated Input', 'NVIDIA NIM', 'Structured Output'].map((s, i) => (
              <span key={s} className={`text-xs font-semibold px-4 py-2 rounded-md border ${
                s.includes('NVIDIA') ? 'border-[#76B900]/40 text-[#76B900] bg-[#76B900]/5' : 'border-border/40 text-foreground/80 bg-surface-1'
              }`}>
                {s}
                {i < 2 && <span className="ml-3 text-muted-foreground/30">→</span>}
              </span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {showFlow && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.5 }}
          className="text-sm text-foreground/90 font-bold text-center">
          AI cannot bypass deterministic validation.
        </motion.p>
      )}

      <Narration text={`NVIDIA NIM operates within a deterministic operational envelope.\nStructured inference — not open-ended generative execution.`} />
      <BoldTakeaway>Schema-bound output within enforced governance boundaries.</BoldTakeaway>
      <DeepDiveLink label="Copilot Structured Output" route="/copilot-studio" />
    </div>
  );
}

function Section7() {
  const [showClosing, setShowClosing] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShowClosing(true), 3000); return () => clearTimeout(t); }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[70vh] gap-6 px-6">
      <SectionTitle>Governance Before Prediction</SectionTitle>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }}
        className="text-base text-foreground/90 font-bold -mt-4 mb-2">
        Advisory discipline today. Predictive intelligence tomorrow.
      </motion.p>

      <div className="grid md:grid-cols-2 gap-10 max-w-3xl w-full text-left">
        <div>
          <h3 className="text-xs font-bold text-primary/70 uppercase tracking-widest mb-4">Phase-1</h3>
          <ul className="space-y-2">
            {['Governed Advisory Intelligence', 'Rule-constrained reasoning', 'Structured executive summaries'].map((item) => (
              <motion.li key={item} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-foreground/85 flex items-start gap-2">
                <span className="text-primary/50 mt-0.5">•</span>{item}
              </motion.li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest mb-4">Phase-2</h3>
          <ul className="space-y-2">
            {['Calibrated feeder-level outage probability modeling', 'ETR calibration', 'Asset-health and weather risk fusion', 'Crew optimization modeling'].map((item) => (
              <motion.li key={item} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-foreground/60 flex items-start gap-2">
                <span className="text-muted-foreground/30 mt-0.5">•</span>{item}
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tightened roadmap transition */}
      <Narration text={`With governance established, Phase-2 introduces calibrated prediction — never uncontrolled automation.\nStructured reasoning always precedes predictive modeling.`} />

      <AnimatePresence>
        {showClosing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1.2 }}
            className="mt-12 flex flex-col items-center gap-2 text-foreground"
          >
            <p className="text-lg font-bold">AI Bound by Policy.</p>
            {/* Soft glow on Human Authority */}
            <motion.p
              className="text-lg font-bold relative"
              animate={{ textShadow: ['0 0 0px transparent', '0 0 12px hsl(var(--primary) / 0.4)', '0 0 0px transparent'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              Human Authority Preserved.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.8 }}
              className="text-xl font-extrabold mt-2 text-primary"
            >
              Structured Intelligence Before Action.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── MAIN PAGE ─── */

const SECTIONS = [Section1, Section2, Section3, Section4, Section5, Section6, Section7];

export default function ExecutiveReviewGTC() {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [finale, setFinale] = useState(false);
  const [finaleReady, setFinaleReady] = useState(false);

  const next = useCallback(() => {
    if (transitioning || finale) return;
    if (step < TOTAL_STEPS - 1) {
      setTransitioning(true);
      setTimeout(() => {
        setStep((s) => s + 1);
        setTimeout(() => setTransitioning(false), 200);
      }, 200);
    } else if (step === TOTAL_STEPS - 1) {
      // Final step → cinematic fade-to-black finale
      setFinale(true);
      setTimeout(() => setFinaleReady(true), 3000);
    }
  }, [step, transitioning, finale]);

  const prev = useCallback(() => {
    if (transitioning || step === 0) return;
    setTransitioning(true);
    setTimeout(() => {
      setStep((s) => Math.max(0, s - 1));
      setTimeout(() => setTransitioning(false), 200);
    }, 200);
  }, [step, transitioning]);

  const restart = useCallback(() => {
    setTransitioning(true);
    setFinale(false);
    setFinaleReady(false);
    setTimeout(() => {
      setStep(0);
      setPaused(false);
      setTimeout(() => setTransitioning(false), 200);
    }, 200);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === ' ') { e.preventDefault(); setPaused((p) => !p); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, step]);

  const CurrentSection = SECTIONS[step];

  return (
    <div className="fixed inset-0 z-50 bg-background text-foreground overflow-y-auto flex flex-col">
      {/* Fade-to-black overlay for transitions */}
      <AnimatePresence>
        {transitioning && (
          <motion.div
            key="fade-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-background pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/30">
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-border/20">
          <motion.div
            className="h-full bg-primary/70"
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>
        <div className="max-w-6xl mx-auto flex items-center justify-between h-12 px-6">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold text-muted-foreground/80 tracking-wide">Executive Review Mode</span>
            <span className="text-[11px] font-bold text-primary tracking-wide">Step {step + 1} of {TOTAL_STEPS}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prev} disabled={step === 0 || finale}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md border border-border/40 hover:border-border/60 disabled:opacity-30 disabled:pointer-events-none">
              <SkipBack className="w-3.5 h-3.5" />
              Back
            </button>
            <button onClick={() => setPaused(!paused)}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md border border-border/40 hover:border-border/60">
              {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              {paused ? 'Resume' : 'Pause'}
            </button>
            <button onClick={next} disabled={finale}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground bg-primary/10 hover:bg-primary/20 transition-colors px-3 py-1.5 rounded-md border border-primary/30 disabled:opacity-30 disabled:pointer-events-none">
              <SkipForward className="w-3.5 h-3.5" />
              {step === TOTAL_STEPS - 1 && !finale ? 'Finish' : 'Next'}
            </button>
            <button onClick={restart}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md border border-border/40 hover:border-border/60">
              <RotateCcw className="w-3.5 h-3.5" />
              Restart
            </button>
            <div className="ml-4 group/tcs relative rounded-lg border-2 border-[#76B900]/60 px-4 py-2 transition-all duration-500 shadow-[0_0_14px_rgba(118,185,0,0.2)]">
              <img
                src={tcsLogo}
                alt="Tata Consultancy Services (TCS)"
                className="h-7 w-auto brightness-0 invert opacity-95 transition-opacity duration-300 group-hover/tcs:opacity-100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {finale ? (
            <motion.div
              key="finale"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5 }}
              className="flex flex-col items-center gap-8 text-center"
            >
              <AnimatePresence>
                {finaleReady && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex flex-col items-center gap-6"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-2xl md:text-3xl font-bold text-foreground tracking-tight"
                      >
                        AI Bound by Policy.
                      </motion.p>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                        className="text-2xl md:text-3xl font-bold text-foreground tracking-tight"
                      >
                        Human Authority Preserved.
                      </motion.p>
                      <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5, duration: 0.8 }}
                        className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight mt-2"
                      >
                        Structured Intelligence Before Action.
                      </motion.p>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={{ delay: 2.2, duration: 0.6 }}
                      className="w-32 h-px bg-border/40 mt-2"
                    />

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2.5, duration: 0.6 }}
                      className="text-sm text-muted-foreground/70 font-medium tracking-wide"
                    >
                      Not automation. Not replacement. Structured augmentation.
                    </motion.p>

                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 3, duration: 0.6 }}
                      onClick={restart}
                      className="flex items-center gap-2 text-sm font-semibold text-foreground/70 hover:text-foreground transition-colors px-5 py-2.5 rounded-md border border-border/40 hover:border-border/60 mt-4"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restart Presentation
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : !paused ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-5xl mx-auto py-12"
            >
              <CurrentSection />
            </motion.div>
          ) : (
            <motion.div key="paused" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 text-muted-foreground/60">
              <Pause className="w-10 h-10" />
              <p className="text-sm font-medium">Paused — Step {step + 1} of {TOTAL_STEPS}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>




      {/* Footer */}
      <div className="border-t border-border/30 py-2 text-center text-[11px] text-muted-foreground/70 font-medium tracking-wide">
        Operator Copilot — Governed Decision Intelligence · Phase-1 Demonstrator · Synthetic Data
      </div>
    </div>
  );
}
