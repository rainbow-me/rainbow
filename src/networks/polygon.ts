import { getProviderForNetwork } from '@/handlers/web3';
import { Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { polygon } from '@wagmi/chains';
import { MATIC_MAINNET_ADDRESS, MATIC_POLYGON_ADDRESS } from '@/references';
import { getPolygonGasPrices } from '@/redux/gas';
import config from '@/model/config';

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

  rpc: config.polygon_mainnet_rpc,
  getProvider: getProviderForNetwork(Network.polygon),
  balanceCheckerAddress: '0x54A4E5800345c01455a7798E0D96438364e22723',

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

  nfts: {},

  // design tings
  colors: {
    light: '#8247E5',
    dark: '#A275EE',
  },
};
