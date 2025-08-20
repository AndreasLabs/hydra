import type { NextApiRequest, NextApiResponse } from 'next';
import { StorageType } from '../../../../generated/prisma';
import { fetchDataAssets as getDataAssets, createDataAsset } from '@/lib/handlers/DataAssetHandlers';
import adze from 'adze';

const logger = adze.namespace('api').namespace('data-assets');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  logger.info('Incoming request', { method: req.method, url: req.url });
  try {
    switch (req.method) {
      case 'GET':
        const dataAssets = await getDataAssets();
        logger.info('Fetched data assets', { count: Array.isArray(dataAssets) ? dataAssets.length : 0 });
        res.status(200).json(dataAssets);
        break;

      case 'POST':
        const { path, storage_type, storage_location, asset_type, owner_uuid } = req.body;
        
        if (!path || !storage_type || !storage_location || !asset_type || !owner_uuid) {
          logger.warn('Missing required fields on create', { path: !!path, storage_type: !!storage_type, storage_location: !!storage_location, asset_type: !!asset_type, owner_uuid: !!owner_uuid });
          return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!Object.values(StorageType).includes(storage_type)) {
          logger.warn('Invalid storage_type', { storage_type });
          return res.status(400).json({ error: 'Invalid storage_type' });
        }

        const newDataAsset = await createDataAsset({
          path,
          storage_type,
          storage_location,
          asset_type,
          owner_uuid
        });
        
        logger.info('Created data asset', { id: newDataAsset?.id, path: newDataAsset?.path });
        res.status(201).json(newDataAsset);
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    logger.error('API Error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
}
