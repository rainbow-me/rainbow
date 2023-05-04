import { getProviderForNetwork } from '@/handlers/web3';
import { Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { bsc } from '@wagmi/chains';
import { BSC_MAINNET_RPC } from 'react-native-dotenv';
import { BNB_BSC_ADDRESS, BNB_MAINNET_ADDRESS } from '@/references';

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

  nativeCurrency: {
    ...bsc.nativeCurrency,
    address: BNB_BSC_ADDRESS,
    mainnetAddress: BNB_MAINNET_ADDRESS,
  },

  // this should be refactored to have less deps
  getProvider: getProviderForNetwork(Network.bsc),

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
    speeds: [gasUtils.NORMAL, gasUtils.FAST, gasUtils.URGENT],

    // ?
    gasType: 'eip1559',
    roundGasDisplay: false,

    // this prob can just be blockTime
    pollingIntervalInMs: 3_000,

    // needs more research
    getGasPrices: () => 'tmp',
  },

  swaps: {
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
