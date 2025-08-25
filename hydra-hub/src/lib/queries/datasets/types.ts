import { z } from 'zod';
export type DatasetQueryType = 'objectstore/path' | 'objectstore/object' | 'objectstore/bucket';

export type DatasetQuery = {
  query: string;
  type: DatasetQueryType;
  exclude: boolean;
}

export type Dataset = {
  key: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  queries: DatasetQuery[];
}



// Zod schemas mirroring the runtime shapes
export const ZDatasetQueryType = z.enum(['objectstore/path', 'objectstore/object', 'objectstore/bucket']);

export const ZDatasetQuery = z.object({
  query: z.string(),
  type: ZDatasetQueryType,
  exclude: z.boolean(),
}).strict();

export const ZDataset = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string(),
  // Accept both Date and ISO strings when parsing inbound JSON, coerce to Date
  createdAt: z.preprocess((v) => typeof v === 'string' ? new Date(v) : v, z.date()),
  updatedAt: z.preprocess((v) => typeof v === 'string' ? new Date(v) : v, z.date()),
  queries: z.array(ZDatasetQuery),
}).strict();