import type { NextApiRequest, NextApiResponse } from 'next';
import { StorageType } from '../../../../generated/prisma';
import { fetchDataAssets as getDataAssets, createDataAsset } from '@/lib/data-assets/queries';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        const dataAssets = await getDataAssets();
        res.status(200).json(dataAssets);
        break;

      case 'POST':
        const { path, storage_type, storage_location, asset_type, owner_uuid } = req.body;
        
        if (!path || !storage_type || !storage_location || !asset_type || !owner_uuid) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!Object.values(StorageType).includes(storage_type)) {
          return res.status(400).json({ error: 'Invalid storage_type' });
        }

        const newDataAsset = await createDataAsset({
          path,
          storage_type,
          storage_location,
          asset_type,
          owner_uuid
        });
        
        res.status(201).json(newDataAsset);
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
