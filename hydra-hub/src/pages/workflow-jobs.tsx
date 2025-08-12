import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { FlowRun, Flow, LogEntry } from '@/lib/prefect/client';
import { prefectClient } from '@/lib/prefect/client';
import { WorkflowJobsTable } from '@/components/workflow-jobs-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Play, Clock, CheckCircle, XCircle, BarChart3 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';

// Enhanced job data with flow info and latest log
export interface EnhancedFlowRun extends FlowRun {
  flowName?: string;
  latestLogMessage?: string;
}

export default function WorkflowJobs() {
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch flow runs with React Query - auto-refetch every 3 seconds
  const { data: flowRuns, isLoading: flowRunsLoading, refetch } = useQuery({
    queryKey: ['flowRuns'],
    queryFn: () => prefectClient.flowRuns.filter({ limit: 50, sort: 'START_TIME_DESC' }),
    refetchInterval: 3000, // 3 seconds
    refetchIntervalInBackground: true,
  });

  // Fetch enhanced data (flows and latest logs) for the flow runs
  const { data: enhancedJobs, isLoading: enhancedLoading } = useQuery({
    queryKey: ['enhancedFlowRuns', flowRuns],
    queryFn: async (): Promise<EnhancedFlowRun[]> => {
      if (!flowRuns || flowRuns.length === 0) return [];
      
      // Get unique flow IDs
      const uniqueFlowIds = [...new Set(flowRuns.map(run => run.flow_id).filter(Boolean))];
      
      // Fetch all flows in parallel
      const flowsPromises = uniqueFlowIds.map(flowId => 
        prefectClient.flows.get(flowId!).catch(() => null)
      );
      const flows = await Promise.all(flowsPromises);
      const flowsMap = new Map<string, Flow>();
      flows.forEach((flow, index) => {
        if (flow && uniqueFlowIds[index]) flowsMap.set(uniqueFlowIds[index], flow);
      });

      // Fetch latest logs for each flow run in parallel
      const latestLogsPromises = flowRuns.map(run => 
        prefectClient.flowRuns.getLatestLog(run.id).catch(() => null)
      );
      const latestLogs = await Promise.all(latestLogsPromises);

      // Combine data
      return flowRuns.map((run, index): EnhancedFlowRun => ({
        ...run,
        flowName: run.flow_id ? flowsMap.get(run.flow_id)?.name : undefined,
        latestLogMessage: latestLogs[index]?.message,
      }));
    },
    enabled: !!flowRuns && flowRuns.length > 0,
    refetchInterval: 10000, // Refetch enhanced data every 10 seconds (less frequent)
  });

  const isLoading = flowRunsLoading || enhancedLoading;
  const jobsData = enhancedJobs || flowRuns;

  // Cancel flow run mutation
  const cancelMutation = useMutation({
    mutationFn: (flowRunId: string) => prefectClient.flowRuns.cancel(flowRunId),
    onSuccess: () => {
      // Invalidate and refetch flow runs after successful cancel
      queryClient.invalidateQueries({ queryKey: ['flowRuns'] });
    },
  });

  const refreshData = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleRetry = async (_id: string) => {
    // TODO: implement retry via deployment create_flow_run if desired
    await refreshData();
  };

  const handleCancel = async (id: string) => {
    await cancelMutation.mutateAsync(id);
  };

  // Calculate statistics
  const jobs: EnhancedFlowRun[] = jobsData ?? [];
  const totalJobs = jobs.length;
  const runningJobs = jobs.filter(job => job.state_type === 'RUNNING').length;
  const completedJobs = jobs.filter(job => job.state_type === 'COMPLETED').length;
  const failedJobs = jobs.filter(job => job.state_type === 'FAILED' || job.state_type === 'CRASHED').length;
  const scheduledJobs = jobs.filter(job => job.state_type === 'SCHEDULED' || job.state_type === 'PENDING').length;

  return (
    <div className="p-6">
      <PageHeader
        title="Workflow Jobs"
        description="Monitor and manage your Prefect workflow executions"
        right={(
          <Button onClick={refreshData} disabled={refreshing || isLoading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
        <StatCard title="Total Jobs" value={totalJobs} icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />} />
        <StatCard title="Running" value={<span className="text-blue-600">{runningJobs}</span>} icon={<Play className="h-4 w-4 text-blue-500" />} />
        <StatCard title="Completed" value={<span className="text-green-600">{completedJobs}</span>} icon={<CheckCircle className="h-4 w-4 text-green-500" />} />
        <StatCard title="Failed" value={<span className="text-red-600">{failedJobs}</span>} icon={<XCircle className="h-4 w-4 text-red-500" />} />
        <StatCard title="Scheduled" value={<span className="text-yellow-600">{scheduledJobs}</span>} icon={<Clock className="h-4 w-4 text-yellow-500" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Workflow Jobs</CardTitle>
          <CardDescription>
            View and manage your Prefect workflow job executions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkflowJobsTable
            data={jobs}
            loading={isLoading}
            onRetry={handleRetry}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
