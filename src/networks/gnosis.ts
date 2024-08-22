import { Network, NetworkProperties } from './types';
import { gnosis } from '@wagmi/chains';

export const gnosisNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...gnosis,

  // network related data
  enabled: false,
  name: 'Gnosis',
  longName: 'Gnosis',
  value: Network.gnosis,

  rpc: '',

  // design tings
  colors: {
    light: '#FF4040',
    dark: '#FF6A6A',
  },
};
