import type { NextApiRequest, NextApiResponse } from 'next';
import { CreateDataset } from '@/lib/queries/datasets/create-dataset';
import { ListDatasets } from '@/lib/queries/datasets/list-datasets';
import { AddQueryToDataset } from '@/lib/queries/datasets/add-query-to-dataset';
import { GetDataset } from '@/lib/queries/datasets/get-dataset';
import { ZDataset, ZDatasetQuery } from '@/lib/queries/datasets/types';
import { z } from 'zod';
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
        const key = typeof req.query.key === 'string' ? req.query.key : undefined;
        if (key) {
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
        const createSchema = ZDataset.pick({ key: true, name: true, description: true, queries: true })
          .extend({
            createdAt: z.preprocess(() => new Date(), z.date()),
            updatedAt: z.preprocess(() => new Date(), z.date()),
          });

        const parsed = createSchema.safeParse(req.body);
        if (!parsed.success) {
          logger.warn('Invalid dataset POST body', { issues: parsed.error.issues });
          return res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
        }
        const dataset = parsed.data;

        logger.debug('Creating dataset', { dataset });
        await CreateDataset(dataset);
        logger.info('Created dataset successfully', { key: dataset.key });
        return res.status(201).json(dataset);
      }

      case 'PUT': {
        logger.debug('Processing PUT request', { body: req.body });
        const addQuerySchema = z.object({
          datasetKey: z.string().min(1),
          query: ZDatasetQuery,
        }).strict();

        const parsed = addQuerySchema.safeParse(req.body);
        if (!parsed.success) {
          logger.warn('Invalid dataset PUT body', { issues: parsed.error.issues });
          return res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
        }

        const { datasetKey, query } = parsed.data;
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
