import { getGlobal, saveGlobal } from './common';

const MIGRATION_VERSION = 'localmigrations';

const migrationsVersion = '0.0.1';

/**
 * @desc get migrations
 * @return {Number}
 */
export const getMigrationVersion = () => getGlobal(MIGRATION_VERSION, 0, migrationsVersion);

/**
 * @desc save migrations
 */
export const setMigrationVersion = (migration: any) => saveGlobal(MIGRATION_VERSION, migration, migrationsVersion);
