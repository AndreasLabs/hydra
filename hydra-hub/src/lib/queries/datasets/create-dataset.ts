import adze from 'adze';
import { SaveJson } from '../../clients/minio';
import type { Dataset } from './types';

const logger = adze.namespace('lib').namespace('queries').namespace('datasets').namespace('create');

export const CreateDataset = async (dataset: Dataset) => {
  logger.info('Creating dataset', { dataset });
  const datasetPath = `/datasets/${dataset.key.replace(/\//g, '_')}`;
  await SaveJson('hydra-data', datasetPath, dataset);
  logger.info('Created dataset', { datasetPath });
}


