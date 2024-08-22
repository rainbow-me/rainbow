import { ChainId, Network, NetworkProperties } from './types';
import { degen } from 'viem/chains';
import { getRemoteConfig } from '@/model/remoteConfig';
import { DEGEN_MAINNET_RPC } from 'react-native-dotenv';
import { defaultChains } from './chains';

const { degen_enabled } = getRemoteConfig();

export const degenNetworkObject: NetworkProperties = {
  // viem chain data
  ...degen,

  // network related data
  enabled: degen_enabled,
  name: 'Degen Chain',
  network: 'degen',
  longName: 'Degen Chain',
  value: Network.degen,

  rpc: defaultChains[ChainId.degen].rpcUrls.default.http[0],

  gas: {
    // ?
    roundGasDisplay: true,
  },

  // design tings
  colors: {
    light: '#A36EFD',
    dark: '#A36EFD',
  },

  rpcUrls: {
    public: { http: [DEGEN_MAINNET_RPC as string] },
    default: {
      http: [DEGEN_MAINNET_RPC as string],
    },
  },
};
