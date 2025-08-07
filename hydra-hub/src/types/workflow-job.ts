// Types for Prefect workflow jobs
export type JobState = 'SCHEDULED' | 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'CRASHED';

export type FlowRunState = 'SCHEDULED' | 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'CRASHED' | 'PAUSED';

export interface WorkflowJob {
  id: string;
  name: string;
  flow_id: string;
  flow_name: string;
  state: JobState;
  state_name: string;
  state_type: string;
  start_time: string | null;
  end_time: string | null;
  expected_start_time: string | null;
  total_run_time: number;
  created: string;
  updated: string;
  deployment_id: string | null;
  deployment_name: string | null;
  work_queue_name: string | null;
  flow_version: string | null;
  parameters: Record<string, any>;
  tags: string[];
}

export interface FlowRun {
  id: string;
  name: string;
  flow_id: string;
  state_type: FlowRunState;
  state_name: string;
  start_time: string | null;
  end_time: string | null;
  expected_start_time: string | null;
  total_run_time: number;
  created: string;
  updated: string;
  deployment_id: string | null;
  work_queue_name: string | null;
  tags: string[];
  parameters: Record<string, any>;
}

export interface PrefectApiResponse<T> {
  data: T[];
  count: number;
  limit: number;
  offset: number;
}
