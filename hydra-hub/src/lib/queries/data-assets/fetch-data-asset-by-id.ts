import { db } from '../../clients/prisma';
import { DataAsset } from '@prisma/client';

export async function fetchDataAssetById(id: string): Promise<DataAsset | null> {
  return await db.dataAsset.findUnique({
    where: { id }
  });
}


