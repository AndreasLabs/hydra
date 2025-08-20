import adze from 'adze';
import type { DatasetQuery } from './types';
import { GetDataset } from './get-dataset';
import { CreateDataset } from './create-dataset';

const logger = adze.namespace('lib').namespace('queries').namespace('datasets').namespace('add-query');

export const AddQueryToDataset = async (datasetKey: string, query: DatasetQuery) => {
  logger.info('Adding query to dataset', { datasetKey, query });
  const dataset = await GetDataset(datasetKey);
  dataset.queries.push(query);
  logger.debug('Saving updated dataset', { datasetKey });
  await CreateDataset(dataset);
  logger.info('Added query to dataset', { datasetKey });
}


