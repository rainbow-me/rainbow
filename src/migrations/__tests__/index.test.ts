import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { MMKV } from 'react-native-mmkv';

import { runMigrations } from '@/migrations';
import {
  Migration,
  MigrationName,
  MIGRATIONS_STORAGE_ID,
} from '@/migrations/types';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe(`@/migrations`, () => {
  const storage = new MMKV({ id: MIGRATIONS_STORAGE_ID });

  // TODO not working, wrong MMKV instance
  test.skip(`runMigrations for new migration`, async () => {
    const name = 'migration_foo' as MigrationName;
    const migration: Migration = {
      name,
      async migrate() {},
    };

    await runMigrations([migration]);

    expect(storage.getString(name)).toEqual(new Date().toUTCString());
  });
});
