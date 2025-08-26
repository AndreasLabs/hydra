import type { NextApiRequest, NextApiResponse } from 'next';
import { ZStorageType } from '@/lib/queries/data-assets/types';
import { fetchDataAssetById as getDataAssetById } from '@/lib/queries/data-assets/fetch-data-asset-by-id';
import { updateDataAsset } from '@/lib/queries/data-assets/update-data-asset';
import { deleteDataAsset } from '@/lib/queries/data-assets/delete-data-asset';
import { ZDataAssetUpdate } from '@/lib/queries/data-assets/types';
import { z } from 'zod';
import adze from 'adze';

const logger = adze.namespace('api').namespace('data-assets').namespace('[id]');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    logger.warn('Invalid ID provided');
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        const dataAsset = await getDataAssetById(id);
        if (!dataAsset) {
          logger.warn('Data asset not found', { id });
          return res.status(404).json({ error: 'Data asset not found' });
        }
        res.status(200).json(dataAsset);
        break;

      case 'PUT':
        const existingAsset = await getDataAssetById(id);
        if (!existingAsset) {
          logger.warn('Data asset not found on update', { id });
          return res.status(404).json({ error: 'Data asset not found' });
        }

        const parsed = ZDataAssetUpdate.safeParse(req.body);
        if (!parsed.success) {
          logger.warn('Invalid data-asset PUT body', { issues: parsed.error.issues });
          return res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
        }

        const { storage_type } = parsed.data;
        if (storage_type !== undefined && !ZStorageType.options.includes(storage_type)) {
          logger.warn('Invalid storage_type on update', { storage_type });
          return res.status(400).json({ error: 'Invalid storage_type' });
        }

        const updatedDataAsset = await updateDataAsset(id, parsed.data);
        logger.info('Updated data asset', { id });
        res.status(200).json(updatedDataAsset);
        break;

      case 'DELETE':
        const assetToDelete = await getDataAssetById(id);
        if (!assetToDelete) {
          logger.warn('Data asset not found on delete', { id });
          return res.status(404).json({ error: 'Data asset not found' });
        }

        await deleteDataAsset(id);
        logger.info('Deleted data asset', { id });
        res.status(200).json({ message: 'Data asset deleted successfully' });
        break;

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    logger.error('API Error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
}
