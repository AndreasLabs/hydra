import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';

import { FlowRun } from '@/types/workflow-job';
import { WorkflowJobsTable } from '@/components/workflow-jobs-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Play, Clock, CheckCircle, XCircle, BarChart3 } from 'lucide-react';

interface WorkflowJobsProps {
  jobs: FlowRun[];
}

export default function WorkflowJobs({ jobs }: WorkflowJobsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const refreshData = () => {
    setLoading(true);
    router.replace(router.asPath).finally(() => setLoading(false));
  };

  const handleRetry = async (id: string) => {
    // In a real implementation, this would call the Prefect API to retry the flow run
    console.log('Retrying job:', id);
    // For now, just refresh the data
    refreshData();
  };

  const handleCancel = async (id: string) => {
    // In a real implementation, this would call the Prefect API to cancel the flow run
    console.log('Cancelling job:', id);
    // For now, just refresh the data
    refreshData();
  };

  // Calculate statistics
  const totalJobs = jobs.length;
  const runningJobs = jobs.filter(job => job.state_type === 'RUNNING').length;
  const completedJobs = jobs.filter(job => job.state_type === 'COMPLETED').length;
  const failedJobs = jobs.filter(job => job.state_type === 'FAILED' || job.state_type === 'CRASHED').length;
  const scheduledJobs = jobs.filter(job => job.state_type === 'SCHEDULED' || job.state_type === 'PENDING').length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-muted-foreground">
            Monitor and manage your Prefect workflow executions
          </p>
        </div>
        <Button 
          onClick={refreshData} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJobs}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <Play className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{runningJobs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedJobs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedJobs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{scheduledJobs}</div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
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
            loading={loading}
            onRetry={handleRetry}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    // In production, you might want to fetch from your own API or directly from Prefect
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/workflow-jobs`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch workflow jobs');
    }
    
    const jobs = await response.json();

    return {
      props: {
        jobs,
      },
    };
  } catch (error) {
    console.error('Failed to fetch workflow jobs:', error);
    return {
      props: {
        jobs: [],
      },
    };
  }
};
