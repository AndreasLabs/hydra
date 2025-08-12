import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { prefectClient, FlowRun, LogEntry, Artifact } from '@/lib/prefect/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, Loader2, Play, Square } from 'lucide-react';
import Link from 'next/link';
import { LoadingState } from '@/components/feedback';

// Tab component
const TabButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      active 
        ? 'bg-primary text-primary-foreground' 
        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    }`}
    onClick={onClick}
  >
    {children}
  </button>
);

// Parameters component
const ParametersTab = ({ parameters }: { parameters: Record<string, unknown> | null | undefined }) => {
  if (!parameters || Object.keys(parameters).length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No parameters found for this flow run.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(parameters).map(([key, value]) => (
        <Card key={key}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{key}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-3 rounded-md overflow-x-auto">
              {JSON.stringify(value, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Logs component
const LogsTab = ({ flowRunId }: { flowRunId: string }) => {
  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['flowRunLogs', flowRunId],
    queryFn: () => prefectClient.flowRuns.getLogs(flowRunId),
  });

  if (isLoading) return <LoadingState label="Loading logs..." />;
  
  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>Failed to load logs: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No logs found for this flow run.</p>
      </div>
    );
  }

  const getLevelColor = (level: number) => {
    if (level >= 40) return 'text-red-500'; // ERROR
    if (level >= 30) return 'text-yellow-500'; // WARNING
    if (level >= 20) return 'text-blue-500'; // INFO
    return 'text-gray-500'; // DEBUG
  };

  const getLevelName = (level: number) => {
    if (level >= 40) return 'ERROR';
    if (level >= 30) return 'WARN';
    if (level >= 20) return 'INFO';
    return 'DEBUG';
  };

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <Card key={log.id} className="p-3">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className={`text-xs ${getLevelColor(log.level)}`}>
              {getLevelName(log.level)}
            </Badge>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <span>{new Date(log.timestamp).toLocaleString()}</span>
                {log.task_run_id && <span>Task: {log.task_run_id.substring(0, 8)}...</span>}
              </div>
              <pre className="text-sm whitespace-pre-wrap break-words">{log.message}</pre>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// Artifacts component
const ArtifactsTab = ({ flowRunId }: { flowRunId: string }) => {
  const { data: artifacts, isLoading, error } = useQuery({
    queryKey: ['flowRunArtifacts', flowRunId],
    queryFn: () => prefectClient.flowRuns.getArtifacts(flowRunId),
  });

  if (isLoading) return <LoadingState label="Loading artifacts..." />;
  
  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>Failed to load artifacts: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }

  if (!artifacts || artifacts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No artifacts found for this flow run.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {artifacts.map((artifact) => (
        <Card key={artifact.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{artifact.key}</CardTitle>
              <Badge variant="outline">{artifact.type}</Badge>
            </div>
            {artifact.description && (
              <CardDescription>{artifact.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground">
                Created: {new Date(artifact.created).toLocaleString()}
              </div>
              {artifact.data !== null && artifact.data !== undefined && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Data:</h4>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-40">
                    {JSON.stringify(artifact.data, null, 2)}
                  </pre>
                </div>
              )}
              {artifact.metadata_ && Object.keys(artifact.metadata_).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Metadata:</h4>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-40">
                    {JSON.stringify(artifact.metadata_, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default function WorkflowJobDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [activeTab, setActiveTab] = useState<'overview' | 'parameters' | 'logs' | 'artifacts'>('overview');

  const { data: flowRun, isLoading, error } = useQuery({
    queryKey: ['flowRun', id],
    queryFn: () => prefectClient.flowRuns.get(id as string),
    enabled: !!id && typeof id === 'string',
  });

  if (isLoading) return <LoadingState label="Loading workflow job..." />;

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <h2 className="text-lg font-semibold text-destructive mb-2">Error Loading Workflow Job</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
          <Link href="/workflow-jobs">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Workflow Jobs
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!flowRun) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <h2 className="text-lg font-semibold mb-2">Workflow Job Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested workflow job could not be found.</p>
          <Link href="/workflow-jobs">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Workflow Jobs
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStateIcon = (state: string) => {
    switch (state.toUpperCase()) {
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'RUNNING':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'FAILED':
      case 'CRASHED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'CANCELLED':
        return <Square className="h-5 w-5 text-gray-500" />;
      case 'SCHEDULED':
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'PAUSED':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStateBadge = (state: string) => {
    const stateUpper = state.toUpperCase();
    switch (stateUpper) {
      case 'COMPLETED':
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case 'RUNNING':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Running</Badge>;
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

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const state = flowRun.state_type || 'UNKNOWN';

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/workflow-jobs">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{flowRun.name || 'Unnamed Flow Run'}</h2>
          <p className="text-muted-foreground mt-1">Flow run details and execution information</p>
        </div>
      </div>

      {/* Overview Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStateIcon(state)}
              <div>
                <CardTitle className="text-xl">{flowRun.name || 'Unnamed Flow Run'}</CardTitle>
                <CardDescription>ID: {flowRun.id}</CardDescription>
              </div>
            </div>
            {getStateBadge(state)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Flow ID</h4>
              <p className="text-sm font-mono">{flowRun.flow_id?.substring(0, 16)}...</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Start Time</h4>
              <p className="text-sm">{formatDate(flowRun.start_time)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">End Time</h4>
              <p className="text-sm">{formatDate(flowRun.end_time)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Duration</h4>
              <p className="text-sm">{formatDuration(flowRun.total_run_time || 0)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Work Queue</h4>
              <p className="text-sm">{flowRun.work_queue_name || 'default'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Created</h4>
              <p className="text-sm">{formatDate(flowRun.created)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Updated</h4>
              <p className="text-sm">{formatDate(flowRun.updated)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Tags</h4>
              <div className="flex flex-wrap gap-1 mt-1">
                {(flowRun.tags || []).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {(!flowRun.tags || flowRun.tags.length === 0) && (
                  <span className="text-xs text-muted-foreground">None</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
          Overview
        </TabButton>
        <TabButton active={activeTab === 'parameters'} onClick={() => setActiveTab('parameters')}>
          Parameters
        </TabButton>
        <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')}>
          Logs
        </TabButton>
        <TabButton active={activeTab === 'artifacts'} onClick={() => setActiveTab('artifacts')}>
          Artifacts
        </TabButton>
      </div>

      {/* Tab Content */}
      <Card>
        <CardContent className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Flow Run Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">State Details</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Type:</span>
                        <span className="text-sm font-medium">{flowRun.state_type || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Name:</span>
                        <span className="text-sm font-medium">{flowRun.state_name || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Execution Details</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Expected Start:</span>
                        <span className="text-sm font-medium">{formatDate(flowRun.expected_start_time)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Deployment ID:</span>
                        <span className="text-sm font-mono">{flowRun.deployment_id?.substring(0, 16) || 'None'}...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'parameters' && <ParametersTab parameters={flowRun.parameters} />}
          {activeTab === 'logs' && <LogsTab flowRunId={flowRun.id} />}
          {activeTab === 'artifacts' && <ArtifactsTab flowRunId={flowRun.id} />}
        </CardContent>
      </Card>
    </div>
  );
}
