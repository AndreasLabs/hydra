import { db } from '../../clients/prisma';
import { DataAsset } from '@prisma/client';

export async function fetchDataAssets(): Promise<DataAsset[]> {
  return await db.dataAsset.findMany({
    orderBy: {
      date_created: 'desc'
    }
  });
}


