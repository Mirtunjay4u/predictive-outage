import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers } from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const CANVAS = { width: 1160, height: 920 };
const STEP_OUT = 14;
const END_PAD = 8;

type Anchor = 'left' | 'right' | 'top' | 'bottom' | 'center';
type EdgeStyle = 'primary' | 'secondary' | 'optional';
type RouteMode = 'horizontal-first' | 'vertical-first';

type NodeId =
  | 'structured_data' | 'sql_db_ingest'
  | 'unstructured_data' | 'text_retriever' | 'milvus_vector_db'
  | 'embedding_nim' | 'reranking_nim'
  | 'authenticated_user' | 'ai_va_ui' | 'agent' | 'sql_retriever_vanna'
  | 'redis_cache' | 'sql_db_checkpoint' | 'sql_db_persistent'
  | 'llm_nim'
  | 'authenticated_admin' | 'admin_console' | 'analytics_microservices';

interface NodeDef {
  id: NodeId;
  x: number; y: number; w: number; h: number;
  label: string;
  sub?: string;
  nim?: boolean;
  optional?: boolean;
  icon?: 'db' | 'doc' | 'user' | 'app' | 'agent' | 'cache' | 'nim' | 'admin' | 'analytics';
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

/* ─── NODES ─── */
const NODES: NodeDef[] = [
  // Band 1 – Ingest row 1
  { id: 'structured_data', x: 45, y: 68, w: 190, h: 76, label: 'STRUCTURED DATA', sub: 'Load, Customer Profiles, Order History', icon: 'db' },
  { id: 'sql_db_ingest', x: 330, y: 68, w: 170, h: 76, label: 'SQL DATABASE', icon: 'db' },
  // Band 1 – Ingest row 2
  { id: 'unstructured_data', x: 45, y: 170, w: 190, h: 76, label: 'UNSTRUCTURED DATA', sub: 'Product Manuals, Catalog, FAQ', icon: 'doc' },
  { id: 'text_retriever', x: 330, y: 170, w: 200, h: 76, label: 'TEXT RETRIEVER', sub: 'Microservice', icon: 'agent' },
  { id: 'milvus_vector_db', x: 620, y: 170, w: 190, h: 76, label: 'MILVUS VECTOR DB', sub: 'cuVS', icon: 'db' },
  // NIMs (right side, stacked)
  { id: 'embedding_nim', x: 920, y: 68, w: 200, h: 60, label: 'RETRIEVER EMBEDDING NIM', nim: true, icon: 'nim' },
  { id: 'reranking_nim', x: 920, y: 186, w: 200, h: 60, label: 'RETRIEVER RERANKING NIM', nim: true, icon: 'nim' },

  // Band 2 – Customer Service Operations row 1
  { id: 'authenticated_user', x: 45, y: 360, w: 180, h: 76, label: 'AUTHENTICATED USER', icon: 'user' },
  { id: 'ai_va_ui', x: 280, y: 360, w: 190, h: 76, label: 'AI VIRTUAL ASSISTANT', sub: 'User Interface', icon: 'app' },
  { id: 'agent', x: 530, y: 360, w: 140, h: 76, label: 'AGENT', icon: 'agent' },
  { id: 'sql_retriever_vanna', x: 730, y: 360, w: 200, h: 76, label: 'SQL DATABASE RETRIEVER', sub: 'Vanna.AI Microservice', icon: 'db' },

  // Band 2 – Row 2 (support)
  { id: 'redis_cache', x: 270, y: 510, w: 170, h: 68, label: 'REDIS CACHE', sub: 'Active Conversation, Feedback', icon: 'cache' },
  { id: 'sql_db_checkpoint', x: 490, y: 510, w: 170, h: 68, label: 'SQL DATABASE', sub: 'Checkpointer Memory', icon: 'db' },
  { id: 'sql_db_persistent', x: 710, y: 510, w: 180, h: 68, label: 'SQL DATABASE', sub: 'Persistent (Historical) Conversation', icon: 'db' },

  // LLM NIM (far right, vertically centered between rows)
  { id: 'llm_nim', x: 970, y: 420, w: 150, h: 80, label: 'LLM NIM', nim: true, icon: 'nim' },

  // Band 3 – Admin
  { id: 'authenticated_admin', x: 45, y: 700, w: 200, h: 80, label: 'AUTHENTICATED ADMIN', sub: 'Sentiment, Summary, Chat History, Feedback', icon: 'admin' },
  { id: 'admin_console', x: 340, y: 700, w: 180, h: 80, label: 'ADMIN CONSOLE', icon: 'app' },
  { id: 'analytics_microservices', x: 620, y: 700, w: 240, h: 80, label: 'ANALYTICS MICROSERVICES', sub: 'Summary Generation', icon: 'analytics' },
];

/* ─── EDGES ─── */
const EDGES: EdgeDef[] = [
  // Ingest
  { from: { nodeId: 'structured_data', anchor: 'right' }, to: { nodeId: 'sql_db_ingest', anchor: 'left' }, style: 'primary', mode: 'horizontal-first' },
  { from: { nodeId: 'unstructured_data', anchor: 'right' }, to: { nodeId: 'text_retriever', anchor: 'left' }, style: 'primary', mode: 'horizontal-first' },
  { from: { nodeId: 'text_retriever', anchor: 'right' }, to: { nodeId: 'milvus_vector_db', anchor: 'left' }, style: 'primary', mode: 'horizontal-first' },
  { from: { nodeId: 'sql_db_ingest', anchor: 'right' }, to: { nodeId: 'embedding_nim', anchor: 'left' }, style: 'optional', mode: 'horizontal-first' },
  { from: { nodeId: 'milvus_vector_db', anchor: 'right' }, to: { nodeId: 'reranking_nim', anchor: 'left' }, style: 'optional', mode: 'horizontal-first' },

  // Band 2 top
  { from: { nodeId: 'authenticated_user', anchor: 'right' }, to: { nodeId: 'ai_va_ui', anchor: 'left' }, style: 'primary', mode: 'horizontal-first' },
  { from: { nodeId: 'ai_va_ui', anchor: 'right' }, to: { nodeId: 'agent', anchor: 'left' }, style: 'primary', mode: 'horizontal-first' },
  { from: { nodeId: 'agent', anchor: 'right' }, to: { nodeId: 'sql_retriever_vanna', anchor: 'left' }, style: 'primary', mode: 'horizontal-first' },

  // Vertical to support
  { from: { nodeId: 'ai_va_ui', anchor: 'bottom' }, to: { nodeId: 'redis_cache', anchor: 'top' }, style: 'secondary', mode: 'vertical-first' },
  { from: { nodeId: 'agent', anchor: 'bottom' }, to: { nodeId: 'sql_db_checkpoint', anchor: 'top' }, style: 'secondary', mode: 'vertical-first' },
  { from: { nodeId: 'sql_retriever_vanna', anchor: 'bottom' }, to: { nodeId: 'sql_db_persistent', anchor: 'top' }, style: 'secondary', mode: 'vertical-first' },

  // LLM NIM
  { from: { nodeId: 'sql_retriever_vanna', anchor: 'right' }, to: { nodeId: 'llm_nim', anchor: 'left' }, style: 'primary', mode: 'horizontal-first' },

  // Admin
  { from: { nodeId: 'authenticated_admin', anchor: 'right' }, to: { nodeId: 'admin_console', anchor: 'left' }, style: 'primary', mode: 'horizontal-first' },
  { from: { nodeId: 'admin_console', anchor: 'right' }, to: { nodeId: 'analytics_microservices', anchor: 'left' }, style: 'primary', mode: 'horizontal-first' },
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

/* ─── icon SVGs ─── */
function NodeIcon({ icon }: { icon?: string }) {
  const cls = 'w-4 h-4 mb-0.5';
  if (icon === 'db') return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" /><path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" /></svg>);
  if (icon === 'doc') return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /></svg>);
  if (icon === 'user' || icon === 'admin') return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>);
  if (icon === 'app') return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><circle cx="7" cy="6" r="0.8" fill="currentColor" /><circle cx="10" cy="6" r="0.8" fill="currentColor" /></svg>);
  if (icon === 'agent') return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 9h6M9 12h4M9 15h5" /></svg>);
  if (icon === 'cache') return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h4v4H6z" /><path d="M14 10h4" /><path d="M14 14h4" /></svg>);
  if (icon === 'nim') return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" /><polygon points="12,6 18,9.5 18,14.5 12,18 6,14.5 6,9.5" /></svg>);
  if (icon === 'analytics') return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 17V13M12 17V7M17 17V11" /></svg>);
  return null;
}

/* ─── node card ─── */
function NodeCard({ node, setNodeRef }: { node: NodeDef; setNodeRef: (id: NodeId) => (el: HTMLDivElement | null) => void }) {
  const borderColor = node.nim ? 'border-emerald-400/70' : 'border-cyan-300/35';
  const textColor = node.nim ? 'text-emerald-100' : 'text-slate-100';
  const iconColor = node.nim ? 'text-emerald-300' : 'text-cyan-300/80';
  return (
    <div
      ref={setNodeRef(node.id)}
      data-node={node.id}
      className={`absolute rounded-lg border bg-slate-900/90 px-2 py-1.5 text-center shadow-[0_0_12px_rgba(15,23,42,0.5)] ${borderColor} ${node.optional ? 'border-dashed' : ''} transition-all hover:shadow-[0_0_20px_rgba(56,189,248,0.15)] hover:border-cyan-300/60`}
      style={{ left: node.x, top: node.y, width: node.w, height: node.h }}
    >
      <div className="flex h-full w-full flex-col items-center justify-center">
        <span className={iconColor}><NodeIcon icon={node.icon} /></span>
        <p className={`text-[9px] font-semibold tracking-[0.06em] leading-tight ${textColor}`}>{node.label}</p>
        {node.sub && <p className="mt-0.5 text-[7.5px] font-medium tracking-[0.03em] text-slate-400/90 leading-tight">{node.sub}</p>}
      </div>
    </div>
  );
}

/* ─── main diagram ─── */
function ArchitectureDiagram() {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef(new Map<NodeId, HTMLDivElement>());
  const rafRef = useRef<number | null>(null);
  const [edgePaths, setEdgePaths] = useState<Array<{ d: string; style: EdgeStyle }>>([]);

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
      return [{ d: pathFromPoints(points), style: edge.style }];
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
    <div className="relative w-[1160px] max-w-full mx-auto overflow-x-auto">
      <div ref={canvasRef} className="relative" style={{ width: CANVAS.width, height: CANVAS.height }}>
        <div className="absolute inset-0 rounded-2xl border border-slate-700/70 bg-slate-950 shadow-[0_0_60px_rgba(15,23,42,0.8)]" />

        {/* Band 1 – Ingest */}
        <div className="absolute left-[20px] top-[28px] w-[1120px] h-[248px] rounded-[18px] border border-emerald-500/30 bg-gradient-to-r from-slate-900/95 to-emerald-950/25" />
        <p className="absolute left-[34px] top-[38px] text-[10px] font-semibold tracking-[0.16em] text-emerald-200/95">INGEST</p>

        {/* Band 2 – Customer Service Operations */}
        <div className="absolute left-[20px] top-[300px] w-[1120px] h-[310px] rounded-[18px] border border-emerald-500/30 bg-gradient-to-r from-slate-900/95 to-emerald-950/25" />
        <p className="absolute left-[34px] top-[310px] text-[10px] font-semibold tracking-[0.16em] text-emerald-200/95">CUSTOMER SERVICE OPERATIONS</p>

        {/* Band 3 – Admin */}
        <div className="absolute left-[20px] top-[640px] w-[1120px] h-[160px] rounded-[18px] border border-emerald-500/30 bg-gradient-to-r from-slate-900/95 to-emerald-950/25" />
        <p className="absolute left-[34px] top-[656px] text-[10px] font-semibold tracking-[0.16em] text-emerald-200/95">ADMIN</p>

        {NODES.map((node) => (
          <NodeCard key={node.id} node={node} setNodeRef={setNodeRef} />
        ))}

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
            const particleR = dim ? 2.5 : 3;
            const dur = dim ? '4s' : '3s';
            const fill = dim ? 'rgba(160,220,205,0.4)' : 'rgba(160,220,205,0.7)';
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
                {/* Data flow particle */}
                <circle r={particleR} fill={fill} opacity={0.8}>
                  <animateMotion dur={dur} repeatCount="indefinite" begin={`${i * 0.4}s`}>
                    <mpath xlinkHref={`#flow-path-${i}`} />
                  </animateMotion>
                </circle>
                <circle r={particleR * 2.5} fill="url(#particleGlow)" opacity={0.25}>
                  <animateMotion dur={dur} repeatCount="indefinite" begin={`${i * 0.4}s`}>
                    <mpath xlinkHref={`#flow-path-${i}`} />
                  </animateMotion>
                </circle>
                {/* Hidden path for animateMotion reference */}
                <path id={`flow-path-${i}`} d={p.d} fill="none" stroke="none" />
              </g>
            );
          })}
        </svg>
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
              Architecture Diagram
            </CardTitle>
          </CardHeader>
          <CardContent className="w-full px-3 pb-3 md:px-4 md:pb-4">
            <ArchitectureDiagram />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
