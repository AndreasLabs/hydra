import { db } from '../../clients/prisma';
import type { DataAsset } from '@/lib/queries/data-assets/types';

export async function fetchDataAssetById(id: string): Promise<DataAsset | null> {
  return await db.dataAsset.findUnique({
    where: { id }
  });
}


