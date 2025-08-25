import adze from 'adze';
import minioClient from '@/lib/clients/minio';
import type { PreviewFileOptions, PreviewFileResult } from './types-files';
import { getFileExtension, isImageExtension, isTextExtension } from '@/lib/constants/files';

const logger = adze;

export class UnsupportedPreviewTypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedPreviewTypeError';
  }
}

export async function PreviewFile(options: PreviewFileOptions): Promise<PreviewFileResult> {
  const { key } = options;
  const limit = Math.min(Math.max(1, options.limit ?? 10_000), 10_000);

  logger.info('Previewing file', { key, limit });

  const ext = getFileExtension(key);

  if (isImageExtension(ext)) {
    const expiresIn = Math.min(Math.max(60, options.expirySeconds ?? 300), 3600);
    const url = await minioClient.presignedGetObject('hydra-data', key, expiresIn);
    logger.info('Generated image preview url', { key, expiresIn });
    return { kind: 'image', key, url, expiresIn };
  }

  if (isTextExtension(ext)) {
    const objectStream = await minioClient.getObject('hydra-data', key);
    const chunks: Buffer[] = [];
    let bytesCollected = 0;
    let truncated = false;
    for await (const chunk of objectStream as AsyncIterable<Buffer>) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      if (bytesCollected + buf.length <= limit) {
        chunks.push(buf);
        bytesCollected += buf.length;
      } else {
        const remaining = limit - bytesCollected;
        if (remaining > 0) {
          chunks.push(buf.slice(0, remaining));
          bytesCollected += remaining;
        }
        truncated = true;
        if (typeof (objectStream as any).destroy === 'function') {
          (objectStream as any).destroy();
        }
        break;
      }
    }
    const content = Buffer.concat(chunks, bytesCollected).toString('utf8');
    logger.info('Generated text preview', { key, bytes: bytesCollected, truncated });
    return { kind: 'text', key, content, truncated };
  }

  logger.warn('Unsupported preview file type', { key, ext });
  throw new UnsupportedPreviewTypeError('Unsupported preview type');
}


