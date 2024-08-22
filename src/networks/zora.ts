import { ChainId, Network, NetworkProperties } from './types';
import { getRemoteConfig } from '@/model/remoteConfig';
import { defaultChains } from './chains';
import { zora } from 'viem/chains';

const { zora_enabled, op_chains_enabled } = getRemoteConfig();

export const zoraNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...zora,

  // network related data
  enabled: zora_enabled && op_chains_enabled,
  name: 'Zora',
  longName: 'Zora',
  value: Network.zora,

  rpc: defaultChains[ChainId.zora].rpcUrls.default.http[0],
};
