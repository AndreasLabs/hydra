import { db } from '../../clients/prisma';
import type { DataAsset } from '@/lib/queries/data-assets/types';

export async function fetchDataAssets(): Promise<DataAsset[]> {
  return await db.dataAsset.findMany({
    orderBy: {
      date_created: 'desc'
    }
  });
}


