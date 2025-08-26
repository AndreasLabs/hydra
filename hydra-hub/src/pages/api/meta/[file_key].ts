import type { NextApiRequest, NextApiResponse } from 'next';
import adze from 'adze';
import { z } from 'zod';
import { GetMeta } from '@/lib/queries/meta/get-meta';

const logger = adze;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  logger.info('Incoming request (get-meta)', { method: req.method, url: req.url });

  try {
    switch (req.method) {
      case 'GET': {
        const pathSchema = z.object({
          file_key: z.preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string().min(1)),
        }).strict();

        const parsed = pathSchema.safeParse(req.query);
        if (!parsed.success) {
          logger.warn('Invalid path params for get-meta', { issues: parsed.error.issues });
          return res.status(400).json({ error: 'Invalid path params', issues: parsed.error.issues });
        }

        const { file_key } = parsed.data;
        const result = await GetMeta({ key: file_key });
        return res.status(200).json(result);
      }

      default: {
        logger.warn('Method not allowed (get-meta)', { method: req.method });
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    }
  } catch (error) {
    logger.error('API Error (get-meta)', { error });
    return res.status(500).json({ error: 'Internal server error' });
  }
}


