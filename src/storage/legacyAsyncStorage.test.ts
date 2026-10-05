import { beforeEach, expect, test, vi } from 'vitest';

import { logger } from '@/logger';

import { getLegacyAsyncStorageValue } from './legacyAsyncStorage';

const load = vi.fn<(...args: unknown[]) => Promise<unknown>>();
const remove = vi.fn<(...args: unknown[]) => Promise<void>>();
const loggerError = vi.spyOn(logger, 'error').mockImplementation(() => undefined);

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
