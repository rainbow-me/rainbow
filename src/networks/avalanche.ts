import { ChainId, Network, NetworkProperties } from './types';
import { avalanche } from '@wagmi/chains';
import { getRemoteConfig } from '@/model/remoteConfig';
import { defaultChains } from './chains';

const { avalanche_enabled } = getRemoteConfig();

export const avalancheNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...avalanche,

  // network related data
  enabled: avalanche_enabled,
  name: 'Avalanche',
  longName: 'Avalanche',
  value: Network.avalanche,

  rpc: defaultChains[ChainId.avalanche].rpcUrls.default.http[0],

  // design tings
  colors: {
    light: '#E84142',
    dark: '#FF5D5E',
  },
};
