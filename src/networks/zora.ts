import { ChainId, Network, NetworkProperties } from './types';
import { zora } from '@wagmi/chains';
import { getRemoteConfig } from '@/model/remoteConfig';
import { defaultChains } from './chains';

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

  // design tings
  colors: {
    light: '#2B5DF0',
    dark: '#6183F0',
  },
};
