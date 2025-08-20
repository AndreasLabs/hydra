import { db } from "../clients/db";
import minioClient, { GetJson, ListObjects, SaveJson } from "../clients/ObjectStore";

import adze from 'adze';

const logger = adze.namespace('lib').namespace('handlers').namespace('DatasetHandlers');

export type DatasetQueryType = 'objectstore/path' | 'objectstore/object' | 'objectstore/bucket';
export type DatasetQuery = {
  query: string;
  type: DatasetQueryType;
  exclude: boolean;
}

export type Dataset = {
  key: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  queries: DatasetQuery[];
}

export const CreateDataset = async (dataset: Dataset) => {
  logger.info('Creating dataset', { dataset });
  // Save the dataset to the object store in path /datasets/{dataset.key} as a json file
  // Replace any / with - in the key
  const datasetPath = `/datasets/${dataset.key.replace(/\//g, '_')}`;
  // Add .json to the path
  await SaveJson('hydra-data', datasetPath, dataset);
  logger.info('Created dataset', { datasetPath });
}

export const GetDataset = async (datasetKey: string) => {
  logger.info('Getting dataset', { datasetKey });
  // Normalize to stored object key and include .json
  const normalizedKey = `datasets/${datasetKey.replace(/\//g, '_')}.json`;
  logger.debug('Fetching dataset from path', { normalizedKey });
  const dataset = await GetJson('hydra-data', normalizedKey);
  logger.info('Retrieved dataset', { datasetKey, dataset });
  return dataset;
}

export const AddQueryToDataset = async (datasetKey: string, query: DatasetQuery) => {
  logger.info('Adding query to dataset', { datasetKey, query });
  const dataset = await GetDataset(datasetKey);
  dataset.queries.push(query);
  logger.debug('Saving updated dataset', { datasetKey, dataset });
  await CreateDataset(dataset);
  logger.info('Added query to dataset', { datasetKey, query });
}

export const ListDatasets = async () => {
  const objects = await ListObjects('hydra-data', 'datasets', true);
  const datasets = [] as any[];

  for (const obj of objects) {
    // Only consider dataset definition files
    const objectName = obj.name || '';
    if (!objectName || !objectName.endsWith('.json')) continue;

    try {
      const content = await GetJson('hydra-data', objectName);
      // Ensure a stable shape
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