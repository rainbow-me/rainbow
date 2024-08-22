import { gnosis } from 'viem/chains';
import { NetworkProperties } from './types';

export const gnosisNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...gnosis,

  rpc: '',
};
