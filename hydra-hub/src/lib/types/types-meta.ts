import { z } from 'zod';

export const ZMetaQueryOptions = z.object({
  key: z.string().min(1),
}).strict();

export const ZMetaQueryResult = z.array(z.object({
  file_key: z.string().min(1),
  file_path: z.string().min(1),
  meta_path: z.string().min(1),
  meta_key: z.string().min(1),
  meta_value_string: z.string().optional(),
  meta_value_map: z.record(z.string(), z.string()).optional(),
}));


export type MetaQueryOptions = z.infer<typeof ZMetaQueryOptions>;
export type MetaQueryResult = z.infer<typeof ZMetaQueryResult>;