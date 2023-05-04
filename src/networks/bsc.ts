import { getProviderForNetwork } from '@/handlers/web3';
import { Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { bsc } from '@wagmi/chains';

export const BSCNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...bsc,

  // network related data
  enabled: true,
  name: 'BSC',
  longName: 'Binance Smart Chain',
  value: Network.polygon,
  networkType: 'layer2',
  blockTimeInMs: 3_000,

  // this should be refactored to have less deps
  getProvider: getProviderForNetwork(Network.bsc),

  // features
  features: {
    txHistory: true,
    flashbots: false,
    walletconnect: true,
    swaps: true,
    nfts: true,
  },

  gas: {
    gasToken: 'BNB',
    speeds: [gasUtils.NORMAL, gasUtils.FAST, gasUtils.URGENT],

    // ?
    gasType: 'eip1559',

    // this prob can just be blockTime
    pollingIntervalInMs: 3_000,

    // needs more research
    getGasPrices: () => 'tmp',
  },

  swaps: {
    outputBasedQuotes: true,
    defaultSlippage: 200,
  },

  // design tings
  colors: {
    light: '#8247E5',
    dark: '#F0B90B',
  },

  assets: {
    badgeSmall: '@assets/badges/ethereumBadgeSmall.png',
  },
};
