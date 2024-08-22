import { Network, NetworkProperties } from './types';
import { goerli } from '@wagmi/chains';
import { getRemoteConfig } from '@/model/remoteConfig';

const { goerli_enabled } = getRemoteConfig();

export const goerliNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...goerli,

  // network related data
  enabled: goerli_enabled,
  name: 'Goerli',
  longName: 'Goerli',
  value: Network.goerli,

  rpc: '',

  // design tings
  colors: {
    light: '#f6c343',
    dark: '#f6c343',
  },
};
