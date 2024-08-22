import { ChainId, NetworkProperties } from './types';
import { defaultChains } from './chains';
import { blast } from 'viem/chains';

export const blastNetworkObject: NetworkProperties = {
  // where wagmi chain data usually is
  ...blast,

  rpc: defaultChains[ChainId.blast].rpcUrls.default.http[0],
};
