import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers } from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const SHOW_DEBUG_ANCHORS = false;
const CANVAS = { width: 1120, height: 720 };
const STEP_OUT = 14;
const END_PAD = 8;

type Anchor = 'left' | 'right' | 'top' | 'bottom' | 'center';
type EdgeStyle = 'primary' | 'secondary' | 'optional';
type RouteMode = 'horizontal-first' | 'vertical-first';

type NodeId =
  | 'structured_data'
  | 'sql_postgres'
  | 'unstructured_data'
  | 'text_retriever'
  | 'vector_db'
  | 'embedding_nim'
  | 'reranking_nim'
  | 'authenticated_operator'
  | 'copilot_ui'
  | 'orchestrator'
  | 'guardrails'
  | 'nemotron_nim'
  | 'lovable_ai'
  | 'sql_tools_store'
  | 'retriever_lane'
  | 'audit_logs'
  | 'prompt_versioning'
  | 'telemetry'
  | 'rbac_rls';

interface NodeDef {
  id: NodeId;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub?: string;
  nim?: boolean;
  optional?: boolean;
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

type Pt = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };

const NODES: NodeDef[] = [
  { id: 'structured_data', x: 40, y: 82, w: 290, h: 84, label: 'STRUCTURED DATA', sub: 'OMS/SCADA events · asset registry · crew · customer' },
  { id: 'sql_postgres', x: 346, y: 82, w: 290, h: 84, label: 'SQL/POSTGRES' },
  { id: 'unstructured_data', x: 656, y: 82, w: 130, h: 84, label: 'UNSTRUCTURED DATA' },
  { id: 'text_retriever', x: 800, y: 82, w: 130, h: 84, label: 'TEXT RETRIEVER' },
  { id: 'vector_db', x: 944, y: 82, w: 80, h: 84, label: 'VECTOR DB' },
  { id: 'embedding_nim', x: 1036, y: 38, w: 72, h: 40, label: 'EMBEDDING NIM', nim: true, optional: true },
  { id: 'reranking_nim', x: 1036, y: 170, w: 72, h: 40, label: 'RERANKING NIM', nim: true, optional: true },

  { id: 'authenticated_operator', x: 198, y: 278, w: 250, h: 72, label: 'AUTHENTICATED OPERATOR' },
  { id: 'copilot_ui', x: 468, y: 278, w: 250, h: 72, label: 'COPILOT UI' },

  { id: 'orchestrator', x: 60, y: 414, w: 230, h: 78, label: 'COPILOT ORCHESTRATOR / EDGE FUNCTIONS' },
  { id: 'guardrails', x: 315, y: 414, w: 220, h: 78, label: 'GUARDRAILS / POLICY BOUNDARY' },
  { id: 'nemotron_nim', x: 570, y: 414, w: 220, h: 78, label: 'NEMOTRON LLM NIM', sub: 'NVIDIA NIM', nim: true },
  { id: 'lovable_ai', x: 808, y: 414, w: 280, h: 164, label: 'LOVABLE AI', sub: 'Thin routing indicates a secondary hybrid path.' },

  { id: 'sql_tools_store', x: 60, y: 514, w: 300, h: 64, label: 'SQL TOOLS / SCENARIO STORE' },
  { id: 'retriever_lane', x: 380, y: 514, w: 410, h: 64, label: 'RETRIEVER LANE (VECTOR DB)' },

  { id: 'audit_logs', x: 65, y: 642, w: 220, h: 46, label: 'AUDIT LOGS' },
  { id: 'prompt_versioning', x: 300, y: 642, w: 250, h: 46, label: 'PROMPT & MODEL VERSIONING' },
  { id: 'telemetry', x: 560, y: 642, w: 240, h: 46, label: 'TELEMETRY / MONITORING' },
  { id: 'rbac_rls', x: 830, y: 642, w: 260, h: 46, label: 'RBAC + RLS' },
];

const EDGES: EdgeDef[] = [
  { from: { nodeId: 'structured_data', anchor: 'right' }, to: { nodeId: 'sql_postgres', anchor: 'left' }, style: 'primary', mode: 'horizontal-first' },
  { from: { nodeId: 'unstructured_data', anchor: 'right' }, to: { nodeId: 'text_retriever', anchor: 'left' }, style: 'primary', mode: 'horizontal-first' },
  { from: { nodeId: 'text_retriever', anchor: 'right' }, to: { nodeId: 'vector_db', anchor: 'left' }, style: 'primary', mode: 'horizontal-first' },
  { from: { nodeId: 'vector_db', anchor: 'right' }, to: { nodeId: 'embedding_nim', anchor: 'left' }, style: 'optional', label: 'optional', mode: 'horizontal-first' },
  { from: { nodeId: 'vector_db', anchor: 'right' }, to: { nodeId: 'reranking_nim', anchor: 'left' }, style: 'optional', label: 'optional', mode: 'horizontal-first' },

  { from: { nodeId: 'authenticated_operator', anchor: 'right' }, to: { nodeId: 'copilot_ui', anchor: 'left' }, style: 'primary', mode: 'horizontal-first' },

  { from: { nodeId: 'orchestrator', anchor: 'right' }, to: { nodeId: 'guardrails', anchor: 'left' }, style: 'primary', mode: 'horizontal-first' },
  { from: { nodeId: 'guardrails', anchor: 'right' }, to: { nodeId: 'nemotron_nim', anchor: 'left' }, style: 'primary', mode: 'horizontal-first' },
  { from: { nodeId: 'nemotron_nim', anchor: 'top' }, to: { nodeId: 'copilot_ui', anchor: 'bottom' }, style: 'primary', label: 'Structured Insights (JSON)', mode: 'vertical-first', laneY: 402 },

  { from: { nodeId: 'sql_tools_store', anchor: 'right' }, to: { nodeId: 'orchestrator', anchor: 'bottom' }, style: 'secondary', mode: 'horizontal-first', laneX: 300 },
  { from: { nodeId: 'retriever_lane', anchor: 'right' }, to: { nodeId: 'orchestrator', anchor: 'bottom' }, style: 'secondary', mode: 'horizontal-first', laneX: 730 },
  { from: { nodeId: 'guardrails', anchor: 'bottom' }, to: { nodeId: 'retriever_lane', anchor: 'top' }, style: 'secondary', mode: 'vertical-first', laneY: 500 },
  { from: { nodeId: 'copilot_ui', anchor: 'right' }, to: { nodeId: 'lovable_ai', anchor: 'left' }, style: 'secondary', mode: 'horizontal-first' },

  { from: { nodeId: 'orchestrator', anchor: 'bottom' }, to: { nodeId: 'audit_logs', anchor: 'top' }, style: 'secondary', mode: 'vertical-first', laneY: 626 },
  { from: { nodeId: 'guardrails', anchor: 'bottom' }, to: { nodeId: 'prompt_versioning', anchor: 'top' }, style: 'secondary', mode: 'vertical-first', laneY: 626 },
  { from: { nodeId: 'nemotron_nim', anchor: 'bottom' }, to: { nodeId: 'telemetry', anchor: 'top' }, style: 'secondary', mode: 'vertical-first', laneY: 626 },
  { from: { nodeId: 'lovable_ai', anchor: 'bottom' }, to: { nodeId: 'rbac_rls', anchor: 'top' }, style: 'secondary', mode: 'vertical-first', laneY: 626 },
];

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
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const cur = points[i];
    if (prev.x === cur.x) d += ` V ${cur.y}`;
    else d += ` H ${cur.x}`;
  }
  return d;
}

function labelPoint(points: Pt): Pt {
  return { x: points.x + 4, y: points.y - 6 };
}

function NodeCard({ node, setNodeRef }: { node: NodeDef; setNodeRef: (id: NodeId) => (el: HTMLDivElement | null) => void }) {
  return (
    <div
      ref={setNodeRef(node.id)}
      data-node={node.id}
      className={`absolute rounded-xl border bg-slate-900/90 px-2 text-center shadow-[0_0_12px_rgba(15,23,42,0.5)] ${node.nim ? 'border-emerald-400/70' : 'border-cyan-300/35'} ${node.optional ? 'border-dashed' : ''}`}
      style={{ left: node.x, top: node.y, width: node.w, height: node.h }}
    >
      <div className="flex h-full w-full flex-col items-center justify-center">
        <p className={`text-[11px] font-semibold tracking-[0.07em] ${node.nim ? 'text-emerald-100' : 'text-slate-100'}`}>{node.label}</p>
        {node.sub && <p className="mt-1 text-[9px] font-semibold tracking-[0.04em] text-slate-300/95">{node.sub}</p>}
      </div>
    </div>
  );
}

function NvidiaStyleArchitectureDiagram() {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef(new Map<NodeId, HTMLDivElement>());
  const rafRef = useRef<number | null>(null);
  const [edgePaths, setEdgePaths] = useState<Array<{ d: string; style: EdgeStyle; label?: string; lx?: number; ly?: number }>>([]);
  const [debugPts, setDebugPts] = useState<Pt[]>([]);

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

    const debug = SHOW_DEBUG_ANCHORS
      ? EDGES.flatMap((edge) => {
          const fromRect = rects.get(edge.from.nodeId);
          const toRect = rects.get(edge.to.nodeId);
          if (!fromRect || !toRect) return [];
          return [getAnchorPoint(fromRect, edge.from.anchor), getAnchorPoint(toRect, edge.to.anchor)];
        })
      : [];

    setEdgePaths(nextPaths);
    setDebugPts(debug);
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

    const onResize = () => schedule();
    window.addEventListener('resize', onResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [schedule]);

  const stroke = (style: EdgeStyle) => (style === 'primary' ? 'rgba(160,220,205,0.85)' : 'rgba(160,220,205,0.55)');

  return (
    <div className="relative w-[1120px] max-w-full mx-auto overflow-x-auto">
      <div ref={canvasRef} className="relative w-[1120px] h-[720px]">
        <div className="absolute inset-0 rounded-2xl border border-slate-700/70 bg-slate-950 shadow-[0_0_60px_rgba(15,23,42,0.8)]" />
        <div className="absolute left-[20px] top-[28px] h-[196px] w-[1080px] rounded-[18px] border border-emerald-500/30 bg-gradient-to-r from-slate-900/95 to-emerald-950/25" />
        <div className="absolute left-[20px] top-[238px] h-[368px] w-[1080px] rounded-[18px] border border-emerald-500/30 bg-gradient-to-r from-slate-900/95 to-emerald-950/25" />
        <div className="absolute left-[20px] top-[616px] h-[92px] w-[1080px] rounded-[18px] border border-emerald-500/30 bg-gradient-to-r from-slate-900/95 to-emerald-950/25" />

        <p className="absolute left-[34px] top-[40px] text-[10px] font-semibold tracking-[0.16em] text-emerald-200/95">BAND 1 - INGEST</p>
        <p className="absolute left-[34px] top-[250px] text-[10px] font-semibold tracking-[0.16em] text-emerald-200/95">BAND 2 - OPERATOR COPILOT RUNTIME</p>
        <p className="absolute left-[34px] top-[628px] text-[10px] font-semibold tracking-[0.16em] text-emerald-200/95">BAND 3 - MEMORY / OBSERVABILITY / GOVERNANCE</p>

        <div className="absolute left-[54px] top-[395px] h-px w-[1014px] border-t border-dashed border-slate-400/70" />
        <p className="absolute left-1/2 top-[380px] -translate-x-1/2 text-[9px] font-semibold tracking-[0.06em] text-slate-300/90">
          TRUST BOUNDARY (CLIENT UI VS BACKEND/AI SERVICES)
        </p>

        {NODES.map((node) => (
          <NodeCard key={node.id} node={node} setNodeRef={setNodeRef} />
        ))}

        <svg className="absolute inset-0 pointer-events-none" width="1120" height="720" viewBox="0 0 1120 720" aria-hidden>
          <defs>
            <marker id="arrowHeadPrimary" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L9,4.5 L0,9 Z" fill="rgba(160,220,205,0.88)" />
            </marker>
            <marker id="arrowHeadSecondary" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L9,4.5 L0,9 Z" fill="rgba(160,220,205,0.58)" />
            </marker>
          </defs>
          {edgePaths.map((p, i) => {
            const dim = p.style !== 'primary';
            return (
              <g key={i}>
                <path
                  d={p.d}
                  fill="none"
                  stroke={stroke(p.style)}
                  strokeWidth={2}
                  strokeDasharray={p.style === 'optional' || p.style === 'secondary' ? '6 6' : undefined}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  markerEnd={`url(#${dim ? 'arrowHeadSecondary' : 'arrowHeadPrimary'})`}
                />
                {p.label && (
                  <text x={p.lx} y={p.ly} fill="rgba(160,220,205,0.95)" fontSize="8.5" fontWeight={700} letterSpacing="0.06em">
                    {p.label}
                  </text>
                )}
              </g>
            );
          })}
          {SHOW_DEBUG_ANCHORS &&
            debugPts.map((pt, i) => <circle key={`dbg-${i}`} cx={pt.x} cy={pt.y} r={3} fill="rgba(244,114,182,0.9)" />)}
        </svg>
      </div>
    </div>
  );
}

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
            <NvidiaStyleArchitectureDiagram />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
