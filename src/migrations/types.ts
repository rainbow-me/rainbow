import { DebugContext } from '@/logger/debugContext';

export const MIGRATIONS_DEBUG_CONTEXT = DebugContext.migrations;
export const MIGRATIONS_STORAGE_ID = 'migrations';

/**
 * UNIQUE names for all migrations. Using an enum here forces the values to be
 * unique. Please follow the naming convention for consistencies sake.
 */
export enum MigrationName {
  deleteImgixMMKVCache = 'migration_deleteImgixMMKVCache',
}

export type Migration = {
  /**
   * Must be a UNIQUE name of the migration.
   */
  name: MigrationName;

  /**
   * An async function that runs your migration. This handler MUST NOT swallow
   * errors. If an error is swallowed, the migration will be incorrectly marked
   * as complete.
   */
  migrate(): Promise<void>;
};
