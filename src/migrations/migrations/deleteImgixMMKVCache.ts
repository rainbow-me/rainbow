import { MMKV } from 'react-native-mmkv';

import { Migration, MigrationName } from '@/migrations/types';

const IMGIX_STORAGE_ID = 'IMGIX_CACHE';

export function deleteImgixMMKVCache(): Migration {
  return {
    name: MigrationName.deleteImgixMMKVCache,
    async defer() {
      const storage = new MMKV({ id: IMGIX_STORAGE_ID });
      storage.clearAll();
    },
  };
}
