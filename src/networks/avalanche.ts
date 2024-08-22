import { ChainId, Network, NetworkProperties } from './types';
import { getRemoteConfig } from '@/model/remoteConfig';
import { defaultChains } from './chains';
import { avalanche } from 'viem/chains';

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
};
