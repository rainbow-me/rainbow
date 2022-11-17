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
