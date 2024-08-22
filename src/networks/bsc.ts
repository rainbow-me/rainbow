import { ChainId, NetworkProperties } from './types';
import { defaultChains } from './chains';
import { bsc } from 'viem/chains';

export const bscNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...bsc,

  rpc: defaultChains[ChainId.bsc].rpcUrls.default.http[0],
};
