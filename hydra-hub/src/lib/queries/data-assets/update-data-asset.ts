import { db } from '../../clients/prisma';
import { DataAsset, StorageType } from '@prisma/client';

export async function updateDataAsset(
  id: string,
  data: {
    path?: string;
    storage_type?: StorageType;
    storage_location?: string;
    asset_type?: string;
    owner_uuid?: string;
  }
): Promise<DataAsset> {
  return await db.dataAsset.update({
    where: { id },
    data
  });
}


