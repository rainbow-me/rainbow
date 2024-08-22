import { ChainId, NetworkProperties } from './types';
import { degen } from 'viem/chains';
import { defaultChains } from './chains';

export const degenNetworkObject: NetworkProperties = {
  // viem chain data
  ...degen,

  rpc: defaultChains[ChainId.degen].rpcUrls.default.http[0],
};
