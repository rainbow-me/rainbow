import { ChainId, NetworkProperties } from './types';
import { defaultChains } from './chains';
import { zora } from 'viem/chains';

export const zoraNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...zora,
  rpc: defaultChains[ChainId.zora].rpcUrls.default.http[0],
};
