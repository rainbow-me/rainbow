import { describe, test, expect } from '@jest/globals';
import { MMKV } from 'react-native-mmkv';

import { logger, RainbowError } from '@/logger';
import { runMigrations } from '@/migrations';
import {
  Migration,
  MigrationName,
  MIGRATIONS_STORAGE_ID,
} from '@/migrations/types';

jest.mock('@/env', () => ({
  IS_PROD: true,
}));

/*
 * We need to mock below two mocks because one of the migrations has imported our redux store
 * which has a lot of module dependencies. We don't want to mock all of them so we mock the used redux files
 * since we are not testing them here.
 */
jest.mock('@/redux/explorer', () => ({
  notificationsSubscription: jest.fn(),
}));

jest.mock('@/redux/store', () => ({
  dispatch: jest.fn(),
}));

describe(`@/migrations IS_PROD`, () => {
  const storage = new MMKV({ id: MIGRATIONS_STORAGE_ID });

  test(`migration in debug mode in prod exits early and logs`, async () => {
    const spy = jest.fn();

    const removeTransport = logger.addTransport(spy);

    const name = 'migration_debug' as MigrationName;
    const migration: Migration = {
      debug: true,
      name,
      async migrate() {},
    };

    await runMigrations([migration]);

    expect(storage.getString(name)).toBeFalsy();
    expect(spy).toHaveBeenCalledWith(
      logger.LogLevel.Error,
      new RainbowError(`Migration is in debug mode`),
      { migration: name }
    );

    removeTransport();
  });
});
