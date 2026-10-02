import { vi } from 'vitest';

/**
 * @desc Promise that will resolve after the ms interval
 */
export const delay = vi.fn().mockImplementation((ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
});
