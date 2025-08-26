import { z } from 'zod';

export const ZStorageType = z.enum(['OBJECT', 'TABLE']);
export type StorageType = z.infer<typeof ZStorageType>;

export type DataAssetCreate = {
  path: string;
  storage_type: StorageType;
  storage_location: string;
  asset_type: string;
  owner_uuid: string;
}

export type DataAssetUpdate = Partial<DataAssetCreate>;

export type DataAsset = {
  id: string;
  path: string;
  storage_type: StorageType;
  storage_location: string;
  asset_type: string;
  owner_uuid: string;
  date_created: Date;
  date_modified: Date;
};

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


