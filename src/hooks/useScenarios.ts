import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scenarioService } from '@/lib/scenarios';
import type { Scenario, ScenarioInsert, ScenarioUpdate } from '@/types/scenario';
import { toast } from 'sonner';

export function useScenarios(options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['scenarios'],
    queryFn: () => scenarioService.getAll(),
    refetchInterval: options?.refetchInterval,
  });
}

export function useScenario(id: string | null) {
  return useQuery({
    queryKey: ['scenario', id],
    queryFn: () => id ? scenarioService.getById(id) : null,
    enabled: !!id,
  });
}

export function useCreateScenario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (scenario: ScenarioInsert) => scenarioService.create(scenario),
    onSuccess: (newScenario) => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      toast.success('Scenario created successfully');
      return newScenario;
    },
    onError: (error) => {
      toast.error('Failed to create scenario');
      console.error(error);
    },
  });
}

export function useUpdateScenario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ScenarioUpdate }) => 
      scenarioService.update(id, data),
    onSuccess: (updatedScenario, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      queryClient.invalidateQueries({ queryKey: ['scenario', id] });
      toast.success('Scenario updated successfully');
      return updatedScenario;
    },
    onError: (error) => {
      toast.error('Failed to update scenario');
      console.error(error);
    },
  });
}

export function useDeleteScenario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => scenarioService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
      toast.success('Scenario deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete scenario');
      console.error(error);
    },
  });
}
