import { InteractionManager } from 'react-native';

import { Storage } from '@/storage';
import { logger, RainbowError } from '@/logger';

import {
  MIGRATIONS_DEBUG_CONTEXT,
  MIGRATIONS_STORAGE_ID,
  MigrationName,
  Migration,
} from '@/migrations/types';
import { deleteImgixMMKVCache } from '@/migrations/migrations/deleteImgixMMKVCache';

/**
 * Local storage for migrations only. Should not be exported.
 */
const storage = new Storage<
  [],
  {
    [key in MigrationName]: string;
  }
>({ id: MIGRATIONS_STORAGE_ID });

/**
 * All migrations should be added here IN the ORDER in which we need them to
 * run.
 */
const migrations: Migration[] = [deleteImgixMMKVCache()];

/**
 * @private Only exported for testing
 */
export async function runMigration({ name, migrate, defer }: Migration) {
  const handler = migrate || defer;

  if (handler) {
    try {
      logger.debug(`Migrating ${name}`, {}, MIGRATIONS_DEBUG_CONTEXT);
      await handler();
      storage.set([name], new Date().toUTCString());
      logger.debug(`Migrating ${name} complete`, {}, MIGRATIONS_DEBUG_CONTEXT);
    } catch (e) {
      logger.error(new RainbowError(`Migration ${name} failed`));
    }
  } else {
    logger.error(new RainbowError(`Migration ${name} had no handler`));
  }
}

/**
 * @private Only exported for testing
 */
export async function runMigrations(migrations: Migration[]) {
  for (const migration of migrations) {
    const migratedAt = storage.get([migration.name]);
    const isDeferable = Boolean(migration.defer);

    if (!migratedAt) {
      if (isDeferable) {
        InteractionManager.runAfterInteractions(() => runMigration(migration));
      } else {
        await runMigration(migration);
      }
    } else {
      logger.debug(
        `Already migrated ${migration.name}`,
        {},
        MIGRATIONS_DEBUG_CONTEXT
      );
    }
  }
}

/**
 * Run all migrations
 */
export async function migrate() {
  await runMigrations(migrations);
}
