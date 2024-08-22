import { gnosis } from 'viem/chains';
import { Network, NetworkProperties } from './types';

export const gnosisNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...gnosis,

  // network related data
  enabled: false,
  name: 'Gnosis',
  longName: 'Gnosis',
  value: Network.gnosis,

  rpc: '',
};
