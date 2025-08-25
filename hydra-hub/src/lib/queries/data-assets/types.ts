import { z } from 'zod';
import type { DataAsset as PrismaDataAsset, StorageType } from '@prisma/client';
import { StorageType as PrismaStorageType } from '@prisma/client';

export type DataAssetCreate = {
  path: string;
  storage_type: StorageType;
  storage_location: string;
  asset_type: string;
  owner_uuid: string;
}

export type DataAssetUpdate = Partial<DataAssetCreate>;

export type DataAsset = PrismaDataAsset;

export const ZStorageType = z.nativeEnum(PrismaStorageType);

export const ZDataAssetCreate = z.object({
  path: z.string().min(1),
  storage_type: ZStorageType,
  storage_location: z.string().min(1),
  asset_type: z.string().min(1),
  owner_uuid: z.string().min(1),
}).strict();

export const ZDataAssetUpdate = ZDataAssetCreate.partial().strict();

export const ZDataAsset = z.object({
  id: z.string(),
  path: z.string(),
  storage_type: ZStorageType,
  storage_location: z.string(),
  asset_type: z.string(),
  owner_uuid: z.string(),
  date_created: z.date(),
  date_modified: z.date(),
}).strict();


