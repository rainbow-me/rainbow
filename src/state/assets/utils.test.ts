import { getPlatformClient } from '@/resources/platform/client';

import { type UserAsset } from './types';
import { fetchUserAssets } from './utils';

/**
 * The merge in `fetchUserAssets`, which is a live code path: the EVM request is
 * unchanged and the Solana rows are additive. The asymmetry is deliberate and is the
 * point of these cases — the store's setter replaces the whole asset map, so Solana
 * rows can only ever be extra rows, never the only rows.
 */

jest.mock('@/resources/platform/client');
jest.mock('@/features/solana/data/fetchSolanaUserAssets');
jest.mock('@/features/network/stores/backendNetworksStore', () => ({
  useBackendNetworksStore: {
    getState: () => ({ getSupportedChainIds: () => [1, 10, 8453] }),
    subscribe: jest.fn(),
  },
}));

// Cut the module graph at the four edges that pull redux, Firebase and the native
// modules behind them into a test of one async function. None is on this path.
jest.mock('@/resources/assets/anvilAssets', () => ({ fetchAnvilBalancesByChainId: jest.fn() }));
jest.mock('@/resources/addys/client', () => ({ isStaging: () => false }));
jest.mock('@/utils/ethereumUtils', () => ({ getUniqueId: (address: string, chainId: number) => `${address}_${chainId}` }));
jest.mock('@/handlers/assets', () => ({ isNativeAsset: () => false }));
jest.mock('./userAssets', () => ({ userAssetsStore: { getState: () => ({ searchCache: new Map() }) } }));
jest.mock('./userAssetsStoreManager', () => ({ userAssetsStoreManager: { getState: () => ({ currency: 'USD' }) } }));

// eslint-disable-next-line @typescript-eslint/no-require-imports, import/no-commonjs
const { fetchSolanaUserAssets } = require('@/features/solana/data/fetchSolanaUserAssets') as {
  fetchSolanaUserAssets: jest.Mock;
};

const PARAMS = { address: '0x1234567890123456789012345678901234567890', currency: 'USD', testnetMode: false } as Parameters<
  typeof fetchUserAssets
>[0];

function userAsset(symbol: string, chainId: number, value: string): UserAsset {
  return {
    asset: {
      address: '0xdeadbeef00000000000000000000000000000000',
      chainId,
      name: symbol,
      symbol,
      decimals: 18,
      type: 'token',
      network: 'mainnet',
      verified: true,
      transferable: true,
      colors: { primary: '#000000' },
      price: { value: 1, relativeChange24h: 0, changedAt: 0 },
      networks: {},
      bridging: { bridgeable: false, networks: {} },
    },
    quantity: '1000000000000000000',
    smallBalance: false,
    updatedAt: '0',
    value,
  } as UserAsset;
}

function mockEvmResponse(result: Record<string, UserAsset> | null) {
  jest.mocked(getPlatformClient).mockReturnValue({
    get: jest.fn().mockResolvedValue({ data: { errors: [], result } }),
  } as unknown as ReturnType<typeof getPlatformClient>);
}

beforeEach(() => {
  jest.clearAllMocks();
  fetchSolanaUserAssets.mockResolvedValue([]);
});

describe('fetchUserAssets', () => {
  it('appends the Solana rows to the EVM rows in one list', async () => {
    mockEvmResponse({ eth: userAsset('ETH', 1, '100') });
    fetchSolanaUserAssets.mockResolvedValue([userAsset('SOL', 1399811149, '450.62')]);

    const result = await fetchUserAssets(PARAMS, null);

    expect(result?.userAssets.map(asset => asset.asset.symbol)).toEqual(['ETH', 'SOL']);
  });

  it('leaves the EVM rows exactly as they were when there are no Solana rows', async () => {
    mockEvmResponse({ eth: userAsset('ETH', 1, '100'), op: userAsset('OP', 10, '5') });

    const result = await fetchUserAssets(PARAMS, null);

    expect(result?.userAssets.map(asset => asset.asset.symbol)).toEqual(['ETH', 'OP']);
  });

  it('returns null when the EVM request yields no result, even with Solana rows in hand', async () => {
    mockEvmResponse(null);
    fetchSolanaUserAssets.mockResolvedValue([userAsset('SOL', 1399811149, '450.62')]);

    // Returning the Solana rows alone would replace every EVM row with nothing.
    expect(await fetchUserAssets(PARAMS, null)).toBeNull();
  });

  it('asks the Solana half for the same currency the EVM half was asked for', async () => {
    mockEvmResponse({ eth: userAsset('ETH', 1, '100') });

    await fetchUserAssets(PARAMS, null);

    expect(fetchSolanaUserAssets).toHaveBeenCalledWith({ abortController: null, currency: 'USD' });
  });

  it('does not ask the Solana half at all in testnet mode', async () => {
    jest.mocked(getPlatformClient).mockReturnValue({ get: jest.fn() } as unknown as ReturnType<typeof getPlatformClient>);

    await fetchUserAssets({ ...PARAMS, testnetMode: true }, null).catch(() => undefined);

    expect(fetchSolanaUserAssets).not.toHaveBeenCalled();
  });
});
