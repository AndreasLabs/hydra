/*
 Simple Prefect v3 REST client for Next.js/React environments.

 Configuration via env:
   - PREFECT_API_URL: Base API URL. Examples:
       Prefect Cloud: https://api.prefect.cloud/api/accounts/{account_id}/workspaces/{workspace_id}
       Prefect Server (local): http://127.0.0.1:4200/api
   - PREFECT_API_KEY: Bearer token (required for Prefect Cloud or authenticated servers)
*/

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface PrefectClientConfig {
  baseUrl: string;
  apiKey?: string;
}

interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
}

export class PrefectHttpError extends Error {
  status: number;
  url: string;

  constructor(message: string, status: number, url: string) {
    super(message);
    this.name = 'PrefectHttpError';
    this.status = status;
    this.url = url;
  }
}

function getDefaultConfigFromEnv(): PrefectClientConfig {
  const baseUrl =
    process.env.PREFECT_API_URL?.trim() || 'http://127.0.0.1:4200/api';
  const apiKey = process.env.PREFECT_API_KEY?.trim();
  return { baseUrl, apiKey };
}

async function requestJson<T>(
  config: PrefectClientConfig,
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${config.baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new PrefectHttpError(
      `Prefect API error ${response.status}: ${text || response.statusText}`,
      response.status,
      url
    );
  }

  if (response.status === 204) return undefined as unknown as T;
  return (await response.json()) as T;
}

// Minimal types used by the UI
export interface FlowRun {
  id: string;
  name?: string;
  flow_id?: string;
  state_type?: string;
  state_name?: string;
  start_time?: string | null;
  end_time?: string | null;
  expected_start_time?: string | null;
  total_run_time?: number;
  created?: string;
  updated?: string;
  deployment_id?: string | null;
  work_queue_name?: string | null;
  tags?: string[];
  parameters?: Record<string, unknown> | null;
}

export interface LogEntry {
  id: string;
  created: string;
  updated: string;
  name: string;
  level: number;
  message: string;
  timestamp: string;
  flow_run_id: string;
  task_run_id?: string | null;
}

export interface Artifact {
  id: string;
  created: string;
  updated: string;
  key: string;
  type: string;
  description?: string;
  data?: unknown;
  metadata_?: Record<string, unknown>;
  flow_run_id?: string;
  task_run_id?: string;
}

export interface Flow {
  id: string;
  name?: string;
  created?: string;
  updated?: string;
}

export interface Deployment {
  id: string;
  name?: string;
  flow_id?: string;
  work_queue_name?: string | null;
  tags?: string[];
}

export interface FlowRunsFilterRequest {
  limit?: number;
  offset?: number;
  sort?: string; // e.g. 'START_TIME_DESC'
  flow_runs?: Record<string, unknown>;
  flows?: Record<string, unknown>;
  deployments?: Record<string, unknown>;
  work_pools?: Record<string, unknown>;
}

export interface DeploymentsFilterRequest {
  limit?: number;
  offset?: number;
  sort?: string;
  deployments?: Record<string, unknown>;
  flows?: Record<string, unknown>;
}

function createFlowRunState(type: string, name?: string, message?: string) {
  return {
    type,
    name,
    message,
    state_details: {},
    data: null,
  } as Record<string, unknown>;
}

export function createPrefectClient(config: PrefectClientConfig = getDefaultConfigFromEnv()) {
  return {
    config,

    flowRuns: {
      async filter(body: FlowRunsFilterRequest = {}): Promise<FlowRun[]> {
        const payload = {
          limit: body.limit ?? 50,
          sort: body.sort ?? 'START_TIME_DESC',
          ...body,
        };
        try {
          const res = await requestJson<FlowRun[]>(config, '/flow_runs/filter', {
            method: 'POST',
            body: payload,
          });
          return Array.isArray(res) ? res : [];
        } catch (err) {
          if (err instanceof PrefectHttpError && err.status === 404) {
            return await requestJson<FlowRun[]>(config, '/flow_runs/', { method: 'GET' });
          }
          throw err;
        }
      },

      async get(flowRunId: string): Promise<FlowRun> {
        return await requestJson<FlowRun>(config, `/flow_runs/${flowRunId}`, { method: 'GET' });
      },

      async cancel(flowRunId: string): Promise<unknown> {
        const state = createFlowRunState('CANCELLED', 'Cancelled by user');
        return await requestJson(config, `/flow_runs/${flowRunId}/set_state`, {
          method: 'POST',
          body: state,
        });
      },

      async getLogs(flowRunId: string): Promise<LogEntry[]> {
        // Use the logs filter endpoint directly since the direct endpoint doesn't exist
        try {
          const response = await requestJson<LogEntry[]>(config, '/logs/filter', {
            method: 'POST',
            body: { 
              logs: { flow_run_id: { any_: [flowRunId] } }, 
              limit: 200, // API limit is 200
              sort: 'TIMESTAMP_ASC' 
            }
          });
          return Array.isArray(response) ? response : [];
        } catch (err) {
          console.error('Failed to fetch logs:', err);
          return [];
        }
      },

      async getArtifacts(flowRunId: string): Promise<Artifact[]> {
        // Use the artifacts filter endpoint directly since the direct endpoint doesn't exist
        try {
          const response = await requestJson<Artifact[]>(config, '/artifacts/filter', {
            method: 'POST',
            body: { 
              artifacts: { flow_run_id: { any_: [flowRunId] } }, 
              limit: 200, // API limit is 200
              sort: 'CREATED_DESC' 
            }
          });
          return Array.isArray(response) ? response : [];
        } catch (err) {
          console.error('Failed to fetch artifacts:', err);
          return [];
        }
      },

      async getLatestLog(flowRunId: string): Promise<LogEntry | null> {
        // Get the most recent log entry for a flow run
        try {
          const response = await requestJson<LogEntry[]>(config, '/logs/filter', {
            method: 'POST',
            body: { 
              logs: { flow_run_id: { any_: [flowRunId] } }, 
              limit: 1, // Just get the latest one
              sort: 'TIMESTAMP_DESC' // Most recent first
            }
          });
          return Array.isArray(response) && response.length > 0 ? response[0] : null;
        } catch (err) {
          console.error('Failed to fetch latest log:', err);
          return null;
        }
      },
    },

    flows: {
      async get(flowId: string): Promise<Flow> {
        return await requestJson<Flow>(config, `/flows/${flowId}`, { method: 'GET' });
      },

      async filter(body: { flows?: Record<string, unknown>; limit?: number; sort?: string } = {}): Promise<Flow[]> {
        const payload = {
          limit: body.limit ?? 50,
          ...body,
        };
        return await requestJson<Flow[]>(config, '/flows/filter', {
          method: 'POST',
          body: payload,
        });
      },
    },

    deployments: {
      async filter(body: DeploymentsFilterRequest = {}): Promise<Deployment[]> {
        const payload = {
          limit: body.limit ?? 50,
          ...body,
        };
        return await requestJson<Deployment[]>(config, '/deployments/filter', {
          method: 'POST',
          body: payload,
        });
      },

      async createFlowRun(
        deploymentId: string,
        body: {
          parameters?: Record<string, unknown>;
          name?: string;
          tags?: string[];
          scheduled_start_time?: string | null;
        } = {}
      ): Promise<FlowRun> {
        return await requestJson<FlowRun>(
          config,
          `/deployments/${deploymentId}/create_flow_run`,
          { method: 'POST', body }
        );
      },
    },
  };
}

export const prefectClient = createPrefectClient();
