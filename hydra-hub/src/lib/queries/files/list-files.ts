import adze from 'adze';
import { ListObjects, GetJson } from '../../clients/minio';
import { ListFileQueryOptions, ListFileResult } from './types-files';

const logger = adze;


export const ListFiles = async (options: ListFileQueryOptions) => {
  logger.info('Listing files', { options });
  const objects = await ListObjects('hydra-data', options.path ?? '', options.recursive ?? true);
  logger.info('Retrieved objects from storage', { count: objects.length });
  const files = [] as ListFileResult[];

  for (const obj of objects) {
    files.push({
      key: obj.name ?? '',
      name: obj.name ?? '',
      size: obj.size,
      lastModified: obj.lastModified ?? new Date(),
      metadata: {},
      raw_minio: JSON.stringify(obj),
    });
    logger.debug('Added file to results', { key: obj.name });
  }

  let results = files;

  // Filtering
  const filter = options.filter;
  if (filter) {
    results = results.filter((file) => {
      const nameLower = file.name.toLowerCase();

      if (filter.nameContains && !nameLower.includes(filter.nameContains.toLowerCase())) {
        return false;
      }
      if (filter.nameStartsWith && !nameLower.startsWith(filter.nameStartsWith.toLowerCase())) {
        return false;
      }
      if (filter.nameEndsWith && !nameLower.endsWith(filter.nameEndsWith.toLowerCase())) {
        return false;
      }

      if (filter.extensions && filter.extensions.length > 0) {
        const ext = (() => {
          const idx = file.name.lastIndexOf('.');
          return idx >= 0 ? file.name.substring(idx + 1).toLowerCase() : '';
        })();
        const normalizedExts = filter.extensions.map((e) => e.replace(/^\./, '').toLowerCase());
        if (!normalizedExts.includes(ext)) {
          return false;
        }
      }

      if (typeof filter.minSize === 'number' && file.size < filter.minSize) {
        return false;
      }
      if (typeof filter.maxSize === 'number' && file.size > filter.maxSize) {
        return false;
      }

      if (filter.modifiedAfter && file.lastModified < filter.modifiedAfter) {
        return false;
      }
      if (filter.modifiedBefore && file.lastModified > filter.modifiedBefore) {
        return false;
      }

      return true;
    });
  }

  // Sorting
  const sort = options.sort;
  if (sort && sort.by) {
    const order = sort.order === 'desc' ? -1 : 1;
    results = [...results].sort((a, b) => {
      switch (sort.by) {
        case 'name':
          return a.name.localeCompare(b.name) * order;
        case 'size':
          return (a.size - b.size) * order;
        case 'lastModified':
          return (a.lastModified.getTime() - b.lastModified.getTime()) * order;
        default:
          return 0;
      }
    });
  }

  logger.info('Completed listing files', { count: results.length });
  return results;
}
