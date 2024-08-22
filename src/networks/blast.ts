import { ChainId, Network, NetworkProperties } from './types';
import { getRemoteConfig } from '@/model/remoteConfig';
import { defaultChains } from './chains';
import { blast } from 'viem/chains';

const { blast_enabled } = getRemoteConfig();

export const blastNetworkObject: NetworkProperties = {
  // where wagmi chain data usually is
  ...blast,

  // network related data
  enabled: blast_enabled,
  name: 'Blast',
  longName: 'Blast',
  value: Network.blast,

  rpc: defaultChains[ChainId.blast].rpcUrls.default.http[0],
};
