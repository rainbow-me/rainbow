import { getProviderForNetwork } from '@/handlers/web3';
import { Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { arbitrum } from '@wagmi/chains';
import { ARBITRUM_ETH_ADDRESS } from '@/references';
import { getArbitrumGasPrices } from '@/redux/gas';

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

  nativeCurrency: {
    ...arbitrum.nativeCurrency,
    address: ARBITRUM_ETH_ADDRESS,
  },

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
    savings: false,
    pools: false,
  },

  gas: {
    speeds: [gasUtils.NORMAL],

    // ?
    gasType: 'eip1559',
    roundGasDisplay: true,

    // this prob can just be blockTime
    pollingIntervalInMs: 3_000,

    // needs more research
    getGasPrices: getArbitrumGasPrices,
  },

  swaps: {
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
