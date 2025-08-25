import { z } from 'zod';

export type FileFilterOptions = {
  nameContains?: string;
  nameStartsWith?: string;
  nameEndsWith?: string;
  extensions?: string[];
  minSize?: number;
  maxSize?: number;
  modifiedAfter?: Date;
  modifiedBefore?: Date;
}

export type FileSortField = 'name' | 'size' | 'lastModified';

export type FileSortOptions = {
  by: FileSortField;
  order?: 'asc' | 'desc';
}

export type ListFileQueryOptions = {
  path?: string;
  recursive?: boolean;
  filter?: FileFilterOptions;
  sort?: FileSortOptions;
}

export type ListFileResult = {
    key: string;
    name: string;
    size: number;
    lastModified: Date;
    metadata: Record<string, any>;
    raw_minio: string;
}

// Zod schemas mirroring the above runtime shapes
export const ZFileSortField = z.enum(['name', 'size', 'lastModified']);

export const ZFileFilterOptions = z.object({
  nameContains: z.string().optional(),
  nameStartsWith: z.string().optional(),
  nameEndsWith: z.string().optional(),
  extensions: z.array(z.string()).optional(),
  minSize: z.number().int().nonnegative().optional(),
  maxSize: z.number().int().nonnegative().optional(),
  modifiedAfter: z.date().optional(),
  modifiedBefore: z.date().optional(),
}).strict().partial();

export const ZFileSortOptions = z.object({
  by: ZFileSortField,
  order: z.enum(['asc', 'desc']).optional(),
}).strict();

export const ZListFileQueryOptions = z.object({
  path: z.string().optional(),
  recursive: z.boolean().optional(),
  filter: ZFileFilterOptions.optional(),
  sort: ZFileSortOptions.optional(),
}).strict();

export const ZListFileResult = z.object({
  key: z.string(),
  name: z.string(),
  size: z.number().int().nonnegative(),
  lastModified: z.date(),
  metadata: z.record(z.string(), z.unknown()),
  raw_minio: z.string(),
}).strict();

// Preview types
export type PreviewKind = 'text' | 'image';

export type PreviewFileOptions = {
  key: string;
  limit?: number; // for text; max 10_000
  expirySeconds?: number; // for image urls
}

export type PreviewTextResult = {
  kind: 'text';
  key: string;
  content: string;
  truncated: boolean;
}

export type PreviewImageResult = {
  kind: 'image';
  key: string;
  url: string; // presigned
  expiresIn: number; // seconds
}

export type PreviewFileResult = PreviewTextResult | PreviewImageResult;

export const ZPreviewFileOptions = z.object({
  key: z.string().min(1),
  limit: z.number().int().positive().max(10_000).optional(),
  expirySeconds: z.number().int().positive().max(60 * 60).optional(),
}).strict();

export const ZPreviewTextResult = z.object({
  kind: z.literal('text'),
  key: z.string(),
  content: z.string(),
  truncated: z.boolean(),
}).strict();

export const ZPreviewImageResult = z.object({
  kind: z.literal('image'),
  key: z.string(),
  url: z.string().url(),
  expiresIn: z.number().int().positive(),
}).strict();

export const ZPreviewFileResult = z.union([ZPreviewTextResult, ZPreviewImageResult]);