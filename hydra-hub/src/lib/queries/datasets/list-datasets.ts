import adze from 'adze';
import { ListObjects, GetJson } from '../../clients/minio';

const logger = adze.namespace('lib').namespace('queries').namespace('datasets').namespace('list');

export const ListDatasets = async () => {
  const objects = await ListObjects('hydra-data', 'datasets', true);
  const datasets = [] as any[];

  for (const obj of objects) {
    const objectName = obj.name || '';
    if (!objectName || !objectName.endsWith('.json')) continue;

    try {
      const content = await GetJson('hydra-data', objectName);
      const keyFromName = objectName
        .replace(/^datasets\//, '')
        .replace(/\.json$/i, '')
        .replace(/\//g, '_');

      datasets.push({
        key: content.key ?? keyFromName,
        name: content.name ?? keyFromName,
        description: content.description ?? '',
        createdAt: content.createdAt ?? obj.lastModified ?? new Date().toISOString(),
        updatedAt: content.updatedAt ?? obj.lastModified ?? new Date().toISOString(),
        queries: Array.isArray(content.queries) ? content.queries : [],
      });
    } catch (error) {
      logger.error('Failed to read dataset JSON', { objectName, error });
      continue;
    }
  }

  return datasets;
}


