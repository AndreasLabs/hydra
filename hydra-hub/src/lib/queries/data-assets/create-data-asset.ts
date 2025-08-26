import { db } from '../../clients/prisma';
import type { DataAsset, DataAssetCreate } from '@/lib/queries/data-assets/types';

export async function createDataAsset(data: DataAssetCreate): Promise<DataAsset> {
  return await db.dataAsset.create({
    data
  });
}


