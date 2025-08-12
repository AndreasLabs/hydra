import type { NextApiRequest, NextApiResponse } from 'next';
import { StorageType } from '../../../../generated/prisma';
import { fetchDataAssetById as getDataAssetById, updateDataAsset, deleteDataAsset } from '@/lib/data-assets/queries';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        const dataAsset = await getDataAssetById(id);
        if (!dataAsset) {
          return res.status(404).json({ error: 'Data asset not found' });
        }
        res.status(200).json(dataAsset);
        break;

      case 'PUT':
        const existingAsset = await getDataAssetById(id);
        if (!existingAsset) {
          return res.status(404).json({ error: 'Data asset not found' });
        }

        const updateData: any = {};
        const { path, storage_type, storage_location, asset_type, owner_uuid } = req.body;

        if (path !== undefined) updateData.path = path;
        if (storage_type !== undefined) {
          if (!Object.values(StorageType).includes(storage_type)) {
            return res.status(400).json({ error: 'Invalid storage_type' });
          }
          updateData.storage_type = storage_type;
        }
        if (storage_location !== undefined) updateData.storage_location = storage_location;
        if (asset_type !== undefined) updateData.asset_type = asset_type;
        if (owner_uuid !== undefined) updateData.owner_uuid = owner_uuid;

        const updatedDataAsset = await updateDataAsset(id, updateData);
        res.status(200).json(updatedDataAsset);
        break;

      case 'DELETE':
        const assetToDelete = await getDataAssetById(id);
        if (!assetToDelete) {
          return res.status(404).json({ error: 'Data asset not found' });
        }

        await deleteDataAsset(id);
        res.status(200).json({ message: 'Data asset deleted successfully' });
        break;

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
