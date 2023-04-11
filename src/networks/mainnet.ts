import { getProviderForNetwork } from '@/handlers/web3';
import { Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';

export const MainnetNetworkObject: NetworkProperties = {
  // network related data
  enabled: true,
  name: 'Ethereum',
  longName: 'Ethereum',
  value: Network.mainnet,
  networkType: 'mainnet',
  blockTimeInMs: 15_000,
  blockExplorerUrl: 'etherscan.io',

  // this should be refactored to have less deps
  getProvider: getProviderForNetwork(Network.mainnet),

  // features
  txHistoryEnabled: true,
  flashbotsEnabled: true,
  walletconnectEnabled: true,

  gas: {
    gasToken: 'ETH',
    speeds: [gasUtils.NORMAL, gasUtils.FAST, gasUtils.CUSTOM],
    gasType: 'eip1559',

    // this prob can just be blockTime
    pollingIntervalInMs: 5_000,

    // needs more research
    getGasPrices: () => 'tmp',
  },

  nfts: {
    enabled: true,
  },

  swaps: {
    enabled: true,
    outputBasedQuotes: true,
    defaultSlippage: 100,
  },

  // design tings

  colors: {
    light: '#25292E',
    dark: '#25292E',
  },

  // could be component or path to asset
  assets: {
    badgeSmall: '@assets/badges/ethereumBadgeSmall.png',
  },
};
