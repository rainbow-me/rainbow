import { getProviderForNetwork } from '@/handlers/web3';
import { Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { polygon } from '@wagmi/chains';
import { MATIC_MAINNET_ADDRESS, MATIC_POLYGON_ADDRESS } from '@/references';
import { getPolygonGasPrices } from '@/redux/gas';

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

  nativeCurrency: {
    ...polygon.nativeCurrency,
    address: MATIC_POLYGON_ADDRESS,
    mainnetAddress: MATIC_MAINNET_ADDRESS,
  },

  // this should be refactored to have less deps
  getProvider: getProviderForNetwork(Network.polygon),

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
    pollingIntervalInMs: 2_000,

    getGasPrices: getPolygonGasPrices,
  },

  swaps: {
    defaultSlippage: 200,
    defaultToFastGas: true,
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
