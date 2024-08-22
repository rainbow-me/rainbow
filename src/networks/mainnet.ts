import { ChainId, Network, NetworkProperties } from './types';
import { mainnet } from '@wagmi/chains';
import { getRemoteConfig } from '@/model/remoteConfig';
import { useConnectedToHardhatStore } from '@/state/connectedToHardhat';
import { defaultChains } from './chains';

const { mainnet_enabled } = getRemoteConfig();

export const mainnetNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...mainnet,

  // network related data
  enabled: mainnet_enabled,
  name: 'Ethereum',
  longName: 'Ethereum',
  value: Network.mainnet,

  rpc: useConnectedToHardhatStore.getState().connectedToHardhat
    ? 'http://127.0.0.1:8545'
    : defaultChains[ChainId.mainnet].rpcUrls.default.http[0],

  gas: {
    roundGasDisplay: true,
  },

  // design tings
  colors: {
    light: '#25292E',
    dark: '#25292E',
  },
};
