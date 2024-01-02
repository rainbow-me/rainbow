import { Migration, MigrationName } from '@/migrations/types';
// import {  } from '@/redux/wallets';

export function setInitialBackupMethod(): Migration {
  return {
    name: MigrationName.setInitialBackupMethod,
    async migrate() {
      // TODO: get backup method from wallets[0] and set it as default
    },
  };
}
