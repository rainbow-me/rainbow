import { goerli } from 'viem/chains';
import { Network, NetworkProperties } from './types';
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
};
