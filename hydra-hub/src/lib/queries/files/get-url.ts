import adze from 'adze';
import minioClient from '@/lib/clients/minio';

const logger = adze;

export type GetUrlOptions = {
  key: string; // object key within bucket
  expirySeconds?: number; // default 300s
};

export type GetUrlResult = {
  key: string;
  url: string;
  expiresIn: number;
};

export async function GetUrl(options: GetUrlOptions): Promise<GetUrlResult> {
  const { key } = options;
  const expiresIn = Math.min(Math.max(60, options.expirySeconds ?? 300), 3600);

  logger.info('Generating presigned URL', { key, expiresIn });
  const normalizedKey = key.replace(/^\/+/, '');
  const url = await minioClient.presignedGetObject('hydra-data', normalizedKey, expiresIn);
  logger.info('Generated presigned URL', { key });
  return { key: normalizedKey, url, expiresIn };
}


