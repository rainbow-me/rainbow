import { ChainId, Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { polygon } from '@wagmi/chains';
import { getRemoteConfig } from '@/model/remoteConfig';
import { defaultChains } from './chains';

const { polygon_tx_enabled } = getRemoteConfig();

export const polygonNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...polygon,

  // network related data
  enabled: true,
  name: 'Polygon',
  longName: 'Polygon',
  value: Network.polygon,
  networkType: 'layer2',

  rpc: defaultChains[ChainId.polygon].rpcUrls.default.http[0],

  // features
  features: {
    txHistory: true,
    flashbots: false,
    walletconnect: true,
    swaps: true,
    nfts: true,
    pools: false,
    txs: polygon_tx_enabled,
  },

  gas: {
    speeds: [gasUtils.NORMAL, gasUtils.FAST, gasUtils.URGENT],

    // ?
    gasType: 'legacy',
    roundGasDisplay: false,

    // this prob can just be blockTime
    pollingIntervalInMs: 2_000,
  },

  swaps: {
    defaultSlippage: 200,
    defaultToFastGas: true,
  },

  nfts: { simplehashNetwork: 'polygon' },

  // design tings
  colors: {
    light: '#8247E5',
    dark: '#A275EE',
  },
};
