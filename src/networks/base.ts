import { ChainId, NetworkProperties } from './types';
import { defaultChains } from './chains';
import { base } from 'viem/chains';

export const baseNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...base,

  rpc: defaultChains[ChainId.base].rpcUrls.default.http[0],
};
