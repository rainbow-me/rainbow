import { ChainId, Network, NetworkProperties } from './types';
import { getRemoteConfig } from '@/model/remoteConfig';
import { defaultChains } from './chains';
import { arbitrum } from 'viem/chains';

const { arbitrum_enabled } = getRemoteConfig();

export const arbitrumNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...arbitrum,
  // network related data
  enabled: arbitrum_enabled,
  name: 'Arbitrum',
  longName: 'Arbitrum',
  value: Network.arbitrum,

  rpc: defaultChains[ChainId.arbitrum].rpcUrls.default.http[0],
};
