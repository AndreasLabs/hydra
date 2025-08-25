import type { NextApiRequest, NextApiResponse } from 'next';
import adze from 'adze';
import { z } from 'zod';
import { PreviewFile } from '@/lib/queries/files/preview-file';
import { UnsupportedPreviewTypeError } from '@/lib/queries/files/preview-file';

const logger = adze;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  logger.info('Incoming request (preview-file)', { method: req.method, url: req.url });

  try {
    switch (req.method) {
      case 'GET': {
        const previewQuerySchema = z.object({
          key: z.string().min(1).optional(),
          path: z.string().min(1).optional(),
          limit: z.preprocess((v) => {
            const s = Array.isArray(v) ? v[0] : v;
            if (typeof s === 'string') {
              const n = Number(s);
              return Number.isFinite(n) ? n : undefined;
            }
            if (typeof s === 'number') return s;
            return undefined;
          }, z.number().int().positive().max(10_000).default(10_000)),
        }).refine((d) => d.key || d.path, { message: 'Either key or path is required' });

        const parsed = previewQuerySchema.safeParse(req.query);
        if (!parsed.success) {
          logger.warn('Invalid query for file preview', { issues: parsed.error.issues });
          return res.status(400).json({ error: 'Invalid query', issues: parsed.error.issues });
        }

        const q = parsed.data;
        const objectKey = q.key ?? q.path!;
        const limit = q.limit;

        logger.debug('Generating preview via lib', { objectKey, limit });
        try {
          const result = await PreviewFile({ key: objectKey, limit });
          logger.info('Preview generated', { objectKey});
          return res.status(200).json(result);
        } catch (err) {
          if (err instanceof UnsupportedPreviewTypeError) {
            logger.warn('Unsupported preview type', { objectKey });
            return res.status(415).json({ error: 'Only txt or json files can be previewed' });
          }
          throw err;
        }
      }

      default: {
        logger.warn('Method not allowed (preview-file)', { method: req.method });
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    }
  } catch (error) {
    logger.error('API Error (preview-file)', { error });
    return res.status(500).json({ error: 'Internal server error' });
  }
}


