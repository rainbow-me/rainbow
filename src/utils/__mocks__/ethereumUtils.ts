import { vi } from 'vitest';

export default {
  calculateL1FeeOptimism: vi.fn(),
  formatGenericAsset: vi.fn(),
  getAssetFromAllAssets: vi.fn(),
  getAccountAsset: vi.fn(),
  getAsset: vi.fn(),
  getAssetPrice: vi.fn(),
  getBalanceAmount: vi.fn(),
  getBasicSwapGasLimit: vi.fn(),
  getBlockExplorer: vi.fn(),
  getEtherscanHostForNetwork: vi.fn(),
  getHash: vi.fn(),
  getMultichainAssetAddress: vi.fn(),
  getNativeAssetForNetwork: vi.fn(),
  getNetworkNativeAsset: vi.fn(),
  getPriceOfNativeAssetForNetwork: vi.fn(),
  isEthAddress: vi.fn(),
  openAddressInBlockExplorer: vi.fn(),
  openNftInBlockExplorer: vi.fn(),
  openTokenEtherscanURL: vi.fn(),
  openTransactionInBlockExplorer: vi.fn(),
};
