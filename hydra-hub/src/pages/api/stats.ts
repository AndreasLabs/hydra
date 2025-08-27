import type { NextApiRequest, NextApiResponse } from 'next';
import adze from 'adze';
import { z } from 'zod';
import { GetStats } from '@/lib/queries/stats/get-stats';

const logger = adze.namespace('api').namespace('stats');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  logger.info('Incoming request (stats)', { method: req.method, url: req.url });

  try {
    switch (req.method) {
      case 'GET': {
        const querySchema = z.object({
          path: z.string().optional(),
          recursive: z.preprocess((v) => {
            const s = Array.isArray(v) ? v[0] : v;
            if (typeof s === 'string') return ['1', 'true', 'yes', 'on'].includes(s.toLowerCase());
            if (typeof s === 'boolean') return s;
            return undefined;
          }, z.boolean().default(true)),
        }).strict();

        const parsed = querySchema.safeParse(req.query);
        if (!parsed.success) {
          logger.warn('Invalid query for stats', { issues: parsed.error.issues });
          return res.status(400).json({ error: 'Invalid query', issues: parsed.error.issues });
        }

        const { path, recursive } = parsed.data;
        const stats = await GetStats({ path, recursive });
        return res.status(200).json(stats);
      }

      default: {
        logger.warn('Method not allowed (stats)', { method: req.method });
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    }
  } catch (error) {
    logger.error('API Error (stats)', { error });
    return res.status(500).json({ error: 'Internal server error' });
  }
}


