import { InteractionManager } from 'react-native';

import * as env from '@/env';
import { logger, RainbowError } from '@/logger';
import { Storage } from '@/storage';

import { deleteImgixMMKVCache } from '@/migrations/migrations/deleteImgixMMKVCache';
import { migrateNotificationSettingsToV2 } from '@/migrations/migrations/migrateNotificationSettingsToV2';
import { migrateNotificationSettingsToV3 } from '@/migrations/migrations/migrateNotificationSettingsToV3';
import { prepareDefaultNotificationGroupSettingsState } from '@/migrations/migrations/prepareDefaultNotificationGroupSettingsState';
import { Migration, MigrationName, MIGRATIONS_DEBUG_CONTEXT, MIGRATIONS_STORAGE_ID } from '@/migrations/types';
import { changeLanguageKeys } from './migrations/changeLanguageKeys';
import { fixHiddenUSDC } from './migrations/fixHiddenUSDC';
import { migrateFavoritesV2, migrateFavoritesV3 } from './migrations/migrateFavorites';
import { migratePersistedQueriesToMMKV } from './migrations/migratePersistedQueriesToMMKV';
import { migratePinnedAndHiddenTokenUniqueIds } from './migrations/migratePinnedAndHiddenTokenUniqueIds';
import { migrateRemotePromoSheetsToZustand } from './migrations/migrateRemotePromoSheetsToZustand';
import { migrateUnlockableAppIconStorage } from './migrations/migrateUnlockableAppIconStorage';
import { purgeWcConnectionsWithoutAccounts } from './migrations/purgeWcConnectionsWithoutAccounts';

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
  migrateFavoritesV2(),
  migrateFavoritesV3(),
  migrateNotificationSettingsToV3(),
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
    logger.error(new RainbowError(`[migrations]: is in debug mode`), {
      migration: name,
    });
    return;
  }

  const handler = migrate || defer;

  if (handler) {
    try {
      logger.debug(
        `[migrations]: Migrating`,
        {
          migration: name,
        },
        MIGRATIONS_DEBUG_CONTEXT
      );
      await handler();
      if (!debug) storage.set([name], new Date().toUTCString());
      logger.debug(
        `[migrations]: Migrating complete`,
        {
          migration: name,
        },
        MIGRATIONS_DEBUG_CONTEXT
      );
    } catch (e) {
      logger.error(new RainbowError(`[migrations]: Migration failed`), {
        migration: name,
      });
    }
  } else {
    logger.error(new RainbowError(`[migrations]: Migration had no handler`), {
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
      logger.debug(`[migrations]: Already migrated`, { migration: migration.name }, MIGRATIONS_DEBUG_CONTEXT);
    }
  }

  logger.debug(`[migrations]: Ran or scheduled migrations`, {
    migrations: ranMigrations,
  });
}

/**
 * Run all migrations
 */
export async function migrate() {
  await runMigrations(migrations);
}
