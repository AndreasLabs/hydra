import type { NextApiRequest, NextApiResponse } from 'next';
import { StorageType } from '../../../../generated/prisma';
import { fetchDataAssetById as getDataAssetById } from '@/lib/queries/data-assets/fetch-data-asset-by-id';
import { updateDataAsset } from '@/lib/queries/data-assets/update-data-asset';
import { deleteDataAsset } from '@/lib/queries/data-assets/delete-data-asset';
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

        const updateData: any = {};
        const { path, storage_type, storage_location, asset_type, owner_uuid } = req.body;

        if (path !== undefined) updateData.path = path;
        if (storage_type !== undefined) {
          if (!Object.values(StorageType).includes(storage_type)) {
            logger.warn('Invalid storage_type on update', { storage_type });
            return res.status(400).json({ error: 'Invalid storage_type' });
          }
          updateData.storage_type = storage_type;
        }
        if (storage_location !== undefined) updateData.storage_location = storage_location;
        if (asset_type !== undefined) updateData.asset_type = asset_type;
        if (owner_uuid !== undefined) updateData.owner_uuid = owner_uuid;

        const updatedDataAsset = await updateDataAsset(id, updateData);
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
