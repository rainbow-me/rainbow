import { ChainId, Network, NetworkProperties } from './types';
import { defaultChains } from './chains';
import { polygon } from 'viem/chains';

export const polygonNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...polygon,

  // network related data
  enabled: true,
  name: 'Polygon',
  longName: 'Polygon',
  value: Network.polygon,

  rpc: defaultChains[ChainId.polygon].rpcUrls.default.http[0],
};
