import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Layers } from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const CANVAS = { width: 1140, height: 820 };
const STEP_OUT = 14;
const END_PAD = 8;

type Anchor = 'left' | 'right' | 'top' | 'bottom' | 'center';
type EdgeStyle = 'primary' | 'secondary' | 'optional';
type RouteMode = 'horizontal-first' | 'vertical-first';

type NodeId =
  | 'structured_data' | 'sql_postgres' | 'unstructured_data' | 'text_retriever' | 'vector_db'
  | 'embedding_nim' | 'reranking_nim'
  | 'authenticated_operator' | 'copilot_ui'
  | 'orchestrator' | 'guardrails' | 'nemotron_nim' | 'lovable_ai'
  | 'sql_tools_store' | 'retriever_lane'
  | 'audit_logs' | 'prompt_versioning' | 'telemetry' | 'rbac_rls';

type NodeTier = 'nim' | 'core' | 'data' | 'input' | 'governance';

interface NodeDef {
  id: NodeId;
  x: number; y: number; w: number; h: number;
  label: string;
  sub?: string;
  nim?: boolean;
  optional?: boolean;
  icon?: string;
  tier?: NodeTier;
}

interface EdgeDef {
  from: { nodeId: NodeId; anchor: Anchor };
  to: { nodeId: NodeId; anchor: Anchor };
  style: EdgeStyle;
  label?: string;
  mode?: RouteMode;
  laneX?: number;
  laneY?: number;
}

interface NodeTooltipInfo {
  description: string;
  techStack: string[];
  protocols?: string[];
}

const NODE_TOOLTIPS: Record<NodeId, NodeTooltipInfo> = {
  structured_data: {
    description: 'Ingests structured operational data from OMS, SCADA, asset registries, crew dispatch, and customer records.',
    techStack: ['PostgreSQL', 'ETL Pipelines', 'CSV/JSON'],
    protocols: ['REST API', 'Batch Import'],
  },
  sql_postgres: {
    description: 'Primary relational store for structured ingestion. Serves as the system of record for tabular operational data.',
    techStack: ['PostgreSQL 15', 'Supabase'],
    protocols: ['SQL', 'PostgREST'],
  },
  unstructured_data: {
    description: 'Ingests unstructured content such as operational manuals, SOPs, and knowledge-base articles for semantic search.',
    techStack: ['PDF/DOCX Parsers', 'Text Extractors'],
    protocols: ['File Upload', 'S3-compatible'],
  },
  text_retriever: {
    description: 'Microservice that chunks, embeds, and indexes unstructured text for semantic retrieval.',
    techStack: ['Python', 'LangChain', 'Sentence Transformers'],
    protocols: ['gRPC', 'REST'],
  },
  vector_db: {
    description: 'High-performance vector database for similarity search over embedded document chunks.',
    techStack: ['pgvector', 'Supabase Vector'],
    protocols: ['SQL', 'REST API'],
  },
  embedding_nim: {
    description: 'NVIDIA NIM microservice for generating dense vector embeddings. Optional enhancement path.',
    techStack: ['NVIDIA NIM', 'NeMo Retriever'],
    protocols: ['NIM API', 'HTTP/2'],
  },
  reranking_nim: {
    description: 'NVIDIA NIM microservice for re-ranking retrieved results by semantic relevance. Optional enhancement.',
    techStack: ['NVIDIA NIM', 'NeMo Retriever'],
    protocols: ['NIM API', 'HTTP/2'],
  },
  authenticated_operator: {
    description: 'Utility operator authenticated via SSO/RBAC who interacts with the Copilot for outage decision support.',
    techStack: ['Supabase Auth', 'JWT', 'RBAC'],
    protocols: ['OAuth 2.0', 'Session Tokens'],
  },
  copilot_ui: {
    description: 'Frontend conversational interface. Renders structured insights, scenario context, and manages operator sessions.',
    techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
    protocols: ['WebSocket', 'REST'],
  },
  orchestrator: {
    description: 'Backend orchestrator routing operator queries through guardrails to AI services. Manages tool calls and context.',
    techStack: ['Supabase Edge Functions', 'Deno', 'TypeScript'],
    protocols: ['REST API', 'JSON-RPC'],
  },
  guardrails: {
    description: 'Policy boundary ensuring AI outputs comply with operational safety rules and advisory-only constraints.',
    techStack: ['NVIDIA NeMo Guardrails', 'Policy Engine'],
    protocols: ['Middleware', 'JSON Schema'],
  },
  nemotron_nim: {
    description: 'NVIDIA Nemotron LLM NIM for generating expert utility operations analysis and structured insights.',
    techStack: ['NVIDIA NIM', 'Nemotron', 'TensorRT-LLM'],
    protocols: ['NIM API', 'OpenAI-compatible'],
  },
  lovable_ai: {
    description: 'Secondary hybrid AI path via Lovable AI Gateway. Provides fallback and supplementary reasoning capabilities.',
    techStack: ['Lovable AI Gateway', 'Gemini', 'GPT-5'],
    protocols: ['OpenAI-compatible API', 'REST'],
  },
  sql_tools_store: {
    description: 'SQL tool execution layer and scenario store. Provides structured data retrieval for orchestrator tool calls.',
    techStack: ['PostgreSQL', 'Supabase', 'Edge Functions'],
    protocols: ['SQL', 'PostgREST'],
  },
  retriever_lane: {
    description: 'Vector retrieval pipeline for semantic search across embedded operational knowledge and documentation.',
    techStack: ['pgvector', 'LangChain', 'Embeddings'],
    protocols: ['SQL', 'REST API'],
  },
  audit_logs: {
    description: 'Immutable record of all operator interactions, AI responses, and system events for compliance and review.',
    techStack: ['PostgreSQL', 'Supabase Logs'],
    protocols: ['SQL', 'Event Streaming'],
  },
  prompt_versioning: {
    description: 'Version control for system prompts and model configurations. Enables A/B testing and rollback.',
    techStack: ['PostgreSQL', 'Git-style Versioning'],
    protocols: ['SQL', 'REST API'],
  },
  telemetry: {
    description: 'Operational telemetry and monitoring for AI response quality, latency, and system health metrics.',
    techStack: ['Supabase Analytics', 'Edge Function Logs'],
    protocols: ['REST API', 'Metrics'],
  },
  rbac_rls: {
    description: 'Role-Based Access Control and Row-Level Security ensuring data isolation and permission enforcement.',
    techStack: ['Supabase RLS', 'PostgreSQL Policies'],
    protocols: ['SQL Policies', 'JWT Claims'],
  },
};

type Pt = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };

/* ─── NODES ─── */
const NODES: NodeDef[] = [
  // Band 1 – Ingest
  { id: 'structured_data', x: 40, y: 60, w: 200, h: 72, label: 'STRUCTURED DATA', sub: 'OMS · SCADA · Asset · Crew · Customer', icon: 'db', tier: 'input' },
  { id: 'sql_postgres', x: 270, y: 60, w: 160, h: 72, label: 'SQL / POSTGRES', icon: 'db', tier: 'data' },
  { id: 'unstructured_data', x: 460, y: 60, w: 160, h: 72, label: 'UNSTRUCTURED DATA', icon: 'doc', tier: 'input' },
  { id: 'text_retriever', x: 650, y: 60, w: 140, h: 72, label: 'TEXT RETRIEVER', icon: 'agent', tier: 'core' },
  { id: 'vector_db', x: 820, y: 60, w: 110, h: 72, label: 'VECTOR DB', icon: 'db', tier: 'data' },
  { id: 'embedding_nim', x: 960, y: 42, w: 150, h: 44, label: 'EMBEDDING NIM', nim: true, optional: true, icon: 'nim', tier: 'nim' },
  { id: 'reranking_nim', x: 960, y: 108, w: 150, h: 44, label: 'RERANKING NIM', nim: true, optional: true, icon: 'nim', tier: 'nim' },

  // Band 2 – Operator Copilot Runtime (above trust boundary)
  { id: 'authenticated_operator', x: 80, y: 230, w: 240, h: 62, label: 'AUTHENTICATED OPERATOR', icon: 'user', tier: 'input' },
  { id: 'copilot_ui', x: 400, y: 230, w: 240, h: 62, label: 'COPILOT UI', icon: 'app', tier: 'core' },

  // Band 2 – Below trust boundary
  { id: 'orchestrator', x: 40, y: 410, w: 220, h: 64, label: 'COPILOT ORCHESTRATOR', sub: 'Edge Functions', icon: 'agent', tier: 'core' },
  { id: 'guardrails', x: 300, y: 410, w: 200, h: 64, label: 'GUARDRAILS', sub: 'Policy Boundary', icon: 'agent', tier: 'core' },
  { id: 'nemotron_nim', x: 540, y: 410, w: 220, h: 64, label: 'NEMOTRON LLM NIM', sub: 'NVIDIA NIM', nim: true, icon: 'nim', tier: 'nim' },
  { id: 'lovable_ai', x: 810, y: 395, w: 290, h: 95, label: 'LOVABLE AI', sub: 'Secondary hybrid AI path', icon: 'nim', tier: 'nim' },

  // Band 2 – Bottom row
  { id: 'sql_tools_store', x: 40, y: 520, w: 240, h: 54, label: 'SQL TOOLS / SCENARIO STORE', icon: 'db', tier: 'data' },
  { id: 'retriever_lane', x: 320, y: 520, w: 320, h: 54, label: 'RETRIEVER LANE (VECTOR DB)', icon: 'db', tier: 'data' },

  // Band 3 – Memory / Observability / Governance
  { id: 'audit_logs', x: 40, y: 680, w: 220, h: 52, label: 'AUDIT LOGS', icon: 'doc', tier: 'governance' },
  { id: 'prompt_versioning', x: 290, y: 680, w: 240, h: 52, label: 'PROMPT & MODEL VERSIONING', icon: 'agent', tier: 'governance' },
  { id: 'telemetry', x: 560, y: 680, w: 230, h: 52, label: 'TELEMETRY / MONITORING', icon: 'analytics', tier: 'governance' },
  { id: 'rbac_rls', x: 820, y: 680, w: 280, h: 52, label: 'RBAC + RLS', icon: 'admin', tier: 'governance' },
];

/* ─── EDGES ─── */
const EDGES: EdgeDef[] = [
  // Ingest row
  { from: { nodeId: 'structured_data', anchor: 'right' }, to: { nodeId: 'sql_postgres', anchor: 'left' }, style: 'primary', mode: 'horizontal-first' },
  { from: { nodeId: 'sql_postgres', anchor: 'right' }, to: { nodeId: 'unstructured_data', anchor: 'left' }, style: 'primary', mode: 'horizontal-first' },
  { from: { nodeId: 'unstructured_data', anchor: 'right' }, to: { nodeId: 'text_retriever', anchor: 'left' }, style: 'primary', mode: 'horizontal-first' },
  { from: { nodeId: 'text_retriever', anchor: 'right' }, to: { nodeId: 'vector_db', anchor: 'left' }, style: 'primary', mode: 'horizontal-first' },
  { from: { nodeId: 'vector_db', anchor: 'right' }, to: { nodeId: 'embedding_nim', anchor: 'left' }, style: 'optional', mode: 'horizontal-first' },
  { from: { nodeId: 'vector_db', anchor: 'right' }, to: { nodeId: 'reranking_nim', anchor: 'left' }, style: 'optional', mode: 'horizontal-first' },

  // Operator → Copilot UI
  { from: { nodeId: 'authenticated_operator', anchor: 'right' }, to: { nodeId: 'copilot_ui', anchor: 'left' }, style: 'primary', mode: 'horizontal-first' },
  // Copilot UI → Lovable AI (dashed, secondary – routed right then down)
  { from: { nodeId: 'copilot_ui', anchor: 'right' }, to: { nodeId: 'lovable_ai', anchor: 'top' }, style: 'secondary', mode: 'horizontal-first', laneX: 770 },

  // Backend row
  { from: { nodeId: 'orchestrator', anchor: 'right' }, to: { nodeId: 'guardrails', anchor: 'left' }, style: 'primary', mode: 'horizontal-first' },
  { from: { nodeId: 'guardrails', anchor: 'right' }, to: { nodeId: 'nemotron_nim', anchor: 'left' }, style: 'primary', mode: 'horizontal-first' },
  // Nemotron → Copilot UI (Structured Insights JSON, upward)
  { from: { nodeId: 'nemotron_nim', anchor: 'top' }, to: { nodeId: 'copilot_ui', anchor: 'bottom' }, style: 'primary', label: 'Structured Insights (JSON)', mode: 'vertical-first', laneY: 370 },

  // SQL Tools → Orchestrator (straight up)
  { from: { nodeId: 'sql_tools_store', anchor: 'top' }, to: { nodeId: 'orchestrator', anchor: 'bottom' }, style: 'secondary', mode: 'vertical-first' },
  // Retriever Lane → Guardrails (straight up)
  { from: { nodeId: 'retriever_lane', anchor: 'top' }, to: { nodeId: 'guardrails', anchor: 'bottom' }, style: 'secondary', mode: 'vertical-first' },

  // Band 3 connections – routed via distinct lane Y values to avoid overlap
  { from: { nodeId: 'audit_logs', anchor: 'top' }, to: { nodeId: 'orchestrator', anchor: 'bottom' }, style: 'secondary', mode: 'vertical-first', laneY: 650 },
  { from: { nodeId: 'prompt_versioning', anchor: 'top' }, to: { nodeId: 'guardrails', anchor: 'bottom' }, style: 'secondary', mode: 'vertical-first', laneY: 650 },
  { from: { nodeId: 'telemetry', anchor: 'top' }, to: { nodeId: 'nemotron_nim', anchor: 'bottom' }, style: 'secondary', mode: 'vertical-first', laneY: 650 },
  { from: { nodeId: 'rbac_rls', anchor: 'top' }, to: { nodeId: 'lovable_ai', anchor: 'bottom' }, style: 'secondary', mode: 'vertical-first', laneY: 650 },
  { from: { nodeId: 'rbac_rls', anchor: 'top' }, to: { nodeId: 'nemotron_nim', anchor: 'bottom' }, style: 'primary', mode: 'vertical-first', laneY: 640 },
];

/* ─── geometry helpers ─── */
function getAnchorPoint(rect: Rect, anchor: Anchor): Pt {
  if (anchor === 'left') return { x: rect.x, y: rect.y + rect.h / 2 };
  if (anchor === 'right') return { x: rect.x + rect.w, y: rect.y + rect.h / 2 };
  if (anchor === 'top') return { x: rect.x + rect.w / 2, y: rect.y };
  if (anchor === 'bottom') return { x: rect.x + rect.w / 2, y: rect.y + rect.h };
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

function stepOut(pt: Pt, anchor: Anchor, distance: number): Pt {
  if (anchor === 'left') return { x: pt.x - distance, y: pt.y };
  if (anchor === 'right') return { x: pt.x + distance, y: pt.y };
  if (anchor === 'top') return { x: pt.x, y: pt.y - distance };
  if (anchor === 'bottom') return { x: pt.x, y: pt.y + distance };
  return pt;
}

function stepIn(pt: Pt, anchor: Anchor, distance: number): Pt {
  if (anchor === 'left') return { x: pt.x - distance, y: pt.y };
  if (anchor === 'right') return { x: pt.x + distance, y: pt.y };
  if (anchor === 'top') return { x: pt.x, y: pt.y - distance };
  if (anchor === 'bottom') return { x: pt.x, y: pt.y + distance };
  return pt;
}

function routeOrthogonal(start: Pt, end: Pt, edge: EdgeDef): Pt[] {
  const out = stepOut(start, edge.from.anchor, STEP_OUT);
  const inPt = stepIn(end, edge.to.anchor, END_PAD);
  if (edge.mode === 'vertical-first') {
    const midY = edge.laneY ?? (out.y + inPt.y) / 2;
    return [start, out, { x: out.x, y: midY }, { x: inPt.x, y: midY }, inPt, end];
  }
  const midX = edge.laneX ?? (out.x + inPt.x) / 2;
  return [start, out, { x: midX, y: out.y }, { x: midX, y: inPt.y }, inPt, end];
}

function pathFromPoints(points: Pt[]) {
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    if (prev.x === cur.x) d += ` V ${cur.y}`;
    else d += ` H ${cur.x}`;
  }
  return d;
}

function labelPoint(pt: Pt): Pt {
  return { x: pt.x + 4, y: pt.y - 6 };
}

/* ─── icons ─── */
function NodeIcon({ icon }: { icon?: string }) {
  const cls = 'w-3.5 h-3.5 mb-0.5';
  if (icon === 'db') return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" /><path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" /></svg>);
  if (icon === 'doc') return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /></svg>);
  if (icon === 'user' || icon === 'admin') return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>);
  if (icon === 'app') return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><circle cx="7" cy="6" r="0.8" fill="currentColor" /><circle cx="10" cy="6" r="0.8" fill="currentColor" /></svg>);
  if (icon === 'agent') return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 9h6M9 12h4M9 15h5" /></svg>);
  if (icon === 'nim') return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" /><polygon points="12,6 18,9.5 18,14.5 12,18 6,14.5 6,9.5" /></svg>);
  if (icon === 'analytics') return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 17V13M12 17V7M17 17V11" /></svg>);
  return null;
}

/* ─── tooltip content ─── */
function NodeTooltipBody({ nodeId }: { nodeId: NodeId }) {
  const info = NODE_TOOLTIPS[nodeId];
  if (!info) return null;
  return (
    <div className="max-w-[260px] space-y-2 text-left">
      <p className="text-[11px] leading-snug text-slate-200">{info.description}</p>
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-300/90 mb-0.5">Tech Stack</p>
        <div className="flex flex-wrap gap-1">
          {info.techStack.map((t) => (
            <span key={t} className="inline-block rounded bg-slate-700/80 px-1.5 py-0.5 text-[8.5px] font-medium text-slate-200">{t}</span>
          ))}
        </div>
      </div>
      {info.protocols && info.protocols.length > 0 && (
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-cyan-300/80 mb-0.5">Protocols</p>
          <div className="flex flex-wrap gap-1">
            {info.protocols.map((p) => (
              <span key={p} className="inline-block rounded bg-slate-700/60 px-1.5 py-0.5 text-[8.5px] font-medium text-slate-300">{p}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── node card ─── */
function NodeCard({ node, setNodeRef }: { node: NodeDef; setNodeRef: (id: NodeId) => (el: HTMLDivElement | null) => void }) {
  const tier = node.tier ?? (node.nim ? 'nim' : 'input');
  const tierStyles: Record<NodeTier, { border: string; text: string; icon: string }> = {
    nim:        { border: 'border-2 border-emerald-400', text: 'text-emerald-100', icon: 'text-emerald-300' },
    core:       { border: 'border-2 border-cyan-400/70', text: 'text-cyan-50', icon: 'text-cyan-300' },
    data:       { border: 'border-[1.5px] border-sky-400/50', text: 'text-slate-100', icon: 'text-sky-300/80' },
    input:      { border: 'border border-slate-400/50', text: 'text-slate-200', icon: 'text-slate-300/80' },
    governance: { border: 'border border-amber-400/45', text: 'text-slate-200', icon: 'text-amber-300/70' },
  };
  const s = tierStyles[tier];
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <div
          ref={setNodeRef(node.id)}
          data-node={node.id}
          tabIndex={0}
          role="button"
          aria-label={`${node.label}${node.sub ? ` — ${node.sub}` : ''}`}
          className={`absolute rounded-lg bg-slate-900/90 px-2 py-1 text-center shadow-[0_0_12px_rgba(15,23,42,0.5)] ${s.border} ${node.optional ? 'border-dashed' : ''} transition-all hover:shadow-[0_0_20px_rgba(56,189,248,0.15)] hover:brightness-110 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400/60 cursor-default`}
          style={{ left: node.x, top: node.y, width: node.w, height: node.h }}
        >
          <div className="flex h-full w-full flex-col items-center justify-center">
            <span className={s.icon}><NodeIcon icon={node.icon} /></span>
            <p className={`text-[9px] font-semibold tracking-[0.06em] leading-tight ${s.text}`}>{node.label}</p>
            {node.sub && <p className="mt-0.5 text-[7px] font-medium tracking-[0.03em] text-slate-400/90 leading-tight">{node.sub}</p>}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side={node.y < 150 ? "bottom" : "top"} className="border-slate-600/80 bg-slate-800/95 backdrop-blur-sm shadow-xl p-3 z-[9999]" sideOffset={8}>
        <NodeTooltipBody nodeId={node.id} />
      </TooltipContent>
    </Tooltip>
  );
}

/* ─── responsive wrapper ─── */
function ResponsiveScaler({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => {
      const available = el.clientWidth;
      setScale(Math.min(1, available / CANVAS.width));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className="w-full overflow-hidden">
      <div
        style={{
          width: CANVAS.width,
          height: CANVAS.height * scale,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ─── main diagram ─── */
function ArchitectureDiagram() {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef(new Map<NodeId, HTMLDivElement>());
  const rafRef = useRef<number | null>(null);
  const [edgePaths, setEdgePaths] = useState<Array<{ d: string; style: EdgeStyle; label?: string; lx?: number; ly?: number }>>([]);

  const setNodeRef = useCallback(
    (id: NodeId) => (el: HTMLDivElement | null) => {
      if (el) nodeRefs.current.set(id, el);
      else nodeRefs.current.delete(id);
    },
    [],
  );

  const recompute = useCallback(() => {
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const rects = new Map<NodeId, Rect>();
    nodeRefs.current.forEach((el, id) => {
      const r = el.getBoundingClientRect();
      rects.set(id, { x: r.left - canvasRect.left, y: r.top - canvasRect.top, w: r.width, h: r.height });
    });
    const nextPaths = EDGES.flatMap((edge) => {
      const fromRect = rects.get(edge.from.nodeId);
      const toRect = rects.get(edge.to.nodeId);
      if (!fromRect || !toRect) return [];
      const start = getAnchorPoint(fromRect, edge.from.anchor);
      const end = getAnchorPoint(toRect, edge.to.anchor);
      const points = routeOrthogonal(start, end, edge);
      const mid = points[Math.max(1, Math.floor(points.length / 2))];
      const lp = edge.label ? labelPoint(mid) : undefined;
      return [{ d: pathFromPoints(points), style: edge.style, label: edge.label, lx: lp?.x, ly: lp?.y }];
    });
    setEdgePaths(nextPaths);
  }, []);

  const schedule = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => recompute());
  }, [recompute]);

  useLayoutEffect(() => {
    schedule();
    const observer = new ResizeObserver(() => schedule());
    if (canvasRef.current) observer.observe(canvasRef.current);
    nodeRefs.current.forEach((el) => observer.observe(el));
    window.addEventListener('resize', schedule);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [schedule]);

  const stroke = (style: EdgeStyle) => (style === 'primary' ? 'rgba(160,220,205,0.85)' : style === 'optional' ? 'rgba(160,220,205,0.45)' : 'rgba(160,220,205,0.55)');

  return (
    <TooltipProvider>
    <ResponsiveScaler>
      <div ref={canvasRef} className="relative" style={{ width: CANVAS.width, height: CANVAS.height }}>
        <div className="absolute inset-0 rounded-2xl border border-slate-700/70 bg-slate-950 shadow-[0_0_60px_rgba(15,23,42,0.8)]" />

        {/* Band 1 – Ingest */}
        <div className="absolute left-[20px] top-[20px] w-[1100px] h-[158px] rounded-[16px] border border-emerald-500/30 bg-gradient-to-r from-slate-900/95 to-emerald-950/25" />
        <p className="absolute left-[34px] top-[28px] text-[10px] font-semibold tracking-[0.16em] text-emerald-200/95">BAND 1 — INGEST</p>

        {/* Band 2 – Operator Copilot Runtime */}
        <div className="absolute left-[20px] top-[196px] w-[1100px] h-[410px] rounded-[16px] border border-emerald-500/30 bg-gradient-to-r from-slate-900/95 to-emerald-950/25" />
        <p className="absolute left-[34px] top-[204px] text-[10px] font-semibold tracking-[0.16em] text-emerald-200/95">BAND 2 — OPERATOR COPILOT RUNTIME</p>

        {/* Trust boundary */}
        <div className="absolute left-[40px] top-[355px] h-px w-[1060px] border-t border-dashed border-slate-400/60" />
        <p className="absolute left-[50px] top-[340px] whitespace-nowrap text-[8px] font-semibold tracking-[0.06em] text-slate-400/70">
          TRUST BOUNDARY — CLIENT UI vs BACKEND / AI SERVICES
        </p>

        {/* Band 3 – Memory / Observability / Governance */}
        <div className="absolute left-[20px] top-[640px] w-[1100px] h-[110px] rounded-[16px] border border-emerald-500/30 bg-gradient-to-r from-slate-900/95 to-emerald-950/25" />
        <p className="absolute left-[34px] top-[648px] text-[10px] font-semibold tracking-[0.16em] text-emerald-200/95">BAND 3 — MEMORY / OBSERVABILITY / GOVERNANCE</p>

        {/* Nodes */}
        {NODES.map((node) => (
          <NodeCard key={node.id} node={node} setNodeRef={setNodeRef} />
        ))}

        {/* Edges + particles */}
        <svg className="absolute inset-0 pointer-events-none" width={CANVAS.width} height={CANVAS.height} viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`} aria-hidden>
          <defs>
            <marker id="arrowPrimary" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,4 L0,8 Z" fill="rgba(160,220,205,0.88)" />
            </marker>
            <marker id="arrowSecondary" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,4 L0,8 Z" fill="rgba(160,220,205,0.58)" />
            </marker>
            <radialGradient id="particleGlow">
              <stop offset="0%" stopColor="rgba(160,220,205,0.9)" />
              <stop offset="100%" stopColor="rgba(160,220,205,0)" />
            </radialGradient>
          </defs>
          {edgePaths.map((p, i) => {
            const dim = p.style !== 'primary';
            const particleR = dim ? 2 : 2.5;
            const dur = dim ? '4s' : '3s';
            const fill = dim ? 'rgba(160,220,205,0.35)' : 'rgba(160,220,205,0.65)';
            return (
              <g key={i}>
                <path
                  d={p.d}
                  fill="none"
                  stroke={stroke(p.style)}
                  strokeWidth={1.5}
                  strokeDasharray={p.style === 'optional' || p.style === 'secondary' ? '5 5' : undefined}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  markerEnd={`url(#${dim ? 'arrowSecondary' : 'arrowPrimary'})`}
                />
                {p.label && (
                  <text x={p.lx} y={p.ly} fill="rgba(160,220,205,0.85)" fontSize="7.5" fontWeight={600} letterSpacing="0.04em">
                    {p.label}
                  </text>
                )}
                <circle r={particleR} fill={fill} opacity={0.8}>
                  <animateMotion dur={dur} repeatCount="indefinite" begin={`${i * 0.35}s`}>
                    <mpath xlinkHref={`#flow-${i}`} />
                  </animateMotion>
                </circle>
                <circle r={particleR * 2.5} fill="url(#particleGlow)" opacity={0.2}>
                  <animateMotion dur={dur} repeatCount="indefinite" begin={`${i * 0.35}s`}>
                    <mpath xlinkHref={`#flow-${i}`} />
                  </animateMotion>
                </circle>
                <path id={`flow-${i}`} d={p.d} fill="none" stroke="none" />
              </g>
            );
          })}
        </svg>
      </div>
    </ResponsiveScaler>
    </TooltipProvider>
  );
}

/* ─── legend ─── */
function DiagramLegend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-lg border border-border/40 bg-muted/30 px-4 py-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70 mr-1">Legend</p>

      {/* Primary flow */}
      <div className="flex items-center gap-1.5">
        <svg width="28" height="10" viewBox="0 0 28 10" className="shrink-0">
          <line x1="0" y1="5" x2="22" y2="5" stroke="rgba(160,220,205,0.85)" strokeWidth="1.5" />
          <polygon points="22,1.5 28,5 22,8.5" fill="rgba(160,220,205,0.88)" />
        </svg>
        <span className="text-[9px] font-semibold text-muted-foreground">Primary data flow</span>
      </div>

      {/* Secondary / dashed */}
      <div className="flex items-center gap-1.5">
        <svg width="28" height="10" viewBox="0 0 28 10" className="shrink-0">
          <line x1="0" y1="5" x2="22" y2="5" stroke="rgba(160,220,205,0.55)" strokeWidth="1.5" strokeDasharray="4 3" />
          <polygon points="22,1.5 28,5 22,8.5" fill="rgba(160,220,205,0.58)" />
        </svg>
        <span className="text-[9px] font-semibold text-muted-foreground">Secondary / governance</span>
      </div>

      {/* Optional */}
      <div className="flex items-center gap-1.5">
        <svg width="28" height="10" viewBox="0 0 28 10" className="shrink-0">
          <line x1="0" y1="5" x2="22" y2="5" stroke="rgba(160,220,205,0.45)" strokeWidth="1.5" strokeDasharray="4 3" />
          <polygon points="22,1.5 28,5 22,8.5" fill="rgba(160,220,205,0.45)" />
        </svg>
        <span className="text-[9px] font-semibold text-muted-foreground">Optional path</span>
      </div>

      {/* NIM node */}
      <div className="flex items-center gap-1.5">
        <div className="h-3.5 w-5 rounded border-2 border-emerald-400 bg-slate-900/80" />
        <span className="text-[9px] font-semibold text-muted-foreground">NVIDIA NIM</span>
      </div>

      {/* Core runtime */}
      <div className="flex items-center gap-1.5">
        <div className="h-3.5 w-5 rounded border-2 border-cyan-400/70 bg-slate-900/80" />
        <span className="text-[9px] font-semibold text-muted-foreground">Core runtime</span>
      </div>

      {/* Data store */}
      <div className="flex items-center gap-1.5">
        <div className="h-3.5 w-5 rounded border-[1.5px] border-sky-400/50 bg-slate-900/80" />
        <span className="text-[9px] font-semibold text-muted-foreground">Data store</span>
      </div>

      {/* Input */}
      <div className="flex items-center gap-1.5">
        <div className="h-3.5 w-5 rounded border border-slate-400/50 bg-slate-900/80" />
        <span className="text-[9px] font-semibold text-muted-foreground">Input / source</span>
      </div>

      {/* Governance */}
      <div className="flex items-center gap-1.5">
        <div className="h-3.5 w-5 rounded border border-amber-400/45 bg-slate-900/80" />
        <span className="text-[9px] font-semibold text-muted-foreground">Governance</span>
      </div>

      {/* Particle */}
      <div className="flex items-center gap-1.5">
        <svg width="18" height="10" viewBox="0 0 18 10" className="shrink-0">
          <circle cx="9" cy="5" r="2.5" fill="rgba(160,220,205,0.65)" />
          <circle cx="9" cy="5" r="5" fill="rgba(160,220,205,0.15)" />
        </svg>
        <span className="text-[9px] font-semibold text-muted-foreground">Animated data particle</span>
      </div>
    </div>
  );
}

/* ─── page ─── */
export default function Architecture() {
  return (
    <div className="mx-auto w-full max-w-[1400px] p-4 md:p-6">
      <motion.div {...fadeUp} className="mb-5">
        <p className="mb-1 text-[11px] font-medium uppercase tracking-widest text-primary/80">System Design</p>
        <h1 className="text-xl font-semibold text-foreground">Technical Architecture</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          End-to-end solution architecture for predictive outage management
          <span className="ml-2 text-[10px] text-muted-foreground/60">— hover or tab through nodes for details</span>
        </p>
      </motion.div>

      <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
        <Card className="border-border/50 bg-card/70">
          <CardHeader className="px-4 pb-2 pt-4 md:px-5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Layers className="h-4 w-4 text-primary" />
              Solution Architecture Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="w-full px-3 pb-3 md:px-4 md:pb-4">
            <ArchitectureDiagram />
            <DiagramLegend />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
