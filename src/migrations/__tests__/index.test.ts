import { describe, test, expect } from '@jest/globals';
import { MMKV } from 'react-native-mmkv';

import { runMigrations } from '@/migrations';
import {
  Migration,
  MigrationName,
  MIGRATIONS_STORAGE_ID,
} from '@/migrations/types';

describe(`@/migrations`, () => {
  const storage = new MMKV({ id: MIGRATIONS_STORAGE_ID });

  const fooMigrationName = 'migration_foo' as MigrationName;
  const fooMigration: Migration = {
    name: fooMigrationName,
    async migrate() {},
  };

  test(`new migration runs once`, async () => {
    jest.useFakeTimers();
    const currDate = new Date().toUTCString();
    await runMigrations([fooMigration]);
    jest.useRealTimers();

    expect(storage.getString(fooMigrationName)).toEqual(
      JSON.stringify({ data: currDate })
    );

    await runMigrations([fooMigration]);

    // not run again
    expect(storage.getString(fooMigrationName)).toEqual(
      JSON.stringify({ data: currDate })
    );
  });

  test(`migration that throws exits and does not mark as complete`, async () => {
    const throwMigrationName = 'migration_throw' as MigrationName;
    const throwMigration: Migration = {
      name: throwMigrationName,
      async migrate() {
        throw new Error('throws');
      },
    };

    await runMigrations([throwMigration]);

    expect(storage.getString(throwMigrationName)).toBeFalsy();
  });
});
