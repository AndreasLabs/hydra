import type { NextApiRequest, NextApiResponse } from 'next';
import adze from 'adze';
import { z } from 'zod';
import { GetUrl } from '@/lib/queries/files/get-url';

const logger = adze;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  logger.info('Incoming request (get-url)', { method: req.method, url: req.url });

  try {
    switch (req.method) {
      case 'GET': {
        const querySchema = z.object({
          key: z.string().min(1),
          expiry: z.preprocess((v) => {
            const s = Array.isArray(v) ? v[0] : v;
            if (typeof s === 'string') {
              const n = Number(s);
              return Number.isFinite(n) ? n : undefined;
            }
            if (typeof s === 'number') return s;
            return undefined;
          }, z.number().int().positive().max(3600).optional()),
        }).strict();

        const parsed = querySchema.safeParse(req.query);
        if (!parsed.success) {
          logger.warn('Invalid query for get-url', { issues: parsed.error.issues });
          return res.status(400).json({ error: 'Invalid query', issues: parsed.error.issues });
        }

        const { key, expiry } = parsed.data;
        const result = await GetUrl({ key, expirySeconds: expiry });
        return res.status(200).json(result);
      }

      default: {
        logger.warn('Method not allowed (get-url)', { method: req.method });
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    }
  } catch (error) {
    logger.error('API Error (get-url)', { error });
    return res.status(500).json({ error: 'Internal server error' });
  }
}


