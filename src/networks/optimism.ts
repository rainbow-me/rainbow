import { ChainId, Network, NetworkProperties } from './types';
import { getRemoteConfig } from '@/model/remoteConfig';
import { defaultChains } from './chains';
import { optimism } from 'viem/chains';

const { optimism_enabled, op_chains_enabled } = getRemoteConfig();

export const optimismNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...optimism,

  // network related data
  enabled: optimism_enabled && op_chains_enabled,
  name: 'Optimism',
  longName: 'Optimism',
  value: Network.optimism,

  rpc: defaultChains[ChainId.optimism].rpcUrls.default.http[0],
};
