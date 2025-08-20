import adze from 'adze';
import { GetJson } from '../../clients/minio';

const logger = adze.namespace('lib').namespace('queries').namespace('datasets').namespace('get');

export const GetDataset = async (datasetKey: string) => {
  logger.info('Getting dataset', { datasetKey });
  const normalizedKey = `datasets/${datasetKey.replace(/\//g, '_')}.json`;
  logger.debug('Fetching dataset from path', { normalizedKey });
  const dataset = await GetJson('hydra-data', normalizedKey);
  logger.info('Retrieved dataset', { datasetKey });
  return dataset;
}


