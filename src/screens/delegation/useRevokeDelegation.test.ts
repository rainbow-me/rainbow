jest.mock('@/utils/haptics', () => ({
  __esModule: true,
  default: {
    notificationError: jest.fn(),
    notificationSuccess: jest.fn(),
  },
}));
jest.mock('@/model/wallet', () => ({ loadWallet: jest.fn() }));
jest.mock('@/handlers/web3', () => ({ getProvider: jest.fn() }));
jest.mock('@/state/nonces', () => ({ getNextNonce: jest.fn() }));
jest.mock('@/__swaps__/utils/meteorology', () => ({ getMeteorologyCachedData: jest.fn() }));
jest.mock('@/resources/meteorology/classification', () => ({ isLegacyMeteorologyFeeData: jest.fn() }));
jest.mock('@rainbow-me/delegation', () => ({ executeRevokeDelegation: jest.fn() }));
jest.mock('@/state/assets/userAssets', () => ({
  userAssetsStore: {
    getState: () => ({
      getNativeAssetForChain: jest.fn(),
    }),
  },
}));
jest.mock('@/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
  RainbowError: class RainbowError extends Error {},
}));

import { ChainId } from '@/state/backendNetworks/types';
import { partitionChainsByGasAvailability } from './useRevokeDelegation';

describe('partitionChainsByGasAvailability', () => {
  const address = '0x123';

  it('marks cached zero native balance as insufficient without RPC fallback', async () => {
    const getChainBalance = jest.fn(async () => 100n);
    const result = await partitionChainsByGasAvailability({
      chains: [{ chainId: ChainId.gnosis }],
      address,
      getNativeAssetBalance: () => '0',
      getChainBalance,
    });

    expect(result.insufficientGasChainIds).toEqual([ChainId.gnosis]);
    expect(result.actionableChains).toEqual([]);
    expect(getChainBalance).not.toHaveBeenCalled();
  });

  it('falls back to provider balance when cached native asset is missing', async () => {
    const getChainBalance = jest.fn(async (chainId: ChainId) => (chainId === ChainId.gnosis ? 0n : 1n));
    const result = await partitionChainsByGasAvailability({
      chains: [{ chainId: ChainId.gnosis }, { chainId: ChainId.mainnet }],
      address,
      getNativeAssetBalance: () => null,
      getChainBalance,
    });

    expect(result.insufficientGasChainIds).toEqual([ChainId.gnosis]);
    expect(result.actionableChains).toEqual([{ chainId: ChainId.mainnet }]);
    expect(getChainBalance).toHaveBeenCalledTimes(2);
  });

  it('keeps chain actionable if balance lookup fails', async () => {
    const getChainBalance = jest.fn(async () => {
      throw new Error('rpc failed');
    });
    const result = await partitionChainsByGasAvailability({
      chains: [{ chainId: ChainId.gnosis }],
      address,
      getNativeAssetBalance: () => undefined,
      getChainBalance,
    });

    expect(result.insufficientGasChainIds).toEqual([]);
    expect(result.actionableChains).toEqual([{ chainId: ChainId.gnosis }]);
  });
});
