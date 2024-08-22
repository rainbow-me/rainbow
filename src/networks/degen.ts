import { ChainId, Network, NetworkProperties } from './types';
import { degen } from 'viem/chains';
import { getRemoteConfig } from '@/model/remoteConfig';
import { defaultChains } from './chains';

const { degen_enabled } = getRemoteConfig();

export const degenNetworkObject: NetworkProperties = {
  // viem chain data
  ...degen,

  // network related data
  enabled: degen_enabled,
  name: 'Degen Chain',
  longName: 'Degen Chain',
  value: Network.degen,

  rpc: defaultChains[ChainId.degen].rpcUrls.default.http[0],
};
