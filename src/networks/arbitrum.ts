import { getProviderForNetwork } from '@/handlers/web3';
import { Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { arbitrum } from '@wagmi/chains';

export const ArbitrumNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...arbitrum,

  // network related data
  enabled: true,
  name: 'Arbitrum',
  longName: 'Arbitrum',
  value: Network.arbitrum,
  networkType: 'layer2',
  blockTimeInMs: 5_000,

  // this should be refactored to have less deps
  getProvider: getProviderForNetwork(Network.arbitrum),

  // features
  features: {
    txHistory: true,

    // not sure if flashbots is being used app wide vs just swaps
    flashbots: false,
    walletconnect: true,
    swaps: true,
    nfts: true,
  },

  gas: {
    gasToken: 'ETH',
    speeds: [gasUtils.NORMAL],

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
    light: '#2D374B',
    dark: '#ADBFE3',
  },

  assets: {
    badgeSmall: '@assets/badges/ethereumBadgeSmall.png',
  },
};
