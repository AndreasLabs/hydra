import { z } from 'zod';

// Define Zod schemas first
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
}).strict();

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

// Preview schemas
export const ZPreviewKind = z.enum(['text', 'image']);

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

// Infer TypeScript types from Zod schemas
export type FileSortField = z.infer<typeof ZFileSortField>;
export type FileFilterOptions = z.infer<typeof ZFileFilterOptions>;
export type FileSortOptions = z.infer<typeof ZFileSortOptions>;
export type ListFileQueryOptions = z.infer<typeof ZListFileQueryOptions>;
export type ListFileResult = z.infer<typeof ZListFileResult>;
export type PreviewKind = z.infer<typeof ZPreviewKind>;
export type PreviewFileOptions = z.infer<typeof ZPreviewFileOptions>;
export type PreviewTextResult = z.infer<typeof ZPreviewTextResult>;
export type PreviewImageResult = z.infer<typeof ZPreviewImageResult>;
export type PreviewFileResult = z.infer<typeof ZPreviewFileResult>;