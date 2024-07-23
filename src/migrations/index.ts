import { InteractionManager } from 'react-native';

import * as env from '@/env';
import { Storage } from '@/storage';
import { logger, RainbowError } from '@/logger';

import { MIGRATIONS_DEBUG_CONTEXT, MIGRATIONS_STORAGE_ID, MigrationName, Migration } from '@/migrations/types';
import { deleteImgixMMKVCache } from '@/migrations/migrations/deleteImgixMMKVCache';
import { migrateNotificationSettingsToV2 } from '@/migrations/migrations/migrateNotificationSettingsToV2';
import { prepareDefaultNotificationGroupSettingsState } from '@/migrations/migrations/prepareDefaultNotificationGroupSettingsState';
import { changeLanguageKeys } from './migrations/changeLanguageKeys';
import { fixHiddenUSDC } from './migrations/fixHiddenUSDC';
import { purgeWcConnectionsWithoutAccounts } from './migrations/purgeWcConnectionsWithoutAccounts';
import { migratePinnedAndHiddenTokenUniqueIds } from './migrations/migratePinnedAndHiddenTokenUniqueIds';
import { migrateUnlockableAppIconStorage } from './migrations/migrateUnlockableAppIconStorage';
import { migratePersistedQueriesToMMKV } from './migrations/migratePersistedQueriesToMMKV';
import { migrateRemotePromoSheetsToZustand } from './migrations/migrateRemotePromoSheetsToZustand';

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
const migrations: Migration[] = [
  deleteImgixMMKVCache(),
  prepareDefaultNotificationGroupSettingsState(),
  migrateNotificationSettingsToV2(),
  changeLanguageKeys(),
  fixHiddenUSDC(),
  purgeWcConnectionsWithoutAccounts(),
  migratePinnedAndHiddenTokenUniqueIds(),
  migrateUnlockableAppIconStorage(),
  migratePersistedQueriesToMMKV(),
  migrateRemotePromoSheetsToZustand(),
];

/**
 * @private Only exported for testing
 */
export async function runMigration({ debug, name, migrate, defer }: Migration) {
  /**
   * If we're in prod and a migration is in debug mode, that's a mistake and we
   * should exit early
   */
  if (debug && env.IS_PROD) {
    logger.error(new RainbowError(`Migration is in debug mode`), {
      migration: name,
    });
    return;
  }

  const handler = migrate || defer;

  if (handler) {
    try {
      logger.debug(
        `Migrating`,
        {
          migration: name,
        },
        MIGRATIONS_DEBUG_CONTEXT
      );
      await handler();
      if (!debug) storage.set([name], new Date().toUTCString());
      logger.debug(
        `Migrating complete`,
        {
          migration: name,
        },
        MIGRATIONS_DEBUG_CONTEXT
      );
    } catch (e) {
      logger.error(new RainbowError(`Migration failed`), {
        migration: name,
      });
    }
  } else {
    logger.error(new RainbowError(`Migration had no handler`), {
      migration: name,
    });
  }
}

/**
 * @private Only exported for testing
 */
export async function runMigrations(migrations: Migration[]) {
  const ranMigrations = [];

  for (const migration of migrations) {
    const migratedAt = storage.get([migration.name]);
    const isDeferable = Boolean(migration.defer);

    if (!migratedAt) {
      if (isDeferable) {
        InteractionManager.runAfterInteractions(() => runMigration(migration));
      } else {
        await runMigration(migration);
      }

      ranMigrations.push(migration.name);
    } else {
      logger.debug(`Already migrated`, { migration: migration.name }, MIGRATIONS_DEBUG_CONTEXT);
    }
  }

  logger.info(`Ran or scheduled migrations`, {
    migrations: ranMigrations,
  });
}

/**
 * Run all migrations
 */
export async function migrate() {
  await runMigrations(migrations);
}
