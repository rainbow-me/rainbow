import { createMMKV } from 'react-native-mmkv';

import { MigrationName, type Migration } from '@/migrations/types';

const IMGIX_STORAGE_ID = 'IMGIX_CACHE';

export function deleteImgixMMKVCache(): Migration {
  return {
    name: MigrationName.deleteImgixMMKVCache,
    async defer() {
      const storage = createMMKV({ id: IMGIX_STORAGE_ID });
      storage.clearAll();
    },
  };
}
