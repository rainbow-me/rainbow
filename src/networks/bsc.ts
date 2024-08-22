import { ChainId, Network, NetworkProperties } from './types';
import { getRemoteConfig } from '@/model/remoteConfig';
import { defaultChains } from './chains';
import { bsc } from 'viem/chains';

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
};
