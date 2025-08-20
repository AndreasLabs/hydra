import type { NextApiRequest, NextApiResponse } from 'next';
import { CreateDataset, ListDatasets, AddQueryToDataset, GetDataset, type Dataset, type DatasetQuery } from '@/lib/handlers/DatasetHandlers';
import adze from 'adze';

const logger = adze;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  logger.info('Handling request', { method: req.method, url: req.url });
  
  try {
    switch (req.method) {
      case 'GET': {
        logger.debug('Processing GET request');
        
        // Handle single dataset get if key provided
        const { key } = req.query;
        if (key && typeof key === 'string') {
          logger.debug('Getting single dataset', { key });
          const dataset = await GetDataset(key);
          logger.info('Retrieved dataset', { key });
          return res.status(200).json(dataset);
        }

        // Otherwise list all datasets
        const datasets = await ListDatasets();
        logger.info('Listed datasets', { n_datasets: datasets.length });
        return res.status(200).json(datasets);
      }

      case 'POST': {
        logger.debug('Processing POST request', { body: req.body });
        const { key, name, description, queries } = req.body as Partial<Dataset>;

        if (!key || !name) {
          logger.warn('Missing required fields in POST request', { key, name });
          return res.status(400).json({ error: 'Missing required fields: key, name' });
        }

        const now = new Date();
        const dataset: Dataset = {
          key,
          name,
          description: description ?? '',
          createdAt: now,
          updatedAt: now,
          queries: Array.isArray(queries) ? queries : [],
        };

        logger.debug('Creating dataset', { dataset });
        await CreateDataset(dataset);
        logger.info('Created dataset successfully', { key: dataset.key });
        return res.status(201).json(dataset);
      }

      case 'PUT': {
        logger.debug('Processing PUT request', { body: req.body });
        const { datasetKey, query } = req.body as { datasetKey: string, query: DatasetQuery };

        if (!datasetKey || !query) {
          logger.warn('Missing required fields in PUT request', { datasetKey, query });
          return res.status(400).json({ error: 'Missing required fields: datasetKey, query' });
        }

        logger.debug('Adding query to dataset', { datasetKey, query });
        await AddQueryToDataset(datasetKey, query);
        logger.info('Added query to dataset successfully', { datasetKey });
        return res.status(200).json({ message: 'Query added successfully' });
      }

      default: {
        logger.warn('Method not allowed', { method: req.method });
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    }
  } catch (error) {
    logger.error('API Error:', { error });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
