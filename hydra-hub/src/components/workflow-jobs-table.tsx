import { FlowRun } from '@/types/workflow-job';
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
import { Play, Square, RotateCcw, Loader2, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface WorkflowJobsTableProps {
  data: FlowRun[];
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading workflow jobs...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No workflow jobs found.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Jobs will appear here once your Prefect flows start running.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Job Name</TableHead>
            <TableHead>Flow ID</TableHead>
            <TableHead>Work Queue</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((job) => (
            <TableRow key={job.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStateIcon(job.state_type)}
                  {getStateBadge(job.state_type)}
                </div>
              </TableCell>
              <TableCell className="font-medium max-w-[200px] truncate">
                {job.name}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {job.flow_id.substring(0, 8)}...
              </TableCell>
              <TableCell>
                <Badge variant="outline">{job.work_queue_name || 'default'}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(job.start_time)}
              </TableCell>
              <TableCell className="text-sm">
                {formatDuration(job.total_run_time)}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {job.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {job.tags.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{job.tags.length - 2}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {job.state_type === 'FAILED' && onRetry && (
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
                  {(job.state_type === 'RUNNING' || job.state_type === 'SCHEDULED') && onCancel && (
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
