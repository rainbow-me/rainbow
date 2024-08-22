import { ChainId, NetworkProperties } from './types';
import { defaultChains } from './chains';
import { arbitrum } from 'viem/chains';

export const arbitrumNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...arbitrum,

  rpc: defaultChains[ChainId.arbitrum].rpcUrls.default.http[0],
};
