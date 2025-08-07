// Shared types for DataAsset to avoid importing Prisma types in browser components
export type StorageType = 'OBJECT' | 'TABLE';

export interface DataAsset {
  id: string;
  path: string;
  storage_type: StorageType;
  storage_location: string;
  asset_type: string;
  date_created: Date | string;
  date_updated: Date | string;
  owner_uuid: string;
}
