import { GetJson, ListObjects } from "@/lib/clients/minio";
import { MetaQueryOptions, MetaQueryResult } from "@/lib/types/types-meta";


export const GetMeta = async (options: MetaQueryOptions) => {
  // For a given file key, search meta/{file_key}.{meta_key}.json
 // Return as ZMetaQueryResult

  const { key } = options;

  const meta_objects_for_key = await ListObjects(`hydra-data`, `meta/${key}`);

  // 3. For each file, return the meta_key and meta_value
  const meta = await Promise.all(meta_objects_for_key.map(async (file) => {
    const meta_key = file.name?.replace('.json', '').split('.').slice(-1)[0];
    const meta_value = await GetJson(`hydra-data`, file.name ?? '') as Record<string, string>;
    const meta_value_string = JSON.stringify(meta_value);
    return {
      file_key: key ?? '',
      file_path: file.name ?? '',
      meta_path: file.name ?? '',
      meta_key: meta_key ?? '',
      meta_value_string: meta_value_string ?? '',
      meta_value_map: meta_value as Record<string, string> ?? {},
    };
  }));
  return meta;
};