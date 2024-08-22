import { ChainId, NetworkProperties } from './types';
import { useConnectedToHardhatStore } from '@/state/connectedToHardhat';
import { defaultChains } from './chains';
import { mainnet } from 'viem/chains';

export const mainnetNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...mainnet,

  rpc: useConnectedToHardhatStore.getState().connectedToHardhat
    ? 'http://127.0.0.1:8545'
    : defaultChains[ChainId.mainnet].rpcUrls.default.http[0],
};
