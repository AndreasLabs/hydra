import { db } from './db';
import { DataAsset, StorageType } from '@prisma/client';

export async function fetchDataAssets(): Promise<DataAsset[]> {
  return await db.dataAsset.findMany({
    orderBy: {
      date_created: 'desc'
    }
  });
}

export async function fetchDataAssetById(id: string): Promise<DataAsset | null> {
  return await db.dataAsset.findUnique({
    where: { id }
  });
}

export async function createDataAsset(data: {
  path: string;
  storage_type: StorageType;
  storage_location: string;
  asset_type: string;
  owner_uuid: string;
}): Promise<DataAsset> {
  return await db.dataAsset.create({
    data
  });
}

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

export async function deleteDataAsset(id: string): Promise<DataAsset> {
  return await db.dataAsset.delete({
    where: { id }
  });
}
