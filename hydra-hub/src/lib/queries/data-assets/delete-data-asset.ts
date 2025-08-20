import { db } from '../../clients/prisma';
import { DataAsset } from '@prisma/client';

export async function deleteDataAsset(id: string): Promise<DataAsset> {
  return await db.dataAsset.delete({
    where: { id }
  });
}


