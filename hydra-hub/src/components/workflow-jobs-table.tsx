import type { FlowRun } from '@/lib/prefect/client';

// Enhanced job data with flow info and latest log
interface EnhancedFlowRun extends FlowRun {
  flowName?: string;
  latestLogMessage?: string;
}
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Square, RotateCcw, Loader2, Clock, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { EmptyState, LoadingState } from '@/components/feedback';

interface WorkflowJobsTableProps {
  data: EnhancedFlowRun[];
  loading: boolean;
  onRetry?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export function WorkflowJobsTable({ data, loading, onRetry, onCancel }: WorkflowJobsTableProps) {
  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getStateIcon = (state: string) => {
    switch (state.toUpperCase()) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'RUNNING':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'FAILED':
      case 'CRASHED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'CANCELLED':
        return <Square className="h-4 w-4 text-gray-500" />;
      case 'SCHEDULED':
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'PAUSED':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStateBadge = (state: string) => {
    const stateUpper = state.toUpperCase();
    switch (stateUpper) {
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case 'RUNNING':
        return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Running</Badge>;
      case 'FAILED':
      case 'CRASHED':
        return <Badge variant="destructive">Failed</Badge>;
      case 'CANCELLED':
        return <Badge variant="secondary">Cancelled</Badge>;
      case 'SCHEDULED':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Scheduled</Badge>;
      case 'PENDING':
        return <Badge variant="outline" className="border-orange-500 text-orange-600">Pending</Badge>;
      case 'PAUSED':
        return <Badge variant="outline" className="border-purple-500 text-purple-600">Paused</Badge>;
      default:
        return <Badge variant="outline">{state}</Badge>;
    }
  };

  if (loading) return <LoadingState label="Loading workflow jobs..." />

  if (data.length === 0)
    return (
      <EmptyState
        title="No workflow jobs found"
        description="Jobs will appear here once your Prefect flows start running."
      />
    )

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Job Name & Flow</TableHead>
            <TableHead>Latest Log</TableHead>
            <TableHead>Work Queue</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((job) => {
            const state = (job.state_type ?? 'UNKNOWN').toUpperCase();
            const flowId = job.flow_id ?? '';
            const tags = job.tags ?? [];
            const totalRunTime = job.total_run_time ?? 0;
            const startTime: string | null = job.start_time ?? null;
            return (
              <TableRow key={job.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStateIcon(state)}
                    {getStateBadge(state)}
                  </div>
                </TableCell>
                <TableCell className="max-w-[250px]">
                  <div className="space-y-1">
                    <Link href={`/workflow-jobs/${job.id}`} className="hover:underline text-primary font-medium block truncate">
                      {job.name ?? 'Unnamed Job'}
                    </Link>
                    <div className="text-xs text-muted-foreground truncate">
                      Flow: {job.flowName ?? (flowId ? `${flowId.substring(0, 12)}...` : 'Unknown')}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="max-w-[300px]">
                  <div className="text-sm text-muted-foreground truncate">
                    {job.latestLogMessage ? (
                      <span className="font-mono text-xs">{job.latestLogMessage}</span>
                    ) : (
                      <span className="italic">No logs available</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{job.work_queue_name || 'default'}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(startTime)}
                </TableCell>
                <TableCell className="text-sm">
                  {formatDuration(totalRunTime)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {tags.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{tags.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/workflow-jobs/${job.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="View details"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">View details</span>
                      </Button>
                    </Link>
                    {state === 'FAILED' && onRetry && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRetry(job.id)}
                        className="h-8 w-8 p-0"
                        title="Retry job"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span className="sr-only">Retry</span>
                      </Button>
                    )}
                    {(state === 'RUNNING' || state === 'SCHEDULED') && onCancel && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCancel(job.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        title="Cancel job"
                      >
                        <Square className="h-4 w-4" />
                        <span className="sr-only">Cancel</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
