import type { NextApiRequest, NextApiResponse } from 'next';
import adze from 'adze';
import { ListFiles } from '@/lib/queries/files/list-files';
import { ZFileSortField } from '@/lib/types/types-files';
import { z } from 'zod';

const logger = adze;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  logger.info('Incoming request', { method: req.method, url: req.url });

  try {
    switch (req.method) {
      case 'GET': {
        const listFilesQuerySchema = z.object({
          path: z.string().min(1).optional(),
          recursive: z.preprocess((v) => {
            const s = Array.isArray(v) ? v[0] : v;
            if (typeof s === 'string') return ['1', 'true', 'yes', 'on'].includes(s.toLowerCase());
            if (typeof s === 'boolean') return s;
            return undefined;
          }, z.boolean().default(true)),
          nameContains: z.string().optional(),
          nameStartsWith: z.string().optional(),
          nameEndsWith: z.string().optional(),
          extensions: z.preprocess((v) => {
            const s = Array.isArray(v) ? v[0] : v;
            if (typeof s !== 'string') return undefined;
            return s.split(',').map((x) => x.trim()).filter(Boolean);
          }, z.array(z.string()).optional()),
          minSize: z.preprocess((v) => typeof v === 'string' ? Number(v) : v, z.number().int().nonnegative().optional()),
          maxSize: z.preprocess((v) => typeof v === 'string' ? Number(v) : v, z.number().int().nonnegative().optional()),
          modifiedAfter: z.preprocess((v) => typeof v === 'string' ? new Date(v) : v, z.date().optional()),
          modifiedBefore: z.preprocess((v) => typeof v === 'string' ? new Date(v) : v, z.date().optional()),
          sortBy: ZFileSortField.optional(),
          sortOrder: z.enum(['asc', 'desc']).optional(),
        }).strict();

        const parsed = listFilesQuerySchema.safeParse(req.query);
        if (!parsed.success) {
          logger.warn('Invalid query for files list', { issues: parsed.error.issues });
          return res.status(400).json({ error: 'Invalid query', issues: parsed.error.issues });
        }

        const q = parsed.data;
        const filter = {
          nameContains: q.nameContains,
          nameStartsWith: q.nameStartsWith,
          nameEndsWith: q.nameEndsWith,
          extensions: q.extensions,
          minSize: q.minSize,
          maxSize: q.maxSize,
          modifiedAfter: q.modifiedAfter,
          modifiedBefore: q.modifiedBefore,
        };
        const sort = q.sortBy ? { by: q.sortBy, order: q.sortOrder } : undefined;

        logger.debug('Listing files with options', { path: q.path, recursive: q.recursive, filter, sort });
        const files = await ListFiles({ path: q.path, recursive: q.recursive, filter, sort });
        logger.info('Files listed', { count: files.length });
        return res.status(200).json(files);
      }

      default: {
        logger.warn('Method not allowed', { method: req.method });
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    }
  } catch (error) {
    logger.error('API Error', { error });
    return res.status(500).json({ error: 'Internal server error' });
  }
}


