import { goerli } from 'viem/chains';
import { NetworkProperties } from './types';

export const goerliNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...goerli,

  rpc: '',
};
