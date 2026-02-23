import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ExternalLink, Download, Pin, Filter, ArrowUpDown,
  Shield, FileText, Cpu, ClipboardList, BarChart3, BookOpen,
  Server, Lock, Gauge, Briefcase, ChevronDown, ChevronRight,
  CheckCircle2, Clock, X, Eye, EyeOff,
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

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Technical: Cpu,
  Operational: ClipboardList,
  Governance: Shield,
  Roadmap: BarChart3,
  Glossary: BookOpen,
  ReleaseNotes: FileText,
};

const DOC_ICONS: Record<string, React.ElementType> = {
  'System Architecture Document': Server,
  'AI Governance & Control Model': Shield,
  'API & Data Schema Specification': FileText,
  'Deployment & Runtime Guide': Lock,
  'Operator Standard Operating Procedure': ClipboardList,
  'Control Room Quick Reference': Gauge,
  'Executive Operational Overview': Briefcase,
  'System Boundary Definition': Shield,
  'Roadmap & Phase Progression': BarChart3,
  'Glossary & Definitions': BookOpen,
};

/* ── Freshness indicator ── */
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

/* ── Channel badge ── */
function ChannelBadge({ channel }: { channel: string }) {
  const styles: Record<string, string> = {
    Stable: 'border-primary/20 bg-primary/5 text-primary/70',
    Beta: 'border-warning/20 bg-warning/5 text-warning/70',
    Internal: 'border-muted-foreground/20 bg-muted/30 text-muted-foreground/70',
  };
  return (
    <Badge variant="outline" className={cn('text-[9px] font-medium', styles[channel] ?? styles.Stable)}>
      {channel}
    </Badge>
  );
}

/* ── Visibility label ── */
function VisibilityLabel({ visibility }: { visibility: string }) {
  const map: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
    PublicDemo: { label: 'Public Demo', icon: Eye, cls: 'text-success/60' },
    InternalOnly: { label: 'Internal Only', icon: EyeOff, cls: 'text-warning/60' },
    Restricted: { label: 'Restricted', icon: Lock, cls: 'text-destructive/60' },
  };
  const v = map[visibility] ?? map.PublicDemo;
  const VIcon = v.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-medium', v.cls)}>
      <VIcon className="h-3 w-3" /> {v.label}
    </span>
  );
}

/* ── Highlight helper ── */
function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((p, i) =>
    regex.test(p) ? <mark key={i} className="bg-primary/20 text-foreground rounded-sm px-0.5">{p}</mark> : p
  );
}

/* ── Doc Card ── */
function DocCard({ doc, query, userRole }: { doc: DocResource; query: string; userRole: Role }) {
  const navigate = useNavigate();
  const Icon = DOC_ICONS[doc.title] ?? FileText;
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
        !isAllowed && 'opacity-60',
      )}>
        <CardContent className="flex flex-col gap-3 p-5">
          {/* Header row */}
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary/8 text-primary/70">
              <Icon className="h-4.5 w-4.5" strokeWidth={1.6} />
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

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-border/30 bg-muted/20 text-[9px] font-medium text-muted-foreground/70">
              {doc.category}
            </Badge>
            <StatusBadgeDoc status={doc.status} />
            <ChannelBadge channel={doc.release_channel} />
            <Badge variant="outline" className="border-border/20 text-[9px] font-mono text-muted-foreground/60">
              {doc.version}
            </Badge>
            <VisibilityLabel visibility={doc.visibility} />
          </div>

          {/* Freshness + updated */}
          <div className="flex items-center gap-3 text-[10.5px] text-muted-foreground/60">
            <FreshnessIndicator updatedAt={doc.updated_at} />
            <span>Updated {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}</span>
            {doc.owner && <span className="hidden sm:inline">· {doc.owner}</span>}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[11px] font-medium" onClick={handleView}>
              <ExternalLink className="h-3 w-3" /> View Online
            </Button>
            {doc.url_download && (
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground">
                <Download className="h-3 w-3" /> Download PDF
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Restricted access dialog */}
      {showRestricted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowRestricted(false)}>
          <div className="w-full max-w-sm rounded-lg border border-border/50 bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 text-destructive/80">
              <Lock className="h-5 w-5" />
              <h3 className="text-sm font-semibold">Access Restricted</h3>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
              This document requires one of the following roles: <span className="font-medium text-foreground/80">{doc.allowed_roles.join(', ')}</span>.
              Your current role is <span className="font-medium text-foreground/80">{userRole}</span>.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" className="text-[11px]" onClick={() => setShowRestricted(false)}>Close</Button>
              <Button variant="default" size="sm" className="text-[11px] opacity-50 cursor-not-allowed">Request Access</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Collapsible Governance Panel ── */
function GovernancePanel({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-border/30 bg-card/40 transition-colors hover:border-border/50">
      <button onClick={() => setOpen(v => !v)} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <span className="text-[12.5px] font-semibold text-foreground/85">{title}</span>
        {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="border-t border-border/20 px-4 py-3">
          <div className="text-[11.5px] leading-relaxed text-muted-foreground/80">{children}</div>
        </div>
      )}
    </div>
  );
}

/* ── Section Header ── */
function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2.5 pb-3 pt-1">
      <Icon className="h-4 w-4 text-primary/60" strokeWidth={1.6} />
      <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground/80">{title}</h3>
      <div className="h-px flex-1 bg-border/30" />
    </div>
  );
}

/* ── Phase Timeline ── */
function PhaseTimeline() {
  const phases = [
    { label: 'Phase 1', subtitle: 'Decision Intelligence Overlay', status: 'active' as const },
    { label: 'Phase 2', subtitle: 'Predictive Modeling & Validation', status: 'planned' as const },
  ];
  return (
    <div className="flex items-center gap-0">
      {phases.map((phase, i) => (
        <div key={phase.label} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full border-2 text-[10px] font-bold',
              phase.status === 'active' ? 'border-primary bg-primary/15 text-primary' : 'border-border/50 bg-card text-muted-foreground/60',
            )}>
              {phase.status === 'active' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-3.5 w-3.5" />}
            </div>
            <div className="text-center">
              <p className={cn('text-[11px] font-semibold', phase.status === 'active' ? 'text-primary' : 'text-muted-foreground/60')}>{phase.label}</p>
              <p className="max-w-[140px] text-[10px] leading-tight text-muted-foreground/60">{phase.subtitle}</p>
            </div>
          </div>
          {i < phases.length - 1 && <div className="mx-4 mb-6 h-px w-16 bg-gradient-to-r from-primary/40 to-border/30" />}
        </div>
      ))}
    </div>
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

/* ── Main Page ── */
export default function Resources() {
  const navigate = useNavigate();
  const { data: docs = [], isLoading } = useDocsResources();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'relevant' | 'updated' | 'az'>('relevant');
  const [userRole, setUserRole] = useState<Role>('Viewer');

  // Filter and search
  const filtered = useMemo(() => {
    let result = docs;

    // Role filter: only show docs where role is in allowed_roles
    result = result.filter(d => d.allowed_roles.includes(userRole));

    // Category filter
    if (activeCategory) result = result.filter(d => d.category === activeCategory);

    // Status filter
    if (activeStatus) result = result.filter(d => d.status === activeStatus);

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.short_description.toLowerCase().includes(q) ||
        d.search_keywords.some(k => k.toLowerCase().includes(q)) ||
        d.content_index.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'updated') {
      result = [...result].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    } else if (sortBy === 'az') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    }
    // 'relevant' keeps default order (pinned first, then updated)

    return result;
  }, [docs, searchQuery, activeCategory, activeStatus, sortBy, userRole]);

  const categories = ['Technical', 'Operational', 'Governance', 'Roadmap', 'Glossary'];
  const statuses = ['Approved', 'Draft', 'Deprecated'];
  const hasFilters = !!activeCategory || !!activeStatus || !!searchQuery.trim();

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[1.35rem] font-semibold tracking-tight text-foreground">
              Resources & Documentation Center
            </h1>
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-[9px] font-semibold uppercase tracking-wider text-primary/70">
              Phase-1
            </Badge>
          </div>
          <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-muted-foreground/70">
            Technical architecture, operational guidance, and governance reference for Operator Copilot.
          </p>
        </div>

        {/* Role selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">Role:</span>
          <Select value={userRole} onValueChange={v => setUserRole(v as Role)}>
            <SelectTrigger className="h-8 w-[130px] text-[11px] border-border/30 bg-card/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border/40 z-[100]">
              {ROLES.map(r => (
                <SelectItem key={r} value={r} className="text-[11px]">{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator className="bg-border/30" />

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
          <Input
            placeholder="Search docs, policies, SOPs, architecture…"
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
          {categories.map(c => (
            <FilterChip key={c} label={c} active={activeCategory === c} onClick={() => setActiveCategory(activeCategory === c ? null : c)} />
          ))}
          <Separator orientation="vertical" className="h-4 bg-border/30" />
          {statuses.map(s => (
            <FilterChip key={s} label={s} active={activeStatus === s} onClick={() => setActiveStatus(activeStatus === s ? null : s)} />
          ))}
          <Separator orientation="vertical" className="h-4 bg-border/30" />
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />
            <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
              <SelectTrigger className="h-7 w-[120px] text-[10px] border-border/20 bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/40 z-50">
                <SelectItem value="relevant" className="text-[10px]">Most relevant</SelectItem>
                <SelectItem value="updated" className="text-[10px]">Last updated</SelectItem>
                <SelectItem value="az" className="text-[10px]">A–Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {hasFilters && (
            <button
              onClick={() => { setActiveCategory(null); setActiveStatus(null); setSearchQuery(''); }}
              className="ml-auto text-[10px] text-primary/60 hover:text-primary underline-offset-2 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        <p className="text-[10.5px] text-muted-foreground/50">
          {filtered.length} document{filtered.length !== 1 ? 's' : ''} · Viewing as <span className="font-medium text-foreground/60">{userRole}</span>
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1,2,3,4].map(i => (
            <Card key={i} className="border-border/20 bg-card/30 animate-pulse">
              <CardContent className="h-40 p-5" />
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <Card className="border-border/20 bg-card/30 p-10 text-center">
          <Search className="mx-auto h-8 w-8 text-muted-foreground/30" />
          <p className="mt-3 text-[13px] font-medium text-muted-foreground/60">No documents found</p>
          <p className="mt-1 text-[11px] text-muted-foreground/40">
            Try adjusting your search or filters. Suggested: "architecture", "SOP", "governance"
          </p>
        </Card>
      )}

      {/* Doc cards by category (when no filter) */}
      {!isLoading && filtered.length > 0 && !activeCategory && !searchQuery.trim() ? (
        <>
          {/* Pinned */}
          {filtered.some(d => d.is_pinned) && (
            <section>
              <SectionHeader icon={Pin} title="Pinned Documents" />
              <div className="grid gap-3 sm:grid-cols-2">
                {filtered.filter(d => d.is_pinned).map(d => (
                  <DocCard key={d.id} doc={d} query={searchQuery} userRole={userRole} />
                ))}
              </div>
            </section>
          )}

          {/* By category */}
          {categories.map(cat => {
            const catDocs = filtered.filter(d => d.category === cat && !d.is_pinned);
            if (catDocs.length === 0) return null;
            const CatIcon = CATEGORY_ICONS[cat] ?? FileText;
            return (
              <section key={cat}>
                <SectionHeader icon={CatIcon} title={cat === 'Roadmap' ? 'Roadmap & Phase Progression' : cat === 'Glossary' ? 'Glossary & Definitions' : `${cat} Documentation`} />
                {cat === 'Roadmap' ? (
                  <Card className="border-border/30 bg-card/40 p-6">
                    <PhaseTimeline />
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {catDocs.map(d => <DocCard key={d.id} doc={d} query={searchQuery} userRole={userRole} />)}
                    </div>
                  </Card>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {catDocs.map(d => <DocCard key={d.id} doc={d} query={searchQuery} userRole={userRole} />)}
                  </div>
                )}
              </section>
            );
          })}

          {/* Governance panels */}
          <section>
            <SectionHeader icon={Shield} title="Advisory Scope & Compliance" />
            <div className="space-y-2">
              <GovernancePanel title="System Boundary Definition">
                Operator Copilot is a decision intelligence overlay positioned above OMS, ADMS, and GIS systems.
                It does not replace any system of record and operates as a stateless advisory generation layer.
                All outputs require explicit operator review and approval before any operational action is taken.
              </GovernancePanel>
              <GovernancePanel title="What the System Does NOT Do">
                No SCADA integration or actuation. No breaker control or switching automation. No autonomous crew dispatch.
                No load flow modeling or protection coordination. No direct OMS ticket modification. No predictive grid modeling (Phase-1).
              </GovernancePanel>
              <GovernancePanel title="Advisory-Only Notice">
                All insights generated by this system are advisory in nature. They are intended to support
                operator decision-making under uncertainty, not to replace human judgment.
                Deterministic rule engine constraints are enforced before any AI inference output is presented.
              </GovernancePanel>
              <GovernancePanel title="Data Governance & Privacy">
                Phase-1 operates on synthetic and illustrative data. No live SCADA, OMS, or customer PII is ingested.
                API keys are secured via backend proxy. AI model calls are routed through backend edge functions
                with no direct frontend exposure. Enterprise data isolation is planned for Phase-2.
              </GovernancePanel>
            </div>
          </section>

          {/* Glossary quick access */}
          <section>
            <SectionHeader icon={BookOpen} title="Glossary Quick Access" />
            <Card className="border-border/30 bg-card/40 p-5">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[11px] font-medium" onClick={() => navigate('/glossary')}>
                  <BookOpen className="h-3 w-3" /> Open Full Glossary
                </Button>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground/60">
                Quick access to standardized terminology — ETR Confidence Band, Critical Load Runway, Decision Trace, and more.
              </p>
            </Card>
          </section>
        </>
      ) : (
        /* Flat search/filter results */
        !isLoading && filtered.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map(d => (
              <DocCard key={d.id} doc={d} query={searchQuery} userRole={userRole} />
            ))}
          </div>
        )
      )}

      {/* Footer */}
      <div className="pt-2 text-center text-[10px] text-muted-foreground/40">
        Conceptual Prototype — Structured Demonstration Environment · Decision-support only
      </div>
    </div>
  );
}
