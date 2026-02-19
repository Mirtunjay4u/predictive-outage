import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, AlertTriangle, Activity } from 'lucide-react';
import { useScenarios, useCreateScenario, useUpdateScenario, useDeleteScenario } from '@/hooks/useScenarios';
import { EventFilters } from '@/components/events/EventFilters';
import { EventTable } from '@/components/events/EventTable';
import { EventCard } from '@/components/events/EventCard';
import { EventDrawer } from '@/components/events/EventDrawer';
import { EventDetailPanel } from '@/components/events/EventDetailPanel';
import { EmptyState } from '@/components/EmptyState';
import { ScenarioTableSkeleton, ScenarioCardsSkeleton } from '@/components/LoadingSkeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { Scenario, ScenarioInsert } from '@/types/scenario';

// ── Tiny summary stat chip ────────────────────────────────────────────────────
function StatChip({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className={cn('rounded-lg border border-border/50 bg-card px-3 py-2 flex flex-col gap-0.5', accent)}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

export default function Events() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [stageFilter, setStageFilter] = useState('all');
  const [lifecycleFilter, setLifecycleFilter] = useState('all');
  const [outageTypeFilter, setOutageTypeFilter] = useState('all');

  // Detail panel — opens when row is clicked
  const [detailScenario, setDetailScenario] = useState<Scenario | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Edit drawer — opened from the action menu or "Edit" footer button in detail
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Apply URL filter params from dashboard navigation
  useEffect(() => {
    const lifecycleParam = searchParams.get('lifecycle');
    const outageTypeParam = searchParams.get('outage_type');
    if (lifecycleParam || outageTypeParam) {
      if (lifecycleParam) setLifecycleFilter(lifecycleParam);
      if (outageTypeParam) setOutageTypeFilter(outageTypeParam);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: scenarios = [], isLoading, error } = useScenarios();
  const createMutation = useCreateScenario();
  const updateMutation = useUpdateScenario();
  const deleteMutation = useDeleteScenario();

  const filteredScenarios = useMemo(() => {
    return scenarios.filter((scenario) => {
      if (stageFilter !== 'all') {
        if (stageFilter === 'active' && !scenario.stage) return false;
        if (stageFilter === 'inactive' && scenario.stage) return false;
      }
      if (lifecycleFilter !== 'all' && scenario.lifecycle_stage !== lifecycleFilter) return false;
      if (outageTypeFilter !== 'all' && scenario.outage_type !== outageTypeFilter) return false;
      return true;
    });
  }, [scenarios, stageFilter, lifecycleFilter, outageTypeFilter]);

  const activeFilters = useMemo(() => {
    const f: string[] = [];
    if (lifecycleFilter !== 'all') f.push(lifecycleFilter);
    if (outageTypeFilter !== 'all') f.push(outageTypeFilter);
    return f;
  }, [lifecycleFilter, outageTypeFilter]);

  // Summary stats
  const stats = useMemo(() => ({
    total: filteredScenarios.length,
    active: filteredScenarios.filter((s) => s.lifecycle_stage === 'Event').length,
    high: filteredScenarios.filter((s) => s.priority === 'high').length,
    critical: filteredScenarios.filter((s) => s.has_critical_load).length,
  }), [filteredScenarios]);

  const clearFilters = () => {
    setLifecycleFilter('all');
    setOutageTypeFilter('all');
    setStageFilter('all');
  };

  const handleRowClick = (scenario: Scenario) => {
    setDetailScenario(scenario);
    setIsDetailOpen(true);
  };

  const handleCreate = () => {
    setEditingScenario(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (scenario: Scenario) => {
    setEditingScenario(scenario);
    setIsDrawerOpen(true);
  };

  const handleSave = (data: ScenarioInsert) => {
    if (editingScenario) {
      updateMutation.mutate(
        { id: editingScenario.id, data },
        { onSuccess: () => setIsDrawerOpen(false) },
      );
    } else {
      createMutation.mutate(data, { onSuccess: () => setIsDrawerOpen(false) });
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => {
          setDeleteId(null);
          if (detailScenario?.id === deleteId) setIsDetailOpen(false);
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="mx-auto max-w-[1600px] px-4 py-5 lg:px-6 space-y-5">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-bold text-foreground">Operational Events</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Single source of truth for active, pre-event, and post-event operational events — with policy evaluation and crew readiness.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Summary strip ── */}
        {!isLoading && scenarios.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
          >
            <StatChip label="Total Events" value={stats.total} />
            <StatChip label="Active Outages" value={stats.active} />
            <StatChip label="High Priority" value={stats.high} accent={stats.high > 0 ? 'border-amber-400/30' : ''} />
            <StatChip label="Crit. Load" value={stats.critical} accent={stats.critical > 0 ? 'border-red-400/30' : ''} />
          </motion.div>
        )}

        {/* ── Active filter banner ── */}
        {activeFilters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm bg-muted/40 rounded-lg px-3 py-2 border border-border/50"
          >
            <span className="text-muted-foreground">Filtered by:</span>
            <span className="font-medium">{activeFilters.join(' · ')}</span>
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground underline transition-colors"
            >
              Clear
            </button>
          </motion.div>
        )}

        {/* ── Filters bar ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <EventFilters
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            stageFilter={stageFilter}
            onStageFilterChange={setStageFilter}
            lifecycleFilter={lifecycleFilter}
            onLifecycleFilterChange={setLifecycleFilter}
            outageTypeFilter={outageTypeFilter}
            onOutageTypeFilterChange={setOutageTypeFilter}
            onCreateClick={handleCreate}
          />
        </motion.div>

        {/* ── Content ── */}
        {isLoading ? (
          viewMode === 'table' ? <ScenarioTableSkeleton /> : <ScenarioCardsSkeleton />
        ) : error ? (
          <EmptyState
            icon={AlertTriangle}
            title="Failed to load events"
            description="There was an error loading events. Please try again."
            actionLabel="Retry"
            onAction={() => window.location.reload()}
          />
        ) : filteredScenarios.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No events found"
            description={
              scenarios.length === 0
                ? 'Get started by creating your first event'
                : 'No events match your current filters'
            }
            actionLabel={scenarios.length === 0 ? 'Create Event' : undefined}
            onAction={scenarios.length === 0 ? handleCreate : undefined}
          />
        ) : viewMode === 'table' ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <EventTable
              scenarios={filteredScenarios}
              onRowClick={handleRowClick}
              onEdit={handleEdit}
              onDelete={setDeleteId}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredScenarios.map((scenario) => (
              <EventCard
                key={scenario.id}
                scenario={scenario}
                onClick={() => handleRowClick(scenario)}
                onDelete={() => setDeleteId(scenario.id)}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* ── Event Detail Panel ── */}
      <EventDetailPanel
        scenario={detailScenario}
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={handleEdit}
      />

      {/* ── Edit Drawer ── */}
      <EventDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        scenario={editingScenario}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* ── Delete Confirm ── */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
