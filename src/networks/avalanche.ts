import { ChainId, Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { avalanche } from '@wagmi/chains';
import { getRemoteConfig } from '@/model/remoteConfig';
import { defaultChains } from './chains';

const { avalanche_enabled, avalanche_tx_enabled } = getRemoteConfig();

export const avalancheNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...avalanche,

  // network related data
  enabled: avalanche_enabled,
  name: 'Avalanche',
  longName: 'Avalanche',
  value: Network.avalanche,

  rpc: defaultChains[ChainId.avalanche].rpcUrls.default.http[0],

  // features
  features: {
    flashbots: false,
    walletconnect: true,
    swaps: true,
    nfts: true,
    txs: avalanche_tx_enabled,
  },

  gas: {
    // ?
    roundGasDisplay: true,
  },

  // design tings
  colors: {
    light: '#E84142',
    dark: '#FF5D5E',
  },
};
