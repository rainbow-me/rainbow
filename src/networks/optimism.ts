import { getProviderForNetwork } from '@/handlers/web3';
import { Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { optimism } from '@wagmi/chains';
import { OPTIMISM_ETH_ADDRESS } from '@/references';

export const OptimismNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...optimism,

  // network related data
  enabled: true,
  name: 'Optimism',
  longName: 'Optimism',
  value: Network.optimism,
  networkType: 'layer2',
  blockTimeInMs: 5_000,

  nativeCurrency: {
    ...optimism.nativeCurrency,
    address: OPTIMISM_ETH_ADDRESS,
  },

  // this should be refactored to have less deps
  getProvider: getProviderForNetwork(Network.optimism),

  // features
  features: {
    txHistory: true,
    flashbots: false,
    walletconnect: true,
    swaps: true,
    nfts: true,
    savings: false,
    pools: false,
  },

  gas: {
    speeds: [gasUtils.NORMAL],

    // ?
    gasType: 'eip1559',
    roundGasDisplay: true,

    // this prob can just be blockTime,
    pollingIntervalInMs: 5_000,

    // needs more research
    getGasPrices: () => 'tmp',
  },

  swaps: {
    defaultSlippage: 200,
  },

  // design tings
  colors: {
    light: '#FF4040',
    dark: '#FF6A6A',
  },

  assets: {
    badgeSmall: '@assets/badges/ethereumBadgeSmall.png',
  },
};
