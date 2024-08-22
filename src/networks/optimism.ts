import { ChainId, Network, NetworkProperties } from './types';
import { optimism } from '@wagmi/chains';
import { getRemoteConfig } from '@/model/remoteConfig';
import { defaultChains } from './chains';

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

  // design tings
  colors: {
    light: '#FF4040',
    dark: '#FF6A6A',
  },
};
