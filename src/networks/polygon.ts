import { ChainId, Network, NetworkProperties } from './types';
import { polygon } from '@wagmi/chains';
import { defaultChains } from './chains';

export const polygonNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...polygon,

  // network related data
  enabled: true,
  name: 'Polygon',
  longName: 'Polygon',
  value: Network.polygon,

  rpc: defaultChains[ChainId.polygon].rpcUrls.default.http[0],

  // design tings
  colors: {
    light: '#8247E5',
    dark: '#A275EE',
  },
};
