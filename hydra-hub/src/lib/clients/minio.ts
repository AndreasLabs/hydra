import * as Minio from 'minio'

import adze from 'adze';

const logger = adze.namespace("objectstore")

const minioClient = new Minio.Client({
  endPoint: '127.0.0.1',
  port: 9050,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin',
})

export const ListObjects = async (
  bucketName: string,
  prefix: string,
  recursive: boolean = true,
  filter: (item: Minio.BucketItem) => boolean = () => true
) => {
  // Normalize prefix to avoid leading slashes in object keys
  const normalizedPrefix = prefix.replace(/^\/+/, '');
  const results: Minio.BucketItem[] = [];
  const iterable = minioClient.listObjectsV2(bucketName, normalizedPrefix, recursive);
  for await (const item of iterable) {
    results.push(item);
  }
  return results;
}

export const GetJson = async (bucketName: string, path: string) => {
  const objectStream = await minioClient.getObject(bucketName, path);
  const chunks = [];
  
  for await (const chunk of objectStream) {
    chunks.push(chunk);
  }

  const data = Buffer.concat(chunks).toString('utf8');
  return JSON.parse(data);
}

export const SaveJson = async (bucketName: string, path: string, data: any) => {
  logger.info('Saving JSON to object store', { bucketName, path, data });
  const json = JSON.stringify(data);
  // Normalize path to avoid leading slashes in object keys
  const normalizedPath = path.replace(/^\/+/, '');
  const pathWithJson = `${normalizedPath}.json`;
  const metadata = {
    'Content-Type': 'application/json',
  };
  await minioClient.putObject(bucketName, pathWithJson, json, json.length, metadata);
}

export default minioClient;

