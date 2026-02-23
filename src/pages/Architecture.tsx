import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown, Layers, Lock, ShieldAlert, X, ArrowRight, Ban, GitBranch } from 'lucide-react';
import { PopoverClose } from '@radix-ui/react-popover';
import { Badge } from '@/components/ui/badge';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const CANVAS = { width: 1300, height: 800 };
const STEP_OUT = 14;
const END_PAD = 8;

/* ─── vertical deployment zone boundaries (NVIDIA GTC style) ─── */
const DEPLOY_ZONES = [
  { id: 'edge', label: 'EDGE', x0: 0, x1: 380 },
  { id: 'control', label: 'CONTROL PLANE', x0: 380, x1: 830 },
  { id: 'inference', label: 'AI INFERENCE PLANE', x0: 830, x1: CANVAS.width },
] as const;

type Anchor = 'left' | 'right' | 'top' | 'bottom' | 'center';
type EdgeStyle = 'primary' | 'secondary' | 'optional';
type RouteMode = 'horizontal-first' | 'vertical-first';

type NodeId =
  | 'structured_data' | 'sql_postgres' | 'unstructured_data' | 'text_retriever' | 'vector_db'
  | 'embedding_nim' | 'reranking_nim'
  | 'dataverse' | 'signal_store'
  | 'authenticated_operator' | 'copilot_ui'
  | 'orchestrator' | 'guardrails' | 'nemotron_nim' | 'lovable_ai'
  | 'streaming_bus'
  | 'sql_tools_store' | 'retriever_lane'
  | 'audit_logs' | 'prompt_versioning' | 'observability_bus' | 'telemetry' | 'compliance_packs' | 'rbac_rls';

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
  /** When set, center the label on this node instead of the edge midpoint */
  labelOnNode?: NodeId;
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
  dataverse: {
    description: 'Governed enterprise data source integrating Dataverse, CRM, and work order systems for operational context.',
    techStack: ['Microsoft Dataverse', 'Dynamics 365', 'Power Platform'],
    protocols: ['OData', 'REST API', 'Batch Sync'],
  },
  signal_store: {
    description: 'Feature store for pre-computed KPIs, risk scores, and ETR features. Feeds the orchestrator and analytics dashboards.',
    techStack: ['PostgreSQL', 'Materialized Views', 'Edge Functions'],
    protocols: ['SQL', 'REST API'],
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
    description: 'Multi-model routing gateway with automatic fallback. Routes requests across available LLM providers for resilience.',
    techStack: ['Model Router', 'Gemini', 'GPT-5', 'Fallback Logic'],
    protocols: ['OpenAI-compatible API', 'REST'],
  },
  streaming_bus: {
    description: 'Real-time streaming event bus ingesting OMS, SCADA, and weather events for live situational awareness.',
    techStack: ['Event Streaming', 'WebSocket', 'Edge Functions'],
    protocols: ['WebSocket', 'SSE', 'Pub/Sub'],
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
  observability_bus: {
    description: 'Central observability hub collecting traces, metrics, and logs from all runtime components for monitoring and alerting.',
    techStack: ['OpenTelemetry', 'Structured Logging', 'Metrics Pipeline'],
    protocols: ['OTLP', 'REST API', 'gRPC'],
  },
  telemetry: {
    description: 'Operational telemetry and monitoring for AI response quality, latency, and system health metrics.',
    techStack: ['Supabase Analytics', 'Edge Function Logs'],
    protocols: ['REST API', 'Metrics'],
  },
  compliance_packs: {
    description: 'Regulatory reporting packs assembling audit trails and model versioning data for compliance reviews.',
    techStack: ['Report Generator', 'PDF Export', 'Compliance Templates'],
    protocols: ['REST API', 'Batch Export'],
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
  // Band 1 – Ingest (row 1)
  { id: 'structured_data', x: 40, y: 52, w: 185, h: 62, label: 'STRUCTURED DATA', sub: 'OMS · SCADA · Asset · Crew · Customer', icon: 'db', tier: 'input' },
  { id: 'sql_postgres', x: 255, y: 52, w: 155, h: 62, label: 'SQL / POSTGRES', icon: 'db', tier: 'data' },
  { id: 'unstructured_data', x: 440, y: 52, w: 155, h: 62, label: 'UNSTRUCTURED DATA', icon: 'doc', tier: 'input' },
  { id: 'text_retriever', x: 625, y: 52, w: 138, h: 62, label: 'TEXT RETRIEVER', icon: 'agent', tier: 'core' },
  { id: 'vector_db', x: 793, y: 52, w: 110, h: 62, label: 'VECTOR DB', icon: 'db', tier: 'data' },
  { id: 'embedding_nim', x: 933, y: 46, w: 145, h: 36, label: 'EMBEDDING NIM', nim: true, optional: true, icon: 'nim', tier: 'nim' },
  { id: 'reranking_nim', x: 933, y: 98, w: 145, h: 36, label: 'RERANKING NIM', nim: true, optional: true, icon: 'nim', tier: 'nim' },
  // Band 1 – Ingest (row 2)
  { id: 'dataverse', x: 40, y: 126, w: 185, h: 46, label: 'DATAVERSE / CRM / WORK ORDERS', sub: 'Governed enterprise data', icon: 'db', tier: 'input' },
  { id: 'signal_store', x: 255, y: 126, w: 170, h: 46, label: 'SIGNAL / FEATURE STORE', sub: 'KPIs, risk scores, ETR features', icon: 'analytics', tier: 'data' },

  // Band 2 – Operator Copilot Runtime (above trust boundary)
  { id: 'authenticated_operator', x: 80, y: 244, w: 235, h: 56, label: 'AUTHENTICATED OPERATOR', icon: 'user', tier: 'input' },
  { id: 'copilot_ui', x: 395, y: 244, w: 235, h: 56, label: 'COPILOT UI', icon: 'app', tier: 'core' },

  // Band 2 – Below trust boundary (runtime row)
  { id: 'orchestrator', x: 40, y: 405, w: 215, h: 58, label: 'COPILOT ORCHESTRATOR', sub: 'Edge Functions', icon: 'agent', tier: 'core' },
  { id: 'guardrails', x: 295, y: 405, w: 195, h: 58, label: 'GUARDRAILS', sub: 'Policy Boundary', icon: 'agent', tier: 'core' },
  { id: 'nemotron_nim', x: 530, y: 405, w: 215, h: 58, label: 'NEMOTRON LLM NIM', sub: 'NVIDIA NIM', nim: true, icon: 'nim', tier: 'nim' },
  { id: 'lovable_ai', x: 790, y: 392, w: 245, h: 82, label: 'MODEL ROUTER', sub: 'Multi-model + fallback', icon: 'nim', tier: 'nim' },

  // Band 2 – Bottom row
  { id: 'sql_tools_store', x: 40, y: 520, w: 230, h: 48, label: 'SQL TOOLS / SCENARIO STORE', icon: 'db', tier: 'data' },
  { id: 'retriever_lane', x: 310, y: 520, w: 310, h: 48, label: 'RETRIEVER LANE (VECTOR DB)', icon: 'db', tier: 'data' },
  { id: 'streaming_bus', x: 670, y: 520, w: 200, h: 48, label: 'STREAMING EVENT BUS', sub: 'OMS / SCADA / Weather events', icon: 'analytics', tier: 'core' },

  // Band 3 – Memory / Observability / Governance
  { id: 'audit_logs', x: 40, y: 685, w: 160, h: 46, label: 'AUDIT LOGS', icon: 'doc', tier: 'governance' },
  { id: 'prompt_versioning', x: 220, y: 685, w: 190, h: 46, label: 'PROMPT & MODEL VERSIONING', icon: 'agent', tier: 'governance' },
  { id: 'compliance_packs', x: 430, y: 685, w: 160, h: 46, label: 'COMPLIANCE PACKS', sub: 'Regulatory reporting', icon: 'doc', tier: 'governance' },
  { id: 'observability_bus', x: 620, y: 685, w: 190, h: 46, label: 'OBSERVABILITY BUS', sub: 'Tracing, metrics, logs', icon: 'analytics', tier: 'governance' },
  { id: 'telemetry', x: 840, y: 685, w: 165, h: 46, label: 'TELEMETRY / MONITORING', icon: 'analytics', tier: 'governance' },
  { id: 'rbac_rls', x: 1035, y: 685, w: 220, h: 46, label: 'RBAC + RLS', icon: 'admin', tier: 'governance' },
];

/* ─── EDGES ─── */
const EDGES: EdgeDef[] = [
  // Band 1 – Ingest row
  { from: { nodeId: 'structured_data', anchor: 'right' }, to: { nodeId: 'sql_postgres', anchor: 'left' }, style: 'primary', mode: 'horizontal-first' },
  { from: { nodeId: 'sql_postgres', anchor: 'right' }, to: { nodeId: 'unstructured_data', anchor: 'left' }, style: 'primary', mode: 'horizontal-first' },
  { from: { nodeId: 'unstructured_data', anchor: 'right' }, to: { nodeId: 'text_retriever', anchor: 'left' }, style: 'primary', mode: 'horizontal-first' },
  { from: { nodeId: 'text_retriever', anchor: 'right' }, to: { nodeId: 'vector_db', anchor: 'left' }, style: 'primary', mode: 'horizontal-first', label: 'RETRIEVE', labelOnNode: 'vector_db' },
  { from: { nodeId: 'vector_db', anchor: 'right' }, to: { nodeId: 'embedding_nim', anchor: 'left' }, style: 'optional', mode: 'horizontal-first' },
  { from: { nodeId: 'vector_db', anchor: 'right' }, to: { nodeId: 'reranking_nim', anchor: 'left' }, style: 'optional', mode: 'horizontal-first' },
  // New ingest connections
  { from: { nodeId: 'dataverse', anchor: 'top' }, to: { nodeId: 'structured_data', anchor: 'bottom' }, style: 'primary', mode: 'vertical-first' },
  { from: { nodeId: 'sql_postgres', anchor: 'bottom' }, to: { nodeId: 'signal_store', anchor: 'top' }, style: 'primary', mode: 'vertical-first' },

  // Operator → Copilot UI
  { from: { nodeId: 'authenticated_operator', anchor: 'right' }, to: { nodeId: 'copilot_ui', anchor: 'left' }, style: 'primary', mode: 'horizontal-first' },
  // Copilot UI → Model Router (dashed, optional – fallback path)
  { from: { nodeId: 'copilot_ui', anchor: 'right' }, to: { nodeId: 'lovable_ai', anchor: 'top' }, style: 'optional', mode: 'horizontal-first', laneX: 760 },

  // Runtime row
  { from: { nodeId: 'orchestrator', anchor: 'right' }, to: { nodeId: 'guardrails', anchor: 'left' }, style: 'primary', mode: 'horizontal-first' },
  { from: { nodeId: 'guardrails', anchor: 'right' }, to: { nodeId: 'nemotron_nim', anchor: 'left' }, style: 'primary', mode: 'horizontal-first', label: 'GENERATE', labelOnNode: 'nemotron_nim' },
  // Nemotron → Copilot UI (Structured Output)
  { from: { nodeId: 'nemotron_nim', anchor: 'top' }, to: { nodeId: 'copilot_ui', anchor: 'bottom' }, style: 'primary', label: 'STRUCTURE OUTPUT (JSON)', mode: 'vertical-first', laneY: 370 },

  // Signal store → Orchestrator (feature feed)
  { from: { nodeId: 'signal_store', anchor: 'bottom' }, to: { nodeId: 'orchestrator', anchor: 'top' }, style: 'secondary', mode: 'vertical-first', laneY: 340 },

  // Streaming event bus → NIM (event data feed)
  { from: { nodeId: 'streaming_bus', anchor: 'top' }, to: { nodeId: 'nemotron_nim', anchor: 'bottom' }, style: 'primary', mode: 'vertical-first', laneY: 490 },
  // Streaming event bus → Telemetry (monitoring, dotted)
  { from: { nodeId: 'streaming_bus', anchor: 'bottom' }, to: { nodeId: 'telemetry', anchor: 'top' }, style: 'optional', mode: 'vertical-first', laneY: 630 },

  // Bottom row
  { from: { nodeId: 'sql_tools_store', anchor: 'top' }, to: { nodeId: 'orchestrator', anchor: 'bottom' }, style: 'secondary', mode: 'vertical-first' },
  { from: { nodeId: 'retriever_lane', anchor: 'top' }, to: { nodeId: 'guardrails', anchor: 'bottom' }, style: 'secondary', mode: 'vertical-first', label: 'RERANK' },

  // Band 3 governance connections (upward to runtime – vertical taps from bus)
  { from: { nodeId: 'audit_logs', anchor: 'top' }, to: { nodeId: 'orchestrator', anchor: 'bottom' }, style: 'secondary', mode: 'vertical-first', laneY: 650 },
  { from: { nodeId: 'prompt_versioning', anchor: 'top' }, to: { nodeId: 'guardrails', anchor: 'bottom' }, style: 'secondary', mode: 'vertical-first', laneY: 650 },
  { from: { nodeId: 'telemetry', anchor: 'top' }, to: { nodeId: 'nemotron_nim', anchor: 'bottom' }, style: 'secondary', mode: 'vertical-first', laneY: 650 },
  { from: { nodeId: 'rbac_rls', anchor: 'top' }, to: { nodeId: 'lovable_ai', anchor: 'bottom' }, style: 'secondary', mode: 'vertical-first', laneY: 650 },
  { from: { nodeId: 'rbac_rls', anchor: 'top' }, to: { nodeId: 'nemotron_nim', anchor: 'bottom' }, style: 'secondary', mode: 'vertical-first', laneY: 640 },

  // Observability bus telemetry (dotted, from runtime down)
  { from: { nodeId: 'nemotron_nim', anchor: 'bottom' }, to: { nodeId: 'observability_bus', anchor: 'top' }, style: 'optional', mode: 'vertical-first', laneY: 580 },
  { from: { nodeId: 'lovable_ai', anchor: 'bottom' }, to: { nodeId: 'observability_bus', anchor: 'top' }, style: 'optional', mode: 'vertical-first', laneY: 590 },

  // Compliance packs (dotted, from audit + versioning)
  { from: { nodeId: 'audit_logs', anchor: 'top' }, to: { nodeId: 'compliance_packs', anchor: 'top' }, style: 'optional', mode: 'vertical-first', laneY: 670 },
  { from: { nodeId: 'prompt_versioning', anchor: 'bottom' }, to: { nodeId: 'compliance_packs', anchor: 'bottom' }, style: 'optional', mode: 'vertical-first', laneY: 745 },
];

/* ─── adjacency map for hover highlighting ─── */
const ADJACENCY = new Map<NodeId, Set<NodeId>>();
EDGES.forEach(e => {
  if (!ADJACENCY.has(e.from.nodeId)) ADJACENCY.set(e.from.nodeId, new Set());
  if (!ADJACENCY.has(e.to.nodeId)) ADJACENCY.set(e.to.nodeId, new Set());
  ADJACENCY.get(e.from.nodeId)!.add(e.to.nodeId);
  ADJACENCY.get(e.to.nodeId)!.add(e.from.nodeId);
});

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
  return { x: pt.x + 6, y: pt.y - 10 };
}

/* ─── icons ─── */
function NodeIcon({ icon }: { icon?: string }) {
  const cls = 'w-4 h-4 mb-0.5';
  if (icon === 'db') return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="rgba(120,200,220,0.9)" strokeWidth="1.8"><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" /><path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" /></svg>);
  if (icon === 'doc') return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /></svg>);
  if (icon === 'user' || icon === 'admin') return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>);
  if (icon === 'app') return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><circle cx="7" cy="6" r="0.8" fill="currentColor" /><circle cx="10" cy="6" r="0.8" fill="currentColor" /></svg>);
  if (icon === 'agent') return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 9h6M9 12h4M9 15h5" /></svg>);
  if (icon === 'nim') return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" /><polygon points="12,6 18,9.5 18,14.5 12,18 6,14.5 6,9.5" /></svg>);
  if (icon === 'analytics') return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="rgba(120,200,220,0.9)" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 17V13M12 17V7M17 17V11" /></svg>);
  return null;
}

/* ─── lock badge ─── */
function LockBadge({ x, y }: { x: number; y: number }) {
  return (
    <div className="absolute pointer-events-none" style={{ left: x, top: y }}>
      <Lock className="h-2.5 w-2.5 text-cyan-400/50" />
    </div>
  );
}

/* ─── tooltip content ─── */
function NodeTooltipBody({ nodeId, label }: { nodeId: NodeId; label: string }) {
  const info = NODE_TOOLTIPS[nodeId];
  if (!info) return null;
  return (
    <div className="max-w-[260px] space-y-2 text-left relative pr-4">
      <PopoverClose className="absolute -top-1 -right-1 rounded-sm p-0.5 text-slate-400 hover:text-slate-100 hover:bg-slate-700/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400/60" aria-label="Close">
        <X className="h-3 w-3" />
      </PopoverClose>
      <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">{label}</p>
      <div className="h-px bg-slate-600/50" />
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
function NodeCard({
  node,
  setNodeRef,
  dimmed,
  onHoverStart,
  onHoverEnd,
}: {
  node: NodeDef;
  setNodeRef: (id: NodeId) => (el: HTMLDivElement | null) => void;
  dimmed: boolean;
  onHoverStart: (id: NodeId) => void;
  onHoverEnd: () => void;
}) {
  const tier = node.tier ?? (node.nim ? 'nim' : 'input');
  const tierStyles: Record<NodeTier, { border: string; text: string; icon: string }> = {
    nim:        { border: 'border-2 border-emerald-400/90', text: 'text-emerald-100', icon: 'text-emerald-300' },
    core:       { border: 'border-2 border-cyan-400/80', text: 'text-cyan-50', icon: 'text-cyan-300' },
    data:       { border: 'border-[1.5px] border-sky-400/60', text: 'text-slate-100', icon: 'text-sky-300/80' },
    input:      { border: 'border border-slate-400/60', text: 'text-slate-200', icon: 'text-slate-300/80' },
    governance: { border: 'border border-amber-400/55', text: 'text-slate-200', icon: 'text-amber-300/70' },
  };
  const s = tierStyles[tier];
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Popover onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          ref={setNodeRef(node.id)}
          data-node={node.id}
          tabIndex={0}
          role="button"
          aria-label={`${node.label}${node.sub ? ` — ${node.sub}` : ''}`}
          className={`absolute rounded-lg bg-slate-900/95 px-2 py-1 text-center shadow-[0_0_12px_rgba(15,23,42,0.5)] ${s.border} ${node.optional ? 'border-dashed' : ''} transition-all duration-200 hover:shadow-[0_0_20px_rgba(56,189,248,0.15)] hover:brightness-110 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400/60 cursor-pointer ${isOpen ? 'ring-1 ring-cyan-400/70 shadow-[0_0_24px_rgba(56,189,248,0.25)] brightness-125' : ''}`}
          style={{
            left: node.x,
            top: node.y,
            width: node.w,
            height: node.h,
            opacity: dimmed ? 0.2 : 1,
            filter: dimmed ? 'grayscale(0.6)' : 'none',
          }}
          onMouseEnter={() => onHoverStart(node.id)}
          onMouseLeave={onHoverEnd}
        >
          <div className="flex h-full w-full flex-col items-center justify-center">
            <span className={s.icon}><NodeIcon icon={node.icon} /></span>
            <p className={`text-[9px] font-semibold tracking-[0.06em] leading-tight ${s.text}`}>{node.label}</p>
            {node.sub && <p className="mt-0.5 text-[7px] font-medium tracking-[0.03em] text-slate-400/90 leading-tight">{node.sub}</p>}
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent side={node.y < 150 ? "bottom" : "top"} className="border-slate-600/80 bg-slate-800/95 backdrop-blur-sm shadow-xl p-3 z-[9999] w-auto" sideOffset={8}>
        <NodeTooltipBody nodeId={node.id} label={node.label} />
      </PopoverContent>
    </Popover>
  );
}

/* ─── vertical deployment zones overlay (pointer-events: none, behind nodes) ─── */
function DeploymentZonesOverlay({ width, zones }: { width: number; zones: typeof DEPLOY_ZONES }) {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      {zones.map((zone, i) => (
        <div key={zone.id}>
          {/* faint tint wash */}
          <div
            className="absolute top-0"
            style={{
              left: zone.x0,
              width: zone.x1 - zone.x0,
              height: '100%',
              background:
                i === 0
                  ? 'linear-gradient(180deg, rgba(56,189,248,0.02) 0%, transparent 60%)'
                  : i === 1
                  ? 'linear-gradient(180deg, rgba(16,185,129,0.02) 0%, transparent 60%)'
                  : 'linear-gradient(180deg, rgba(168,85,247,0.02) 0%, transparent 60%)',
              borderRadius: '16px',
            }}
          />
          {/* top label */}
          <p
            className="absolute"
            style={{
              left: zone.x0 + 30,
              top: 5,
              fontSize: '8.5px',
              fontWeight: 700,
              letterSpacing: '0.22em',
              color: 'rgba(148,163,184,0.78)',
              textTransform: 'uppercase' as const,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            {zone.label}
          </p>
          {/* faint rail line under label */}
          <div
            className="absolute"
            style={{
              left: zone.x0 + 28,
              top: 18,
              width: Math.min(zone.label.length * 7.5 + 16, zone.x1 - zone.x0 - 56),
              height: '1px',
              background: 'linear-gradient(90deg, rgba(148,163,184,0.25) 0%, transparent 100%)',
            }}
          />
          {/* vertical divider line – full-height, consistent opacity */}
          {zone.x0 > 0 && (
            <div
              className="absolute top-0"
              style={{
                left: zone.x0,
                width: '1px',
                height: '100%',
                background: 'rgba(148,163,184,0.07)',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── scrollable canvas wrapper (fixed width, horizontal scroll on small screens) ─── */
function ScrollableCanvas({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ width: `${CANVAS.width}px`, minWidth: `${CANVAS.width}px`, display: 'inline-block' }}>
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
  const [hoveredNode, setHoveredNode] = useState<NodeId | null>(null);

  const connectedNodes = hoveredNode
    ? new Set([hoveredNode, ...(ADJACENCY.get(hoveredNode) ?? [])])
    : null;
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
      let lp: Pt | undefined;
      if (edge.label) {
        if (edge.labelOnNode) {
          const targetRect = rects.get(edge.labelOnNode);
          if (targetRect) {
            // Center label on the target node
            lp = { x: targetRect.x + targetRect.w / 2, y: targetRect.y - 10 };
          }
        }
        if (!lp) {
          const midIdx = Math.floor(points.length / 2);
          const mid = {
            x: (points[midIdx - 1].x + points[midIdx].x) / 2,
            y: (points[midIdx - 1].y + points[midIdx].y) / 2,
          };
          lp = labelPoint(mid);
        }
      }
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

  const strokeColor = (style: EdgeStyle) =>
    style === 'primary' ? 'rgba(160,220,205,0.85)' : style === 'optional' ? 'rgba(160,220,205,0.40)' : 'rgba(160,220,205,0.55)';
  const strokeWidth = (style: EdgeStyle) => style === 'primary' ? 2 : 1.2;

  return (
    <ScrollableCanvas>
      <div ref={canvasRef} className="relative shrink-0" style={{ width: CANVAS.width, minWidth: CANVAS.width, height: CANVAS.height }}>
        <div className="absolute inset-0 rounded-2xl border border-slate-700/70 bg-slate-950 shadow-[0_0_60px_rgba(15,23,42,0.8)]" />

        {/* ─── Vertical deployment zone overlays (GTC-style) ─── */}
        <DeploymentZonesOverlay width={CANVAS.width} zones={DEPLOY_ZONES} />

        {/* DEPLOYMENT caption – top-left inside canvas */}
        <p
          className="absolute pointer-events-none select-none"
          style={{
            left: 24,
            top: 4,
            fontSize: '7px',
            fontWeight: 700,
            letterSpacing: '0.28em',
            color: 'rgba(148,163,184,0.22)',
            textTransform: 'uppercase',
            fontFamily: 'Inter, system-ui, sans-serif',
            zIndex: 2,
          }}
        >
          Deployment
        </p>

        {/* Band 1 – Ingest */}
        <div className="absolute left-[20px] top-[20px] w-[1260px] h-[168px] rounded-[16px] border border-emerald-500/30 bg-gradient-to-r from-slate-900/95 to-emerald-950/25" />
        <p className="absolute left-[34px] top-[28px] text-[10px] font-semibold tracking-[0.16em] text-emerald-200/95">BAND 1 — INGEST</p>

        {/* NIM SERVICES sub-label above Embedding/Reranking NIMs */}
        <p className="absolute pointer-events-none select-none" style={{ left: 965, top: 32, fontSize: '7px', fontWeight: 600, letterSpacing: '0.10em', color: 'rgba(160,220,205,0.55)', fontFamily: 'monospace', textTransform: 'uppercase' as const }}>NIM SERVICES</p>

        {/* Band 2 – Operator Copilot Runtime */}
        <div className="absolute left-[20px] top-[202px] w-[1260px] h-[430px] rounded-[16px] border border-emerald-500/30 bg-gradient-to-r from-slate-900/95 to-emerald-950/25" />
        <p className="absolute left-[34px] top-[210px] text-[10px] font-semibold tracking-[0.16em] text-emerald-200/95">BAND 2 — OPERATOR COPILOT RUNTIME</p>

        {/* Trust boundary */}
        <div className="absolute left-[40px] top-[355px] h-px w-[1220px] border-t border-dashed border-slate-400/60" />
        <p className="absolute left-[50px] top-[340px] whitespace-nowrap text-[8px] font-semibold tracking-[0.06em] text-slate-400/70">
          ZERO-TRUST API BOUNDARY — CLIENT UI vs BACKEND / AI SERVICES
        </p>

        {/* Band 3 – Memory / Observability / Governance */}
        <div className="absolute left-[20px] top-[650px] w-[1260px] h-[115px] rounded-[16px] border border-emerald-500/30 bg-gradient-to-r from-slate-900/95 to-emerald-950/25" />
        <p className="absolute left-[34px] top-[658px] text-[10px] font-semibold tracking-[0.16em] text-emerald-200/95">BAND 3 — MEMORY / OBSERVABILITY / GOVERNANCE</p>

        {/* Governance bus – horizontal line across Band 3 */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: 40,
            top: 680,
            width: 1220,
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(251,191,36,0.18) 5%, rgba(251,191,36,0.18) 95%, transparent 100%)',
          }}
        />

        {/* Lock badges (security indicators) */}
        <LockBadge x={622} y={246} />
        <LockBadge x={482} y={407} />
        <LockBadge x={1247} y={687} />

        {/* Nodes */}
        {NODES.map((node) => (
          <NodeCard
            key={node.id}
            node={node}
            setNodeRef={setNodeRef}
            dimmed={connectedNodes !== null && !connectedNodes.has(node.id)}
            onHoverStart={setHoveredNode}
            onHoverEnd={() => setHoveredNode(null)}
          />
        ))}

        {/* Edges + particles */}
        <svg className="absolute inset-0 pointer-events-none" width={CANVAS.width} height={CANVAS.height} viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`} aria-hidden>
          <defs>
            <marker id="arrowPrimary" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,4 L0,8 Z" fill="rgba(160,220,205,0.88)" />
            </marker>
            <marker id="arrowSecondary" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,4 L0,8 Z" fill="rgba(160,220,205,0.50)" />
            </marker>
            <radialGradient id="particleGlow">
              <stop offset="0%" stopColor="rgba(160,220,205,0.9)" />
              <stop offset="100%" stopColor="rgba(160,220,205,0)" />
            </radialGradient>
          </defs>
          {edgePaths.map((p, i) => {
            const dim = p.style !== 'primary';
            const particleR = dim ? 1.8 : 2.5;
            const dur = dim ? '4s' : '3s';
            const fill = dim ? 'rgba(160,220,205,0.30)' : 'rgba(160,220,205,0.65)';
            return (
              <g key={i}>
                <path
                  d={p.d}
                  fill="none"
                  stroke={strokeColor(p.style)}
                  strokeWidth={strokeWidth(p.style)}
                  strokeDasharray={dim ? '5 4' : undefined}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  markerEnd={`url(#${dim ? 'arrowSecondary' : 'arrowPrimary'})`}
                />
                {p.label && (
                  <g>
                    {(() => {
                      const textW = p.label.length * 4.2 + 6;
                      const lx = p.lx ?? 0;
                      const ly = p.ly ?? 0;
                      return (
                        <>
                          <rect
                            x={lx - textW / 2}
                            y={ly - 8}
                            width={textW}
                            height={12}
                            rx={3}
                            fill="rgba(15,23,42,0.92)"
                            stroke="rgba(160,220,205,0.12)"
                            strokeWidth={0.5}
                          />
                          <text x={lx} y={ly} fill="rgba(160,220,205,0.92)" fontSize="7" fontWeight={600} letterSpacing="0.05em" fontFamily="monospace" textAnchor="middle">
                            {p.label}
                          </text>
                        </>
                      );
                    })()}
                  </g>
                )}
                <circle r={particleR} fill={fill} opacity={0.8}>
                  <animateMotion dur={dur} repeatCount="indefinite" begin={`${i * 0.3}s`}>
                    <mpath xlinkHref={`#flow-${i}`} />
                  </animateMotion>
                </circle>
                <circle r={particleR * 2.5} fill="url(#particleGlow)" opacity={0.15}>
                  <animateMotion dur={dur} repeatCount="indefinite" begin={`${i * 0.3}s`}>
                    <mpath xlinkHref={`#flow-${i}`} />
                  </animateMotion>
                </circle>
                <path id={`flow-${i}`} d={p.d} fill="none" stroke="none" />
              </g>
            );
          })}
        </svg>
      </div>
    </ScrollableCanvas>
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
          <line x1="0" y1="5" x2="22" y2="5" stroke="rgba(160,220,205,0.85)" strokeWidth="2" />
          <polygon points="22,1.5 28,5 22,8.5" fill="rgba(160,220,205,0.88)" />
        </svg>
        <span className="text-[9px] font-semibold text-muted-foreground">Primary data flow</span>
      </div>

      {/* Secondary / dashed */}
      <div className="flex items-center gap-1.5">
        <svg width="28" height="10" viewBox="0 0 28 10" className="shrink-0">
          <line x1="0" y1="5" x2="22" y2="5" stroke="rgba(160,220,205,0.55)" strokeWidth="1.2" strokeDasharray="5 4" />
          <polygon points="22,1.5 28,5 22,8.5" fill="rgba(160,220,205,0.50)" />
        </svg>
        <span className="text-[9px] font-semibold text-muted-foreground">Secondary / governance</span>
      </div>

      {/* Optional */}
      <div className="flex items-center gap-1.5">
        <svg width="28" height="10" viewBox="0 0 28 10" className="shrink-0">
          <line x1="0" y1="5" x2="22" y2="5" stroke="rgba(160,220,205,0.40)" strokeWidth="1.2" strokeDasharray="5 4" />
          <polygon points="22,1.5 28,5 22,8.5" fill="rgba(160,220,205,0.40)" />
        </svg>
        <span className="text-[9px] font-semibold text-muted-foreground">Optional / telemetry</span>
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

      {/* Lock */}
      <div className="flex items-center gap-1.5">
        <Lock className="h-3 w-3 text-cyan-400/50" />
        <span className="text-[9px] font-semibold text-muted-foreground">Secured node</span>
      </div>

      {/* Zone legend separator */}
      <div className="h-3 w-px bg-border/30 mx-1" />
      <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/50 mr-0.5">Zones</p>

      {/* Edge zone */}
      <div className="flex items-center gap-1">
        <div className="h-3 w-4 rounded-[3px] border border-sky-400/20" style={{ background: 'rgba(56,189,248,0.06)' }} />
        <span className="text-[8px] font-semibold text-muted-foreground/80">Edge</span>
      </div>

      {/* Control Plane zone */}
      <div className="flex items-center gap-1">
        <div className="h-3 w-4 rounded-[3px] border border-emerald-400/20" style={{ background: 'rgba(16,185,129,0.06)' }} />
        <span className="text-[8px] font-semibold text-muted-foreground/80">Control Plane</span>
      </div>

      {/* AI Inference Plane zone */}
      <div className="flex items-center gap-1">
        <div className="h-3 w-4 rounded-[3px] border border-purple-400/20" style={{ background: 'rgba(168,85,247,0.06)' }} />
        <span className="text-[8px] font-semibold text-muted-foreground/80">AI Inference</span>
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

/* ─── rule coverage data ─── */
interface RuleCoverageRow {
  constraint: string;
  hazard: string;
  trigger: string;
  flags: string[];
  blocked: string[];
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  hazardColor: string;
  /** Evidence lines returned by the engine in safetyConstraints[].evidence */
  evidence: string[];
  /** Optional note clarifying conditional evidence lines */
  conditionalNote?: string;
}

const RULE_COVERAGE: RuleCoverageRow[] = [
  {
    constraint: 'SC-CRIT-001',
    title: 'Critical service continuity',
    hazard: 'ANY',
    trigger: 'criticalLoads includes HOSPITAL/WATER/TELECOM  OR  avgLoadCriticality ≥ 0.70',
    flags: ['critical_load_at_risk'],
    blocked: ['deenergize_section'],
    severity: 'HIGH',
    hazardColor: 'text-red-400',
    evidence: [
      'Critical load types (hospital/water/telecom) detected.',
      'Average load criticality is {avgLoadCriticality} (>= 0.70).',
    ],
  },
  {
    constraint: 'SC-CRIT-002',
    title: 'Backup power depletion risk',
    hazard: 'ANY',
    trigger: 'criticalLoad.backupHoursRemaining < 4',
    flags: ['critical_backup_window_short'],
    blocked: [],
    severity: 'HIGH',
    hazardColor: 'text-red-400',
    evidence: [
      '{load.type} ({load.name}) backup < 4h.',
    ],
    conditionalNote: 'One evidence line is emitted per qualifying critical load with backupHoursRemaining < 4. Multiple loads each produce a separate bullet: {load.type} ({load.name}) backup < 4h.',
  },
  {
    constraint: 'SC-CREW-001',
    title: 'Field crew sufficiency',
    hazard: 'ANY',
    trigger: 'crewsAvailable + enRoute < estimatedCrewsNeeded',
    flags: ['insufficient_crews'],
    blocked: ['reroute_load'],
    severity: 'HIGH',
    hazardColor: 'text-orange-400',
    evidence: [
      '{crewsAvailable} crew(s) available, {enRoute} en route — {estimatedCrewsNeeded} estimated needed.',
    ],
  },
  {
    constraint: 'SC-HEAT-001',
    title: 'Transformer thermal overload risk',
    hazard: 'HEAT ≥ 3',
    trigger: 'hazardType = HEAT  &  severity ≥ 3',
    flags: ['transformer_thermal_stress'],
    blocked: ['reroute_load'],
    severity: 'HIGH',
    hazardColor: 'text-amber-400',
    evidence: [
      'Hazard: HEAT — severity {severity}/5 (threshold: 3).',
      'Sustained ambient heat elevates transformer winding temperature and may accelerate insulation breakdown under full load restoration.',
    ],
  },
  {
    constraint: 'SC-HEAT-002',
    title: 'Extreme heat peak load risk',
    hazard: 'HEAT ≥ 4',
    trigger: 'hazardType = HEAT  &  severity ≥ 4',
    flags: ['heat_load_spike', 'transformer_thermal_stress'],
    blocked: ['reroute_load'],
    severity: 'HIGH',
    hazardColor: 'text-red-400',
    evidence: [
      'Hazard: HEAT — severity >= 4 (threshold: 4).',
      'Peak load conditions may push transformers beyond rated thermal limits under sustained extreme ambient temperatures.',
    ],
  },
  {
    constraint: 'SC-FLOOD-001',
    title: 'Flood zone equipment access restriction',
    hazard: 'RAIN / ACTIVE',
    trigger: 'hazardType = RAIN  &  phase = ACTIVE',
    flags: ['flood_access_risk'],
    blocked: ['dispatch_crews'],
    severity: 'HIGH',
    hazardColor: 'text-blue-400',
    evidence: [
      'Hazard: FLOOD/RAIN — phase: ACTIVE.',
      'Ground saturation and standing water elevate electrocution risk for field personnel near pad-mount equipment.',
    ],
  },
  {
    constraint: 'SC-STORM-001',
    title: 'High wind field crew prohibition',
    hazard: 'STORM / ACTIVE',
    trigger: 'hazardType = STORM  &  phase = ACTIVE',
    flags: ['storm_active', 'high_wind_conductor_risk'],
    blocked: ['dispatch_crews', 'reroute_load'],
    severity: 'HIGH',
    hazardColor: 'text-sky-400',
    evidence: [
      'Hazard: STORM — phase: ACTIVE.',
      'High wind conditions elevate conductor contact and tree strike risk for field personnel.',
    ],
  },
  {
    constraint: 'SC-ICE-001',
    title: 'Ice storm switching prohibition',
    hazard: 'ICE / ACTIVE',
    trigger: 'hazardType = ICE  &  phase = ACTIVE',
    flags: ['ice_load_risk'],
    blocked: ['reroute_load', 'deenergize_section'],
    severity: 'HIGH',
    hazardColor: 'text-cyan-400',
    evidence: [
      'Hazard: ICE — phase: ACTIVE.',
      'Remote switching without visual line inspection risks cascading failures on ice-loaded conductors.',
      'Asset {id} ({type}) — vegetation exposure: {vegetationExposure} (threshold: 0.50).',
    ],
    conditionalNote: 'Third evidence line is only appended when hasIceLoadRisk is true (i.e. assets with vegetationExposure > 0.50 are present). Otherwise only the first two lines appear.',
  },
  {
    constraint: 'SC-ICE-002',
    title: 'Ice vegetation line loading',
    hazard: 'ICE / ACTIVE',
    trigger: 'hazardType = ICE  &  asset.vegetationExposure > 0.50',
    flags: ['ice_load_risk'],
    blocked: [],
    severity: 'HIGH',
    hazardColor: 'text-cyan-400',
    evidence: [
      'Asset {id} ({type}) — vegetation exposure: {vegetationExposure} (threshold: 0.50).',
    ],
    conditionalNote: 'One evidence line is emitted per asset with vegetationExposure > 0.50. This constraint fires independently of SC-ICE-001 — it targets line loading risk rather than the switching prohibition.',
  },
  {
    constraint: 'SC-WILD-001',
    title: 'Wildfire aerial clearance required',
    hazard: 'WILDFIRE',
    trigger: 'hazardType = WILDFIRE  &  vegetation_exposure_avg > 0.60',
    flags: ['vegetation_fire_risk'],
    blocked: ['deenergize_section'],
    severity: 'HIGH',
    hazardColor: 'text-orange-400',
    evidence: [
      'Hazard: WILDFIRE — {n} asset(s) exceed 0.60 vegetation exposure threshold.',
      'Asset {id} ({type}) — vegetation exposure: {vegetationExposure}.',
    ],
    conditionalNote: 'Evidence lines are only appended per-asset when hasWildfireSwitchingRisk is true (i.e. assets with vegetationExposure > 0.60 are present). Otherwise only the summary line appears.',
  },
];

const SEV_CLS: Record<RuleCoverageRow['severity'], string> = {
  HIGH: 'bg-destructive/15 text-destructive',
  MEDIUM: 'bg-amber-500/15 text-amber-400',
  LOW: 'bg-muted text-muted-foreground',
};

function RuleCoverageTable() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse text-xs">
        <thead>
          <tr className="border-b border-border/40">
            {[
              'Constraint',
              'Hazard',
              'Trigger Condition',
              'Escalation Flags',
              'Actions Blocked',
              'Sev',
            ].map(h => (
              <th
                key={h}
                className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {RULE_COVERAGE.map((row, i) => {
            const isOpen = expanded === row.constraint;
            return (
              <>
                <tr
                  key={row.constraint}
                  onClick={() => toggle(row.constraint)}
                  className={`border-b border-border/20 transition-colors cursor-pointer select-none
                    ${isOpen ? 'bg-muted/30' : i % 2 === 0 ? 'bg-muted/10 hover:bg-muted/30' : 'hover:bg-muted/30'}`}
                >
                  {/* Constraint ID + title + expand chevron */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="flex items-start gap-1.5">
                      <ChevronDown
                        className={`mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-[10px] font-bold text-amber-400">{row.constraint}</span>
                        <span className="text-[9px] text-muted-foreground leading-tight max-w-[140px]">{row.title}</span>
                      </div>
                    </div>
                  </td>

                  {/* Hazard */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className={`font-mono text-[10px] font-semibold ${row.hazardColor}`}>{row.hazard}</span>
                  </td>

                  {/* Trigger */}
                  <td className="px-3 py-2.5 max-w-[220px]">
                    <code className="text-[9px] text-muted-foreground/80 font-mono leading-relaxed break-words">
                      {row.trigger}
                    </code>
                  </td>

                  {/* Escalation flags */}
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {row.flags.length > 0 ? row.flags.map(f => (
                        <span
                          key={f}
                          className="inline-flex items-center rounded border border-primary/20 bg-primary/5 px-1.5 py-0.5 font-mono text-[9px] text-primary"
                        >
                          {f}
                        </span>
                      )) : (
                        <span className="text-[9px] text-muted-foreground/50 italic">—</span>
                      )}
                    </div>
                  </td>

                  {/* Actions blocked */}
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {row.blocked.length > 0 ? row.blocked.map(a => (
                        <span
                          key={a}
                          className="inline-flex items-center rounded border border-destructive/25 bg-destructive/5 px-1.5 py-0.5 font-mono text-[9px] text-destructive"
                        >
                          {a}
                        </span>
                      )) : (
                        <span className="text-[9px] text-muted-foreground/50 italic">—</span>
                      )}
                    </div>
                  </td>

                  {/* Severity */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${SEV_CLS[row.severity]}`}>
                      {row.severity}
                    </span>
                  </td>
                </tr>

                {/* Expandable evidence row */}
                {isOpen && (
                  <tr key={`${row.constraint}-evidence`} className="border-b border-border/20">
                    <td colSpan={6} className="px-0 py-0">
                      <AnimatePresence initial={false}>
                        <motion.div
                          key="evidence"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="mx-3 my-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
                            <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-amber-400/80">
                              Engine evidence — <code className="font-mono normal-case tracking-normal">safetyConstraints[].evidence</code>
                            </p>
                            <ul className="space-y-1">
                              {row.evidence.map((line, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/60" />
                                  <code className="text-[10px] font-mono text-muted-foreground/90 leading-relaxed break-words">
                                    {line}
                                  </code>
                                </li>
                              ))}
                            </ul>
                            <p className="mt-2 text-[9px] text-muted-foreground/50 italic">
                              Dynamic values shown as <code className="font-mono text-[8px]">{'{placeholder}'}</code> are substituted at evaluation time.
                            </p>
                            {row.conditionalNote && (
                              <div className="mt-2 flex items-start gap-1.5 rounded border border-cyan-500/20 bg-cyan-500/5 px-2 py-1.5">
                                <span className="mt-[2px] shrink-0 text-[10px] leading-none text-cyan-400/70">⚑</span>
                                <p className="text-[9px] text-cyan-300/80 leading-relaxed">
                                  {row.conditionalNote}
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>

      {/* Legend + footnote */}
      <div className="mt-4 space-y-3 border-t border-border/20 pt-3">
        {/* Chip legend */}
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60">Legend</p>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center rounded border border-amber-500/25 bg-amber-500/5 px-1.5 py-0.5 font-mono text-[9px] text-amber-400">SC-ID</span>
            <span className="text-[9px] text-muted-foreground/70">Safety constraint — click any row to view engine evidence</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center rounded border border-primary/20 bg-primary/5 px-1.5 py-0.5 font-mono text-[9px] text-primary">flag</span>
            <span className="text-[9px] text-muted-foreground/70">Escalation flag emitted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center rounded border border-destructive/25 bg-destructive/5 px-1.5 py-0.5 font-mono text-[9px] text-destructive">action</span>
            <span className="text-[9px] text-muted-foreground/70">Blocked action</span>
          </div>
        </div>

        {/* Footnote — output schema */}
        <div className="rounded-md border border-border/30 bg-muted/20 px-3 py-2.5 text-[10px] leading-relaxed text-muted-foreground/80 space-y-1">
          <p>
            <span className="font-semibold text-primary/70">Escalation flags</span> are emitted in the{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[9px]">escalationFlags</code> array.{' '}
            <span className="font-semibold text-destructive/70">Blocked actions</span> appear in{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[9px]">blockedActions</code> with remediation steps.{' '}
            <span className="font-semibold text-amber-400/80">Safety constraints</span> appear in{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[9px]">safetyConstraints</code> with{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[9px]">triggered: true</code> and evidence lines.
          </p>
          <p className="text-muted-foreground/60 italic">
            All outputs are advisory — operators review and approve before any action is taken.
          </p>
        </div>

        {/* Footnote — deterministic hash */}
        <div className="rounded-md border border-border/30 bg-muted/20 px-3 py-2.5 text-[10px] leading-relaxed text-muted-foreground/80 space-y-1">
          <p>
            <span className="font-semibold text-muted-foreground">Auditability &amp; reproducibility —</span>{' '}
            each evaluation produces a{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[9px]">deterministicHash</code>{' '}
            in{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[9px]">meta</code>{' '}
            so operators can confirm two evaluations of identical inputs produce identical outputs.
            The hash is computed over the normalised scenario inputs before any rule is applied, ensuring the evaluation is stateless and replay-safe.
          </p>
        </div>

        {/* Footnote — evaluatedAt timestamp */}
        <div className="rounded-md border border-border/30 bg-muted/20 px-3 py-2.5 text-[10px] leading-relaxed text-muted-foreground/80 space-y-1">
          <p>
            <span className="font-semibold text-muted-foreground">Incident timestamps —</span>{' '}
            each evaluation also records a{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[9px]">meta.evaluatedAt</code>{' '}
            ISO timestamp so audit logs can confirm the exact moment a constraint set was calculated — supporting incident post-mortems and regulatory review.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── 5-layer architecture data ─── */
const ARCH_LAYERS = [
  {
    num: 1,
    title: 'Event & Context Ingestion',
    label: 'Structured Input Normalization',
    accent: 'border-sky-500/40 bg-sky-500/[0.04]',
    accentText: 'text-sky-400',
    items: ['OMS event feed', 'Weather overlays', 'Asset metadata', 'Crew availability', 'Critical load registry'],
  },
  {
    num: 2,
    title: 'Operational Rules Engine',
    label: 'Constraint Enforcement Before AI',
    accent: 'border-amber-500/50 bg-amber-500/[0.06]',
    accentText: 'text-amber-400',
    items: ['Maintenance validation', 'Lockout enforcement', 'Critical runway thresholds', 'Crew safety constraints', 'Escalation triggers'],
    highlight: true,
  },
  {
    num: 3,
    title: 'Orchestration Layer',
    label: 'Controlled AI Invocation',
    accent: 'border-primary/40 bg-primary/[0.04]',
    accentText: 'text-primary',
    items: ['Context builder', 'Structured prompt composer', 'Output schema enforcement', 'Trace collector'],
  },
  {
    num: 4,
    title: 'AI Reasoning Layer',
    label: 'Governed Advisory Generation',
    accent: 'border-emerald-500/40 bg-emerald-500/[0.04]',
    accentText: 'text-emerald-400',
    items: ['NVIDIA Nemotron (Primary)', 'Model Router fallback', 'Structured advisory generation'],
  },
  {
    num: 5,
    title: 'Observability & Audit Layer',
    label: 'Accountability & Transparency',
    accent: 'border-purple-400/40 bg-purple-400/[0.04]',
    accentText: 'text-purple-400',
    items: ['Decision trace', 'Policy log', 'Advisory classification', 'Operator approval state'],
  },
];

const DECISION_STEPS = [
  'Event ingested',
  'Deterministic constraints evaluated',
  'Context structured',
  'AI advisory generated',
  'Operator validates',
  'Decision logged',
];

const PHASE1_EXCLUSIONS = [
  'SCADA execution',
  'Automatic switching',
  'Load-flow simulation',
  'Protection coordination',
  'Autonomous dispatch',
];

/* ─── page ─── */
export default function Architecture() {
  return (
    <div data-tour-section="architecture" className="mx-auto w-full max-w-[1400px] p-4 md:p-6 space-y-5">
      {/* ── Header ── */}
      <motion.div {...fadeUp} className="mb-1">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-widest text-primary/80">System Design</p>
            <h1 className="text-xl font-semibold text-foreground">Operational Decision Intelligence Architecture</h1>
            <p className="mt-1 text-sm text-muted-foreground/85 leading-relaxed">
              Layered governance, deterministic constraint enforcement, and AI-assisted reasoning.
            </p>
          </div>
          {/* Status strip */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {[
              { label: 'Phase: 1', sub: 'Advisory Intelligence' },
              { label: 'Execution Authority', sub: 'Human' },
              { label: 'AI Role', sub: 'Structured Reasoning' },
              { label: 'OMS Integration', sub: 'Overlay' },
            ].map((b) => (
              <Badge key={b.label} variant="outline" className="rounded-md border-border/60 bg-muted/30 px-2 py-1 text-[9px] font-semibold text-muted-foreground/90 gap-1">
                <span className="text-foreground/70">{b.label}:</span> {b.sub}
              </Badge>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── 5-Layer Architecture ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.03 }}>
        <Card className="border-border/50 bg-card/70">
          <CardHeader className="px-4 pb-2 pt-4 md:px-5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Layers className="h-4 w-4 text-primary" />
              Layered Architecture
            </CardTitle>
            <p className="mt-0.5 text-[11px] text-muted-foreground/80">
              Five explicit layers separating ingestion, constraint enforcement, orchestration, AI reasoning, and audit.
            </p>
          </CardHeader>
          <CardContent className="px-4 pb-5 md:px-5 space-y-0">
            {ARCH_LAYERS.map((layer, i) => (
              <div key={layer.num} className="flex items-stretch">
                {/* Connector line */}
                <div className="flex flex-col items-center w-8 shrink-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${layer.highlight ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-muted/40 text-muted-foreground border border-border/40'}`}>
                    {layer.num}
                  </div>
                  {i < ARCH_LAYERS.length - 1 && <div className="w-px flex-1 bg-border/30 min-h-[8px]" />}
                </div>
                {/* Layer card */}
                <div className={`flex-1 ml-3 mb-3 rounded-lg border p-4 ${layer.accent} ${layer.highlight ? 'ring-1 ring-amber-500/20' : ''}`}>
                  <div className="flex items-baseline gap-2 mb-1.5">
                    <h3 className={`text-xs font-bold ${layer.accentText}`}>{layer.title}</h3>
                    <span className="text-[9px] font-medium text-muted-foreground/60 italic">{layer.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {layer.items.map((item) => (
                      <span key={item} className="text-[11px] text-foreground/75 flex items-center gap-1.5">
                        <span className={`w-1 h-1 rounded-full shrink-0 ${layer.highlight ? 'bg-amber-400/60' : 'bg-muted-foreground/40'}`} />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Decision Flow Walkthrough ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
        <Card className="border-border/50 bg-card/70">
          <CardHeader className="px-4 pb-2 pt-4 md:px-5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <GitBranch className="h-4 w-4 text-primary" />
              How a Decision Is Produced
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-5 md:px-5">
            <div className="flex flex-wrap items-center gap-1">
              {DECISION_STEPS.map((step, i) => (
                <div key={step} className="flex items-center gap-1">
                  <div className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/20 px-3 py-2">
                    <span className="text-[10px] font-bold text-primary/60">{i + 1}</span>
                    <span className="text-[11px] font-medium text-foreground/80">{step}</span>
                  </div>
                  {i < DECISION_STEPS.length - 1 && (
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Solution Architecture Diagram (existing) ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.07 }}>
        <Card className="border-border/50 bg-card/70">
          <CardHeader className="px-4 pb-2 pt-4 md:px-5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Layers className="h-4 w-4 text-primary" />
              Solution Architecture Overview
            </CardTitle>
            <p className="mt-0.5 text-[11px] text-muted-foreground/70">
              Hover or tab through nodes for details.
            </p>
          </CardHeader>
          <CardContent className="w-full overflow-x-auto px-3 pb-3 md:px-4 md:pb-4">
            <ArchitectureDiagram />
            <DiagramLegend />
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Rule Coverage Matrix (existing) ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
        <Card className="border-border/50 bg-card/70">
          <CardHeader className="px-4 pb-2 pt-4 md:px-5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              Policy Evaluation Engine — Rule Coverage Matrix
            </CardTitle>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Deterministic safety rules applied by the <code className="text-primary/80">copilot-evaluate</code> engine per hazard scenario.
              All outputs are advisory — operators review and approve before any action is taken.
            </p>
          </CardHeader>
          <CardContent className="px-3 pb-4 md:px-4">
            <RuleCoverageTable />
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Phase-1 Boundary ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.12 }}>
        <Card className="border-destructive/20 bg-card/70">
          <CardHeader className="px-4 pb-2 pt-4 md:px-5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Ban className="h-4 w-4 text-destructive/80" />
              Phase-1 Boundary — Exclusions
            </CardTitle>
            <p className="mt-0.5 text-[11px] text-muted-foreground/80">
              This architecture does <strong className="text-foreground/80">NOT</strong> include:
            </p>
          </CardHeader>
          <CardContent className="px-4 pb-5 md:px-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {PHASE1_EXCLUSIONS.map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-md border border-destructive/15 bg-destructive/[0.04] px-3 py-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive/50 shrink-0" />
                  <span className="text-[11px] font-medium text-foreground/75">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── OMS / ADMS Relationship ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.14 }}>
        <Card className="border-border/50 bg-card/70">
          <CardHeader className="px-4 pb-2 pt-4 md:px-5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Layers className="h-4 w-4 text-primary" />
              OMS / ADMS Relationship
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-5 md:px-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border/40 bg-muted/15 p-4">
                <h4 className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wide mb-2">OMS Manages</h4>
                {['Event lifecycle', 'Switching records', 'Restoration tracking'].map((item) => (
                  <div key={item} className="flex items-center gap-2 mb-1.5">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                    <span className="text-[11px] text-foreground/75">{item}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-4">
                <h4 className="text-xs font-bold text-primary/80 uppercase tracking-wide mb-2">Operator Copilot Provides</h4>
                {['Constraint-aware advisory reasoning', 'ETR uncertainty framing', 'Escalation structure', 'Policy-validated decision support'].map((item) => (
                  <div key={item} className="flex items-center gap-2 mb-1.5">
                    <span className="w-1 h-1 rounded-full bg-primary/50" />
                    <span className="text-[11px] text-foreground/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-3 text-center text-[11px] font-semibold text-muted-foreground/60 italic">
              Overlay intelligence, not system replacement.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Utility Stack Positioning (existing) ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.16 }}>
        <Card className="border-border/50 bg-card/70">
          <CardHeader className="px-4 pb-2 pt-4 md:px-5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Layers className="h-4 w-4 text-primary" />
              Utility Stack Positioning
            </CardTitle>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Where Operator Copilot sits relative to existing utility systems.
            </p>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex flex-col items-center gap-0 py-4">
              {[
                { label: 'OMS', sub: 'Outage Management System' },
                { label: 'ADMS', sub: 'Advanced Distribution Management' },
                { label: 'GIS', sub: 'Geographic Information System' },
                { label: 'Asset Registry', sub: 'Equipment & Infrastructure Records' },
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="rounded-md border border-border/30 bg-muted/20 px-6 py-2.5 text-center min-w-[280px]">
                    <p className="text-xs font-semibold text-muted-foreground/60">{s.label}</p>
                    <p className="text-[10px] text-muted-foreground/40">{s.sub}</p>
                  </div>
                  <div className="w-px h-3 bg-border/40" />
                </div>
              ))}
              <div className="w-px h-2 bg-primary/40" />
              <div className="rounded-lg border-2 border-primary/30 bg-primary/[0.06] px-8 py-3 text-center min-w-[280px] shadow-[0_0_12px_hsl(217,91%,60%,0.08)]">
                <p className="text-sm font-bold text-primary">Operator Copilot</p>
                <p className="text-[10px] text-primary/60 font-medium">Decision Intelligence Overlay</p>
              </div>
            </div>
            <div className="mt-3 rounded-md border border-amber-500/15 bg-amber-500/[0.03] px-3 py-2 text-center text-[10px] text-amber-400/70">
              Overlay Layer — Not System Replacement.
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
