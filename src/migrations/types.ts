import { DebugContext } from '@/logger/debugContext';

export const MIGRATIONS_DEBUG_CONTEXT = DebugContext.migrations;
export const MIGRATIONS_STORAGE_ID = 'migrations';

/**
 * UNIQUE names for all migrations. Using an enum here forces the values to be
 * unique. Please follow the naming convention for consistencies sake.
 */
export enum MigrationName {
  deleteImgixMMKVCache = 'migration_deleteImgixMMKVCache',
  migrateNotificationSettingsToVersion2 = 'migration_migrateNotificationSettingsToVersion2',
  prepareDefaultNotificationGroupSettingsState = 'migration_addDefaultNotificationGroupSettings',
  changeLanguageKeys = 'migration_changeLanguageKeys',
}

export type Migration = {
  /**
   * Set to true to run the migration every time when writing your migration
   * code. DELETE THIS PROP or set to `false` before merging your code,
   * otherwise your migration will not run in production.
   */
  debug?: boolean;

  /**
   * Must be a UNIQUE name of the migration.
   */
  name: MigrationName;

  /**
   * Runs immediately on startup, and is intended for migrations that MUST
   * happen prior to anything else in the app. Be very careful about adding any
   * long-running actions in this type of migration. For long running
   * migrations, or those that don't need to happen immediately, use `defer()`
   * instead.
   *
   * This handler MUST NOT swallow errors. If an error is swallowed, the
   * migration will be incorrectly marked as complete.
   */
  migrate?(): Promise<void>;

  /**
   * Runs lazily using `InteractionManager.runAfterInteractions`. Intended for
   * long-running migrations, or those that don't need to happen immediately.
   * Not intended for migrations that are required for app startup.
   *
   * This handler MUST NOT swallow errors. If an error is swallowed, the
   * migration will be incorrectly marked as complete.
   */
  defer?(): Promise<void>;
};
