import { ChainId, NetworkProperties } from './types';
import { defaultChains } from './chains';
import { polygon } from 'viem/chains';

export const polygonNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...polygon,
  rpc: defaultChains[ChainId.polygon].rpcUrls.default.http[0],
};
