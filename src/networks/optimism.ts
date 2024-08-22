import { ChainId, NetworkProperties } from './types';
import { defaultChains } from './chains';
import { optimism } from 'viem/chains';

export const optimismNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...optimism,

  rpc: defaultChains[ChainId.optimism].rpcUrls.default.http[0],
};
