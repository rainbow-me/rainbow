import { vi } from 'vitest';

/*
 * This _could_ cause issues one day if something gets imported here that
 * breaks test mocks
 */
import { event } from '../event';

export const analytics = {
  init: vi.fn(),
  identify: vi.fn(),
  screen: vi.fn(),
  track: vi.fn(),
  setWalletContext: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  event,
};
