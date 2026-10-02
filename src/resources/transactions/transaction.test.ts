import { beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

import { RainbowFetchClient, RainbowFetchError } from '@/framework/data/http/rainbowFetch';
import { getPlatformClient } from '@/resources/platform/client';

import { fetchRawTransaction } from './transaction';

vi.mock('@/env', () => ({
  IS_TEST: false,
}));

vi.mock('@/features/config/stores/experimentalConfigStore', () => ({
  getExperimentalFlag: vi.fn(() => false),
}));

vi.mock('@/features/cash/utils/mockCashTransactionByHash', () => ({
  getMockCashTransactionByHash: vi.fn(),
}));

vi.mock('@/parsers/transactions', () => ({
  parseTransaction: vi.fn(),
}));

vi.mock('@/resources/platform/client', () => ({
  getPlatformClient: vi.fn(),
}));

vi.mock('@/state/assets/userAssetsStoreManager', () => ({
  userAssetsStoreManager: vi.fn(),
}));

vi.mock('@/state/wallets/walletsStore', () => ({
  useAccountAddress: vi.fn(),
}));

const mockGetPlatformClient = vi.mocked(getPlatformClient);

describe('fetchRawTransaction', () => {
  let getSpy: MockInstance<RainbowFetchClient['get']>;

  beforeEach(() => {
    vi.clearAllMocks();
    const client = new RainbowFetchClient();
    getSpy = vi.spyOn(client, 'get');
    mockGetPlatformClient.mockReturnValue(client);
  });

  it('returns null when the transaction has not been indexed', async () => {
    getSpy.mockImplementation(async () => {
      throw buildFetchError(404);
    });

    await expect(fetchTransaction()).resolves.toBeNull();
  });

  it.each([401, 403, 408, 429, 500])('preserves HTTP %s failures for the polling owner', async status => {
    const error = buildFetchError(status);
    getSpy.mockImplementation(async () => {
      throw error;
    });

    await expect(fetchTransaction()).rejects.toBe(error);
  });
});

function fetchTransaction() {
  return fetchRawTransaction({
    address: '0x123',
    chainId: 1,
    currency: 'ETH',
    hash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  });
}

function buildFetchError(status: number): RainbowFetchError {
  return new RainbowFetchError({
    message: `HTTP ${status}`,
    response: new Response(null, { status }),
  });
}
