import { db } from '../../clients/prisma';
import type { DataAsset } from '@/lib/queries/data-assets/types';

export async function deleteDataAsset(id: string): Promise<DataAsset> {
  return await db.dataAsset.delete({
    where: { id }
  });
}


