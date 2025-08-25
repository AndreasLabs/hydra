import type { NextApiRequest, NextApiResponse } from 'next';
import adze from 'adze';
import minioClient from '@/lib/clients/minio';

const logger = adze;

function guessContentType(objectKey: string): string {
  const lower = objectKey.toLowerCase();
  if (lower.endsWith('.json')) return 'application/json';
  if (lower.endsWith('.laz') || lower.endsWith('.las')) return 'application/octet-stream';
  if (lower.endsWith('.bin')) return 'application/octet-stream';
  if (lower.endsWith('.txt')) return 'text/plain; charset=utf-8';
  return 'application/octet-stream';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const keyParam = req.query.key;
  const key = Array.isArray(keyParam) ? keyParam.join('/') : keyParam;

  if (!key || typeof key !== 'string') {
    return res.status(400).json({ error: 'Missing key' });
  }

  // Normalize and prevent path traversal
  const normalizedKey = key.replace(/^\/+/, '').replace(/\.\.+/g, '');
  logger.info('Proxying object from MinIO', { normalizedKey });

  try {
    const stream = await minioClient.getObject('hydra-data', normalizedKey);
    res.setHeader('Content-Type', guessContentType(normalizedKey));
    res.setHeader('Cache-Control', 'private, max-age=60');
    // Pipe the object stream directly to response
    (stream as any).on('error', (err: any) => {
      logger.error('Stream error from MinIO', { err });
      if (!res.headersSent) res.status(500).end('Upstream error');
    });
    (stream as any).pipe(res);
  } catch (error: any) {
    const status = error?.code === 'NoSuchKey' ? 404 : 500;
    logger.error('Failed to proxy object from MinIO', { normalizedKey, error });
    res.status(status).json({ error: 'Failed to fetch object', key: normalizedKey });
  }
}


