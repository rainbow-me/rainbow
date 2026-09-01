import { beforeEach, expect, jest, test } from '@jest/globals';

import { logger } from '@/logger';

import { getLegacyAsyncStorageValue } from './legacyAsyncStorage';

const load = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const remove = jest.fn<(...args: unknown[]) => Promise<void>>();
const loggerError = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

beforeEach(() => {
  load.mockReset();
  remove.mockReset();
  loggerError.mockClear();
  Object.defineProperty(globalThis, 'storage', {
    configurable: true,
    value: { load, remove },
  });
});

test('returns null without reporting or deleting an empty legacy value', async () => {
  load.mockResolvedValue(null);

  await expect(getLegacyAsyncStorageValue('empty')).resolves.toBeNull();
  expect(remove).not.toHaveBeenCalled();
  expect(loggerError).not.toHaveBeenCalled();
});
