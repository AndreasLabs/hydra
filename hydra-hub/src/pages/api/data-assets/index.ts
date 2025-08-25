import type { NextApiRequest, NextApiResponse } from 'next';
import { StorageType } from '../../../../generated/prisma';
import { fetchDataAssets as getDataAssets } from '@/lib/queries/data-assets/fetch-data-assets';
import { createDataAsset } from '@/lib/queries/data-assets/create-data-asset';
import { ZDataAssetCreate } from '@/lib/queries/data-assets/types';
import { z } from 'zod';
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
        const parsed = ZDataAssetCreate.safeParse(req.body);
        if (!parsed.success) {
          logger.warn('Invalid data-asset POST body', { issues: parsed.error.issues });
          return res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
        }

        const { path, storage_type, storage_location, asset_type, owner_uuid } = parsed.data;

        // Extra guard to ensure generated prisma enum aligns
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
