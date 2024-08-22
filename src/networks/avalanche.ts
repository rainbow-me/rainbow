import { ChainId, NetworkProperties } from './types';
import { defaultChains } from './chains';
import { avalanche } from 'viem/chains';

export const avalancheNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...avalanche,

  rpc: defaultChains[ChainId.avalanche].rpcUrls.default.http[0],
};
