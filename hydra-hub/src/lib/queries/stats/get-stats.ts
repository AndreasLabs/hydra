import adze from 'adze';
import { ListObjects } from '@/lib/clients/minio';

export type StorageStats = {
  fileCount: number;
  totalSize: number;
};

export type GetStatsOptions = {
  path?: string;
  recursive?: boolean;
};

const logger = adze.namespace('lib').namespace('queries').namespace('stats');

export async function GetStats(options: GetStatsOptions = {}): Promise<StorageStats> {
  const path = options.path ?? '';
  const recursive = options.recursive ?? true;

  logger.info('Computing storage stats', { path, recursive });

  const objects = await ListObjects('hydra-data', path, recursive);

  let fileCount = 0;
  let totalSize = 0;

  for (const obj of objects) {
    fileCount += 1;
    totalSize += obj.size ?? 0;
  }

  logger.info('Computed storage stats', { fileCount, totalSize });
  return { fileCount, totalSize };
}


