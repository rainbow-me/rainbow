import { ChainId, Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { arbitrum } from '@wagmi/chains';
import { getRemoteConfig } from '@/model/remoteConfig';
import { defaultChains } from './chains';

const { arbitrum_enabled, arbitrum_tx_enabled } = getRemoteConfig();

export const arbitrumNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...arbitrum,
  // network related data
  enabled: arbitrum_enabled,
  name: 'Arbitrum',
  longName: 'Arbitrum',
  value: Network.arbitrum,

  rpc: defaultChains[ChainId.arbitrum].rpcUrls.default.http[0],

  // design tings
  colors: {
    light: '#2D374B',
    dark: '#ADBFE3',
  },
};
