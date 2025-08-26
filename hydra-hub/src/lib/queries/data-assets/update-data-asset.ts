import { db } from '../../clients/prisma';
import type { DataAsset, DataAssetUpdate } from '@/lib/queries/data-assets/types';

export async function updateDataAsset(
  id: string,
  data: DataAssetUpdate
): Promise<DataAsset> {
  return await db.dataAsset.update({
    where: { id },
    data
  });
}


