import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { prefectClient } from '@/lib/clients/PrefectClient';
import type { 
  FlowRun, 
  Deployment, 
  FlowRunsFilterRequest, 
  DeploymentsFilterRequest 
} from '@/lib/clients/PrefectClient';

// Query keys
export const prefectKeys = {
  all: ['prefect'] as const,
  flowRuns: (filter?: FlowRunsFilterRequest) => [...prefectKeys.all, 'flowRuns', filter] as const,
  flowRun: (id: string) => [...prefectKeys.all, 'flowRun', id] as const,
  deployments: (filter?: DeploymentsFilterRequest) => [...prefectKeys.all, 'deployments', filter] as const,
} as const;

// Flow Run Hooks
export function useFlowRuns(filter: FlowRunsFilterRequest = {}) {
  return useQuery({
    queryKey: prefectKeys.flowRuns(filter),
    queryFn: () => prefectClient.flowRuns.filter(filter),
  });
}

export function useFlowRun(flowRunId: string) {
  return useQuery({
    queryKey: prefectKeys.flowRun(flowRunId),
    queryFn: () => prefectClient.flowRuns.get(flowRunId),
    enabled: Boolean(flowRunId),
  });
}

export function useCancelFlowRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (flowRunId: string) => prefectClient.flowRuns.cancel(flowRunId),
    onSuccess: (_, flowRunId) => {
      // Invalidate the specific flow run and the flow runs list
      queryClient.invalidateQueries({ queryKey: prefectKeys.flowRun(flowRunId) });
      queryClient.invalidateQueries({ queryKey: prefectKeys.flowRuns() });
    },
  });
}

// Deployment Hooks
export function useDeployments(filter: DeploymentsFilterRequest = {}) {
  return useQuery({
    queryKey: prefectKeys.deployments(filter),
    queryFn: () => prefectClient.deployments.filter(filter),
  });
}

export function useCreateFlowRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      deploymentId: string;
      options?: {
        parameters?: Record<string, unknown>;
        name?: string;
        tags?: string[];
        scheduled_start_time?: string | null;
      };
    }) => prefectClient.deployments.createFlowRun(params.deploymentId, params.options),
    onSuccess: () => {
      // Invalidate flow runs list after creating a new run
      queryClient.invalidateQueries({ queryKey: prefectKeys.flowRuns() });
    },
  });
}
