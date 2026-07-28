import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { RainbowFetchClient, RainbowFetchError } from '@/framework/data/http/rainbowFetch';
import { getPlatformClient } from '@/resources/platform/client';

import { fetchRawTransaction } from './transaction';

jest.mock('@/env', () => ({
  IS_TEST: false,
}));

jest.mock('@/features/config/stores/experimentalConfigStore', () => ({
  getExperimentalFlag: jest.fn(() => false),
}));

jest.mock('@/features/cash/utils/mockCashTransactionByHash', () => ({
  getMockCashTransactionByHash: jest.fn(),
}));

jest.mock('@/parsers/transactions', () => ({
  parseTransaction: jest.fn(),
}));

jest.mock('@/resources/platform/client', () => ({
  getPlatformClient: jest.fn(),
}));

jest.mock('@/state/assets/userAssetsStoreManager', () => ({
  userAssetsStoreManager: jest.fn(),
}));

jest.mock('@/state/wallets/walletsStore', () => ({
  useAccountAddress: jest.fn(),
}));

const mockGetPlatformClient = jest.mocked(getPlatformClient);

describe('fetchRawTransaction', () => {
  let getSpy: jest.SpiedFunction<RainbowFetchClient['get']>;

  beforeEach(() => {
    jest.clearAllMocks();
    const client = new RainbowFetchClient();
    getSpy = jest.spyOn(client, 'get');
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
