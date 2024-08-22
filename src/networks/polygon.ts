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

  rpc: defaultChains[ChainId.polygon].rpcUrls.default.http[0],

  // features
  features: {
    flashbots: false,
    walletconnect: true,
    swaps: true,
    nfts: true,
    txs: polygon_tx_enabled,
  },

  gas: {
    // ?
    roundGasDisplay: false,
  },

  // design tings
  colors: {
    light: '#8247E5',
    dark: '#A275EE',
  },
};
