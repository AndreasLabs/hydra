import { MetaQueryOptions } from "@/lib/types/types-meta";


export const GetMeta = async (options: MetaQueryOptions) => {
  const { key } = options;
  const meta = await GetJson(`hydra-data/${key}.meta.json`);
  return meta;
};