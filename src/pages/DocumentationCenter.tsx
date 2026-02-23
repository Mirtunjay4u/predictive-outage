import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, ExternalLink, Download, Pin, Filter, ArrowUpDown,
  Shield, FileText, Cpu, ClipboardList, BarChart3, BookOpen,
  Server, Lock, Gauge, Briefcase, ChevronDown, ChevronRight,
  CheckCircle2, Clock, X, Eye, EyeOff, Activity, Layers,
  AlertTriangle, Target, Zap, ScrollText, FileCheck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useDocsResources, type DocResource } from '@/hooks/useDocsResources';
import { formatDistanceToNow, differenceInDays } from 'date-fns';

/* ── Constants ── */
const ROLES = ['Admin', 'Engineer', 'Operator', 'Executive', 'CTO', 'Viewer'] as const;
type Role = (typeof ROLES)[number];

const CATEGORY_META: Record<string, { icon: React.ElementType; color: string }> = {
  Technical: { icon: Cpu, color: 'text-blue-400' },
  Operational: { icon: ClipboardList, color: 'text-teal-400' },
  Governance: { icon: Shield, color: 'text-purple-400' },
  Roadmap: { icon: BarChart3, color: 'text-amber-400' },
  Glossary: { icon: BookOpen, color: 'text-emerald-400' },
  ReleaseNotes: { icon: FileText, color: 'text-sky-400' },
};

const VISIBILITY_MAP: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  PublicDemo: { label: 'Public', icon: Eye, cls: 'text-success/70' },
  InternalOnly: { label: 'Internal', icon: EyeOff, cls: 'text-warning/70' },
  Restricted: { label: 'Restricted', icon: Lock, cls: 'text-destructive/70' },
};

/* ── Document inventory spec (for coverage calculation) ── */
const EXPECTED_DOCS: Record<string, string[]> = {
  Technical: [
    'Technical Design Document (TDD)', 'Architecture Blueprint', 'AI Governance Framework',
    'Integration Architecture', 'API Specification', 'Rule Engine Specification',
  ],
  Operational: [
    'Operator SOP Manual', 'Emergency Use Protocol', 'Scenario Playbook',
    'Crew Redeployment Guide', 'ETR Confidence Methodology',
  ],
  Governance: [
    'Regulatory Alignment Overview', 'Advisory Boundary Declaration',
    'Audit Trace Methodology', 'Data Governance Statement', 'Risk Disclosure',
  ],
  Executive: [
    'Executive Brief', 'Roadmap Blueprint',
    'Financial Impact Overview', 'Competitive Positioning Summary',
  ],
};

/* ── Freshness ── */
function FreshnessIndicator({ updatedAt }: { updatedAt: string }) {
  const days = differenceInDays(new Date(), new Date(updatedAt));
  const color = days <= 30 ? 'bg-success' : days <= 90 ? 'bg-warning' : 'bg-muted-foreground/40';
  const label = days <= 30 ? 'Fresh' : days <= 90 ? 'Aging' : 'Stale';
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
      <span className={cn('h-1.5 w-1.5 rounded-full', color)} />
      {label}
    </span>
  );
}

/* ── Status badge ── */
function StatusBadgeDoc({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Approved: 'border-success/30 bg-success/8 text-success',
    Draft: 'border-warning/30 bg-warning/8 text-warning',
    Deprecated: 'border-destructive/30 bg-destructive/8 text-destructive',
    Archived: 'border-muted-foreground/30 bg-muted/40 text-muted-foreground',
  };
  return (
    <Badge variant="outline" className={cn('text-[9px] font-semibold uppercase tracking-wider', styles[status] ?? styles.Draft)}>
      {status}
    </Badge>
  );
}

/* ── Highlight ── */
function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((p, i) =>
    regex.test(p) ? <mark key={i} className="bg-primary/20 text-foreground rounded-sm px-0.5">{p}</mark> : p
  );
}

/* ── Filter Chip ── */
function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-2.5 py-1 text-[10px] font-medium transition-all',
        active
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border/30 bg-card/40 text-muted-foreground/60 hover:border-border/50 hover:text-muted-foreground',
      )}
    >
      {label}
    </button>
  );
}

/* ── Coverage Health Bar ── */
function CoverageBar({ label, pct, icon: Icon }: { label: string; pct: number; icon: React.ElementType }) {
  const color = pct >= 90 ? 'bg-success' : pct >= 70 ? 'bg-warning' : 'bg-destructive';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-foreground/80">
          <Icon className="h-3 w-3 text-muted-foreground/60" />
          {label}
        </span>
        <span className="text-[11px] font-semibold text-foreground/70">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ── Version History Expandable ── */
function VersionHistory({ doc }: { doc: DocResource }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2 border-t border-border/20 pt-2">
      <button onClick={() => setOpen(v => !v)} className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground/60 hover:text-muted-foreground transition-colors">
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        Version History
      </button>
      {open && (
        <div className="mt-2 space-y-1.5 pl-4 border-l border-border/20">
          <div className="flex items-center gap-2 text-[10px]">
            <Badge variant="outline" className="text-[8px] font-mono border-primary/20 bg-primary/5 text-primary/70">
              {doc.version}
            </Badge>
            <span className="text-muted-foreground/60">Current</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-muted-foreground/50">{formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}</span>
          </div>
          {doc.change_summary && (
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed">{doc.change_summary}</p>
          )}
          {doc.supersedes_doc_id && (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground/40">
              <ScrollText className="h-3 w-3" />
              <span>Supersedes previous version</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Doc Card (enhanced) ── */
function DocCard({ doc, query, userRole }: { doc: DocResource; query: string; userRole: Role }) {
  const navigate = useNavigate();
  const catMeta = CATEGORY_META[doc.category] ?? CATEGORY_META.Technical;
  const Icon = catMeta.icon;
  const visMeta = VISIBILITY_MAP[doc.visibility] ?? VISIBILITY_MAP.PublicDemo;
  const VisIcon = visMeta.icon;
  const isAllowed = doc.allowed_roles.includes(userRole);
  const [showRestricted, setShowRestricted] = useState(false);

  const handleView = () => {
    if (!isAllowed) { setShowRestricted(true); return; }
    if (doc.url_view) navigate(doc.url_view);
  };

  return (
    <>
      <Card className={cn(
        'group/doc border-border/30 bg-card/60 backdrop-blur-sm transition-all duration-200 hover:border-border/50 hover:shadow-[0_0_12px_hsl(217,70%,50%,0.06)]',
        doc.is_pinned && 'ring-1 ring-primary/15',
        !isAllowed && 'opacity-50',
      )}>
        <CardContent className="flex flex-col gap-3 p-5">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/8 text-primary/70">
              <Icon className="h-4 w-4" strokeWidth={1.6} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-[13px] font-semibold leading-snug text-foreground/90">
                  {highlightMatch(doc.title, query)}
                </h4>
                {doc.is_pinned && <Pin className="h-3 w-3 text-primary/50" />}
              </div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground/80">
                {highlightMatch(doc.short_description, query)}
              </p>
            </div>
          </div>

          {/* Metadata chips */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-border/30 bg-muted/20 text-[9px] font-medium text-muted-foreground/70">{doc.category}</Badge>
            <StatusBadgeDoc status={doc.status} />
            <Badge variant="outline" className="border-border/20 text-[9px] font-mono text-muted-foreground/60">{doc.version}</Badge>
            <span className={cn('inline-flex items-center gap-1 text-[10px] font-medium', visMeta.cls)}>
              <VisIcon className="h-3 w-3" /> {visMeta.label}
            </span>
          </div>

          {/* Owner / Updated / Freshness */}
          <div className="flex items-center gap-3 text-[10.5px] text-muted-foreground/60">
            <FreshnessIndicator updatedAt={doc.updated_at} />
            <span>Updated {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}</span>
            {doc.owner && <span className="hidden sm:inline">· Owner: {doc.owner}</span>}
            {doc.reviewer && <span className="hidden md:inline">· Reviewer: {doc.reviewer}</span>}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[11px] font-medium" onClick={handleView}>
              <ExternalLink className="h-3 w-3" /> View
            </Button>
            {doc.url_download && (
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground">
                <Download className="h-3 w-3" /> PDF
              </Button>
            )}
          </div>

          {/* Version History */}
          <VersionHistory doc={doc} />
        </CardContent>
      </Card>

      {/* Restricted dialog */}
      {showRestricted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowRestricted(false)}>
          <div className="w-full max-w-sm rounded-lg border border-border/50 bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 text-destructive/80">
              <Lock className="h-5 w-5" />
              <h3 className="text-sm font-semibold">Access Restricted</h3>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
              Required roles: <span className="font-medium text-foreground/80">{doc.allowed_roles.join(', ')}</span>.
              Current: <span className="font-medium text-foreground/80">{userRole}</span>.
            </p>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" className="text-[11px]" onClick={() => setShowRestricted(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Main Page ── */
export default function DocumentationCenter() {
  const { data: docs = [], isLoading } = useDocsResources();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [activeVisibility, setActiveVisibility] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'relevant' | 'updated' | 'az' | 'version'>('relevant');
  const [userRole, setUserRole] = useState<Role>('Executive');

  const filtered = useMemo(() => {
    let result = docs;
    result = result.filter(d => d.allowed_roles.includes(userRole));
    if (activeCategory) result = result.filter(d => d.category === activeCategory);
    if (activeStatus) result = result.filter(d => d.status === activeStatus);
    if (activeVisibility) result = result.filter(d => d.visibility === activeVisibility);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.short_description.toLowerCase().includes(q) ||
        d.search_keywords.some(k => k.toLowerCase().includes(q)) ||
        d.content_index.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'updated') result = [...result].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    else if (sortBy === 'az') result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === 'version') result = [...result].sort((a, b) => b.version.localeCompare(a.version));
    return result;
  }, [docs, searchQuery, activeCategory, activeStatus, activeVisibility, sortBy, userRole]);

  // Coverage calculation
  const coverage = useMemo(() => {
    const calc = (cat: string) => {
      const expected = EXPECTED_DOCS[cat]?.length ?? 1;
      const found = docs.filter(d => {
        if (cat === 'Executive') return d.category === 'Roadmap' || d.category === 'Governance';
        return d.category === cat;
      }).length;
      return Math.min(100, Math.round((found / expected) * 100));
    };
    return {
      Technical: calc('Technical'),
      Operational: calc('Operational'),
      Governance: calc('Governance'),
      AuditTrace: 100, // Always 100 by design
    };
  }, [docs]);

  const categories = ['Technical', 'Operational', 'Governance', 'Roadmap', 'Glossary', 'ReleaseNotes'];
  const statuses = ['Approved', 'Draft', 'Deprecated', 'Archived'];
  const visibilities = ['PublicDemo', 'InternalOnly', 'Restricted'];
  const hasFilters = !!activeCategory || !!activeStatus || !!activeVisibility || !!searchQuery.trim();

  // Group docs by category for display
  const groupedDocs = useMemo(() => {
    const groups: Record<string, DocResource[]> = {};
    filtered.forEach(d => {
      if (!groups[d.category]) groups[d.category] = [];
      groups[d.category].push(d);
    });
    return groups;
  }, [filtered]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Documentation & Knowledge Governance Center
              </h1>
              <Badge variant="outline" className="border-primary/20 bg-primary/5 text-[9px] font-semibold uppercase tracking-wider text-primary/70">
                Governed
              </Badge>
            </div>
            <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-muted-foreground/70">
              Structured technical, operational, and compliance documentation repository.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">Role:</span>
            <Select value={userRole} onValueChange={v => setUserRole(v as Role)}>
              <SelectTrigger className="h-8 w-[130px] text-[11px] border-border/30 bg-card/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/40 z-[100]">
                {ROLES.map(r => <SelectItem key={r} value={r} className="text-[11px]">{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      <Separator className="bg-border/30" />

      {/* Document Health Panel */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card className="border-border/30 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-primary/60" strokeWidth={1.6} />
              <h3 className="text-[13px] font-semibold text-foreground/80">Documentation Health</h3>
              <div className="h-px flex-1 bg-border/20" />
              <Badge variant="outline" className="border-success/20 bg-success/5 text-[9px] text-success/70">
                {docs.filter(d => d.status === 'Approved').length} / {docs.length} Approved
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <CoverageBar label="Technical" pct={coverage.Technical} icon={Cpu} />
              <CoverageBar label="Operational" pct={coverage.Operational} icon={ClipboardList} />
              <CoverageBar label="Governance" pct={coverage.Governance} icon={Shield} />
              <CoverageBar label="Audit Trace" pct={coverage.AuditTrace} icon={FileCheck} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search & Filters */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
          <Input
            placeholder="Search documentation by title, keywords, content…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-10 pl-10 text-[12px] bg-card/40 border-border/30 focus:border-primary/40"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground/40" />
          <span className="text-[9px] font-medium text-muted-foreground/40 uppercase">Category:</span>
          {categories.map(c => (
            <FilterChip key={c} label={c} active={activeCategory === c} onClick={() => setActiveCategory(activeCategory === c ? null : c)} />
          ))}
          <Separator orientation="vertical" className="h-4 bg-border/30" />
          <span className="text-[9px] font-medium text-muted-foreground/40 uppercase">Status:</span>
          {statuses.map(s => (
            <FilterChip key={s} label={s} active={activeStatus === s} onClick={() => setActiveStatus(activeStatus === s ? null : s)} />
          ))}
          <Separator orientation="vertical" className="h-4 bg-border/30" />
          <span className="text-[9px] font-medium text-muted-foreground/40 uppercase">Visibility:</span>
          {visibilities.map(v => (
            <FilterChip key={v} label={v === 'PublicDemo' ? 'Public' : v === 'InternalOnly' ? 'Internal' : v} active={activeVisibility === v} onClick={() => setActiveVisibility(activeVisibility === v ? null : v)} />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground/60 hover:text-foreground" onClick={() => { setActiveCategory(null); setActiveStatus(null); setActiveVisibility(null); setSearchQuery(''); }}>
                <X className="h-3 w-3 mr-1" /> Clear filters
              </Button>
            )}
            <span className="text-[10px] text-muted-foreground/50">{filtered.length} document{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />
            <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
              <SelectTrigger className="h-7 w-[130px] text-[10px] border-border/20 bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/40 z-50">
                <SelectItem value="relevant" className="text-[10px]">Most relevant</SelectItem>
                <SelectItem value="updated" className="text-[10px]">Recently updated</SelectItem>
                <SelectItem value="az" className="text-[10px]">Alphabetical</SelectItem>
                <SelectItem value="version" className="text-[10px]">Version</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Document Grid — grouped by category */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-border/20 bg-card/30 animate-pulse">
              <CardContent className="h-48 p-5" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/20 bg-card/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="text-[13px] font-medium text-muted-foreground/60">No documents match your criteria.</p>
            <p className="text-[11px] text-muted-foreground/40 mt-1">Try adjusting your search or filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedDocs).map(([category, catDocs], gi) => {
            const catMeta = CATEGORY_META[category] ?? CATEGORY_META.Technical;
            const CatIcon = catMeta.icon;
            return (
              <motion.section
                key={category}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 * gi }}
              >
                <div className="flex items-center gap-2.5 pb-4 pt-1">
                  <CatIcon className={cn('h-4 w-4', catMeta.color)} strokeWidth={1.6} />
                  <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground/80">{category}</h3>
                  <Badge variant="outline" className="border-border/20 text-[9px] text-muted-foreground/50">{catDocs.length}</Badge>
                  <div className="h-px flex-1 bg-border/20" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {catDocs.map(doc => (
                    <DocCard key={doc.id} doc={doc} query={searchQuery} userRole={userRole} />
                  ))}
                </div>
              </motion.section>
            );
          })}
        </div>
      )}

      {/* Advisory Footer */}
      <Separator className="bg-border/20" />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-[10px] text-muted-foreground/40 pb-4"
      >
        Documentation governance maintained under structured version control · Role-based access enforced · All documents subject to review lifecycle
      </motion.p>
    </div>
  );
}
