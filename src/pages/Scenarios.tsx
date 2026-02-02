import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, AlertTriangle } from 'lucide-react';
import { useScenarios, useCreateScenario, useUpdateScenario, useDeleteScenario } from '@/hooks/useScenarios';
import { ScenarioFilters } from '@/components/scenarios/ScenarioFilters';
import { ScenarioTable } from '@/components/scenarios/ScenarioTable';
import { ScenarioCard } from '@/components/scenarios/ScenarioCard';
import { ScenarioDrawer } from '@/components/scenarios/ScenarioDrawer';
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
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [stageFilter, setStageFilter] = useState('all');
  const [lifecycleFilter, setLifecycleFilter] = useState('all');
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  const [copilotScenario, setCopilotScenario] = useState<Scenario | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
      return true;
    });
  }, [scenarios, stageFilter, lifecycleFilter]);

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
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-2xl font-bold mb-1">Scenarios</h1>
            <p className="text-muted-foreground">
              Manage and monitor operational scenarios
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <ScenarioFilters
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              stageFilter={stageFilter}
              onStageFilterChange={setStageFilter}
              lifecycleFilter={lifecycleFilter}
              onLifecycleFilterChange={setLifecycleFilter}
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
              title="No scenarios found"
              description={
                scenarios.length === 0
                  ? "Get started by creating your first scenario"
                  : "No scenarios match your current filters"
              }
              actionLabel={scenarios.length === 0 ? "Create Scenario" : undefined}
              onAction={scenarios.length === 0 ? handleCreate : undefined}
            />
          ) : viewMode === 'table' ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <ScenarioTable
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
                <ScenarioCard
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
      <ScenarioDrawer
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
            <AlertDialogTitle>Delete Scenario</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this scenario? This action cannot be undone.
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
