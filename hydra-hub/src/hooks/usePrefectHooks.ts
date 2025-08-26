import { useCallback, useEffect, useRef, useState } from 'react';
import { prefectClient } from '@/lib/clients/prefect';
import type { FlowRun, Deployment, FlowRunsFilterRequest, DeploymentsFilterRequest } from '@/lib/clients/prefect';

interface UseQueryResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

interface UseMutationResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  mutate: (...args: any[]) => Promise<void>;
}

// Flow Runs Hooks
export function useFlowRuns(filter: FlowRunsFilterRequest = {}): UseQueryResult<FlowRun[]> {
  const [data, setData] = useState<FlowRun[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      // Only show loading spinner on initial load
      if (!hasLoadedRef.current) {
        setIsLoading(true);
      }
      setError(null);
      const runs = await prefectClient.flowRuns.filter(filter);
      setData(runs);
      hasLoadedRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch flow runs'));
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, isLoading, refetch: fetchData };
}

export function useFlowRun(flowRunId: string): UseQueryResult<FlowRun> {
  const [data, setData] = useState<FlowRun | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const run = await prefectClient.flowRuns.get(flowRunId);
      setData(run);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch flow run'));
    } finally {
      setIsLoading(false);
    }
  }, [flowRunId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, isLoading, refetch: fetchData };
}

export function useCancelFlowRun(): UseMutationResult<unknown> {
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const mutate = useCallback(async (flowRunId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await prefectClient.flowRuns.cancel(flowRunId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to cancel flow run'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, error, isLoading, mutate };
}

// Deployments Hooks
export function useDeployments(filter: DeploymentsFilterRequest = {}): UseQueryResult<Deployment[]> {
  const [data, setData] = useState<Deployment[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const deployments = await prefectClient.deployments.filter(filter);
      setData(deployments);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch deployments'));
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, isLoading, refetch: fetchData };
}

export function useCreateFlowRun(): UseMutationResult<FlowRun> {
  const [data, setData] = useState<FlowRun | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const mutate = useCallback(async (deploymentId: string, params: {
    parameters?: Record<string, unknown>;
    name?: string;
    tags?: string[];
    scheduled_start_time?: string | null;
  } = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await prefectClient.deployments.createFlowRun(deploymentId, params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create flow run'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, error, isLoading, mutate };
}
