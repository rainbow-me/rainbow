import { getProviderForNetwork } from '@/handlers/web3';
import { Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { polygon } from '@wagmi/chains';

export const PolygonNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...polygon,

  // network related data
  enabled: true,
  name: 'Polygon',
  longName: 'Polygon',
  value: Network.polygon,
  networkType: 'layer2',
  blockTimeInMs: 2_000,

  // this should be refactored to have less deps
  getProvider: getProviderForNetwork(Network.polygon),

  // features
  features: {
    txHistory: true,
    flashbots: false,
    walletconnect: true,
    swaps: true,
    nfts: true,
  },

  gas: {
    gasToken: 'MATIC',
    speeds: [gasUtils.NORMAL, gasUtils.FAST, gasUtils.URGENT],

    // ?
    gasType: 'eip1559',

    // this prob can just be blockTime
    pollingIntervalInMs: 2_000,

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
    dark: '#A275EE',
  },

  assets: {
    badgeSmall: '@assets/badges/ethereumBadgeSmall.png',
  },
};
