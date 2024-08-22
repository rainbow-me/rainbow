import { ChainId, Network, NetworkProperties } from './types';
import { bsc } from '@wagmi/chains';
import { getRemoteConfig } from '@/model/remoteConfig';
import { defaultChains } from './chains';

const { bsc_enabled } = getRemoteConfig();

export const bscNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...bsc,

  // network related data
  enabled: bsc_enabled,
  name: 'BSC',
  longName: 'Binance Smart Chain',
  value: Network.bsc,

  rpc: defaultChains[ChainId.bsc].rpcUrls.default.http[0],

  // design tings
  colors: {
    light: '#8247E5',
    dark: '#F0B90B',
  },
};
