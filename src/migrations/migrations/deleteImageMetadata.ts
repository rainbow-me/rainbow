import { Migration, MigrationName } from '@/migrations/types';
import { removeLocal } from '@/handlers/localstorage/common';
import { IMAGE_METADATA } from '@/handlers/localstorage/globalSettings';

export function deleteImageMetadata(): Migration {
  return {
    name: MigrationName.deleteImageMetadata,
    async defer() {
      await removeLocal(IMAGE_METADATA);
    },
  };
}
