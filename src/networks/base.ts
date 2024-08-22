import { ChainId, Network, NetworkProperties } from './types';
import { getRemoteConfig } from '@/model/remoteConfig';
import { defaultChains } from './chains';
import { base } from 'viem/chains';

const { base_enabled, op_chains_enabled } = getRemoteConfig();

export const baseNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...base,

  // network related data
  enabled: base_enabled && op_chains_enabled,
  name: 'Base',
  longName: 'Base',
  value: Network.base,

  rpc: defaultChains[ChainId.base].rpcUrls.default.http[0],
};
