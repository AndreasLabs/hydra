import type { NextApiRequest, NextApiResponse } from 'next';
import { prefectClient, type FlowRun } from '@/lib/prefect/client';

// Mock data for now - in production, you would configure these from environment variables
const PREFECT_API_URL = process.env.PREFECT_API_URL || 'https://api.prefect.cloud/api/accounts/{account_id}/workspaces/{workspace_id}';
const PREFECT_API_KEY = process.env.PREFECT_API_KEY;

async function fetchPrefectFlowRuns(): Promise<FlowRun[]> {
  // For now, return mock data since we don't have actual Prefect credentials
  // In production, you would make actual API calls to Prefect
  
  const isPlaceholder = PREFECT_API_URL.includes('{account_id}') || PREFECT_API_URL.includes('{workspace_id}');
  if (isPlaceholder) {
    // Return mock data for demonstration
    return [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'data-processing-flow-run-1',
        flow_id: '550e8400-e29b-41d4-a716-446655440001',
        state_type: 'COMPLETED',
        state_name: 'Completed',
        start_time: new Date(Date.now() - 3600000).toISOString(),
        end_time: new Date(Date.now() - 3000000).toISOString(),
        expected_start_time: new Date(Date.now() - 3600000).toISOString(),
        total_run_time: 600,
        created: new Date(Date.now() - 7200000).toISOString(),
        updated: new Date(Date.now() - 3000000).toISOString(),
        deployment_id: '550e8400-e29b-41d4-a716-446655440002',
        work_queue_name: 'default',
        tags: ['production', 'data-processing'],
        parameters: { batch_size: 1000, source: 's3://data-bucket' }
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'etl-pipeline-run-2',
        flow_id: '550e8400-e29b-41d4-a716-446655440004',
        state_type: 'RUNNING',
        state_name: 'Running',
        start_time: new Date(Date.now() - 1800000).toISOString(),
        end_time: null,
        expected_start_time: new Date(Date.now() - 1800000).toISOString(),
        total_run_time: 1800,
        created: new Date(Date.now() - 3600000).toISOString(),
        updated: new Date(Date.now() - 60000).toISOString(),
        deployment_id: '550e8400-e29b-41d4-a716-446655440005',
        work_queue_name: 'etl-queue',
        tags: ['etl', 'staging'],
        parameters: { environment: 'staging', parallel_tasks: 4 }
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440006',
        name: 'data-validation-run-3',
        flow_id: '550e8400-e29b-41d4-a716-446655440007',
        state_type: 'FAILED',
        state_name: 'Failed',
        start_time: new Date(Date.now() - 7200000).toISOString(),
        end_time: new Date(Date.now() - 6600000).toISOString(),
        expected_start_time: new Date(Date.now() - 7200000).toISOString(),
        total_run_time: 600,
        created: new Date(Date.now() - 10800000).toISOString(),
        updated: new Date(Date.now() - 6600000).toISOString(),
        deployment_id: '550e8400-e29b-41d4-a716-446655440008',
        work_queue_name: 'validation-queue',
        tags: ['validation', 'quality-check'],
        parameters: { validation_rules: ['not_null', 'unique'], threshold: 0.95 }
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440009',
        name: 'ml-training-run-4',
        flow_id: '550e8400-e29b-41d4-a716-446655440010',
        state_type: 'SCHEDULED',
        state_name: 'Scheduled',
        start_time: null,
        end_time: null,
        expected_start_time: new Date(Date.now() + 3600000).toISOString(),
        total_run_time: 0,
        created: new Date(Date.now() - 1800000).toISOString(),
        updated: new Date(Date.now() - 1800000).toISOString(),
        deployment_id: '550e8400-e29b-41d4-a716-446655440011',
        work_queue_name: 'ml-queue',
        tags: ['machine-learning', 'training'],
        parameters: { model_type: 'random_forest', epochs: 100 }
      }
    ];
  }

  try {
    const runs = await prefectClient.flowRuns.filter({ limit: 25, sort: 'START_TIME_DESC' });
    return runs;
  } catch (error) {
    console.error('Error fetching Prefect flow runs:', error);
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        const flowRuns = await fetchPrefectFlowRuns();
        res.status(200).json(flowRuns);
        break;

      default:
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
