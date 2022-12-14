import { InteractionManager } from 'react-native';
import { describe, test, expect } from '@jest/globals';
import { MMKV } from 'react-native-mmkv';

import { runMigrations } from '@/migrations';
import {
  Migration,
  MigrationName,
  MIGRATIONS_STORAGE_ID,
} from '@/migrations/types';

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

InteractionManager.runAfterInteractions = jest.fn();

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

  test(`deferable migration is set up`, async () => {
    const deferMigrationName = 'migration_defer' as MigrationName;
    const deferMigration: Migration = {
      name: deferMigrationName,
      async defer() {},
    };

    await runMigrations([deferMigration]);

    expect(InteractionManager.runAfterInteractions).toHaveBeenCalled();
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

  test(`migration in debug mode does not mark as complete`, async () => {
    const throwMigrationName = 'migration_debug' as MigrationName;
    const throwMigration: Migration = {
      debug: true,
      name: throwMigrationName,
      async migrate() {},
    };

    await runMigrations([throwMigration]);

    expect(storage.getString(throwMigrationName)).toBeFalsy();
  });
});
