import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, AlertTriangle } from 'lucide-react';
import { useScenarios, useCreateScenario, useUpdateScenario, useDeleteScenario } from '@/hooks/useScenarios';
import { EventFilters } from '@/components/events/EventFilters';
import { EventTable } from '@/components/events/EventTable';
import { EventCard } from '@/components/events/EventCard';
import { EventDrawer } from '@/components/events/EventDrawer';
import { CopilotPanel } from '@/components/copilot/CopilotPanel';
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
import type { Scenario, ScenarioInsert } from '@/types/scenario';

export default function Scenarios() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [stageFilter, setStageFilter] = useState('all');
  const [lifecycleFilter, setLifecycleFilter] = useState('all');
  const [outageTypeFilter, setOutageTypeFilter] = useState('all');
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  const [copilotScenario, setCopilotScenario] = useState<Scenario | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Read filters from URL params on mount
  useEffect(() => {
    const lifecycleParam = searchParams.get('lifecycle');
    const outageTypeParam = searchParams.get('outage_type');
    
    if (lifecycleParam || outageTypeParam) {
      if (lifecycleParam) {
        setLifecycleFilter(lifecycleParam);
      }
      if (outageTypeParam) {
        setOutageTypeFilter(outageTypeParam);
      }
      // Clear the URL params after applying
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: scenarios = [], isLoading, error } = useScenarios();
  const createMutation = useCreateScenario();
  const updateMutation = useUpdateScenario();
  const deleteMutation = useDeleteScenario();

  const filteredScenarios = useMemo(() => {
    return scenarios.filter(scenario => {
      if (stageFilter !== 'all') {
        if (stageFilter === 'active' && !scenario.stage) return false;
        if (stageFilter === 'inactive' && scenario.stage) return false;
      }
      if (lifecycleFilter !== 'all' && scenario.lifecycle_stage !== lifecycleFilter) {
        return false;
      }
      if (outageTypeFilter !== 'all' && scenario.outage_type !== outageTypeFilter) {
        return false;
      }
      return true;
    });
  }, [scenarios, stageFilter, lifecycleFilter, outageTypeFilter]);

  const activeFilters = useMemo(() => {
    const filters: string[] = [];
    if (lifecycleFilter !== 'all') filters.push(lifecycleFilter);
    if (outageTypeFilter !== 'all') filters.push(outageTypeFilter);
    return filters;
  }, [lifecycleFilter, outageTypeFilter]);

  const clearFilters = () => {
    setLifecycleFilter('all');
    setOutageTypeFilter('all');
  };

  const handleCreate = () => {
    setEditingScenario(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (scenario: Scenario) => {
    setEditingScenario(scenario);
    setCopilotScenario(scenario);
    setIsDrawerOpen(true);
  };

  const handleSave = (data: ScenarioInsert) => {
    if (editingScenario) {
      updateMutation.mutate(
        { id: editingScenario.id, data },
        { 
          onSuccess: (updatedScenario) => {
            setIsDrawerOpen(false);
            // Update copilot scenario if it was the one being edited
            if (copilotScenario?.id === editingScenario.id) {
              setCopilotScenario(updatedScenario);
            }
          }
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: (newScenario) => {
          setIsDrawerOpen(false);
          setCopilotScenario(newScenario);
        },
      });
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => {
          setDeleteId(null);
          if (copilotScenario?.id === deleteId) {
            setCopilotScenario(null);
          }
        },
      });
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gradient-to-br from-background via-background to-muted/20">
        <div className="p-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-2xl font-bold mb-1">Events</h1>
            <p className="text-muted-foreground">
              Manage and monitor operational events
            </p>
          </motion.div>

          {/* Active Filter Banner */}
          {activeFilters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center gap-2 text-sm"
            >
              <span className="text-muted-foreground">Filtered by:</span>
              <span className="font-medium">{activeFilters.join(' • ')}</span>
              <button
                onClick={clearFilters}
                className="ml-2 text-xs text-muted-foreground hover:text-foreground underline transition-colors"
              >
                Clear filters
              </button>
            </motion.div>
          )}

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
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

          {/* Content */}
          {isLoading ? (
            viewMode === 'table' ? <ScenarioTableSkeleton /> : <ScenarioCardsSkeleton />
          ) : error ? (
            <EmptyState
              icon={AlertTriangle}
              title="Failed to load scenarios"
              description="There was an error loading scenarios. Please try again."
              actionLabel="Retry"
              onAction={() => window.location.reload()}
            />
          ) : filteredScenarios.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No events found"
              description={
                scenarios.length === 0
                  ? "Get started by creating your first event"
                  : "No events match your current filters"
              }
              actionLabel={scenarios.length === 0 ? "Create Event" : undefined}
              onAction={scenarios.length === 0 ? handleCreate : undefined}
            />
          ) : viewMode === 'table' ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <EventTable
                scenarios={filteredScenarios}
                onRowClick={handleEdit}
                onDelete={setDeleteId}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredScenarios.map((scenario) => (
                <EventCard
                  key={scenario.id}
                  scenario={scenario}
                  onClick={() => handleEdit(scenario)}
                  onDelete={() => setDeleteId(scenario.id)}
                />
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Copilot Panel */}
      <CopilotPanel
        scenario={copilotScenario}
        isOpen={isCopilotOpen}
        onToggle={() => setIsCopilotOpen(!isCopilotOpen)}
      />

      {/* Drawer */}
      <EventDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        scenario={editingScenario}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
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
